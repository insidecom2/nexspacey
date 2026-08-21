import { z } from "zod";
import { ApplicationStatus } from "@/generated/prisma/client";
import { AuthRequiredError, getCurrentEmployer, RoleRequiredError } from "@/modules/auth/auth.service";
import { EmployerApplicationConflictError, EmployerApplicationNotFoundError, EmployerApplicationValidationError, updateEmployerApplicationStatus } from "@/modules/applications/employer-application.service";

const idSchema = z.string().uuid();
const updateSchema = z.object({ status: z.nativeEnum(ApplicationStatus) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const employer = await getCurrentEmployer();
    const applicationId = idSchema.parse((await params).id);
    const input = updateSchema.parse(await request.json());
    const application = await updateEmployerApplicationStatus({ companyId: employer.companyId, employerId: employer.id, applicationId, nextStatus: input.status });
    return Response.json({ application });
  } catch (error) {
    if (error instanceof AuthRequiredError) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    if (error instanceof RoleRequiredError) return Response.json({ error: "คุณไม่มีสิทธิ์แก้ไขใบสมัคร" }, { status: 403 });
    if (error instanceof z.ZodError || error instanceof SyntaxError) return Response.json({ error: "ข้อมูลเปลี่ยนสถานะไม่ถูกต้อง" }, { status: 400 });
    if (error instanceof EmployerApplicationNotFoundError) return Response.json({ error: "ไม่พบใบสมัครนี้" }, { status: 404 });
    if (error instanceof EmployerApplicationValidationError) return Response.json({ error: error.message }, { status: 400 });
    if (error instanceof EmployerApplicationConflictError) return Response.json({ error: "ใบสมัครถูกเปลี่ยนแปลงแล้ว กรุณาโหลดข้อมูลใหม่" }, { status: 409 });
    return Response.json({ error: "ไม่สามารถเปลี่ยนสถานะใบสมัครได้" }, { status: 500 });
  }
}
