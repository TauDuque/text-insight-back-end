export const UPLOAD_CONFIG = {
  // Limites de arquivo
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 1,

  // Tipos de arquivo permitidos
  ALLOWED_MIME_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],

  // Extensões permitidas
  ALLOWED_EXTENSIONS: [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".pdf",
    ".txt",
    ".doc",
    ".docx",
  ],

  // Pastas
  TEMP_DIR: "uploads/temp",
  PROCESSED_DIR: "uploads/processed",

  // Timeouts
  PROCESSING_TIMEOUT: 30000, // 30 segundos

  // Limites de conteúdo extraído
  MAX_TEXT_EXTRACT: 1000, // Máximo de caracteres extraídos
  MAX_PREVIEW_SIZE: 500, // Tamanho do preview
} as const;

export const UPLOAD_ERRORS = {
  FILE_TOO_LARGE: "Arquivo muito grande. Máximo permitido: 5MB",
  INVALID_FILE_TYPE: "Tipo de arquivo não suportado",
  TOO_MANY_FILES: "Apenas 1 arquivo por vez é permitido",
  PROCESSING_FAILED: "Falha ao processar documento",
  UPLOAD_FAILED: "Falha no upload do arquivo",
} as const;
