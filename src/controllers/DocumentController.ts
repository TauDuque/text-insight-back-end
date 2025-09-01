import { Request, Response } from "express";
import { getPrismaClient } from "../config/database";

import { documentProcessingQueue } from "../config/queue";
import { DocumentProcessor } from "../utils/documentProcessor";
import { UPLOAD_CONFIG } from "../config/upload";
import { ERROR_MESSAGES } from "../config/limits";
import { DocumentStatus } from "../types/document";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

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

      // Verificar quota do usuário
      const hasQuota = await DocumentProcessor.checkUserQuota(userId);
      if (!hasQuota) {
        return res.status(400).json({
          success: false,
          message: ERROR_MESSAGES.USER_QUOTA_EXCEEDED,
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

      // Gerar resposta da fila
      const queueResponse = {
        queueId: job.id.toString(),
        message: "Documento enviado para processamento",
        estimatedTime: 5, // 5 segundos estimados
        fileSize: size,
        filename: originalname,
      };

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
      const {
        page = 1,
        limit = 10,
        status,
      } = req.query as {
        page?: string;
        limit?: string;
        status?: DocumentStatus;
      };

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuário não autenticado",
        });
      }

      const skip = (Number(page) - 1) * Number(limit);
      const where = { userId, ...(status ? { status } : {}) };

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
   * Buscar documento por jobId
   */
  static async getDocumentByJobId(req: AuthRequest, res: Response) {
    try {
      const { jobId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuário não autenticado",
        });
      }

      const document = await getPrismaClient().document.findFirst({
        where: {
          jobId,
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
      console.error("Erro ao buscar documento por jobId:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

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

      // Enviar o arquivo para download
      const fs = require("fs");

      // Verificar se o arquivo existe
      if (!fs.existsSync(document.processedFilePath)) {
        return res.status(404).json({
          success: false,
          message: "Arquivo não encontrado no servidor",
        });
      }

      // Configurar headers para download
      res.setHeader("Content-Type", document.mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(document.originalName)}"`
      );

      // Criar stream de leitura e enviar arquivo
      const fileStream = fs.createReadStream(document.processedFilePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Erro no download do documento:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
}
