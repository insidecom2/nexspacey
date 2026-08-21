DELETE FROM "audit_logs" WHERE "actor_id" = '20000000-0000-0000-0000-000000000002'::uuid;
DELETE FROM "users" WHERE "id" = '20000000-0000-0000-0000-000000000002'::uuid;

DROP INDEX IF EXISTS "audit_logs_resource_type_resource_id_created_at_idx";
DROP INDEX IF EXISTS "audit_logs_actor_id_created_at_idx";
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_actor_id_fkey";
DROP TABLE IF EXISTS "audit_logs";

ALTER TABLE "jobs" DROP CONSTRAINT IF EXISTS "jobs_moderated_by_fkey";
DROP INDEX IF EXISTS "jobs_status_moderation_status_idx";
ALTER TABLE "jobs"
  DROP COLUMN IF EXISTS "moderation_status",
  DROP COLUMN IF EXISTS "moderation_reason",
  DROP COLUMN IF EXISTS "moderated_at",
  DROP COLUMN IF EXISTS "moderated_by";
DROP TYPE IF EXISTS "JobModerationStatus";
