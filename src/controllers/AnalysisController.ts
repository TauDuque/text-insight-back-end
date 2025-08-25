import { Request, Response } from "express";
import { AnalysisService } from "../services/AnalysisService";

interface AuthRequest extends Request {
  user?: any;
}

export class AnalysisController {
  private analysisService = new AnalysisService();

  analyze = async (req: AuthRequest, res: Response) => {
    try {
      const { text } = req.body;
      const userId = req.user.id;

      const result = await this.analysisService.createAnalysis(text, userId);

      const statusCode =
        "status" in result && result.status === "COMPLETED" ? 200 : 202;

      res.status(statusCode).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Erro na análise:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Erro interno do servidor",
      });
    }
  };

  getAnalysis = async (req: AuthRequest, res: Response) => {
    try {
      const { analysisId } = req.params;
      const userId = req.user.id;

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
      const userId = req.user.id;
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
      const userId = req.user.id;

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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;

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
