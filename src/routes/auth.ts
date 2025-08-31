import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { authenticateToken } from "../middlewares/auth";
import { validateRegistration, validateLogin } from "../middlewares/validation";

const router = Router();
const authController = new AuthController();

// Rotas públicas
router.post("/register", validateRegistration, authController.register);
router.post("/login", validateLogin, authController.login);

// Rotas protegidas (requerem JWT)
router.put("/profile", authenticateToken, authController.updateProfile);

export default router;
