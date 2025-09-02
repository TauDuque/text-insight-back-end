import cron from "node-cron";
import { Logger } from "../utils/logger";

// Rodar limpeza todo dia à meia-noite
export const startCleanupJob = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      Logger.info("🧹 Iniciando limpeza de arquivos expirados...");
      // Limpeza não necessária - arquivos são processados em memória
      Logger.info("✅ Limpeza concluída com sucesso (não necessária)");
    } catch (error) {
      Logger.error("❌ Erro na limpeza automática:", error);
    }
  });
};
