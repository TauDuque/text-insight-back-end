import { Response } from "express";
import { getPrismaClient } from "../config/database";
import { DocumentProcessor } from "../utils/documentProcessor";
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

      // Processar o documento
      const processed = await DocumentProcessor.processDocument(
        buffer,
        mimetype
      );

      // Salvar no banco apenas os dados extraídos
      const prisma = getPrismaClient();
      const document = await prisma.document.create({
        data: {
          userId,
          originalName: originalname,
          filename: originalname, // Usar o nome original como filename
          mimeType: mimetype,
          type: mimetype.split("/")[0], // Extrair o tipo (image, application, etc.)
          size: size,
          extractedText: processed.extractedText,
          metadata: processed.metadata,
          processedAt: new Date(),
        },
      });

      // Retornar apenas metadados
      res.json({
        id: document.id,
        originalName: document.originalName,
        mimeType: DocumentProcessor.getContentType(mimetype),
        size: document.size,
        createdAt: document.createdAt,
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
          metadata: true,
        },
      });

      res.json(documents);
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

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    try {
      const prisma = getPrismaClient();
      const document = await prisma.document.findFirst({
        where: {
          userId,
          // Como não temos mais jobId no banco, vamos buscar por ID
          // ou implementar uma lógica diferente baseada no jobId
          id: jobId, // Assumindo que jobId é na verdade o ID do documento
        },
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
      console.error("Erro ao buscar documento por jobId:", error);
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
}
