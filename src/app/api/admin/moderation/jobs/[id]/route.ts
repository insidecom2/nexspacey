import { z } from "zod";
import { AuthRequiredError, getCurrentAdmin, RoleRequiredError } from "@/modules/auth/auth.service";
import { AdminModerationConflictError, AdminModerationNotFoundError, AdminModerationValidationError, moderateJob } from "@/modules/moderation/job-moderation.service";

const idSchema = z.string().uuid();
const actionSchema = z.object({
  action: z.enum(["approve", "reject", "suspend"]),
  reason: z.string().max(1000).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentAdmin();
    const jobId = idSchema.parse((await params).id);
    const input = actionSchema.parse(await request.json());
    const job = await moderateJob({ ...input, adminId: admin.id, jobId });
    return Response.json({ job });
  } catch (error) {
    if (error instanceof AuthRequiredError) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    if (error instanceof RoleRequiredError) return Response.json({ error: "คุณไม่มีสิทธิ์ตรวจสอบประกาศงาน" }, { status: 403 });
    if (error instanceof z.ZodError || error instanceof SyntaxError) return Response.json({ error: "ข้อมูลการตรวจสอบไม่ถูกต้อง" }, { status: 400 });
    if (error instanceof AdminModerationNotFoundError) return Response.json({ error: "ไม่พบประกาศงานนี้" }, { status: 404 });
    if (error instanceof AdminModerationValidationError) return Response.json({ error: error.message }, { status: 400 });
    if (error instanceof AdminModerationConflictError) return Response.json({ error: error.message }, { status: 409 });
    return Response.json({ error: "ไม่สามารถตรวจสอบประกาศงานได้" }, { status: 500 });
  }
}
