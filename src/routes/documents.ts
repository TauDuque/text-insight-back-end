import { Router } from "express";
import { DocumentController } from "../controllers/DocumentController";
import { upload, uploadErrorHandler } from "../middlewares/upload";
import { authenticateToken } from "../middlewares/auth";

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

// Upload de documento
router.post(
  "/upload",
  upload.single("document"),
  uploadErrorHandler,
  DocumentController.uploadDocument
);

// Obter status de um documento
router.get("/:documentId/status", DocumentController.getDocumentStatus);

// Listar documentos do usuário
router.get("/", DocumentController.getUserDocuments);

// Download de documento processado
router.get("/:documentId/download", DocumentController.downloadDocument);

// Buscar documento por jobId
router.get("/job/:jobId", DocumentController.getDocumentByJobId);

export default router;
