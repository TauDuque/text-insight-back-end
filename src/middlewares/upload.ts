import multer from "multer";
import { Request, Response, NextFunction } from "express";
import path from "path";
import { UPLOAD_LIMITS, ERROR_MESSAGES } from "../config/limits";

// Configuração do storage
const storage = multer.diskStorage({
  destination: "uploads/temp",
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Filtro de arquivos
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = [
    ...UPLOAD_LIMITS.allowedImageTypes,
    ...UPLOAD_LIMITS.allowedDocTypes,
  ];

  if (!allowedTypes.includes(file.mimetype as any)) {
    cb(new Error(ERROR_MESSAGES.INVALID_FILE_TYPE));
    return;
  }

  cb(null, true);
};

// Configuração do multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: UPLOAD_LIMITS.maxFileSize,
    files: 1,
  },
});

// Handler de erros do upload
export const uploadErrorHandler = (
  err: Error | multer.MulterError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.FILE_TOO_LARGE,
      });
    }
  }

  if (err.message === ERROR_MESSAGES.INVALID_FILE_TYPE) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next(err);
};
