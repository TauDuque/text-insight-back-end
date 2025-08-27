import { Request, Response } from "express";
import { AnalysisService } from "../services/AnalysisService";
import { Logger } from "../utils/logger";

interface AuthRequest extends Request {
  user?: any;
}

export class AnalysisController {
  private analysisService = new AnalysisService();

  analyze = async (req: AuthRequest, res: Response) => {
    try {
      Logger.info("🔍 [AnalysisController] Iniciando análise...");
      Logger.info("👤 [AnalysisController] User:", req.user);

      const { text } = req.body;
      const userId = req.user.userId; // Corrigido: userId em vez de id

      Logger.info(
        "📝 [AnalysisController] Texto recebido:",
        text?.substring(0, 100) + "..."
      );
      Logger.info("🆔 [AnalysisController] UserId:", userId);

      const result = await this.analysisService.createAnalysis(text, userId);

      Logger.success(
        "✅ [AnalysisController] Análise criada com sucesso:",
        result
      );

      const statusCode =
        "status" in result && result.status === "COMPLETED" ? 200 : 202;

      // Se a análise vai para fila, adicionar instruções de acompanhamento
      if (
        "status" in result &&
        (result.status === "PENDING" || result.status === "PROCESSING") &&
        "id" in result
      ) {
        res.status(202).json({
          success: true,
          data: result,
          instructions: {
            message:
              "Análise enviada para processamento. Para acompanhar o status:",
            checkStatus: `GET /api/analyze/${result.id}`,
            headers: "X-API-Key: sua_api_key_aqui",
            examples: {
              postman: "Use Postman ou Insomnia com o endpoint acima",
              curl: `curl -H "X-API-Key: sua_api_key_aqui" http://localhost:3001/api/analyze/${result.id}`,
              note: "Substitua 'sua_api_key_aqui' pela sua API Key real",
            },
          },
        });
      } else {
        res.status(statusCode).json({
          success: true,
          data: result,
        });
      }
    } catch (error: any) {
      Logger.error("❌ [AnalysisController] Erro na análise:", error);
      Logger.error("❌ [AnalysisController] Stack trace:", error.stack);
      res.status(500).json({
        success: false,
        message: error.message || "Erro interno do servidor",
      });
    }
  };

  getAnalysis = async (req: AuthRequest, res: Response) => {
    try {
      const { analysisId } = req.params;
      const userId = req.user.userId;

      const analysis = await this.analysisService.getAnalysis(
        analysisId,
        userId
      );

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error: any) {
      const statusCode = error.message === "Análise não encontrada" ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  };

  getUserAnalyses = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.analysisService.getUserAnalyses(
        userId,
        page,
        limit
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  deleteAnalysis = async (req: AuthRequest, res: Response) => {
    try {
      const { analysisId } = req.params;
      const userId = req.user.userId;

      const result = await this.analysisService.deleteAnalysis(
        analysisId,
        userId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      const statusCode = error.message === "Análise não encontrada" ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  };

  getQueueStats = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.userId;
      const stats = await this.analysisService.getUserQueueStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  getUserStats = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.userId;
      const stats = await this.analysisService.getAnalysisStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  // Endpoint para reprocessar análise falhada
  retryAnalysis = async (req: AuthRequest, res: Response) => {
    try {
      const { analysisId } = req.params;
      const userId = req.user.userId;

      // Buscar análise original
      const originalAnalysis = await this.analysisService.getAnalysis(
        analysisId,
        userId
      );

      if (originalAnalysis.status !== "FAILED") {
        return res.status(400).json({
          success: false,
          message: "Apenas análises falhadas podem ser reprocessadas",
        });
      }

      // Criar nova análise com o mesmo texto
      const result = await this.analysisService.createAnalysis(
        originalAnalysis.text,
        userId
      );

      res.status(202).json({
        success: true,
        data: result,
        message: "Análise reenfileirada para reprocessamento",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
}
