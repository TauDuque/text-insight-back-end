import multer from "multer";
import path from "path";
import { Request } from "express";
import { UPLOAD_CONFIG, UPLOAD_ERRORS } from "../config/upload";

// Configuração de armazenamento temporário
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, UPLOAD_CONFIG.TEMP_DIR);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Gerar nome único para o arquivo
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + extension);
  },
});

// Filtro de tipos de arquivo permitidos
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
    cb(null, true);
  } else {
    cb(new Error(UPLOAD_ERRORS.INVALID_FILE_TYPE));
  }
};

// Configuração do multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
    files: UPLOAD_CONFIG.MAX_FILES,
  },
});

// Middleware para capturar erros de upload
export const uploadErrorHandler = (
  err: any,
  req: Request,
  res: any,
  next: any
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: UPLOAD_ERRORS.FILE_TOO_LARGE,
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: UPLOAD_ERRORS.TOO_MANY_FILES,
      });
    }
  }

  if (err.message === UPLOAD_ERRORS.INVALID_FILE_TYPE) {
    return res.status(400).json({
      success: false,
      message: UPLOAD_ERRORS.INVALID_FILE_TYPE,
    });
  }

  next(err);
};
