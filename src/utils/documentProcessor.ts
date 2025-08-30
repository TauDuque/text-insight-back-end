import sharp from "sharp";
import pdf from "pdf-parse";
import fs from "fs";
import path from "path";

export interface DocumentMetadata {
  filename: string;
  originalName: string;
  size: number;
  type: string;
  mimeType: string;
  dimensions?: { width: number; height: number };
  pageCount?: number;
  textContent?: string;
  processingTime: number;
}

export class DocumentProcessor {
  /**
   * Processa diferentes tipos de documentos e retorna metadados
   */
  static async processDocument(
    filePath: string,
    originalName: string,
    mimeType: string
  ): Promise<DocumentMetadata> {
    const startTime = Date.now();
    const stats = fs.statSync(filePath);
    const size = stats.size;

    try {
      let metadata: Partial<DocumentMetadata> = {
        filename: path.basename(filePath),
        originalName,
        size,
        type: this.getDocumentType(mimeType),
        mimeType,
        processingTime: 0,
      };

      // Processar baseado no tipo de arquivo
      switch (mimeType) {
        case "application/pdf":
          metadata = await this.processPDF(filePath, metadata);
          break;
        case "text/plain":
          metadata = await this.processTextFile(filePath, metadata);
          break;
        case "application/msword":
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          metadata = await this.processWordDocument(filePath, metadata);
          break;
        default:
          // Processar como imagem
          if (mimeType.startsWith("image/")) {
            metadata = await this.processImage(filePath, metadata);
          }
      }

      metadata.processingTime = Date.now() - startTime;
      return metadata as DocumentMetadata;
    } catch (error) {
      console.error(`Erro ao processar documento ${filePath}:`, error);
      throw new Error(
        `Falha ao processar documento: ${error instanceof Error ? error.message : "Erro desconhecido"}`
      );
    }
  }

  /**
   * Processa arquivos PDF
   */
  private static async processPDF(
    filePath: string,
    metadata: Partial<DocumentMetadata>
  ): Promise<Partial<DocumentMetadata>> {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(dataBuffer);

    return {
      ...metadata,
      pageCount: pdfData.numpages,
      textContent: pdfData.text.substring(0, 1000), // Primeiros 1000 caracteres
    };
  }

  /**
   * Processa arquivos de texto
   */
  private static async processTextFile(
    filePath: string,
    metadata: Partial<DocumentMetadata>
  ): Promise<Partial<DocumentMetadata>> {
    const content = fs.readFileSync(filePath, "utf-8");

    return {
      ...metadata,
      textContent: content.substring(0, 1000), // Primeiros 1000 caracteres
    };
  }

  /**
   * Processa documentos Word (simplificado - apenas metadados básicos)
   */
  private static async processWordDocument(
    filePath: string,
    metadata: Partial<DocumentMetadata>
  ): Promise<Partial<DocumentMetadata>> {
    // Para DOC/DOCX, retornamos apenas metadados básicos
    // Processamento completo seria feito com bibliotecas como mammoth.js
    return {
      ...metadata,
      textContent:
        "[Conteúdo do documento Word - processamento completo disponível]",
    };
  }

  /**
   * Processa imagens
   */
  private static async processImage(
    filePath: string,
    metadata: Partial<DocumentMetadata>
  ): Promise<Partial<DocumentMetadata>> {
    const image = sharp(filePath);
    const imageInfo = await image.metadata();

    return {
      ...metadata,
      dimensions: {
        width: imageInfo.width || 0,
        height: imageInfo.height || 0,
      },
    };
  }

  /**
   * Determina o tipo de documento baseado no MIME type
   */
  static getDocumentType(mimeType: string): string {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType === "text/plain") return "text";
    if (mimeType.includes("word")) return "document";
    return "unknown";
  }

  /**
   * Limpa arquivos temporários
   */
  static cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Arquivo temporário removido: ${filePath}`);
      }
    } catch (error) {
      console.warn(`Erro ao remover arquivo temporário ${filePath}:`, error);
    }
  }

  /**
   * Move arquivo processado para pasta final
   */
  static moveToProcessed(tempPath: string, filename: string): string {
    const processedPath = path.join("uploads/processed", filename);

    try {
      fs.renameSync(tempPath, processedPath);
      return processedPath;
    } catch (error) {
      console.error(`Erro ao mover arquivo para pasta processada:`, error);
      throw new Error("Falha ao mover arquivo processado");
    }
  }
}
