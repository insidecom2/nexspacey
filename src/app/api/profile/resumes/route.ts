import { getCurrentCandidate, AuthRequiredError } from "@/modules/auth/auth.service";
import { createResume, listCandidateResumes, ResumeValidationError } from "@/modules/resumes/resume.service";
import { ResumeMalwareDetectedError, ResumeScannerConfigurationError, ResumeScannerUnavailableError } from "@/modules/security/resume-scanner";
import { ResumeStorageConfigurationError } from "@/modules/storage/resume-storage";
import { enforceRateLimit, RateLimitExceededError } from "@/modules/security/rate-limit.service";

export async function GET() {
  try {
    const candidate = await getCurrentCandidate();
    await enforceRateLimit({ action: "resume_upload", subjectId: candidate.id, limit: 5, windowMs: 60 * 60 * 1000 });
    return Response.json({ resumes: await listCandidateResumes(candidate.id) });
  } catch (error) {
    if (error instanceof AuthRequiredError) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    return Response.json({ error: "ไม่สามารถโหลด Resume ได้" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const candidate = await getCurrentCandidate();
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return Response.json({ error: "กรุณาเลือกไฟล์ Resume" }, { status: 400 });
    const content = new Uint8Array(await file.arrayBuffer());
    const resume = await createResume({ candidateId: candidate.id, originalName: file.name, mimeType: file.type, sizeBytes: file.size, content });
    return Response.json({ resume }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthRequiredError) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    if (error instanceof ResumeValidationError) return Response.json({ error: error.message }, { status: 400 });
    if (error instanceof ResumeMalwareDetectedError) return Response.json({ error: "ไฟล์ Resume ไม่ผ่านการตรวจความปลอดภัย" }, { status: 400 });
    if (error instanceof ResumeScannerConfigurationError || error instanceof ResumeStorageConfigurationError) return Response.json({ error: "ระบบอัปโหลด Resume ยังตั้งค่าไม่ครบ" }, { status: 500 });
    if (error instanceof ResumeScannerUnavailableError) return Response.json({ error: "ระบบตรวจความปลอดภัยไม่พร้อมใช้งาน กรุณาลองใหม่" }, { status: 503 });
    if (error instanceof RateLimitExceededError) return Response.json({ error: error.message }, { status: 429 });
    return Response.json({ error: "ไม่สามารถอัปโหลด Resume ได้" }, { status: 500 });
  }
}
