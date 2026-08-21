import { AuthRequiredError, getCurrentUser } from "@/modules/auth/auth.service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return Response.json({ user });
  } catch (error) {
    if (error instanceof AuthRequiredError) return Response.json({ user: null }, { status: 401 });
    return Response.json({ error: "ไม่สามารถตรวจสอบ session ได้" }, { status: 500 });
  }
}
