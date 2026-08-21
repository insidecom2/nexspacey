import { UserRole } from "@/generated/prisma/client";
import { AuthRequiredError, getCurrentUser, RoleRequiredError } from "@/modules/auth/auth.service";
import { listCandidateSavedJobs } from "@/modules/jobs/public-job.service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (user.role !== UserRole.CANDIDATE) throw new RoleRequiredError();
    return Response.json({ savedJobs: await listCandidateSavedJobs(user.id) });
  } catch (error) {
    if (error instanceof AuthRequiredError) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    if (error instanceof RoleRequiredError) return Response.json({ error: "เฉพาะบัญชีผู้สมัครเท่านั้นที่ดูงานที่บันทึกได้" }, { status: 403 });
    return Response.json({ error: "ไม่สามารถโหลดงานที่บันทึกได้" }, { status: 500 });
  }
}
