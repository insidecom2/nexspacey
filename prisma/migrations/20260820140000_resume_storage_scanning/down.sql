DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "resumes" WHERE "content" IS NULL) THEN
    RAISE EXCEPTION 'Cannot reverse resume storage migration while R2-backed resumes exist';
  END IF;
END $$;

DROP INDEX IF EXISTS "resumes_storage_provider_idx";
ALTER TABLE "resumes" DROP CONSTRAINT IF EXISTS "resumes_storage_provider_check";
ALTER TABLE "resumes" DROP COLUMN IF EXISTS "checksum_sha256";
ALTER TABLE "resumes" DROP COLUMN IF EXISTS "storage_provider";
ALTER TABLE "resumes" ALTER COLUMN "content" SET NOT NULL;
