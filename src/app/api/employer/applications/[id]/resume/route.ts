import { AuthRequiredError, getCurrentEmployer, RoleRequiredError } from "@/modules/auth/auth.service";
import { EmployerApplicationNotFoundError, getEmployerApplicationResume } from "@/modules/applications/employer-application.service";
import { z } from "zod";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const employer = await getCurrentEmployer();
    const applicationId = z.string().uuid().parse((await params).id);
    const resume = await getEmployerApplicationResume({ companyId: employer.companyId, employerId: employer.id, applicationId });
    const safeFileName = resume.fileName.replace(/[\r\n"\\]/g, "_").slice(0, 255) || "resume";
    return new Response(new Uint8Array(resume.content), {
      headers: {
        "Content-Type": resume.mimeType,
        "Content-Disposition": `attachment; filename="${safeFileName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    if (error instanceof RoleRequiredError) return Response.json({ error: "คุณไม่มีสิทธิ์ดาวน์โหลด Resume นี้" }, { status: 403 });
    if (error instanceof z.ZodError) return Response.json({ error: "ไม่พบ Resume นี้" }, { status: 404 });
    if (error instanceof EmployerApplicationNotFoundError) return Response.json({ error: "ไม่พบ Resume นี้" }, { status: 404 });
    return Response.json({ error: "ไม่สามารถดาวน์โหลด Resume ได้" }, { status: 500 });
  }
}
