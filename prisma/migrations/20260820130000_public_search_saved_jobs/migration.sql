CREATE TABLE "saved_jobs" (
  "id" UUID NOT NULL,
  "job_id" UUID NOT NULL,
  "candidate_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "saved_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "saved_jobs_job_id_candidate_id_key" ON "saved_jobs"("job_id", "candidate_id");
CREATE INDEX "saved_jobs_candidate_id_created_at_idx" ON "saved_jobs"("candidate_id", "created_at");
CREATE INDEX "saved_jobs_job_id_idx" ON "saved_jobs"("job_id");

ALTER TABLE "saved_jobs"
  ADD CONSTRAINT "saved_jobs_job_id_fkey"
  FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "saved_jobs"
  ADD CONSTRAINT "saved_jobs_candidate_id_fkey"
  FOREIGN KEY ("candidate_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "jobs_public_search_fts_idx"
  ON "jobs"
  USING GIN (to_tsvector('simple', "title" || ' ' || "company_name" || ' ' || "location" || ' ' || "description"));
