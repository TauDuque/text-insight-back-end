import { Request, Response, NextFunction } from "express";

interface AuthRequest extends Request {
  user?: { id: string; email: string; name: string };
}

// Log de requisições de API
export const logApiRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  // Capturar dados da requisição
  const requestData = {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get("User-Agent"),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id,
    timestamp: new Date(),
  };

  // Override do res.json para capturar a resposta
  const originalJson = res.json;
  res.json = function (body) {
    const responseTime = Date.now() - startTime;

    // Log assíncrono (não bloquear a resposta)
    setImmediate(() => {
      console.log(
        `${requestData.method} ${requestData.url} - ${res.statusCode} - ${responseTime}ms - User: ${requestData.userId || "anonymous"}`
      );

      // Salvar no banco apenas para endpoints críticos
      if (req.originalUrl.includes("/documents") && req.method === "POST") {
        // Aqui você pode salvar logs específicos no banco se necessário
      }
    });

    return originalJson.call(this, body);
  };

  next();
};

// Middleware para rate limiting logging
export const logRateLimit = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const originalStatus = res.status;
  res.status = function (code) {
    if (code === 429) {
      console.warn(
        `Rate limit exceeded for user ${req.user?.id || "anonymous"} on ${req.originalUrl}`
      );
    }
    return originalStatus.call(this, code);
  };
  next();
};
