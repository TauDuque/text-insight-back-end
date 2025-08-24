import { Request, Response, NextFunction } from "express";
import redis from "../config/redis";

interface AuthRequest extends Request {
  user?: any;
}

export const createRateLimit = (windowMs: number, maxRequests: number) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return next(); // Se não há usuário, pular rate limiting
      }

      const key = `rate_limit:${userId}`;
      const window = Math.floor(Date.now() / windowMs);
      const windowKey = `${key}:${window}`;

      // Incrementar contador
      const current = await redis.incr(windowKey);

      // Definir expiração na primeira requisição da janela
      if (current === 1) {
        await redis.expire(windowKey, Math.ceil(windowMs / 1000));
      }

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
        "X-RateLimit-Reset": new Date(
          Date.now() + (await redis.ttl(windowKey)) * 1000
        ).toISOString(),
      });

      next();
    } catch (error) {
      console.error("Erro no rate limiting:", error);
      next(); // Em caso de erro, permitir a requisição
    }
  };
};

// Rate limits específicos
export const analysisRateLimit = createRateLimit(60 * 1000, 10); // 10 análises por minuto
export const generalRateLimit = createRateLimit(60 * 1000, 100); // 100 requisições por minuto
