import { Job } from "bull";
import { documentProcessingQueue } from "../config/queue";
import { DocumentProcessingService } from "../services/DocumentProcessingService";
import { getPrismaClient } from "../config/database";
import { cacheService } from "../services/CacheService";
// import { DocumentProcessor } from "../utils/documentProcessor"; // Não utilizado mais
import { UPLOAD_CONFIG } from "../config/upload";

interface DocumentJobData {
  documentId: string;
  file_path: string;
  originalName: string;
  mimeType: string;
  userId: string;
}

const documentProcessingService = new DocumentProcessingService();

// Configurações para otimização de recursos
const PROCESSING_TIMEOUT = UPLOAD_CONFIG.PROCESSING_TIMEOUT;
const BATCH_SIZE = 3; // Processar no máximo 3 documentos simultaneamente

// Processar jobs de processamento de documentos com otimizações
documentProcessingQueue.process(
  "process-document",
  BATCH_SIZE,
  async (job: Job<DocumentJobData>) => {
    const { documentId, file_path, originalName, mimeType, userId } = job.data;

    try {
      console.log(
        `🔄 Iniciando processamento do documento ${documentId} para usuário ${userId}`
      );

      // Atualizar status para PROCESSING
      await getPrismaClient().document.update({
        where: { id: documentId },
        data: { status: "PROCESSING" },
      });

      // Simular progresso
      job.progress(25);

      // Realizar processamento com timeout
      const results = await Promise.race([
        documentProcessingService.processQueuedDocument(
          file_path,
          originalName,
          mimeType
        ),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout no processamento")),
            PROCESSING_TIMEOUT
          )
        ),
      ]);

      console.log("🔍 DEBUG - Resultados do processamento:", results);

      job.progress(75);

      // Mover arquivo para pasta processada (simulado)
      const processedPath = file_path; // Por enquanto, manter no mesmo local

      // Obter tamanho do arquivo
      const fs = require("fs");
      const fileSize = fs.statSync(file_path).size;

      // Salvar resultados processados
      const processedResults = results as any;
      await getPrismaClient().document.update({
        where: { id: documentId },
        data: {
          status: "COMPLETED",
          results: {
            filename: originalName,
            originalName: originalName,
            size: fileSize,
            type: mimeType.split("/")[0],
            mimeType: mimeType,
            dimensions:
              processedResults.metadata.width &&
              processedResults.metadata.height
                ? {
                    width: processedResults.metadata.width,
                    height: processedResults.metadata.height,
                  }
                : undefined,
            pageCount: processedResults.metadata.pageCount,
            textContent: processedResults.extractedText,
            processingTime: Date.now() - job.timestamp,
            status: "completed",
          },
          processed_file_path: processedPath,
          completed_at: new Date(),
          processing_time: Date.now() - job.timestamp,
          extractedText: processedResults.extractedText,
          metadata: processedResults.metadata,
          processedAt: new Date(),
        },
      });

      // Limpar cache das estatísticas do usuário para forçar atualização
      await cacheService.invalidateUserCache(userId);

      job.progress(100);

      console.log(`✅ Documento ${documentId} processado com sucesso`);

      // Forçar garbage collection se disponível
      if (global.gc) {
        global.gc();
      }

      return results;
    } catch (error) {
      console.error(
        `❌ Erro no processamento do documento ${documentId}:`,
        error
      );

      // Limpar arquivo temporário em caso de erro
      // DocumentProcessor.cleanupTempFile(filePath); // Método não existe mais

      // Salvar erro
      await getPrismaClient().document.update({
        where: { id: documentId },
        data: {
          status: "FAILED",
          error: error instanceof Error ? error.message : "Erro desconhecido",
          completed_at: new Date(),
        },
      });

      // Limpar cache das estatísticas do usuário para forçar atualização
      await cacheService.invalidateUserCache(userId);

      throw error;
    }
  }
);

// Event listeners para monitoramento com limpeza de memória
documentProcessingQueue.on("completed", (job, _result) => {
  console.log(`✅ Job de documento ${job.id} concluído`);

  // Limpar dados do job da memória
  job.remove();

  // Forçar garbage collection se disponível
  if (global.gc) {
    global.gc();
  }
});

documentProcessingQueue.on("failed", (job, err) => {
  console.error(`❌ Job de documento ${job.id} falhou:`, err.message);

  // Limpar dados do job da memória
  job.remove();
});

documentProcessingQueue.on("stalled", job => {
  console.warn(`⚠️ Job de documento ${job.id} travado`);

  // Tentar remover job travado
  job.remove();
});

// Limpeza periódica de jobs antigos para liberar memória
setInterval(
  async () => {
    try {
      // Remover jobs completos com mais de 1 hora
      const completedJobs = await documentProcessingQueue.getCompleted();
      const oneHourAgo = Date.now() - 60 * 60 * 1000;

      for (const job of completedJobs) {
        if (job.finishedOn && job.finishedOn < oneHourAgo) {
          await job.remove();
        }
      }

      // Forçar garbage collection
      if (global.gc) {
        global.gc();
      }
    } catch (error) {
      console.warn("Erro na limpeza de jobs de documentos:", error);
    }
  },
  30 * 60 * 1000
); // A cada 30 minutos

export { documentProcessingQueue };
