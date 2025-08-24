import { prisma } from "../config/database";
import { textAnalysisQueue } from "../config/queue";
import { TextAnalysisService } from "./TextAnalysisService";
import { cacheService } from "./CacheService";

export class AnalysisService {
  private textAnalysisService = new TextAnalysisService();

  async createAnalysis(text: string, userId: string) {
    // Verificar se já existe análise idêntica recente (cache por hash do texto)
    const textHash = this.generateTextHash(text);
    const cachedResult = await cacheService.get(
      `text_hash:${textHash}:${userId}`
    );

    if (cachedResult) {
      return {
        ...cachedResult,
        fromCache: true,
        message: "Resultado obtido do cache (análise idêntica recente)",
      };
    }

    // Determinar se deve ser processamento síncrono ou assíncrono
    const isLongText = text.length > 500;

    // Criar registro da análise
    const analysis = await prisma.analysis.create({
      data: {
        text,
        userId,
        status: isLongText ? "PENDING" : "PROCESSING",
      },
    });

    if (isLongText) {
      // Processamento assíncrono
      const job = await textAnalysisQueue.add(
        "analyze-text",
        {
          analysisId: analysis.id,
          text,
          userId,
        },
        {
          priority: this.calculatePriority(text.length),
          delay: 0,
        }
      );

      // Atualizar com jobId
      await prisma.analysis.update({
        where: { id: analysis.id },
        data: { jobId: job.id.toString() },
      });

      const result = {
        id: analysis.id,
        jobId: job.id.toString(),
        status: "PENDING",
        message: "Análise enfileirada para processamento assíncrono",
        estimatedTime: this.estimateProcessingTime(text.length),
        queuePosition: await this.getQueuePosition(job.id.toString()),
      };

      // Cache temporário
      await cacheService.set(`analysis:${analysis.id}`, result, 300);

      return result;
    } else {
      // Processamento síncrono
      try {
        const results = await this.textAnalysisService.analyzeText(text);

        const updatedAnalysis = await prisma.analysis.update({
          where: { id: analysis.id },
          data: {
            status: "COMPLETED",
            results: results as any,
            completedAt: new Date(),
            processingTime: Date.now() - analysis.createdAt.getTime(),
          },
        });

        const result = {
          id: analysis.id,
          status: "COMPLETED",
          results,
          processingTime: updatedAnalysis.processingTime,
          message: "Análise concluída",
        };

        // Cache do resultado por hash do texto
        await cacheService.set(`text_hash:${textHash}:${userId}`, result, 3600); // 1 hora
        await cacheService.cacheAnalysis(analysis.id, result, 3600);

        return result;
      } catch (error) {
        await prisma.analysis.update({
          where: { id: analysis.id },
          data: {
            status: "FAILED",
            error: error instanceof Error ? error.message : "Erro desconhecido",
            completedAt: new Date(),
          },
        });
        throw error;
      }
    }
  }

  async getAnalysis(analysisId: string, userId: string) {
    // Tentar buscar do cache primeiro
    const cached = await cacheService.getCachedAnalysis(analysisId);
    if (cached && cached.status === "COMPLETED") {
      return { ...cached, fromCache: true };
    }

    const analysis = await prisma.analysis.findFirst({
      where: {
        id: analysisId,
        userId,
      },
    });

    if (!analysis) {
      throw new Error("Análise não encontrada");
    }

    // Se ainda está processando e tem jobId, verificar status na fila
    if (
      (analysis.status === "PENDING" || analysis.status === "PROCESSING") &&
      analysis.jobId
    ) {
      const job = await textAnalysisQueue.getJob(analysis.jobId);
      if (job) {
        const progress = job.progress();
        const queuePosition = await this.getQueuePosition(analysis.jobId);

        const result = {
          ...analysis,
          progress,
          queuePosition,
          estimatedTime: this.estimateProcessingTime(analysis.text.length),
        };

        // Cache temporário para análises em progresso
        await cacheService.set(`analysis:${analysisId}`, result, 60);

        return result;
      }
    }

    // Cache para análises completas
    if (analysis.status === "COMPLETED") {
      await cacheService.cacheAnalysis(analysisId, analysis, 3600);
    }

    return analysis;
  }

