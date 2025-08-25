import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthService } from "../services/AuthService";

interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  // Debug: verificar JWT_SECRET
  console.log(
    "🔐 Auth Middleware - JWT_SECRET:",
    process.env.JWT_SECRET ? "DEFINIDO" : "NÃO DEFINIDO"
  );
  console.log(
    "🔐 Auth Middleware - JWT_SECRET valor:",
    process.env.JWT_SECRET
      ? process.env.JWT_SECRET.substring(0, 20) + "..."
      : "undefined"
  );

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token de acesso requerido",
    });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secret",
    (err: any, user: any) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: "Token inválido",
        });
      }
      req.user = user;
      next();
    }
  );
};

export const authenticateApiKey = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers["x-api-key"] as string;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: "API Key requerida",
    });
  }

  try {
    const authService = new AuthService();
    const validApiKey = await authService.validateApiKey(apiKey);

    if (!validApiKey) {
      return res.status(401).json({
        success: false,
        message: "API Key inválida",
      });
    }

    req.user = validApiKey.user;
    next();
  } catch {
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};
