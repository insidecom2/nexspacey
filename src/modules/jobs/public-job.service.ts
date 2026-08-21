import { Prisma, JobStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { expireDueJobs } from "@/modules/jobs/job-expiration.service";

export type PublicJobSummary = {
  id: string;
  title: string;
  companyName: string;
  location: string;
  category: string | null;
  workModel: "ONSITE" | "HYBRID" | "REMOTE";
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  description: string;
  publishedAt: Date | null;
  expiresAt: Date | null;
  applicantCount: number;
};

export class PublicJobNotFoundError extends Error {
  constructor() {
    super("Public job not found");
    this.name = "PublicJobNotFoundError";
  }
}

export class SavedJobValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SavedJobValidationError";
  }
}

function publicJobWhere() {
  return {
    status: JobStatus.PUBLISHED,
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  };
}

export async function listPublicJobs(input: { q?: string; location?: string; category?: string; workModel?: "ONSITE" | "HYBRID" | "REMOTE"; salaryMin?: number; limit?: number }) {
  await expireDueJobs();
  const q = input.q?.trim();
  const location = input.location?.trim();
  const category = input.category?.trim();
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 50);
  const keywordCondition = q
    ? Prisma.sql`AND (to_tsvector('simple', j.title || ' ' || j.company_name || ' ' || j.location || ' ' || COALESCE(j.category, '') || ' ' || j.description) @@ plainto_tsquery('simple', ${q}) OR j.title ILIKE ${`%${q}%`} OR j.company_name ILIKE ${`%${q}%`} OR j.location ILIKE ${`%${q}%`} OR j.category ILIKE ${`%${q}%`} OR j.description ILIKE ${`%${q}%`})`
    : Prisma.empty;
  const locationCondition = location ? Prisma.sql`AND j.location ILIKE ${`%${location}%`}` : Prisma.empty;
  const categoryCondition = category ? Prisma.sql`AND j.category ILIKE ${`%${category}%`}` : Prisma.empty;
  const workModelCondition = input.workModel ? Prisma.sql`AND j.work_model = ${input.workModel}::"WorkModel"` : Prisma.empty;
  const salaryCondition = input.salaryMin === undefined ? Prisma.empty : Prisma.sql`AND j.salary_max >= ${input.salaryMin}`;

  return prisma.$queryRaw<PublicJobSummary[]>(Prisma.sql`
    SELECT
      j.id,
      j.title,
      j.company_name AS "companyName",
      j.location,
      j.category,
      j.work_model AS "workModel",
      j.salary_min AS "salaryMin",
      j.salary_max AS "salaryMax",
      j.salary_currency AS "salaryCurrency",
      j.description,
      j.published_at AS "publishedAt",
      j.expires_at AS "expiresAt",
      COUNT(a.id)::int AS "applicantCount"
    FROM jobs j
    LEFT JOIN applications a ON a.job_id = j.id
    WHERE j.status = 'PUBLISHED'::"JobStatus"
      AND (j.expires_at IS NULL OR j.expires_at > CURRENT_TIMESTAMP)
      ${keywordCondition}
      ${locationCondition}
      ${categoryCondition}
      ${workModelCondition}
      ${salaryCondition}
    GROUP BY j.id
    ORDER BY j.published_at DESC NULLS LAST, j.created_at DESC
    LIMIT ${limit}
  `);
}

export async function getPublicJob(jobId: string) {
  await expireDueJobs();
  const job = await prisma.job.findFirst({
    where: { id: jobId, ...publicJobWhere() },
    include: { _count: { select: { applications: true } } },
  });
  if (!job) throw new PublicJobNotFoundError();
  return {
    id: job.id,
    title: job.title,
    companyName: job.companyName,
    location: job.location,
    category: job.category,
    workModel: job.workModel,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    description: job.description,
    publishedAt: job.publishedAt,
    expiresAt: job.expiresAt,
    applicantCount: job._count.applications,
  };
}

export async function listCandidateSavedJobs(candidateId: string) {
  return prisma.savedJob.findMany({
    where: { candidateId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      job: { select: { id: true, title: true, companyName: true, location: true, status: true, expiresAt: true } },
    },
  });
}

export async function saveJob(input: { candidateId: string; jobId: string }) {
  const job = await prisma.job.findFirst({ where: { id: input.jobId, ...publicJobWhere() }, select: { id: true } });
  if (!job) throw new SavedJobValidationError("ประกาศงานนี้ไม่เปิดให้บันทึกแล้ว");
  return prisma.savedJob.upsert({
    where: { jobId_candidateId: { jobId: input.jobId, candidateId: input.candidateId } },
    create: { jobId: input.jobId, candidateId: input.candidateId },
    update: {},
    select: { id: true, jobId: true, createdAt: true },
  });
}

export async function unsaveJob(input: { candidateId: string; jobId: string }) {
  await prisma.savedJob.deleteMany({ where: { candidateId: input.candidateId, jobId: input.jobId } });
  return { jobId: input.jobId };
}