  async getUserAnalyses(userId: string, page: number = 1, limit: number = 10) {
    const cacheKey = `user:${userId}:analyses:${page}:${limit}`;
    const cached = await cacheService.get(cacheKey);

    if (cached) {
      return { ...cached, fromCache: true };
    }

    const skip = (page - 1) * limit;

    const [analyses, total] = await Promise.all([
      prisma.analysis.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          status: true,
          createdAt: true,
          completedAt: true,
          processingTime: true,
          error: true,
          text: true,
        },
      }),
      prisma.analysis.count({
        where: { userId },
      }),
    ]);

    const result = {
      analyses: analyses.map(analysis => ({
        ...analysis,
        textPreview:
          analysis.text.substring(0, 100) +
          (analysis.text.length > 100 ? "..." : ""),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    // Cache por 5 minutos
    await cacheService.set(cacheKey, result, 300);

    return result;
  }

  async deleteAnalysis(analysisId: string, userId: string) {
    const analysis = await prisma.analysis.findFirst({
      where: {
        id: analysisId,
        userId,
      },
    });

    if (!analysis) {
      throw new Error("Análise não encontrada");
    }

    // Se tem job ativo, cancelar
    if (
      analysis.jobId &&
      (analysis.status === "PENDING" || analysis.status === "PROCESSING")
    ) {
      const job = await textAnalysisQueue.getJob(analysis.jobId);
      if (job) {
        await job.remove();
      }
    }

    await prisma.analysis.delete({
      where: { id: analysisId },
    });

    // Limpar cache
    await cacheService.del(`analysis:${analysisId}`);
    await cacheService.invalidateUserCache(userId);

    return { message: "Análise removida com sucesso" };
  }

  async getQueueStats() {
    // Tentar buscar do cache primeiro
    const cached = await cacheService.getCachedQueueStats();
    if (cached) {
      return { ...cached, fromCache: true };
    }

    const [waiting, active, completed, failed] = await Promise.all([
      textAnalysisQueue.getWaiting(),
      textAnalysisQueue.getActive(),
      textAnalysisQueue.getCompleted(),
      textAnalysisQueue.getFailed(),
    ]);

    const stats = {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length,
      timestamp: new Date().toISOString(),
    };

    // Cache por 30 segundos
    await cacheService.cacheQueueStats(stats, 30);

    return stats;
  }

  async getAnalysisStats(userId: string) {
    const cacheKey = `user:${userId}:stats`;
    const cached = await cacheService.get(cacheKey);

    if (cached) {
      return { ...cached, fromCache: true };
    }

    const [total, completed, failed, pending] = await Promise.all([
      prisma.analysis.count({ where: { userId } }),
      prisma.analysis.count({ where: { userId, status: "COMPLETED" } }),
      prisma.analysis.count({ where: { userId, status: "FAILED" } }),
      prisma.analysis.count({
        where: { userId, status: { in: ["PENDING", "PROCESSING"] } },
      }),
    ]);

    const avgProcessingTime = await prisma.analysis.aggregate({
      where: {
        userId,
        status: "COMPLETED",
        processingTime: { not: null },
      },
      _avg: { processingTime: true },
    });

    const stats = {
      total,
      completed,
      failed,
      pending,
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      averageProcessingTime: Math.round(
        avgProcessingTime._avg.processingTime || 0
      ),
      timestamp: new Date().toISOString(),
    };

    // Cache por 10 minutos
    await cacheService.set(cacheKey, stats, 600);

    return stats;
  }

  private generateTextHash(text: string): string {
    // Gerar hash simples do texto para cache
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString();
  }

  private calculatePriority(textLength: number): number {
    // Prioridade baseada no tamanho do texto (textos menores têm prioridade)
    if (textLength < 1000) return 10;
    if (textLength < 5000) return 5;
    if (textLength < 10000) return 3;
    return 1;
  }

  private async getQueuePosition(jobId: string): Promise<number> {
    try {
      const waiting = await textAnalysisQueue.getWaiting();
      const position = waiting.findIndex(job => job.id.toString() === jobId);
      return position >= 0 ? position + 1 : 0;
    } catch {
      return 0;
    }
  }

  private estimateProcessingTime(textLength: number): string {
    // Estimativa baseada no tamanho do texto
    const seconds = Math.ceil(textLength / 1000) * 2; // ~2 segundos por 1000 caracteres

    if (seconds < 60) return `~${seconds} segundos`;
    const minutes = Math.ceil(seconds / 60);
    return `~${minutes} minuto${minutes > 1 ? "s" : ""}`;
  }
}
