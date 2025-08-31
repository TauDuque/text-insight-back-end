import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  console.log("🔍 AUTH DEBUG - Header:", authHeader);
  console.log("🔍 AUTH DEBUG - Token:", token ? "EXISTS" : "NULL");

  if (!token) {
    console.log("🚨 AUTH ERROR: No token provided");
    return res.status(401).json({
      success: false,
      message: "Token de acesso requerido",
    });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secret",
    (err: any, decoded: any) => {
      if (err) {
        console.log("🚨 AUTH ERROR: Token verification failed:", err.message);
        return res.status(403).json({
          success: false,
          message: "Token inválido",
        });
      }

      console.log("✅ AUTH SUCCESS - Decoded payload:", decoded);

      // Mapear o payload do JWT para a interface esperada
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name || "",
      };

      console.log("✅ AUTH SUCCESS - Mapped user:", req.user);

      next();
    }
  );
};

// API Key removida - aplicação agora usa apenas JWT para autenticação de usuários
