import Bull from "bull";

// Configuração condicional do Redis baseada no ambiente
const getRedisConfig = () => {
  if (process.env.NODE_ENV === "development") {
    // Em desenvolvimento, usa Redis local
    return {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD || undefined,
    };
  } else {
    // Em produção, usa Redis externo via REDIS_URL
    return process.env.REDIS_URL!;
  }
};

// Configuração da fila para processamento de documentos com otimizações CRÍTICAS
export const documentProcessingQueue = new Bull("document processing", {
  redis: getRedisConfig(),
  defaultJobOptions: {
    removeOnComplete: 5, // Reduzido para apenas os últimos 5 jobs completos
    removeOnFail: 3, // Reduzido para apenas os últimos 3 jobs falhados
    attempts: 1, // Reduzido para apenas 1 tentativa
    backoff: {
      type: "fixed",
      delay: 5000, // 5 segundos de delay
    },
    delay: 1000, // Delay inicial de 1 segundo
    timeout: 30000, // Timeout reduzido para 30 segundos
  },
  settings: {
    stalledInterval: 60000, // Verificar jobs travados a cada 1 minuto (reduzido)
    maxStalledCount: 0, // Não tentar reprocessar jobs travados
    retryProcessDelay: 5000, // Delay de 5 segundos entre tentativas
    lockDuration: 30000, // Lock reduzido para 30 segundos
    lockRenewTime: 15000, // Renovar lock a cada 15 segundos
  },
  limiter: {
    max: 2, // Reduzido para máximo de 2 jobs por
    duration: 60000, // por minuto
  },
});

// Configuração da fila para rate limiting (otimizada)
export const rateLimitQueue = new Bull("rate limit", {
  redis: getRedisConfig(),
  defaultJobOptions: {
    removeOnComplete: 10, // Manter apenas os últimos 10
    removeOnFail: 5, // Manter apenas os últimos 5 falhados
    attempts: 1, // Apenas 1 tentativa
    timeout: 10000, // Timeout de 10 segundos
  },
  settings: {
    stalledInterval: 60000, // Verificar jobs travados a cada 1 minuto
    maxStalledCount: 0, // Não tentar reprocessar jobs travados
  },
});

// Função para limpar filas antigas periodicamente
export const cleanupQueues = async () => {
  try {
    // Limpar jobs antigos das filas
    await documentProcessingQueue.clean(60 * 60 * 1000, "completed"); // 1 hora
    await documentProcessingQueue.clean(60 * 60 * 1000, "failed"); // 1 hora
    await rateLimitQueue.clean(30 * 60 * 1000, "completed"); // 30 minutos
    await rateLimitQueue.clean(30 * 60 * 1000, "failed"); // 30 minutos

    console.log("🧹 Filas limpas com sucesso");
  } catch (error) {
    console.warn("⚠️ Erro ao limpar filas:", error);
  }
};

// Executar limpeza a cada 4 horas (reduzido)
setInterval(cleanupQueues, 4 * 60 * 60 * 1000);

export { Bull };
