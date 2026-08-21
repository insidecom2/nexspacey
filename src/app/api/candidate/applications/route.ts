import { AuthRequiredError, getCurrentCandidate } from "@/modules/auth/auth.service";
import { listCandidateApplications } from "@/modules/applications/application.service";

export async function GET() {
  try {
    const candidate = await getCurrentCandidate();
    return Response.json({ applications: await listCandidateApplications(candidate.id) });
  } catch (error) {
    if (error instanceof AuthRequiredError) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    return Response.json({ error: "ไม่สามารถโหลดใบสมัครได้" }, { status: 500 });
  }
}
