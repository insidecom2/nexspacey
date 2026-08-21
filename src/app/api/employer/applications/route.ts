import { z } from "zod";
import { AuthRequiredError, getCurrentEmployer, RoleRequiredError } from "@/modules/auth/auth.service";
import { listEmployerApplications } from "@/modules/applications/employer-application.service";
import { ApplicationStatus } from "@/generated/prisma/client";

const filtersSchema = z.object({ jobId: z.string().uuid().optional(), status: z.nativeEnum(ApplicationStatus).optional() });

export async function GET(request: Request) {
  try {
    const employer = await getCurrentEmployer();
    const url = new URL(request.url);
    const filters = filtersSchema.parse({ jobId: url.searchParams.get("jobId") ?? undefined, status: url.searchParams.get("status") ?? undefined });
    return Response.json({ applications: await listEmployerApplications({ companyId: employer.companyId, ...filters }) });
  } catch (error) {
    if (error instanceof AuthRequiredError) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    if (error instanceof RoleRequiredError) return Response.json({ error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลผู้สมัคร" }, { status: 403 });
    if (error instanceof z.ZodError) return Response.json({ error: "ตัวกรองไม่ถูกต้อง" }, { status: 400 });
    return Response.json({ error: "ไม่สามารถโหลดข้อมูลผู้สมัครได้" }, { status: 500 });
  }
}
