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

// Configuração da fila para análise de texto
export const textAnalysisQueue = new Bull("text analysis", {
  redis: getRedisConfig(),
  defaultJobOptions: {
    removeOnComplete: 100, // Manter apenas os últimos 100 jobs completos
    removeOnFail: 50, // Manter apenas os últimos 50 jobs falhados
    attempts: 3, // Tentar 3 vezes em caso de falha
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
});

// Configuração da fila para rate limiting
export const rateLimitQueue = new Bull("rate limit", {
  redis: getRedisConfig(),
});

export { Bull };
