import { Request, Response, NextFunction } from "express";
import redis from "../config/redis";
import { PRODUCTION_CONFIG } from "../config/production";

interface AuthRequest extends Request {
  user?: any;
}

// Cache em memória para reduzir chamadas ao Redis
const memoryCache = new Map<string, { count: number; resetTime: number }>();
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000; // Limpeza a cada 5 minutos

// Limpar cache em memória periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of memoryCache.entries()) {
    if (value.resetTime < now) {
      memoryCache.delete(key);
    }
  }
}, CACHE_CLEANUP_INTERVAL);

export const createRateLimit = (windowMs: number, maxRequests: number) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return next(); // Se não há usuário, pular rate limiting
      }

      const key = `rate_limit:${userId}`;
      const now = Date.now();
      const window = Math.floor(now / windowMs);
      const windowKey = `${key}:${window}`;

      // Verificar cache em memória primeiro
      const cached = memoryCache.get(windowKey);
      if (cached && cached.resetTime > now) {
        if (cached.count > maxRequests) {
          const ttl = Math.ceil((cached.resetTime - now) / 1000);
          return res.status(429).json({
            success: false,
            message: "Muitas requisições. Tente novamente em alguns minutos.",
            retryAfter: ttl,
          });
        }

        // Incrementar contador em memória
        cached.count++;

        // Adicionar headers informativos
        res.set({
          "X-RateLimit-Limit": maxRequests.toString(),
          "X-RateLimit-Remaining": Math.max(
            0,
            maxRequests - cached.count
          ).toString(),
          "X-RateLimit-Reset": new Date(cached.resetTime).toISOString(),
        });

        return next();
      }

      // Se não há cache, usar Redis
      const current = await redis.incr(windowKey);
      const resetTime = now + windowMs;

      // Definir expiração na primeira requisição da janela
      if (current === 1) {
        await redis.expire(windowKey, Math.ceil(windowMs / 1000));
      }

      // Armazenar no cache em memória
      memoryCache.set(windowKey, { count: current, resetTime });

      // Verificar se excedeu o limite
      if (current > maxRequests) {
        const ttl = await redis.ttl(windowKey);

        return res.status(429).json({
          success: false,
          message: "Muitas requisições. Tente novamente em alguns minutos.",
          retryAfter: ttl,
        });
      }

      // Adicionar headers informativos
      res.set({
        "X-RateLimit-Limit": maxRequests.toString(),
        "X-RateLimit-Remaining": Math.max(0, maxRequests - current).toString(),
        "X-RateLimit-Reset": new Date(resetTime).toISOString(),
      });

      next();
    } catch (error) {
      console.error("Erro no rate limiting:", error);
      next(); // Em caso de erro, permitir a requisição
    }
  };
};

// Rate limits otimizados para produção
const isProduction = process.env.NODE_ENV === "production";

export const analysisRateLimit = createRateLimit(
  isProduction ? PRODUCTION_CONFIG.RATE_LIMIT.WINDOW_MS : 60 * 1000,
  isProduction ? 50 : 10 // Reduzir para 50 análises por 15 minutos em produção
);

export const generalRateLimit = createRateLimit(
  isProduction ? PRODUCTION_CONFIG.RATE_LIMIT.WINDOW_MS : 60 * 1000,
  isProduction ? PRODUCTION_CONFIG.RATE_LIMIT.MAX_REQUESTS : 100
);
