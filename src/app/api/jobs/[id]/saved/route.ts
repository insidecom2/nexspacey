import { z } from "zod";
import { UserRole } from "@/generated/prisma/client";
import { AuthRequiredError, getCurrentUser, RoleRequiredError } from "@/modules/auth/auth.service";
import { SavedJobValidationError, saveJob, unsaveJob } from "@/modules/jobs/public-job.service";

const idSchema = z.string().uuid();

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (user.role !== UserRole.CANDIDATE) throw new RoleRequiredError();
    const jobId = idSchema.parse((await params).id);
    return Response.json({ savedJob: await saveJob({ candidateId: user.id, jobId }) }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthRequiredError) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อนบันทึกงาน" }, { status: 401 });
    if (error instanceof RoleRequiredError) return Response.json({ error: "เฉพาะบัญชีผู้สมัครเท่านั้นที่บันทึกงานได้" }, { status: 403 });
    if (error instanceof z.ZodError) return Response.json({ error: "รหัสประกาศงานไม่ถูกต้อง" }, { status: 400 });
    if (error instanceof SavedJobValidationError) return Response.json({ error: error.message }, { status: 409 });
    return Response.json({ error: "ไม่สามารถบันทึกงานได้" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (user.role !== UserRole.CANDIDATE) throw new RoleRequiredError();
    const jobId = idSchema.parse((await params).id);
    return Response.json(await unsaveJob({ candidateId: user.id, jobId }));
  } catch (error) {
    if (error instanceof AuthRequiredError) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อนยกเลิกการบันทึก" }, { status: 401 });
    if (error instanceof RoleRequiredError) return Response.json({ error: "เฉพาะบัญชีผู้สมัครเท่านั้นที่ยกเลิกการบันทึกได้" }, { status: 403 });
    if (error instanceof z.ZodError) return Response.json({ error: "รหัสประกาศงานไม่ถูกต้อง" }, { status: 400 });
    return Response.json({ error: "ไม่สามารถยกเลิกการบันทึกได้" }, { status: 500 });
  }
}
