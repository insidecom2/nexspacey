DROP INDEX IF EXISTS "jobs_public_search_fts_idx";
DROP INDEX IF EXISTS "saved_jobs_job_id_idx";
DROP INDEX IF EXISTS "saved_jobs_candidate_id_created_at_idx";
DROP INDEX IF EXISTS "saved_jobs_job_id_candidate_id_key";
ALTER TABLE "saved_jobs" DROP CONSTRAINT IF EXISTS "saved_jobs_job_id_fkey";
ALTER TABLE "saved_jobs" DROP CONSTRAINT IF EXISTS "saved_jobs_candidate_id_fkey";
DROP TABLE IF EXISTS "saved_jobs";
