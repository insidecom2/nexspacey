import { z } from "zod";
import { AuthRequiredError, getCurrentEmployer, RoleRequiredError } from "@/modules/auth/auth.service";
import { assertEmployerApplicationResumeAccess, EmployerApplicationNotFoundError } from "@/modules/applications/employer-application.service";
import { createResumeDownloadToken, ResumeTokenConfigurationError, RESUME_SIGNED_URL_TTL_SECONDS } from "@/lib/security/resume-signed-token";
import { prisma } from "@/lib/db/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const employer = await getCurrentEmployer();
    const applicationId = z.string().uuid().parse((await params).id);
    await assertEmployerApplicationResumeAccess({ companyId: employer.companyId, applicationId });
    const issuedAt = Date.now();
    const token = createResumeDownloadToken(applicationId, issuedAt);
    const expiresAt = new Date(issuedAt + RESUME_SIGNED_URL_TTL_SECONDS * 1000);
    await prisma.auditLog.create({ data: { actorId: employer.id, action: "RESUME_DOWNLOAD_URL_ISSUED", resourceType: "APPLICATION", resourceId: applicationId, metadata: { expiresAt: expiresAt.toISOString() } } });
    return Response.json({ url: `/api/resumes/download?token=${encodeURIComponent(token)}`, expiresAt: expiresAt.toISOString() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AuthRequiredError) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    if (error instanceof RoleRequiredError) return Response.json({ error: "คุณไม่มีสิทธิ์ขอ URL ของ Resume นี้" }, { status: 403 });
    if (error instanceof z.ZodError || error instanceof EmployerApplicationNotFoundError) return Response.json({ error: "ไม่พบ Resume นี้" }, { status: 404 });
    if (error instanceof ResumeTokenConfigurationError) return Response.json({ error: "ระบบดาวน์โหลด Resume ยังไม่พร้อมใช้งาน" }, { status: 500 });
    return Response.json({ error: "ไม่สามารถเตรียม URL ของ Resume ได้" }, { status: 500 });
  }
}
