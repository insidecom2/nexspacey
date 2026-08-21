import { z } from "zod";
import { JobStatus, WorkModel } from "@/generated/prisma/client";
import { AuthRequiredError, getCurrentEmployer, RoleRequiredError } from "@/modules/auth/auth.service";
import { EmployerJobConflictError, EmployerJobNotFoundError, EmployerJobValidationError, deleteEmployerJob, updateEmployerJob } from "@/modules/jobs/employer-job.service";

const idSchema = z.string().uuid();
const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const updateJobSchema = z.object({
  title: z.string().trim().min(2).max(180).optional(),
  location: z.string().trim().min(2).max(180).optional(),
  category: z.string().trim().min(2).max(120).optional(),
  workModel: z.nativeEnum(WorkModel).optional(),
  salaryMin: z.number().int().nonnegative().max(10_000_000).nullable().optional(),
  salaryMax: z.number().int().nonnegative().max(10_000_000).nullable().optional(),
  salaryCurrency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/).nullable().optional(),
  description: z.string().trim().min(10).max(20000).optional(),
  expiresAt: dateOnlySchema.nullable().optional(),
  status: z.nativeEnum(JobStatus).optional(),
}).refine((input) => Object.keys(input).length > 0, "at least one field is required");

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const employer = await getCurrentEmployer();
    const jobId = idSchema.parse((await params).id);
    const input = updateJobSchema.parse(await request.json());
    const { status, expiresAt, ...content } = input;
    const job = await updateEmployerJob({ companyId: employer.companyId, companyName: employer.companyName, jobId, content: { ...content, ...(expiresAt === undefined ? {} : { expiresAt: expiresAt ? parseDateOnly(expiresAt) : null }) }, nextStatus: status });
    return Response.json({ job });
  } catch (error) {
    if (error instanceof AuthRequiredError) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    if (error instanceof RoleRequiredError) return Response.json({ error: "คุณไม่มีสิทธิ์แก้ไขประกาศงาน" }, { status: 403 });
    if (error instanceof z.ZodError || error instanceof SyntaxError) return Response.json({ error: "ข้อมูลประกาศงานไม่ถูกต้อง" }, { status: 400 });
    if (error instanceof EmployerJobNotFoundError) return Response.json({ error: "ไม่พบประกาศงานนี้" }, { status: 404 });
    if (error instanceof EmployerJobValidationError) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ error: "ไม่สามารถแก้ไขประกาศงานได้" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const employer = await getCurrentEmployer();
    const jobId = idSchema.parse((await params).id);
    return Response.json({ job: await deleteEmployerJob({ companyId: employer.companyId, jobId }) });
  } catch (error) {
    if (error instanceof AuthRequiredError) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    if (error instanceof RoleRequiredError) return Response.json({ error: "คุณไม่มีสิทธิ์ลบประกาศงาน" }, { status: 403 });
    if (error instanceof z.ZodError) return Response.json({ error: "รหัสประกาศงานไม่ถูกต้อง" }, { status: 400 });
    if (error instanceof EmployerJobNotFoundError) return Response.json({ error: "ไม่พบประกาศงานนี้" }, { status: 404 });
    if (error instanceof EmployerJobValidationError || error instanceof EmployerJobConflictError) return Response.json({ error: error.message }, { status: 409 });
    return Response.json({ error: "ไม่สามารถลบประกาศงานได้" }, { status: 500 });
  }
}

function parseDateOnly(value: string) {
  return new Date(`${value}T23:59:59.999Z`);
}
