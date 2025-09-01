export interface ProcessedDocument {
  processedPath: string;
  size: number;
  width?: number;
  height?: number;
  format?: string;
  textContent?: string;
}

export interface DocumentMetadata {
  width?: number;
  height?: number;
  format?: string;
  pageCount?: number;
  textContent?: string;
  processedPath: string;
  size: number;
}

export type DocumentStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
