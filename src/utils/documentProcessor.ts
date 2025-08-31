import sharp from "sharp";
import { UPLOAD_LIMITS } from "../config/limits";
import fs from "fs";
import { getPrismaClient } from "../config/database";
import pdf from "pdf-parse";
import { ProcessedDocument } from "../types/document";

export class DocumentProcessor {
  static async processDocument(
    filePath: string,
    originalName: string,
    mimeType: string
  ): Promise<ProcessedDocument> {
    try {
      // Verificar tipo de arquivo
      if (
        UPLOAD_LIMITS.allowedImageTypes.includes(
          mimeType as "image/jpeg" | "image/png" | "image/gif"
        )
      ) {
        return await this.processImage(filePath);
      } else if (
        UPLOAD_LIMITS.allowedDocTypes.includes(
          mimeType as "application/pdf" | "text/plain"
        )
      ) {
        return await this.processText(filePath);
      } else {
        throw new Error("Tipo de arquivo não suportado");
      }
    } catch (error) {
      console.error("Erro no processamento:", error);
      throw error;
    }
  }

  private static async processImage(
    filePath: string
  ): Promise<ProcessedDocument> {
    const processed = await sharp(filePath)
      .resize(
        UPLOAD_LIMITS.maxImageDimension,
        UPLOAD_LIMITS.maxImageDimension,
        {
          fit: "inside",
          withoutEnlargement: true,
        }
      )
      .jpeg({
        quality: UPLOAD_LIMITS.imageQuality,
        progressive: true,
      })
      .toBuffer();

    // Salvar versão otimizada
    const processedPath = filePath.replace("temp", "processed");
    await fs.promises.writeFile(processedPath, processed);

    // Retornar metadados
    const metadata = await sharp(processed).metadata();
    return {
      processedPath,
      size: processed.length,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
    };
  }

  private static async processText(
    filePath: string
  ): Promise<ProcessedDocument> {
    const buffer = await fs.promises.readFile(filePath);
    let text = "";

    if (filePath.endsWith(".pdf")) {
      const data = await pdf(buffer);
      text = data.text;
    } else {
      text = buffer.toString("utf-8");
    }

    // Limitar tamanho do texto
    text = text.substring(0, UPLOAD_LIMITS.maxTextLength);

    // Salvar texto em arquivo
    const processedPath = filePath.replace("temp", "processed") + ".txt";
    await fs.promises.writeFile(processedPath, text);

    return {
      processedPath,
      size: text.length,
      textContent: text,
    };
  }

  static async cleanupTempFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      console.error("Erro ao limpar arquivo temporário:", error);
    }
  }

  static async cleanupExpiredFiles(): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const expirationDate = new Date();
      expirationDate.setDate(
        expirationDate.getDate() - UPLOAD_LIMITS.retentionDays
      );

      // Buscar documentos expirados
      const expiredDocs = await prisma.document.findMany({
        where: {
          createdAt: {
            lt: expirationDate,
          },
        },
      });

      // Deletar arquivos e registros
      for (const doc of expiredDocs) {
        if (doc.filePath) {
          try {
            await fs.promises.unlink(doc.filePath);
          } catch (error) {
            console.error(`Erro ao deletar arquivo ${doc.filePath}:`, error);
          }
        }
        if (doc.processedFilePath) {
          try {
            await fs.promises.unlink(doc.processedFilePath);
          } catch (error) {
            console.error(
              `Erro ao deletar arquivo processado ${doc.processedFilePath}:`,
              error
            );
          }
        }
        await prisma.document.delete({
          where: { id: doc.id },
        });
      }
    } catch (error) {
      console.error("Erro na limpeza de arquivos expirados:", error);
    }
  }

  static async checkUserQuota(userId: string): Promise<boolean> {
    const prisma = getPrismaClient();
    const count = await prisma.document.count({
      where: { userId },
    });
    return count < UPLOAD_LIMITS.maxFilesPerUser;
  }
}
