import { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";
import { getTranslation, Language } from "../config/i18n";

// Middleware para processar resultados de validação
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Detecta o idioma preferido do usuário (padrão: português)
    const preferredLanguage = (
      req.headers["accept-language"] as string
    )?.includes("es")
      ? "es"
      : (req.headers["accept-language"] as string)?.includes("en")
        ? "en"
        : "pt";

    // Se há apenas um erro, retorna a mensagem diretamente
    if (errors.array().length === 1) {
      return res.status(400).json({
        success: false,
        message: getTranslation(
          errors.array()[0].msg,
          preferredLanguage as Language
        ),
        errors: errors.array().map(error => ({
          field: error.type === "field" ? error.path : "unknown",
          message: getTranslation(error.msg, preferredLanguage as Language),
          value: error.type === "field" ? error.value : undefined,
        })),
      });
    }

    // Se há múltiplos erros, retorna uma mensagem geral com detalhes
    return res.status(400).json({
      success: false,
      message: getTranslation(
        "validation.multipleErrors",
        preferredLanguage as Language
      ),
      errors: errors.array().map(error => ({
        field: error.type === "field" ? error.path : "unknown",
        message: getTranslation(error.msg, preferredLanguage as Language),
        value: error.type === "field" ? error.value : undefined,
      })),
    });
  }
  next();
};

// Validações para análise de texto
export const validateTextAnalysis = [
  body("text")
    .isString()
    .withMessage("validation.text.string")
    .isLength({ min: 1, max: 50000 })
    .withMessage("validation.text.length")
    .trim()
    .notEmpty()
    .withMessage("validation.text.empty"),
  handleValidationErrors,
];

// Validações para consulta de análise
export const validateAnalysisId = [
  param("analysisId").isUUID().withMessage("validation.analysisId.uuid"),
  handleValidationErrors,
];

// Validações para paginação
export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("validation.pagination.page"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("validation.pagination.limit"),
  handleValidationErrors,
];

// Validações para criação de API Key
export const validateApiKeyCreation = [
  body("name")
    .isString()
    .withMessage("validation.name.string")
    .isLength({ min: 1, max: 100 })
    .withMessage("validation.name.length")
    .trim()
    .notEmpty()
    .withMessage("validation.name.empty"),
  handleValidationErrors,
];

// Validação de email
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validações para registro
export const validateRegistration = [
  body("email")
    .isEmail()
    .withMessage("validation.email.invalid")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("validation.password.minLength")
    .matches(/^(?=.*[a-z])/)
    .withMessage("validation.password.lowercase")
    .matches(/^(?=.*[A-Z])/)
    .withMessage("validation.password.uppercase")
    .matches(/^(?=.*\d)/)
    .withMessage("validation.password.number"),
  body("name")
    .isString()
    .withMessage("validation.name.string")
    .isLength({ min: 2, max: 100 })
    .withMessage("validation.name.length")
    .trim()
    .notEmpty()
    .withMessage("validation.name.empty"),
  handleValidationErrors,
];

// Validações para login
export const validateLogin = [
  body("email")
    .isEmail()
    .withMessage("validation.email.invalid")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("validation.password.required"),
  handleValidationErrors,
];
