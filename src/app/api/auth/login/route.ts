import { z } from "zod";
import { InvalidCredentialsError, loginUser } from "@/modules/auth/auth.service";

const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(128) });

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    const user = await loginUser(input);
    return Response.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return Response.json({ error: "ข้อมูลเข้าสู่ระบบไม่ถูกต้อง" }, { status: 400 });
    if (error instanceof InvalidCredentialsError) return Response.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    return Response.json({ error: "ไม่สามารถเข้าสู่ระบบได้ในขณะนี้" }, { status: 500 });
  }
}
