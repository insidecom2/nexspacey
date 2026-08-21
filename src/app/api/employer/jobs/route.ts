import { z } from "zod";
import { JobStatus, WorkModel } from "@/generated/prisma/client";
import { AuthRequiredError, getCurrentEmployer, RoleRequiredError } from "@/modules/auth/auth.service";
import { createEmployerJob, listEmployerJobs } from "@/modules/jobs/employer-job.service";
import { enforceRateLimit, RateLimitExceededError } from "@/modules/security/rate-limit.service";

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid date");
const createJobSchema = z.object({
  title: z.string().trim().min(2).max(180),
  location: z.string().trim().min(2).max(180),
  category: z.string().trim().min(2).max(120),
  workModel: z.nativeEnum(WorkModel).default(WorkModel.ONSITE),
  salaryMin: z.number().int().nonnegative().max(10_000_000).nullable().optional(),
  salaryMax: z.number().int().nonnegative().max(10_000_000).nullable().optional(),
  salaryCurrency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/).nullable().optional(),
  description: z.string().trim().min(10).max(20000),
  expiresAt: dateOnlySchema.nullable().optional(),
  status: z.enum([JobStatus.DRAFT, JobStatus.PENDING_REVIEW]).default(JobStatus.DRAFT),
});

export async function GET() {
  try {
    const employer = await getCurrentEmployer();
    await enforceRateLimit({ action: "job_post", subjectId: employer.id, limit: 10, windowMs: 60 * 60 * 1000 });
    return Response.json({ jobs: await listEmployerJobs(employer.companyId) });
  } catch (error) {
    if (error instanceof AuthRequiredError) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    if (error instanceof RoleRequiredError) return Response.json({ error: "คุณไม่มีสิทธิ์เข้าถึงประกาศงาน" }, { status: 403 });
    return Response.json({ error: "ไม่สามารถโหลดประกาศงานได้" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const employer = await getCurrentEmployer();
    const input = createJobSchema.parse(await request.json());
    return Response.json({ job: await createEmployerJob({ ...input, companyId: employer.companyId, companyName: employer.companyName, salaryMin: input.salaryMin ?? null, salaryMax: input.salaryMax ?? null, salaryCurrency: input.salaryCurrency ?? null, expiresAt: input.expiresAt ? parseDateOnly(input.expiresAt) : null }) }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthRequiredError) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    if (error instanceof RoleRequiredError) return Response.json({ error: "คุณไม่มีสิทธิ์สร้างประกาศงาน" }, { status: 403 });
    if (error instanceof z.ZodError || error instanceof SyntaxError) return Response.json({ error: "ข้อมูลประกาศงานไม่ถูกต้อง" }, { status: 400 });
    if (error instanceof Error && error.name === "EmployerJobValidationError") return Response.json({ error: error.message }, { status: 400 });
    if (error instanceof RateLimitExceededError) return Response.json({ error: error.message }, { status: 429 });
    return Response.json({ error: "ไม่สามารถสร้างประกาศงานได้" }, { status: 500 });
  }
}

function parseDateOnly(value: string) {
  return new Date(`${value}T23:59:59.999Z`);
}
