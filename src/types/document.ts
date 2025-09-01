export interface DocumentMetadata {
  id: string;
  userId: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  processedAt?: Date;
}

export interface ProcessedDocument {
  extractedText: string | null; // Texto extraído de PDFs e arquivos de texto
  metadata: {
    width?: number; // Para imagens
    height?: number; // Para imagens
    format?: string; // Formato original
    pageCount?: number; // Para PDFs
    size: number; // Tamanho original
  };
}
