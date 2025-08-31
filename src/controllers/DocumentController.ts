import { Request, Response } from "express";
import { getPrismaClient } from "../config/database";
import { DocumentProcessingService } from "../services/DocumentProcessingService";
import { documentProcessingQueue } from "../config/queue";
import { DocumentProcessor } from "../utils/documentProcessor";
import { UPLOAD_CONFIG } from "../config/upload";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

const documentProcessingService = new DocumentProcessingService();

export class DocumentController {
  /**
   * Upload de documento para processamento
   */
  static async uploadDocument(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Nenhum arquivo enviado",
        });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuário não autenticado",
        });
      }

      const {
        originalname,
        filename,
        path: filePath,
        mimetype,
        size,
      } = req.file;

      // Validar tamanho do arquivo
      if (size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
        // Limpar arquivo temporário
        DocumentProcessor.cleanupTempFile(filePath);
        return res.status(400).json({
          success: false,
          message: UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024) + "MB",
        });
      }

      // Criar registro no banco
      const document = await getPrismaClient().document.create({
        data: {
          originalName: originalname,
          filename,
          filePath,
          size,
          mimeType: mimetype,
          type: DocumentProcessor.getDocumentType(mimetype),
          status: "PENDING",
          userId,
        },
      });

      // Adicionar à fila de processamento
      const job = await documentProcessingQueue.add(
        "process-document",
        {
          documentId: document.id,
          filePath,
          originalName: originalname,
          mimeType: mimetype,
          userId,
        },
        {
          attempts: 2,
          backoff: {
            type: "fixed",
            delay: 3000,
          },
        }
      );

      // Atualizar jobId no banco
      await getPrismaClient().document.update({
        where: { id: document.id },
        data: { jobId: job.id.toString() },
      });

      // Obter resposta da fila
      const queueResponse = await documentProcessingService.addDocumentToQueue(
        filePath,
        originalname,
        mimetype,
        userId
      );

      res.status(201).json({
        success: true,
        message: "Documento enviado para processamento",
        data: {
          documentId: document.id,
          jobId: job.id,
          ...queueResponse,
        },
      });
    } catch (error) {
      console.error("Erro no upload de documento:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  /**
   * Obter status de um documento
   */
  static async getDocumentStatus(req: AuthRequest, res: Response) {
    try {
      const { documentId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuário não autenticado",
        });
      }

      const document = await getPrismaClient().document.findFirst({
        where: {
          id: documentId,
          userId,
        },
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: "Documento não encontrado",
        });
      }

      res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      console.error("Erro ao obter status do documento:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  /**
   * Listar documentos do usuário
   */
  static async getUserDocuments(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 10, status } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuário não autenticado",
        });
      }

      const skip = (Number(page) - 1) * Number(limit);
      const where: any = { userId };

      if (status) {
        where.status = status;
      }

      const [documents, total] = await Promise.all([
        getPrismaClient().document.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: Number(limit),
        }),
        getPrismaClient().document.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          documents,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error("Erro ao listar documentos:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  /**
   * Download de documento processado
   */
  static async downloadDocument(req: AuthRequest, res: Response) {
    try {
      const { documentId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuário não autenticado",
        });
      }

      const document = await getPrismaClient().document.findFirst({
        where: {
          id: documentId,
          userId,
          status: "COMPLETED",
        },
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: "Documento não encontrado ou não processado",
        });
      }

      if (!document.processedFilePath) {
        return res.status(404).json({
          success: false,
          message: "Arquivo processado não encontrado",
        });
      }

      // TODO: Implementar download do arquivo
      res.json({
        success: true,
        message: "Download implementado",
        data: {
          filename: document.originalName,
          path: document.processedFilePath,
        },
      });
    } catch (error) {
      console.error("Erro no download do documento:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
}
