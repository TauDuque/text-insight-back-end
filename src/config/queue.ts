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

// Configuração da fila para processamento de documentos com otimizações
export const documentProcessingQueue = new Bull("document processing", {
  redis: getRedisConfig(),
  defaultJobOptions: {
    removeOnComplete: 15, // Reduzir para apenas os últimos 15 jobs completos
    removeOnFail: 8, // Reduzir para apenas os últimos 8 jobs falhados
    attempts: 2, // Reduzir tentativas para 2
    backoff: {
      type: "fixed", // Usar backoff fixo em vez de exponencial
      delay: 3000, // 3 segundos de delay
    },
    delay: 500, // Delay inicial de 0.5 segundos
    timeout: 45000, // Timeout de 45 segundos por job (mais tempo para documentos)
  },
  settings: {
    stalledInterval: 45000, // Verificar jobs travados a cada 45 segundos
    maxStalledCount: 1, // Máximo de 1 tentativa para jobs travados
    retryProcessDelay: 3000, // Delay de 3 segundos entre tentativas
    lockDuration: 45000, // Lock de 45 segundos
    lockRenewTime: 20000, // Renovar lock a cada 20 segundos
  },
  limiter: {
    max: 8, // Máximo de 8 jobs por
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

// Executar limpeza a cada 2 horas
setInterval(cleanupQueues, 2 * 60 * 60 * 1000);

export { Bull };
