import { Router } from "express";
import { AnalysisController } from "../controllers/AnalysisController";
import { authenticateApiKey } from "../middlewares/auth";
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
router.use(authenticateApiKey);
router.use(logApiRequest);
router.use(logRateLimit);
router.use(generalRateLimit);

// Rotas de análise
router.post(
  "/",
  analysisRateLimit,
  validateTextAnalysis,
  analysisController.analyze
);
router.get("/stats/queue", analysisController.getQueueStats);
router.get("/stats/user", analysisController.getUserStats);
router.get("/history", validatePagination, analysisController.getUserAnalyses);
router.get("/:analysisId", validateAnalysisId, analysisController.getAnalysis);
router.post(
  "/:analysisId/retry",
  validateAnalysisId,
  analysisController.retryAnalysis
);
router.delete(
  "/:analysisId",
  validateAnalysisId,
  analysisController.deleteAnalysis
);

export default router;
