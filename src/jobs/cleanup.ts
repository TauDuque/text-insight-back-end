import { DocumentProcessor } from "../utils/documentProcessor";
import cron from "node-cron";
import { Logger } from "../utils/logger";

// Rodar limpeza todo dia à meia-noite
export const startCleanupJob = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      Logger.info("🧹 Iniciando limpeza de arquivos expirados...");
      await DocumentProcessor.cleanupExpiredFiles();
      Logger.info("✅ Limpeza concluída com sucesso");
    } catch (error) {
      Logger.error("❌ Erro na limpeza automática:", error);
    }
  });
};
