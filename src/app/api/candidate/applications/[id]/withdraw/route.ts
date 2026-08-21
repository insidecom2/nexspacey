import { z } from "zod";
import { UserRole } from "@/generated/prisma/client";
import { ApplicationNotFoundError, ApplicationTransitionConflictError, withdrawCandidateApplication } from "@/modules/applications/application.service";
import { AuthRequiredError, getCurrentUser, RoleRequiredError } from "@/modules/auth/auth.service";

const idSchema = z.string().uuid();

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (user.role !== UserRole.CANDIDATE) throw new RoleRequiredError();
    const applicationId = idSchema.parse((await params).id);
    return Response.json({ application: await withdrawCandidateApplication({ applicationId, candidateId: user.id }) });
  } catch (error) {
    if (error instanceof AuthRequiredError) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อนถอนใบสมัคร" }, { status: 401 });
    if (error instanceof RoleRequiredError) return Response.json({ error: "เฉพาะบัญชีผู้สมัครเท่านั้นที่ถอนใบสมัครได้" }, { status: 403 });
    if (error instanceof z.ZodError) return Response.json({ error: "รหัสใบสมัครไม่ถูกต้อง" }, { status: 400 });
    if (error instanceof ApplicationNotFoundError) return Response.json({ error: "ไม่พบใบสมัครนี้" }, { status: 404 });
    if (error instanceof ApplicationTransitionConflictError) return Response.json({ error: error.message }, { status: 409 });
    return Response.json({ error: "ไม่สามารถถอนใบสมัครได้" }, { status: 500 });
  }
}
