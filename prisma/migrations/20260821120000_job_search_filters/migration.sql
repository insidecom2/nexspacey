CREATE TYPE "WorkModel" AS ENUM ('ONSITE', 'HYBRID', 'REMOTE');

ALTER TABLE "jobs"
  ADD COLUMN "category" VARCHAR(120),
  ADD COLUMN "work_model" "WorkModel" NOT NULL DEFAULT 'ONSITE',
  ADD COLUMN "salary_min" INTEGER,
  ADD COLUMN "salary_max" INTEGER,
  ADD COLUMN "salary_currency" CHAR(3);

ALTER TABLE "jobs"
  ADD CONSTRAINT "jobs_salary_range_check"
  CHECK (
    ("salary_min" IS NULL AND "salary_max" IS NULL AND "salary_currency" IS NULL)
    OR (
      "salary_min" IS NOT NULL
      AND "salary_max" IS NOT NULL
      AND "salary_currency" IS NOT NULL
      AND "salary_min" >= 0
      AND "salary_max" >= 0
      AND "salary_min" <= "salary_max"
      AND "salary_currency" ~ '^[A-Z]{3}$'
    )
  );

CREATE INDEX "jobs_category_idx" ON "jobs"("category");
CREATE INDEX "jobs_work_model_idx" ON "jobs"("work_model");
CREATE INDEX "jobs_salary_max_idx" ON "jobs"("salary_max");

-- Rollback (run manually only if this migration must be reverted):
-- DROP INDEX "jobs_work_model_idx";
-- DROP INDEX "jobs_category_idx";
-- DROP INDEX "jobs_salary_max_idx";
-- ALTER TABLE "jobs" DROP CONSTRAINT "jobs_salary_range_check";
-- ALTER TABLE "jobs" DROP COLUMN "salary_currency", DROP COLUMN "salary_max", DROP COLUMN "salary_min", DROP COLUMN "work_model", DROP COLUMN "category";
-- DROP TYPE "WorkModel";
