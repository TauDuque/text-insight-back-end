#!/usr/bin/env node

/**
 * Script de inicialização otimizado para produção
 * Reduz significativamente o consumo de CPU e memória
 */

// Configurações de otimização para Node.js
process.env.NODE_OPTIONS =
  "--max-old-space-size=512 --expose-gc --optimize-for-size";

// Configurações de garbage collection
process.env.NODE_GC_INTERVAL = "900000"; // 15 minutos

// Configurações de cluster (se necessário)
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;

// Configurações de produção
const isProduction = process.env.NODE_ENV === "production";

if (isProduction && cluster.isMaster) {
  console.log(
    `🚀 Iniciando servidor em modo produção com ${Math.min(numCPUs, 2)} workers`
  );

  // Em produção, usar apenas 2 workers para economizar recursos
  for (let i = 0; i < Math.min(numCPUs, 2); i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`⚠️ Worker ${worker.process.pid} morreu. Reiniciando...`);
    cluster.fork();
  });

  // Monitoramento de memória
  setInterval(
    () => {
      const memUsage = process.memoryUsage();
      console.log(
        `💾 Master - Heap: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`
      );

      // Forçar garbage collection se necessário
      if (memUsage.heapUsed > 400 * 1024 * 1024) {
        // 400MB
        if (global.gc) global.gc();
      }
    },
    5 * 60 * 1000
  ); // A cada 5 minutos
} else {
  // Worker ou desenvolvimento
  require("./dist/app.js");

  // Monitoramento de recursos do worker
  if (isProduction) {
    setInterval(
      () => {
        const memUsage = process.memoryUsage();
        console.log(
          `💾 Worker ${process.pid} - Heap: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`
        );

        // Forçar garbage collection se necessário
        if (memUsage.heapUsed > 200 * 1024 * 1024) {
          // 200MB
          if (global.gc) global.gc();
        }
      },
      5 * 60 * 1000
    ); // A cada 5 minutos
  }
}

// Tratamento de erros não capturados
process.on("uncaughtException", error => {
  console.error("❌ Erro não capturado:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Promise rejeitada não tratada:", reason);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Recebido SIGTERM, encerrando...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Recebido SIGINT, encerrando...");
  process.exit(0);
});
