import { z } from "zod";
import { AuthRequiredError, getCurrentCandidate } from "@/modules/auth/auth.service";
import { ApplicationConflictError, ApplicationValidationError, applyToJob } from "@/modules/applications/application.service";
import { enforceRateLimit, RateLimitExceededError } from "@/modules/security/rate-limit.service";

const applySchema = z.object({ resumeId: z.string().uuid() });
const jobIdSchema = z.string().uuid();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const candidate = await getCurrentCandidate();
    await enforceRateLimit({ action: "job_apply", subjectId: candidate.id, limit: 10, windowMs: 60 * 60 * 1000 });
    const input = applySchema.parse(await request.json());
    const { id: rawJobId } = await params;
    const jobId = jobIdSchema.parse(rawJobId);
    const application = await applyToJob({ jobId, candidateId: candidate.id, resumeId: input.resumeId });
    return Response.json({ application }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthRequiredError) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อนสมัครงาน" }, { status: 401 });
    if (error instanceof z.ZodError || error instanceof SyntaxError) return Response.json({ error: "ข้อมูลสมัครงานไม่ถูกต้อง" }, { status: 400 });
    if (error instanceof ApplicationConflictError) return Response.json({ error: error.message }, { status: 409 });
    if (error instanceof ApplicationValidationError) return Response.json({ error: error.message }, { status: 400 });
    if (error instanceof RateLimitExceededError) return Response.json({ error: error.message }, { status: 429 });
    return Response.json({ error: "ไม่สามารถสมัครงานได้ในขณะนี้" }, { status: 500 });
  }
}
