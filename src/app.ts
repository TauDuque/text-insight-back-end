import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database";
import { connectRedis } from "./config/redis";
import { errorHandler } from "./middlewares/errorHandler";
import { requestLogger } from "./middlewares/requestLogger";
import { Logger } from "./utils/logger";
import authRoutes from "./routes/auth";
import documentRoutes from "./routes/documents";

// Importar workers e jobs APENAS quando necessário
// import "./workers/documentProcessingWorker"; // REMOVIDO - será carregado sob demanda
import { startCleanupJob } from "./jobs/cleanup";
import { applyProductionOptimizations } from "./config/production";
import { resourceMonitor } from "./utils/resourceMonitor";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

// Aplicar otimizações de produção
applyProductionOptimizations();

export const app = express();

// Configurações de segurança otimizadas
app.use(
  helmet({
    contentSecurityPolicy: false, // Desabilitar CSP para reduzir overhead
    hsts: false, // Desabilitar HSTS para reduzir overhead
  })
);

// CORS otimizado
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
    maxAge: 86400, // Cache CORS por 24 horas
  })
);

// Morgan OTIMIZADO - apenas em desenvolvimento
if (process.env.NODE_ENV === "development") {
  app.use(
    morgan("combined", {
      stream: {
        write: (message: string) => {
          Logger.info(`🌐 HTTP: ${message.trim()}`);
        },
      },
      skip: (req, _res) => {
        return req.url === "/health" || req.url === "/favicon.ico";
      },
    })
  );
}

// Middleware personalizado para logs detalhados (apenas em desenvolvimento)
if (process.env.NODE_ENV === "development") {
  app.use(requestLogger);
}

// Parsers otimizados
app.use(
  express.json({
    limit: "2mb", // Reduzido de 5mb para 2mb
    strict: true,
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "512kb", // Reduzido de 1mb para 512kb
  })
);

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);

// Health check OTIMIZADO
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    // Removido memory e uptime para reduzir processamento
  });
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Middleware para rotas não encontradas
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Rota não encontrada",
  });
});

const PORT = process.env.PORT || 3001;

// SINGLE setInterval para todas as limpezas (otimização crítica)
let cleanupInterval: NodeJS.Timeout | null = null;

const performCleanup = async () => {
  try {
    // Forçar garbage collection se disponível
    if (global.gc) {
      global.gc();
    }

    // Log de uso de memória apenas a cada 4 horas
    const now = new Date();
    if (now.getHours() % 4 === 0 && now.getMinutes() < 5) {
      const memUsage = process.memoryUsage();
      Logger.info(
        `💾 Uso de memória: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`
      );
    }
  } catch {
    // Silenciar erros de limpeza para reduzir logs
  }
};

// Função para limpeza de conexões (apenas quando necessário)
const cleanupConnections = async () => {
  try {
    if ((global as Record<string, unknown>).prisma) {
      await (
        (global as Record<string, unknown>).prisma as {
          $disconnect: () => Promise<void>;
        }
      ).$disconnect();
    }
  } catch {
    // Silenciar erros
  }
};

async function startServer() {
  try {
    Logger.info("🚀 Iniciando servidor...");

    try {
      // Conectar ao banco de dados
      Logger.info("🗄️ Conectando ao banco de dados...");
      await connectDatabase();
      Logger.info("✅ Banco de dados conectado com sucesso");

      // Conectar ao Redis
      Logger.info("🔴 Conectando ao Redis...");
      await connectRedis();
      Logger.info("✅ Redis conectado com sucesso");

      // Iniciar job de limpeza
      startCleanupJob();

      // Iniciar monitor de recursos
      resourceMonitor.startMonitoring();

      // Iniciar servidor
      app.listen(PORT, () => {
        Logger.success(`🚀 Servidor rodando na porta ${PORT}`);
        Logger.info(`📖 Health check: http://localhost:${PORT}/health`);
      });

      // SINGLE setInterval para limpeza (a cada 2 horas)
      cleanupInterval = setInterval(performCleanup, 2 * 60 * 60 * 1000);
    } catch (error) {
      Logger.error("❌ Erro ao iniciar serviços:", error);
      process.exit(1);
    }
  } catch (error) {
    Logger.error("❌ Erro crítico ao iniciar servidor:", error);
    process.exit(1);
  }
}

// Graceful shutdown OTIMIZADO
process.on("SIGTERM", async () => {
  Logger.info("🛑 Recebido SIGTERM, encerrando servidor...");

  // Limpar interval
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }

  await cleanupConnections();
  process.exit(0);
});

process.on("SIGINT", async () => {
  Logger.info("🛑 Recebido SIGINT, encerrando servidor...");

  // Limpar interval
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }

  await cleanupConnections();
  process.exit(0);
});

// Inicia o servidor apenas se não estiver em ambiente de teste
if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;
