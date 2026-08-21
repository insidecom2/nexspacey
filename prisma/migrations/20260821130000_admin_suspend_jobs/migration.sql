ALTER TYPE "JobStatus" ADD VALUE 'SUSPENDED';

-- PostgreSQL enum values cannot be removed safely. Rolling this migration back
-- requires a replacement enum and an explicit data migration.
