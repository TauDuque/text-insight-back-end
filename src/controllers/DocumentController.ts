import { Response } from "express";
import { getPrismaClient } from "../config/database";
import { AuthRequest } from "../types/auth";
import { UPLOAD_LIMITS } from "../config/limits";

export class DocumentController {
  static async uploadDocument(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const { originalname, mimetype, size, buffer } = req.file;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      // Validar limites
      if (size > UPLOAD_LIMITS.maxFileSize) {
        return res.status(400).json({ error: "Arquivo muito grande" });
      }

      // Validar mimeType
      if (!mimetype) {
        return res
          .status(400)
          .json({ error: "Tipo de arquivo não identificado" });
      }

      if (process.env.NODE_ENV === "development") {
        console.log("🔍 DEBUG - MimeType recebido:", mimetype);
        console.log("🔍 DEBUG - Buffer size:", buffer?.length);
      }

      // Salvar arquivo temporário para processamento em fila
      const tempDir = "uploads/temp";
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const tempFilename = `doc_${uniqueSuffix}_${originalname}`;
      const tempFilePath = `${tempDir}/${tempFilename}`;

      // Garantir que o diretório existe
      const fs = require("fs");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Salvar arquivo temporário
      fs.writeFileSync(tempFilePath, buffer);

      // Criar documento no banco com status PENDING
      const prisma = getPrismaClient();
      const document = await prisma.document.create({
        data: {
          userId,
          originalName: originalname,
          filename: tempFilename,
          file_path: tempFilePath,
          mimeType: mimetype,
          type: mimetype.split("/")[0],
          size: size,
          status: "PENDING",
        },
      });

      // Adicionar à fila de processamento
      const { documentProcessingQueue } = require("../config/queue");
      const job = await documentProcessingQueue.add(
        "process-document",
        {
          documentId: document.id,
          file_path: tempFilePath,
          originalName: originalname,
          mimeType: mimetype,
          userId,
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        }
      );

      console.log(
        `📥 Documento ${document.id} adicionado à fila, job: ${job.id}`
      );

      // Atualizar o documento no banco com o job_id
      await prisma.document.update({
        where: { id: document.id },
        data: { job_id: job.id.toString() },
      });

      if (process.env.NODE_ENV === "development") {
        console.log(
          `💾 Job ID ${job.id} salvo no banco para documento ${document.id}`
        );
      }

      // Retornar resposta da fila
      res.json({
        id: document.id,
        queueId: job.id.toString(),
        message: "Documento enviado para processamento",
        estimatedTime: 30, // Estimativa em segundos
        fileSize: size,
        filename: originalname,
        status: "PENDING",
      });
    } catch (error) {
      console.error("Erro ao processar documento:", error);
      res.status(500).json({ error: "Erro ao processar documento" });
    }
  }

  static async getDocument(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    try {
      const prisma = getPrismaClient();
      const document = await prisma.document.findFirst({
        where: { id, userId },
      });

      if (!document) {
        return res.status(404).json({ error: "Documento não encontrado" });
      }

      // Para imagens, retornamos apenas os metadados
      if (document.mimeType.startsWith("image/")) {
        return res.json({
          id: document.id,
          originalName: document.originalName,
          mimeType: document.mimeType,
          metadata: document.metadata,
        });
      }

      // Para PDFs e textos, retornamos o texto extraído
      res.setHeader("Content-Type", "text/plain");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${document.originalName}"`
      );
      res.send(document.extractedText || "");
    } catch (error) {
      console.error("Erro ao recuperar documento:", error);
      res.status(500).json({ error: "Erro ao recuperar documento" });
    }
  }

  static async getUserDocuments(req: AuthRequest, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    try {
      const prisma = getPrismaClient();
      const documents = await prisma.document.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          size: true,
          createdAt: true,
          processedAt: true,
          completed_at: true,
          status: true,
          metadata: true,
          job_id: true,
        },
      });

      // Retornar no formato que o front-end espera
      res.json({
        success: true,
        data: {
          documents: documents,
          total: documents.length,
          page: 1,
          limit: documents.length,
        },
      });
    } catch (error) {
      console.error("Erro ao listar documentos:", error);
      res.status(500).json({ error: "Erro ao listar documentos" });
    }
  }

  static async getDocumentStatus(req: AuthRequest, res: Response) {
    const { documentId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    try {
      const prisma = getPrismaClient();
      const document = await prisma.document.findFirst({
        where: { id: documentId, userId },
      });

      if (!document) {
        return res.status(404).json({ error: "Documento não encontrado" });
      }

      res.json({
        id: document.id,
        originalName: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
        createdAt: document.createdAt,
        processedAt: document.processedAt,
      });
    } catch (error) {
      console.error("Erro ao obter status do documento:", error);
      res.status(500).json({ error: "Erro ao obter status do documento" });
    }
  }

  static async getDocumentByJobId(req: AuthRequest, res: Response) {
    const { jobId } = req.params;
    const userId = req.user?.id;

    if (process.env.NODE_ENV === "development") {
      console.log(
        `🔍 DEBUG - getDocumentByJobId chamado com jobId: ${jobId}, userId: ${userId}`
      );
    }

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    try {
      // Buscar documento diretamente pelo job_id no banco
      const prisma = getPrismaClient();
      const document = await prisma.document.findFirst({
        where: {
          job_id: jobId,
          userId,
        },
      });

      if (process.env.NODE_ENV === "development") {
        console.log(
          `🔍 DEBUG - Documento encontrado no banco:`,
          document ? `Sim (ID: ${document.id})` : "Não"
        );
      }

      if (!document) {
        if (process.env.NODE_ENV === "development") {
          console.log(
            `❌ DEBUG - Documento com job_id ${jobId} não encontrado no banco para usuário ${userId}`
          );

          // Vamos verificar se há documentos do usuário
          const userDocuments = await prisma.document.findMany({
            where: { userId },
            select: {
              id: true,
              job_id: true,
              originalName: true,
              status: true,
            },
          });

          console.log(`🔍 DEBUG - Documentos do usuário:`, userDocuments);
        }

        return res.status(404).json({
          error: "Documento não encontrado",
          ...(process.env.NODE_ENV === "development" && { userDocuments: [] }),
        });
      }

      if (process.env.NODE_ENV === "development") {
        console.log(
          `✅ DEBUG - Retornando documento ${document.id} com sucesso`
        );
      }

      // Retornar documento com status atualizado
      res.json({
        id: document.id,
        originalName: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
        status: document.status,
        createdAt: document.createdAt,
        processedAt: document.processedAt,
        results: document.results,
        error: document.error,
        processingTime: document.processing_time,
      });
    } catch (error) {
      console.error("❌ ERROR - Erro ao buscar documento por jobId:", error);
      res.status(500).json({ error: "Erro ao buscar documento" });
    }
  }

  static async downloadDocument(req: AuthRequest, res: Response) {
    const { documentId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    try {
      const prisma = getPrismaClient();
      const document = await prisma.document.findFirst({
        where: { id: documentId, userId },
      });

      if (!document) {
        return res.status(404).json({ error: "Documento não encontrado" });
      }

      // Para imagens, retornamos apenas os metadados
      if (document.mimeType.startsWith("image/")) {
        return res.json({
          id: document.id,
          originalName: document.originalName,
          mimeType: document.mimeType,
          metadata: document.metadata,
        });
      }

      // Para PDFs e textos, retornamos o texto extraído
      res.setHeader("Content-Type", "text/plain");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${document.originalName}"`
      );
      res.send(document.extractedText || "");
    } catch (error) {
      console.error("Erro no download do documento:", error);
      res.status(500).json({ error: "Erro no download do documento" });
    }
  }

  static async getQueueStatus(req: AuthRequest, res: Response) {
    // Endpoint apenas disponível em desenvolvimento
    if (process.env.NODE_ENV !== "development") {
      return res
        .status(404)
        .json({ error: "Endpoint não disponível em produção" });
    }

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    try {
      const { documentProcessingQueue } = require("../config/queue");

      // Obter estatísticas da fila
      const waitingJobs = await documentProcessingQueue.getWaiting();
      const activeJobs = await documentProcessingQueue.getActive();
      const completedJobs = await documentProcessingQueue.getCompleted();
      const failedJobs = await documentProcessingQueue.getFailed();
      const delayedJobs = await documentProcessingQueue.getDelayed();

      // Obter jobs específicos do usuário
      const userDocuments = await getPrismaClient().document.findMany({
        where: { userId },
        select: { id: true, status: true, createdAt: true, originalName: true },
      });

      res.json({
        queueStatus: {
          waiting: waitingJobs.length,
          active: activeJobs.length,
          completed: completedJobs.length,
          failed: failedJobs.length,
          delayed: delayedJobs.length,
          total:
            waitingJobs.length +
            activeJobs.length +
            completedJobs.length +
            failedJobs.length +
            delayedJobs.length,
        },
        userDocuments: userDocuments,
        waitingJobIds: waitingJobs.map((j: any) => ({
          id: j.id,
          data: j.data,
        })),
        activeJobIds: activeJobs.map((j: any) => ({ id: j.id, data: j.data })),
        completedJobIds: completedJobs
          .slice(0, 5)
          .map((j: any) => ({ id: j.id, data: j.data })),
        failedJobIds: failedJobs.slice(0, 5).map((j: any) => ({
          id: j.id,
          data: j.data,
          failedReason: j.failedReason,
        })),
      });
    } catch (error) {
      console.error("❌ ERROR - Erro ao obter status da fila:", error);
      res.status(500).json({ error: "Erro ao obter status da fila" });
    }
  }
}
