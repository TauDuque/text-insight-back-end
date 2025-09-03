import { Job } from "bull";
import { documentProcessingQueue } from "../config/queue";
import { DocumentProcessingService } from "../services/DocumentProcessingService";
import { getPrismaClient } from "../config/database";
import { cacheService } from "../services/CacheService";
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
const BATCH_SIZE = 1; // Reduzido para 1 para economizar recursos

// Worker "dorminhoco" - só processa quando há jobs
let isProcessing = false;
let workerActive = false;

const processJob = async (job: Job<DocumentJobData>) => {
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
    const processedResults = results as Record<string, unknown>;
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
            (processedResults.metadata as Record<string, unknown>)?.width &&
            (processedResults.metadata as Record<string, unknown>)?.height
              ? {
                  width: (processedResults.metadata as Record<string, unknown>)
                    .width as number,
                  height: (processedResults.metadata as Record<string, unknown>)
                    .height as number,
                }
              : undefined,
          pageCount: (processedResults.metadata as Record<string, unknown>)
            ?.pageCount as number,
          textContent: processedResults.extractedText as string,
          processingTime: Date.now() - job.timestamp,
          status: "completed",
        },
        processed_file_path: processedPath,
        completed_at: new Date(),
        processing_time: Date.now() - job.timestamp,
        extractedText: processedResults.extractedText as string,
        metadata: processedResults.metadata as object,
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
};

// Função para ativar worker quando há jobs
const activateWorker = async () => {
  if (workerActive || isProcessing) return;

  workerActive = true;
  console.log("🚀 Ativando worker de documentos...");

  // Processar jobs pendentes
  const pendingJobs = await documentProcessingQueue.getWaiting();

  if (pendingJobs.length > 0) {
    console.log(`📋 Encontrados ${pendingJobs.length} jobs pendentes`);

    for (const job of pendingJobs.slice(0, BATCH_SIZE)) {
      if (!isProcessing) {
        isProcessing = true;
        try {
          await processJob(job);
        } finally {
          isProcessing = false;
        }
      }
    }
  }

  // Desativar worker após processar
  setTimeout(() => {
    workerActive = false;
    console.log("😴 Worker de documentos desativado (dorminhoco)");
  }, 5000); // Aguardar 5 segundos antes de desativar
};

// Verificar jobs a cada 30 segundos (em vez de constantemente)
setInterval(async () => {
  try {
    const waitingCount = await documentProcessingQueue.getWaiting();
    const activeCount = await documentProcessingQueue.getActive();

    if (waitingCount.length > 0 || activeCount.length > 0) {
      await activateWorker();
    }
  } catch (error) {
    console.warn("⚠️ Erro ao verificar jobs:", error);
  }
}, 30000); // 30 segundos

// Event listeners otimizados
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

// Limpeza periódica de jobs antigos (reduzida)
setInterval(
  async () => {
    try {
      // Remover jobs completos com mais de 2 horas
      const completedJobs = await documentProcessingQueue.getCompleted();
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;

      for (const job of completedJobs) {
        if (job.finishedOn && job.finishedOn < twoHoursAgo) {
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
  60 * 60 * 1000 // A cada 1 hora (reduzido de 30 min)
);

export { documentProcessingQueue };
