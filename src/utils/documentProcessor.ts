import sharp from "sharp";
import pdfParse from "pdf-parse";
import { ProcessedDocument } from "../types/document";

export class DocumentProcessor {
  static async processDocument(
    buffer: Buffer,
    mimeType: string
  ): Promise<ProcessedDocument> {
    try {
      console.log("🔍 DEBUG - Processando documento com mimeType:", mimeType);
      console.log(
        "🔍 DEBUG - Buffer recebido:",
        buffer ? `Buffer(${buffer.length} bytes)` : "undefined"
      );

      if (!buffer || !Buffer.isBuffer(buffer)) {
        throw new Error("Buffer inválido ou não fornecido");
      }

      if (!mimeType || typeof mimeType !== "string") {
        throw new Error("MimeType inválido ou não fornecido");
      }

      if (mimeType.startsWith("image/")) {
        return await this.processImage(buffer);
      } else if (mimeType === "application/pdf") {
        return await this.processPDF(buffer);
      } else if (mimeType === "text/plain") {
        return await this.processText(buffer);
      }

      console.log("⚠️ WARNING - Tipo de arquivo não suportado:", mimeType);
      throw new Error(`Tipo de arquivo não suportado: ${mimeType}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error("❌ ERROR - Erro no processamento:", error);
      throw new Error(`Erro ao processar documento: ${errorMessage}`);
    }
  }

  private static async processImage(
    buffer: Buffer
  ): Promise<ProcessedDocument> {
    // Para imagens, apenas extraímos os metadados
    const metadata = await sharp(buffer).metadata();

    return {
      extractedText: null, // Imagens não têm texto
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: buffer.length,
      },
    };
  }

  private static async processPDF(buffer: Buffer): Promise<ProcessedDocument> {
    const data = await pdfParse(buffer);

    return {
      extractedText: data.text, // Guardamos apenas o texto do PDF
      metadata: {
        pageCount: data.numpages,
        format: "pdf",
        size: buffer.length,
      },
    };
  }

  private static async processText(buffer: Buffer): Promise<ProcessedDocument> {
    const text = buffer.toString("utf-8");

    return {
      extractedText: text,
      metadata: {
        format: "txt",
        size: buffer.length,
      },
    };
  }

  static getContentType(mimeType: string): string {
    if (mimeType.startsWith("image/")) {
      return mimeType; // Mantemos o tipo original da imagem
    } else if (mimeType === "application/pdf" || mimeType === "text/plain") {
      return "text/plain";
    } else {
      return mimeType;
    }
  }
}
