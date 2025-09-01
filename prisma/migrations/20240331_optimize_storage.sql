-- Remover tabelas antigas
DROP TABLE IF EXISTS "analyses";
DROP TABLE IF EXISTS "api_keys";

-- Remover enum antigo
DROP TYPE IF EXISTS "AnalysisStatus";

-- Criar nova tabela de documentos
CREATE TABLE "documents" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "original_name" VARCHAR(255) NOT NULL,
  "mime_type" VARCHAR(100) NOT NULL,
  "size" INTEGER NOT NULL,
  "extracted_text" TEXT,
  "metadata" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processed_at" TIMESTAMP(3),
  "user_id" UUID NOT NULL,
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Criar índices
CREATE INDEX "documents_user_id_idx" ON "documents"("user_id");
CREATE INDEX "documents_created_at_idx" ON "documents"("created_at" DESC);
