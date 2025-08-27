import { Router } from "express";
import { AnalysisController } from "../controllers/AnalysisController";
import { authenticateToken } from "../middlewares/auth";
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

// Rotas protegidas por JWT (para usuários logados via frontend)
router.post(
  "/",
  authenticateToken,
  analysisRateLimit,
  validateTextAnalysis,
  analysisController.analyze
);

router.get("/stats/queue", authenticateToken, analysisController.getQueueStats);
router.get("/stats/user", authenticateToken, analysisController.getUserStats);
router.get(
  "/history",
  authenticateToken,
  validatePagination,
  analysisController.getUserAnalyses
);

// Rotas protegidas por JWT (para usuários logados via frontend)
router.get(
  "/:analysisId",
  authenticateToken,
  validateAnalysisId,
  analysisController.getAnalysis
);

router.post(
  "/:analysisId/retry",
  authenticateToken,
  validateAnalysisId,
  analysisController.retryAnalysis
);

router.delete(
  "/:analysisId",
  authenticateToken,
  validateAnalysisId,
  analysisController.deleteAnalysis
);

export default router;
