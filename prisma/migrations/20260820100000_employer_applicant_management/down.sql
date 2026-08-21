DELETE FROM "company_members" WHERE "id" = '30000000-0000-0000-0000-000000000001';
DELETE FROM "users" WHERE "id" = '20000000-0000-0000-0000-000000000001';
UPDATE "jobs" SET "company_id" = NULL WHERE "id" IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);
DELETE FROM "companies" WHERE "id" IN (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003'
);

DROP INDEX "jobs_company_id_status_idx";
DROP INDEX "company_members_user_id_idx";
DROP INDEX "company_members_company_id_user_id_key";

ALTER TABLE "jobs" DROP CONSTRAINT "jobs_company_id_fkey";
ALTER TABLE "company_members" DROP CONSTRAINT "company_members_user_id_fkey";
ALTER TABLE "company_members" DROP CONSTRAINT "company_members_company_id_fkey";
ALTER TABLE "jobs" DROP COLUMN "company_id";
DROP TABLE "company_members";
DROP TABLE "companies";
DROP TYPE "CompanyMemberRole";
