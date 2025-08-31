import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name: string;
  };
}

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "Nome, email e senha são obrigatórios",
        });
      }

      const result = await this.authService.register(name, email, password);

      res.status(201).json({
        success: true,
        message: "Conta criada com sucesso",
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            createdAt: result.user.createdAt,
          },
          token: result.token,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email e senha são obrigatórios",
        });
      }

      const result = await this.authService.login(email, password);

      res.json({
        success: true,
        message: "Login realizado com sucesso",
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            createdAt: result.user.createdAt,
          },
          token: result.token,
        },
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  };

  // ✅ NOVO: Atualizar perfil do usuário
  updateProfile = async (req: AuthRequest, res: Response) => {
    try {
      const { name } = req.body;
      const userId = req.user?.userId;

      if (!name || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: "Nome deve ter pelo menos 2 caracteres",
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuário não autenticado",
        });
      }

      const updatedUser = await this.authService.updateUserProfile(userId, {
        name,
      });

      res.json({
        success: true,
        message: "Perfil atualizado com sucesso",
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            createdAt: updatedUser.createdAt,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
}
