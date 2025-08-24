import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { authenticateToken } from "../middlewares/auth";
import {
  validateRegistration,
  validateLogin,
  validateApiKeyCreation,
} from "../middlewares/validation";

const router = Router();
const authController = new AuthController();

// Rotas públicas
router.post("/register", validateRegistration, authController.register);
router.post("/login", validateLogin, authController.login);

// Rotas protegidas (requerem JWT)
router.get("/profile", authenticateToken, authController.getProfile);
router.put("/profile", authenticateToken, authController.updateProfile);

// Gerenciamento de API Keys
router.get("/api-keys", authenticateToken, authController.getUserApiKeys);
router.post(
  "/api-keys",
  authenticateToken,
  validateApiKeyCreation,
  authController.createApiKey
);
router.delete(
  "/api-keys/:keyId",
  authenticateToken,
  authController.revokeApiKey
);

export default router;
