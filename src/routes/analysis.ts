import { Router } from "express";
import { AnalysisController } from "../controllers/AnalysisController";
import { authenticateApiKey, authenticateToken } from "../middlewares/auth";
import { analysisRateLimit, generalRateLimit } from "../middlewares/rateLimit";
import { logApiRequest, logRateLimit } from "../middlewares/logging";
import {
  validateTextAnalysis,
  validateAnalysisId,
  validatePagination,
} from "../middlewares/validation";

const router = Router();
const analysisController = new AnalysisController();

// Middlewares globais
router.use(logApiRequest);
router.use(logRateLimit);
router.use(generalRateLimit);

// Rotas protegidas por API Key (para usuários não logados)
router.post(
  "/",
  authenticateApiKey,
  analysisRateLimit,
  validateTextAnalysis,
  analysisController.analyze
);

// Rotas protegidas por JWT (para usuários logados)
router.get("/stats/queue", authenticateToken, analysisController.getQueueStats);
router.get("/stats/user", authenticateToken, analysisController.getUserStats);
router.get(
  "/history",
  authenticateToken,
  validatePagination,
  analysisController.getUserAnalyses
);

// Rotas protegidas por API Key (para status da fila)
router.get(
  "/:analysisId",
  authenticateApiKey,
  validateAnalysisId,
  analysisController.getAnalysis
);
router.post(
  "/:analysisId/retry",
  authenticateApiKey,
  validateAnalysisId,
  analysisController.retryAnalysis
);

// Rotas protegidas por JWT (para ações pessoais)
router.delete(
  "/:analysisId",
  authenticateToken,
  validateAnalysisId,
  analysisController.deleteAnalysis
);

export default router;
