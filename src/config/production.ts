// Configurações específicas para produção - otimizações de custo
export const PRODUCTION_CONFIG = {
  // Configurações de CPU
  CPU: {
    // Reduzir polling de jobs
    JOB_CHECK_INTERVAL: 60000, // 1 minuto (era 30 segundos)

    // Reduzir limpeza de memória
    MEMORY_CLEANUP_INTERVAL: 4 * 60 * 60 * 1000, // 4 horas (era 2 horas)

    // Reduzir logs
    LOG_LEVEL: "error", // Apenas erros em produção
  },

  // Configurações de Redis/Bull
  QUEUE: {
    // Reduzir verificações de jobs travados
    STALLED_INTERVAL: 120000, // 2 minutos (era 1 minuto)

    // Reduzir limpeza de filas
    CLEANUP_INTERVAL: 6 * 60 * 60 * 1000, // 6 horas (era 4 horas)

    // Reduzir jobs mantidos em memória
    MAX_COMPLETED_JOBS: 3, // Apenas 3 jobs completos
    MAX_FAILED_JOBS: 2, // Apenas 2 jobs falhados
  },

  // Configurações de banco de dados
  DATABASE: {
    // Reduzir conexões ativas
    MAX_CONNECTIONS: 2, // Máximo 2 conexões simultâneas

    // Reduzir timeout de conexão
    CONNECTION_TIMEOUT: 10000, // 10 segundos
  },

  // Configurações de rede
  NETWORK: {
    // Reduzir tamanho máximo de upload
    MAX_UPLOAD_SIZE: 1024 * 1024, // 1MB (era 5MB)

    // Reduzir timeout de requisições
    REQUEST_TIMEOUT: 30000, // 30 segundos
  },

  // Configurações de rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutos
    MAX_REQUESTS: 50, // Máximo 50 requests por janela
  },

  // Configurações de processamento
  PROCESSING: {
    // Reduzir batch size
    BATCH_SIZE: 1, // Processar apenas 1 documento por vez

    // Reduzir timeout de processamento
    PROCESSING_TIMEOUT: 20000, // 20 segundos (era 45 segundos)

    // Reduzir tentativas
    MAX_ATTEMPTS: 1, // Apenas 1 tentativa
  },
};

// Função para aplicar configurações de produção
export const applyProductionOptimizations = () => {
  if (process.env.NODE_ENV === "production") {
    console.log("🔧 Aplicando otimizações de produção...");

    // Reduzir logs em produção
    if (process.env.LOG_LEVEL) {
      process.env.LOG_LEVEL = PRODUCTION_CONFIG.CPU.LOG_LEVEL;
    }

    // Configurar garbage collection mais agressivo
    if (global.gc) {
      // Forçar GC a cada 10 minutos em produção
      setInterval(
        () => {
          global.gc?.();
        },
        10 * 60 * 1000
      );
    }

    console.log("✅ Otimizações de produção aplicadas");
  }
};
