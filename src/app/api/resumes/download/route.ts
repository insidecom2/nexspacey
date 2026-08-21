import { z } from "zod";
import { EmployerApplicationNotFoundError, getApplicationResumeById } from "@/modules/applications/employer-application.service";
import { InvalidResumeTokenError, verifyResumeDownloadToken } from "@/lib/security/resume-signed-token";

const querySchema = z.string().min(1);

export async function GET(request: Request) {
  try {
    const token = querySchema.parse(new URL(request.url).searchParams.get("token"));
    const { applicationId } = verifyResumeDownloadToken(token);
    const resume = await getApplicationResumeById(applicationId);
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
    if (error instanceof z.ZodError || error instanceof InvalidResumeTokenError) return Response.json({ error: "ลิงก์ดาวน์โหลดไม่ถูกต้องหรือหมดอายุ" }, { status: 401 });
    if (error instanceof EmployerApplicationNotFoundError) return Response.json({ error: "ไม่พบ Resume นี้" }, { status: 404 });
    return Response.json({ error: "ไม่สามารถดาวน์โหลด Resume ได้" }, { status: 500 });
  }
}
