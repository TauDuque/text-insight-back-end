import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";

interface AuthRequest extends Request {
  user?: any;
}

export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      const result = await this.authService.register(email, password, name);

      res.status(201).json({
        success: true,
        message: "Usuário criado com sucesso",
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            createdAt: result.user.createdAt,
          },
          apiKey: result.apiKey,
          token: result.token, // Agora retorna o JWT Token também
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

  getProfile = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.userId;

      const apiKeys = await this.authService.getUserApiKeys(userId);

      res.json({
        success: true,
        data: {
          user: req.user,
          apiKeys,
        },
      });
    } catch (error: unknown) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  };

  createApiKey = async (req: AuthRequest, res: Response) => {
    try {
      const { name } = req.body;
      const userId = req.user.userId;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Nome da API Key é obrigatório",
        });
      }

      const apiKey = await this.authService.createApiKey(userId, name);

      res.status(201).json({
        success: true,
        message: "API Key criada com sucesso",
        data: apiKey,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  // ✅ NOVO: Listar API Keys do usuário
  getUserApiKeys = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.userId;
      const apiKeys = await this.authService.getUserApiKeys(userId);

      res.json({
        success: true,
        data: apiKeys,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  // ✅ NOVO: Revogar API Key
  revokeApiKey = async (req: AuthRequest, res: Response) => {
    try {
      const { keyId } = req.params;
      const userId = req.user.userId;

      await this.authService.revokeApiKey(keyId, userId);

      res.json({
        success: true,
        message: "API Key revogada com sucesso",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  // ✅ NOVO: Atualizar perfil do usuário
  updateProfile = async (req: AuthRequest, res: Response) => {
    try {
      const { name } = req.body;
      const userId = req.user.userId;

      if (!name || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: "Nome deve ter pelo menos 2 caracteres",
        });
      }

      const updatedUser = await this.authService.updateUserProfile(userId, {
        name,
      });

      res.json({
        success: true,
        message: "Perfil atualizado com sucesso",
        data: updatedUser,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
}
