import { Job } from "bull";
import { textAnalysisQueue } from "../config/queue";
import { TextAnalysisService } from "../services/TextAnalysisService";
import { prisma } from "../config/database";
import { cacheService } from "../services/CacheService";

interface AnalysisJobData {
  analysisId: string;
  text: string;
  userId: string;
}

const textAnalysisService = new TextAnalysisService();

// Configurações para otimização de recursos
const MAX_TEXT_LENGTH = 50000; // Limite de texto para análise
const PROCESSING_TIMEOUT = 30000; // 30 segundos máximo por análise
const BATCH_SIZE = 5; // Processar no máximo 5 análises simultaneamente

// Processar jobs de análise de texto com otimizações
textAnalysisQueue.process(
  "analyze-text",
  BATCH_SIZE,
  async (job: Job<AnalysisJobData>) => {
    const { analysisId, text, userId } = job.data;

    // Verificar tamanho do texto para evitar processamento excessivo
    if (text.length > MAX_TEXT_LENGTH) {
      await prisma.analysis.update({
        where: { id: analysisId },
        data: {
          status: "FAILED",
          error: "Texto muito longo para análise",
          completedAt: new Date(),
        },
      });
      throw new Error("Texto muito longo para análise");
    }

    try {
      console.log(`🔄 Iniciando análise ${analysisId} para usuário ${userId}`);

      // Atualizar status para PROCESSING
      await prisma.analysis.update({
        where: { id: analysisId },
        data: { status: "PROCESSING" },
      });

      // Simular progresso
      job.progress(25);

      // Realizar análise com timeout
      const results = await Promise.race([
        textAnalysisService.analyzeText(text),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout na análise")),
            PROCESSING_TIMEOUT
          )
        ),
      ]);

      job.progress(75);

      // Salvar resultados
      await prisma.analysis.update({
        where: { id: analysisId },
        data: {
          status: "COMPLETED",
          results: results as any,
          completedAt: new Date(),
          processingTime: Date.now() - job.timestamp,
        },
      });

      // Limpar cache das estatísticas do usuário para forçar atualização
      await cacheService.invalidateUserCache(userId);

      job.progress(100);

      console.log(`✅ Análise ${analysisId} concluída`);

      // Forçar garbage collection se disponível
      if (global.gc) {
        global.gc();
      }

      return results;
    } catch (error) {
      console.error(`❌ Erro na análise ${analysisId}:`, error);

      // Salvar erro
      await prisma.analysis.update({
        where: { id: analysisId },
        data: {
          status: "FAILED",
          error: error instanceof Error ? error.message : "Erro desconhecido",
          completedAt: new Date(),
        },
      });

      // Limpar cache das estatísticas do usuário para forçar atualização
      await cacheService.invalidateUserCache(userId);

      throw error;
    }
  }
);

// Event listeners para monitoramento com limpeza de memória
textAnalysisQueue.on("completed", (job, _result) => {
  console.log(`✅ Job ${job.id} concluído`);

  // Limpar dados do job da memória
  job.remove();

  // Forçar garbage collection se disponível
  if (global.gc) {
    global.gc();
  }
});

textAnalysisQueue.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} falhou:`, err.message);

  // Limpar dados do job da memória
  job.remove();
});

textAnalysisQueue.on("stalled", job => {
  console.warn(`⚠️ Job ${job.id} travado`);

  // Tentar remover job travado
  job.remove();
});

// Limpeza periódica de jobs antigos para liberar memória
setInterval(
  async () => {
    try {
      // Remover jobs completos com mais de 1 hora
      const completedJobs = await textAnalysisQueue.getCompleted();
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
      console.warn("Erro na limpeza de jobs:", error);
    }
  },
  30 * 60 * 1000
); // A cada 30 minutos

export { textAnalysisQueue };
