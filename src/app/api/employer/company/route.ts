import { z } from "zod";
import { AuthRequiredError, getCurrentEmployer, RoleRequiredError } from "@/modules/auth/auth.service";
import { CompanyNotFoundError, getEmployerCompany, updateEmployerCompany } from "@/modules/companies/company.service";

const optionalText = (max: number) => z.preprocess((value) => value === "" ? null : value, z.string().trim().max(max).nullable());
const companySchema = z.object({
  name: z.string().trim().min(2).max(180),
  location: optionalText(180),
  industry: optionalText(120),
  about: optionalText(5000),
});

export async function GET() {
  try {
    const employer = await getCurrentEmployer();
    return Response.json({ company: await getEmployerCompany(employer.companyId), membershipRole: employer.membershipRole });
  } catch (error) {
    if (error instanceof AuthRequiredError) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    if (error instanceof RoleRequiredError) return Response.json({ error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลบริษัท" }, { status: 403 });
    if (error instanceof CompanyNotFoundError) return Response.json({ error: "ไม่พบข้อมูลบริษัท" }, { status: 404 });
    return Response.json({ error: "ไม่สามารถโหลดข้อมูลบริษัทได้" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const employer = await getCurrentEmployer();
    if (employer.membershipRole !== "OWNER") return Response.json({ error: "เฉพาะ Owner เท่านั้นที่แก้ไขข้อมูลบริษัทได้" }, { status: 403 });
    const input = companySchema.parse(await request.json());
    return Response.json({ company: await updateEmployerCompany({ companyId: employer.companyId, ...input }) });
  } catch (error) {
    if (error instanceof AuthRequiredError) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    if (error instanceof RoleRequiredError) return Response.json({ error: "คุณไม่มีสิทธิ์แก้ไขข้อมูลบริษัท" }, { status: 403 });
    if (error instanceof z.ZodError || error instanceof SyntaxError) return Response.json({ error: "ข้อมูลบริษัทไม่ถูกต้อง" }, { status: 400 });
    if (error instanceof CompanyNotFoundError) return Response.json({ error: "ไม่พบข้อมูลบริษัท" }, { status: 404 });
    return Response.json({ error: "ไม่สามารถบันทึกข้อมูลบริษัทได้" }, { status: 500 });
  }
}
