CREATE TYPE "CompanyMemberRole" AS ENUM ('OWNER', 'MEMBER');

CREATE TABLE "companies" (
  "id" UUID NOT NULL,
  "name" VARCHAR(180) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "company_members" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "role" "CompanyMemberRole" NOT NULL DEFAULT 'MEMBER',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "company_members_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "jobs" ADD COLUMN "company_id" UUID;

CREATE UNIQUE INDEX "company_members_company_id_user_id_key" ON "company_members"("company_id", "user_id");
CREATE INDEX "company_members_user_id_idx" ON "company_members"("user_id");
CREATE INDEX "jobs_company_id_status_idx" ON "jobs"("company_id", "status");

ALTER TABLE "company_members" ADD CONSTRAINT "company_members_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "companies" ("id", "name", "updated_at") VALUES
  ('10000000-0000-0000-0000-000000000001', 'Baan Software', CURRENT_TIMESTAMP),
  ('10000000-0000-0000-0000-000000000002', 'Fintopia Thailand', CURRENT_TIMESTAMP),
  ('10000000-0000-0000-0000-000000000003', 'Nimbus Studio', CURRENT_TIMESTAMP);

UPDATE "jobs" SET "company_id" = CASE "id"
  WHEN '00000000-0000-0000-0000-000000000001' THEN '10000000-0000-0000-0000-000000000001'::uuid
  WHEN '00000000-0000-0000-0000-000000000002' THEN '10000000-0000-0000-0000-000000000002'::uuid
  WHEN '00000000-0000-0000-0000-000000000003' THEN '10000000-0000-0000-0000-000000000003'::uuid
  ELSE NULL
END
WHERE "id" IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);

INSERT INTO "users" ("id", "email", "password_hash", "role", "created_at", "updated_at") VALUES
  ('20000000-0000-0000-0000-000000000001', 'mvp.employer@example.com', 'scrypt:demo-employer-salt:e967b9761ae0e7174a8f830001228442d49c63f5869ecac1963e9d376093ec45154eaf9850286164ca6392f45f2567a4a8096d907d9cb3bd224a134e4c5671dd', 'EMPLOYER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "company_members" ("id", "company_id", "user_id", "role") VALUES
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'OWNER');
