import { z } from "zod";
import { AuthRequiredError, getCurrentUser, RoleRequiredError } from "@/modules/auth/auth.service";
import { candidateProfileUpdateSchema } from "@/modules/candidates/candidate-profile.contract";
import { CandidateProfileNotFoundError, getCandidateProfile, updateCandidateProfile } from "@/modules/candidates/candidate-profile.service";
import { UserRole } from "@/generated/prisma/client";

async function getAuthorizedCandidate() {
  const user = await getCurrentUser();
  if (user.role !== UserRole.CANDIDATE) throw new RoleRequiredError();
  return user;
}

export async function GET() {
  try {
    const candidate = await getAuthorizedCandidate();
    return Response.json({ profile: await getCandidateProfile(candidate.id) });
  } catch (error) {
    if (error instanceof AuthRequiredError) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    if (error instanceof RoleRequiredError) return Response.json({ error: "คุณไม่มีสิทธิ์เข้าถึงโปรไฟล์ผู้สมัคร" }, { status: 403 });
    if (error instanceof CandidateProfileNotFoundError) return Response.json({ error: "ไม่พบข้อมูลโปรไฟล์ผู้สมัคร" }, { status: 404 });
    return Response.json({ error: "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const candidate = await getAuthorizedCandidate();
    const input = candidateProfileUpdateSchema.parse(await request.json());
    return Response.json({ profile: await updateCandidateProfile({ candidateId: candidate.id, ...input }) });
  } catch (error) {
    if (error instanceof AuthRequiredError) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    if (error instanceof RoleRequiredError) return Response.json({ error: "คุณไม่มีสิทธิ์แก้ไขโปรไฟล์ผู้สมัคร" }, { status: 403 });
    if (error instanceof z.ZodError || error instanceof SyntaxError) return Response.json({ error: "ชื่อที่แสดงต้องมีความยาว 1–160 ตัวอักษร" }, { status: 400 });
    if (error instanceof CandidateProfileNotFoundError) return Response.json({ error: "ไม่พบข้อมูลโปรไฟล์ผู้สมัคร" }, { status: 404 });
    return Response.json({ error: "ไม่สามารถบันทึกข้อมูลโปรไฟล์ได้" }, { status: 500 });
  }
}
