import { z } from "zod";
import { EmailAlreadyUsedError, registerCandidate, registerEmployer } from "@/modules/auth/auth.service";

const registerSchema = z.object({
  role: z.enum(["candidate", "employer"]).default("candidate"),
  displayName: z.string().trim().min(2).max(160).optional(),
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(128),
  companyName: z.string().trim().min(2).max(180).optional(),
}).superRefine((input, context) => {
  if (input.role === "candidate" && !input.displayName) context.addIssue({ code: z.ZodIssueCode.custom, path: ["displayName"], message: "displayName is required" });
  if (input.role === "employer" && !input.companyName) context.addIssue({ code: z.ZodIssueCode.custom, path: ["companyName"], message: "companyName is required" });
});

export async function POST(request: Request) {
  try {
    const input = registerSchema.parse(await request.json());
    const user = input.role === "employer"
      ? await registerEmployer({ email: input.email, password: input.password, companyName: input.companyName as string })
      : await registerCandidate({ email: input.email, password: input.password, displayName: input.displayName as string });
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return Response.json({ error: "ข้อมูลสมัครสมาชิกไม่ถูกต้อง" }, { status: 400 });
    if (error instanceof EmailAlreadyUsedError) return Response.json({ error: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 409 });
    return Response.json({ error: "ไม่สามารถสมัครสมาชิกได้ในขณะนี้" }, { status: 500 });
  }
}
