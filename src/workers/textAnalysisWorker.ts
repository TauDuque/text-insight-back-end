import { Job } from "bull";
import { textAnalysisQueue } from "../config/queue";
import { TextAnalysisService } from "../services/TextAnalysisService";
import { prisma } from "../config/database";

interface AnalysisJobData {
  analysisId: string;
  text: string;
  userId: string;
}

const textAnalysisService = new TextAnalysisService();

// Processar jobs de análise de texto
textAnalysisQueue.process("analyze-text", async (job: Job<AnalysisJobData>) => {
  const { analysisId, text, userId } = job.data;

  try {
    console.log(`🔄 Iniciando análise ${analysisId} para usuário ${userId}`);

    // Atualizar status para PROCESSING
    await prisma.analysis.update({
      where: { id: analysisId },
      data: { status: "PROCESSING" },
    });

    // Simular progresso
    job.progress(25);

    // Realizar análise
    const results = await textAnalysisService.analyzeText(text);

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

    job.progress(100);

    console.log(`✅ Análise ${analysisId} concluída`);

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

    throw error;
  }
});

// Event listeners para monitoramento
textAnalysisQueue.on("completed", (job, _result) => {
  console.log(`✅ Job ${job.id} concluído`);
});

textAnalysisQueue.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} falhou:`, err.message);
});

textAnalysisQueue.on("stalled", job => {
  console.warn(`⚠️ Job ${job.id} travado`);
});

export { textAnalysisQueue };
