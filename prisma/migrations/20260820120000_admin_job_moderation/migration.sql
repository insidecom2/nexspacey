CREATE TYPE "JobModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "jobs"
  ADD COLUMN "moderation_status" "JobModerationStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "moderation_reason" VARCHAR(1000),
  ADD COLUMN "moderated_at" TIMESTAMP(3),
  ADD COLUMN "moderated_by" UUID;

UPDATE "jobs"
SET "moderation_status" = 'APPROVED',
    "moderated_at" = COALESCE("published_at", "updated_at")
WHERE "status" IN ('PUBLISHED', 'PAUSED', 'CLOSED', 'EXPIRED');

UPDATE "jobs"
SET "moderation_status" = 'REJECTED'
WHERE "status" = 'DRAFT';

CREATE INDEX "jobs_status_moderation_status_idx" ON "jobs"("status", "moderation_status");

CREATE TABLE "audit_logs" (
  "id" UUID NOT NULL,
  "actor_id" UUID,
  "action" VARCHAR(100) NOT NULL,
  "resource_type" VARCHAR(80) NOT NULL,
  "resource_id" UUID,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "jobs"
  ADD CONSTRAINT "jobs_moderated_by_fkey"
  FOREIGN KEY ("moderated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "audit_logs_resource_type_resource_id_created_at_idx" ON "audit_logs"("resource_type", "resource_id", "created_at");
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

INSERT INTO "users" ("id", "email", "password_hash", "role", "created_at", "updated_at") VALUES
  ('20000000-0000-0000-0000-000000000002', 'mvp.admin@example.com', 'scrypt:demo-admin-salt:2b16e13cd8a7b01658fe0ae80b246c589b656cb97a762c59cba26ed766d63c5acede5e3382e38a215216d2f309c7bb77e6a34985ef8ba30d627e07ab54e63551', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
