export const UPLOAD_LIMITS = {
  // Limites de arquivo
  maxFileSize: 3 * 1024 * 1024, // 3MB max
  maxFilesPerUser: 10, // Máximo de arquivos por usuário

  // Limites de imagem
  maxImageDimension: 800, // px
  imageQuality: 60, // %
  allowedImageTypes: ["image/jpeg", "image/png", "image/gif"],

  // Limites de documento
  maxTextLength: 100000, // 100KB de texto
  allowedDocTypes: ["application/pdf", "text/plain"],

  // Retenção
  retentionDays: 7, // 7 dias de retenção
} as const;

export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: `Arquivo muito grande. Máximo permitido: ${UPLOAD_LIMITS.maxFileSize / (1024 * 1024)}MB`,
  INVALID_FILE_TYPE: "Tipo de arquivo não suportado",
  USER_QUOTA_EXCEEDED: `Limite de ${UPLOAD_LIMITS.maxFilesPerUser} arquivos por usuário atingido`,
  RETENTION_WARNING: `Os arquivos são automaticamente removidos após ${UPLOAD_LIMITS.retentionDays} dias`,
} as const;
