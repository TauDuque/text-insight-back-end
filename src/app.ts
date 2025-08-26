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
import analysisRoutes from "./routes/analysis";

// Importar worker (isso iniciará o processamento)
import "./workers/textAnalysisWorker";

dotenv.config();

export const app = express();

// Middlewares de segurança e logging
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  })
);
// Morgan para logs HTTP padrão
app.use(
  morgan("combined", {
    stream: {
      write: (message: string) => {
        Logger.info(`🌐 HTTP: ${message.trim()}`);
      },
    },
  })
);

// Middleware personalizado para logs detalhados
app.use(requestLogger);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/analyze", analysisRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
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

const PORT = process.env.PORT || 8080;

async function startServer() {
  try {
    await connectDatabase();
    await connectRedis();

    app.listen(PORT, () => {
      Logger.success(`🚀 Servidor rodando na porta ${PORT}`);
      Logger.info(`📖 Health check: http://localhost:${PORT}/health`);
      Logger.info(`🔍 Análise: http://localhost:${PORT}/api/analyze`);
    });
  } catch (error) {
    Logger.error("❌ Erro ao iniciar servidor:", error);
    process.exit(1);
  }
}

// Inicia o servidor apenas se não estiver em ambiente de teste
if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;
