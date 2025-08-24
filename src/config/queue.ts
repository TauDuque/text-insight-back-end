import Bull from "bull";
import redis from "./redis";

// Configuração da fila para análise de texto
export const textAnalysisQueue = new Bull("text analysis", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
  },
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
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
  },
});

export { Bull };
