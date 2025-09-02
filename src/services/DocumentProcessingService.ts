import { ProcessedDocument } from "../types/document";
import { DocumentProcessor } from "../utils/documentProcessor";
import { UPLOAD_CONFIG } from "../config/upload";

export interface DocumentProcessingResult {
  documentId: string;
  filename: string;
  originalName: string;
  size: number;
  type: string;
  mimeType: string;
  dimensions?: { width: number; height: number };
  pageCount?: number;
  textContent?: string;
  processingTime: number;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
}

export interface QueueResponse {
  queueId: string;
  message: string;
  estimatedTime: number;
  fileSize: number;
  filename: string;
}

export class DocumentProcessingService {
  private readonly MAX_FILE_SIZE = UPLOAD_CONFIG.MAX_FILE_SIZE;

  /**
   * Adiciona documento à fila de processamento
   */
  async addDocumentToQueue(
    filePath: string,
    originalName: string,
    mimeType: string,
    _userId: string
  ): Promise<QueueResponse> {
    const fileSize = this.getFileSize(filePath);

    if (fileSize > this.MAX_FILE_SIZE) {
      throw new Error(
        `Arquivo muito grande. Máximo permitido: ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
      );
    }

    const estimatedTime = this.calculateEstimatedTime(fileSize, mimeType);
    const queueId = this.generateQueueId();

    return {
      queueId,
      message: `Documento enviado para processamento em fila. Tamanho: ${(fileSize / 1024).toFixed(1)}KB`,
      estimatedTime,
      fileSize,
      filename: originalName,
    };
  }

  /**
   * Processa documento em fila (chamado pelo worker)
   */
  async processQueuedDocument(
    filePath: string,
    originalName: string,
    mimeType: string
  ): Promise<ProcessedDocument> {
    try {
      console.log("🔍 DEBUG - Iniciando processamento em fila:", {
        filePath,
        originalName,
        mimeType,
      });

      // Ler o arquivo como buffer
      const fs = require("fs");
      const buffer = fs.readFileSync(filePath);

      console.log("🔍 DEBUG - Arquivo lido, tamanho:", buffer.length);

      const result = await DocumentProcessor.processDocument(buffer, mimeType);

      console.log("🔍 DEBUG - Processamento concluído:", result);

      return result;
    } catch (error) {
      console.error("❌ ERROR - Erro no processamento em fila:", error);
      throw new Error("Falha ao processar documento em fila");
    }
  }

  /**
   * Obtém estatísticas da fila de documentos
   */
  async getQueueStats() {
    // Retorna estatísticas da fila de documentos
    return {
      totalJobs: 0,
      pendingJobs: 0,
      processingJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      averageProcessingTime: 0,
      jobsPerMinute: 0,
    };
  }

  /**
   * Limpa arquivos temporários
   */
  async cleanupTempFiles(_filePaths: string[]): Promise<void> {
    // Método não implementado - arquivos são processados em memória
    console.log("Limpeza de arquivos temporários não necessária");
  }

  /**
   * Move arquivo processado para pasta final
   */
  async moveToProcessed(tempPath: string, _filename: string): Promise<string> {
    // Método não implementado - arquivos são processados em memória
    return tempPath; // Retorna o caminho original
  }

  /**
   * Calcula tempo estimado de processamento
   */
  private calculateEstimatedTime(fileSize: number, mimeType: string): number {
    const baseTime = 3; // 3 segundos base
    const timePerMB = 0.5; // 0.5 segundos por MB adicional

    let multiplier = 1;

    // Ajustar tempo baseado no tipo de arquivo
    if (mimeType.startsWith("image/")) {
      multiplier = 0.8; // Imagens são mais rápidas
    } else if (mimeType === "application/pdf") {
      multiplier = 1.2; // PDFs podem ser mais lentos
    } else if (mimeType.includes("word")) {
      multiplier = 1.5; // Documentos Word são mais lentos
    }

    const estimatedTime =
      (baseTime + (fileSize / (1024 * 1024)) * timePerMB) * multiplier;
    return Math.min(estimatedTime, 15); // Máximo 15 segundos
  }

  /**
   * Obtém tamanho do arquivo
   */
  private getFileSize(filePath: string): number {
    try {
      const fs = require("fs");
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      console.error(`Erro ao obter tamanho do arquivo ${filePath}:`, error);
      return 0;
    }
  }

  /**
   * Gera ID único para a fila
   */
  private generateQueueId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `doc_queue_${timestamp}_${random}`;
  }
}
