-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "job_id" TEXT,
    "original_name" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "file_path" TEXT,
    "processed_file_path" TEXT,
    "size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "results" JSONB,
    "error" TEXT,
    "processing_time" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "documents_job_id_key" ON "documents"("job_id");

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
