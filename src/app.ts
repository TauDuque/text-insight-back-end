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

// Importar workers e jobs
import "./workers/documentProcessingWorker";
import { startCleanupJob } from "./jobs/cleanup";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

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

// Morgan otimizado para logs HTTP
app.use(
  morgan("combined", {
    stream: {
      write: (message: string) => {
        Logger.info(`🌐 HTTP: ${message.trim()}`);
      },
    },
    skip: (req, _res) => {
      // Pular logs para rotas de health check e favicon
      return req.url === "/health" || req.url === "/favicon.ico";
    },
  })
);

// Middleware personalizado para logs detalhados (otimizado)
app.use(requestLogger);

// Parsers otimizados
app.use(
  express.json({
    limit: "5mb", // Reduzir limite de 10mb para 5mb
    strict: true, // Habilitar modo estrito
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb", // Limitar dados de formulário
  })
);

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);

// Health check otimizado
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    memory: process.memoryUsage(),
    uptime: process.uptime(),
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

// Função para limpeza de memória
const cleanupMemory = () => {
  try {
    // Forçar garbage collection se disponível
    if (global.gc) {
      global.gc();
      Logger.info("🧹 Garbage collection executado");
    }

    // Log de uso de memória
    const memUsage = process.memoryUsage();
    Logger.info(
      `💾 Uso de memória: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`
    );
  } catch (error) {
    Logger.warn("⚠️ Erro na limpeza de memória:", error);
  }
};

// Função para limpeza de conexões
const cleanupConnections = async () => {
  try {
    // Limpar conexões do Prisma
    if ((global as any).prisma) {
      await (global as any).prisma.$disconnect();
      Logger.info("🗄️ Conexões do banco limpas");
    }
  } catch (error) {
    Logger.warn("⚠️ Erro ao limpar conexões:", error);
  }
};

async function startServer() {
  try {
    // ✅ CONEXÃO RETARDADA: Iniciar servidor primeiro, conectar depois
    Logger.info("🚀 Iniciando servidor...");

    // Iniciar job de limpeza
    startCleanupJob();

    // Iniciar servidor primeiro (sem aguardar conexões)
    app.listen(PORT, () => {
      Logger.success(`🚀 Servidor rodando na porta ${PORT}`);
      Logger.info(`📖 Health check: http://localhost:${PORT}/health`);
      Logger.info(`📄 Documentos: http://localhost:${PORT}/api/documents`);
    });

    // ✅ CONECTAR AO BANCO EM BACKGROUND (não bloquear startup)
    setImmediate(async () => {
      try {
        Logger.info("🗄️ Conectando ao banco de dados...");
        await connectDatabase();
        Logger.info("✅ Banco de dados conectado com sucesso");
      } catch (error) {
        Logger.error("❌ Erro ao conectar com banco (não crítico):", error);
        // ✅ NÃO PARAR A APLICAÇÃO - apenas logar o erro
      }
    });

    // ✅ CONECTAR AO REDIS EM BACKGROUND
    setImmediate(async () => {
      try {
        Logger.info("🔴 Conectando ao Redis...");
        await connectRedis();
        Logger.info("✅ Redis conectado com sucesso");
      } catch (error) {
        Logger.error("❌ Erro ao conectar com Redis (não crítico):", error);
        // ✅ NÃO PARAR A APLICAÇÃO - apenas logar o erro
      }
    });

    // Configurar limpeza automática
    setInterval(cleanupMemory, 15 * 60 * 1000); // A cada 15 minutos
    setInterval(cleanupConnections, 60 * 60 * 1000); // A cada 1 hora
  } catch (error) {
    Logger.error("❌ Erro crítico ao iniciar servidor:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  Logger.info("🛑 Recebido SIGTERM, encerrando servidor...");
  await cleanupConnections();
  process.exit(0);
});

process.on("SIGINT", async () => {
  Logger.info("🛑 Recebido SIGINT, encerrando servidor...");
  await cleanupConnections();
  process.exit(0);
});

// Inicia o servidor apenas se não estiver em ambiente de teste
if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;
