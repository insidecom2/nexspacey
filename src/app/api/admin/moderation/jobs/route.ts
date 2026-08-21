import { AuthRequiredError, getCurrentAdmin, RoleRequiredError } from "@/modules/auth/auth.service";
import { listPendingModerationJobs } from "@/modules/moderation/job-moderation.service";
import { listModeratableJobs } from "@/modules/moderation/job-moderation.service";

export async function GET(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    const scope = new URL(request.url).searchParams.get("scope");
    const jobs = scope === "active" ? await listModeratableJobs() : await listPendingModerationJobs();
    return Response.json({ admin: { id: admin.id, email: admin.email }, jobs });
  } catch (error) {
    if (error instanceof AuthRequiredError) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    if (error instanceof RoleRequiredError) return Response.json({ error: "คุณไม่มีสิทธิ์เข้าถึงคิวตรวจสอบ" }, { status: 403 });
    return Response.json({ error: "ไม่สามารถโหลดคิวตรวจสอบได้" }, { status: 500 });
  }
}
