import { AuthRequiredError, getCurrentAdmin, RoleRequiredError } from "@/modules/auth/auth.service";
import { expireDueJobs } from "@/modules/jobs/job-expiration.service";

export async function POST() {
  try {
    await getCurrentAdmin();
    return Response.json(await expireDueJobs());
  } catch (error) {
    if (error instanceof AuthRequiredError) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    if (error instanceof RoleRequiredError) return Response.json({ error: "คุณไม่มีสิทธิ์เรียก maintenance job" }, { status: 403 });
    return Response.json({ error: "ไม่สามารถอัปเดตสถานะประกาศหมดอายุได้" }, { status: 500 });
  }
}
