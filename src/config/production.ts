// Configurações específicas para produção para reduzir consumo de recursos

export const PRODUCTION_CONFIG = {
  // Configurações de memória
  MEMORY: {
    MAX_HEAP_SIZE: "512m", // Limitar heap a 512MB
    GC_INTERVAL: 15 * 60 * 1000, // Garbage collection a cada 15 minutos
    CACHE_CLEANUP_INTERVAL: 30 * 60 * 1000, // Limpeza de cache a cada 30 minutos
  },

  // Configurações de processamento
  PROCESSING: {
    MAX_CONCURRENT_JOBS: 3, // Máximo de 3 jobs simultâneos
    JOB_TIMEOUT: 30000, // Timeout de 30 segundos por job
    MAX_TEXT_LENGTH: 50000, // Limite de texto para análise
    BATCH_SIZE: 5, // Tamanho do lote para processamento
  },

  // Configurações de banco de dados
  DATABASE: {
    CONNECTION_LIMIT: 5, // Máximo de 5 conexões simultâneas
    IDLE_TIMEOUT: 30000, // Timeout de conexões ociosas em 30 segundos
    CLEANUP_INTERVAL: 60 * 60 * 1000, // Limpeza de conexões a cada 1 hora
  },

  // Configurações de Redis
  REDIS: {
    MAX_CONNECTIONS: 3, // Máximo de 3 conexões simultâneas
    CONNECTION_TIMEOUT: 10000, // Timeout de conexão em 10 segundos
    CLEANUP_INTERVAL: 2 * 60 * 60 * 1000, // Limpeza a cada 2 horas
  },

  // Configurações de filas
  QUEUE: {
    MAX_JOBS_IN_MEMORY: 50, // Máximo de 50 jobs na memória
    CLEANUP_INTERVAL: 60 * 60 * 1000, // Limpeza a cada 1 hora
    REMOVE_ON_COMPLETE: 20, // Manter apenas 20 jobs completos
    REMOVE_ON_FAIL: 10, // Manter apenas 10 jobs falhados
  },

  // Configurações de logs
  LOGGING: {
    LEVEL: "warn", // Apenas logs de warning e erro em produção
    MAX_LOG_SIZE: "10m", // Tamanho máximo de log
    ROTATION_INTERVAL: 24 * 60 * 60 * 1000, // Rotação diária
  },

  // Configurações de rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // Janela de 15 minutos
    MAX_REQUESTS: 100, // Máximo de 100 requisições por janela
    SKIP_SUCCESSFUL_REQUESTS: true, // Pular rate limiting para requisições bem-sucedidas
  },
};
