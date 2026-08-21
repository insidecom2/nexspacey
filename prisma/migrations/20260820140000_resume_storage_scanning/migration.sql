ALTER TABLE "resumes"
  ALTER COLUMN "content" DROP NOT NULL;

ALTER TABLE "resumes"
  ADD COLUMN "storage_provider" VARCHAR(32) NOT NULL DEFAULT 'postgres',
  ADD COLUMN "checksum_sha256" CHAR(64);

ALTER TABLE "resumes"
  ADD CONSTRAINT "resumes_storage_provider_check" CHECK ("storage_provider" IN ('postgres', 'r2'));

CREATE INDEX "resumes_storage_provider_idx" ON "resumes"("storage_provider");
