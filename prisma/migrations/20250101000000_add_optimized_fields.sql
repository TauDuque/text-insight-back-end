-- Adicionar novos campos para armazenamento otimizado
ALTER TABLE documents ADD COLUMN IF NOT EXISTS extracted_text TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;

-- Migrar dados existentes se houver
-- Para documentos já processados, vamos tentar extrair informações dos results
UPDATE documents 
SET 
  metadata = CASE 
    WHEN results IS NOT NULL THEN results
    ELSE '{}'::jsonb
  END,
  processed_at = CASE 
    WHEN completed_at IS NOT NULL THEN completed_at
    ELSE NULL
  END
WHERE results IS NOT NULL OR completed_at IS NOT NULL;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_documents_extracted_text ON documents USING gin(to_tsvector('portuguese', extracted_text));
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON documents USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_documents_processed_at ON documents(processed_at);
