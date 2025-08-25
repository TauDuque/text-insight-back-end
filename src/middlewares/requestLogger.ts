import { Request, Response, NextFunction } from "express";
import { Logger } from "../utils/logger";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  // Log da requisição recebida
  Logger.info(`📥 Incoming Request: ${req.method} ${req.originalUrl}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
    headers: req.headers, // ADICIONAR TODOS OS HEADERS
  });

  // Interceptar o final da resposta
  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    // Determinar o nível de log baseado no status
    if (status >= 500) {
      Logger.error(`❌ Request Error: ${req.method} ${req.originalUrl}`, {
        status,
        duration: `${duration}ms`,
        method: req.method,
        url: req.originalUrl,
      });
    } else if (status >= 400) {
      Logger.warn(`⚠️  Request Warning: ${req.method} ${req.originalUrl}`, {
        status,
        duration: `${duration}ms`,
        method: req.method,
        url: req.originalUrl,
      });
    } else {
      Logger.success(`✅ Request Success: ${req.method} ${req.originalUrl}`, {
        status,
        duration: `${duration}ms`,
        method: req.method,
        url: req.originalUrl,
      });
    }
  });

  next();
};
