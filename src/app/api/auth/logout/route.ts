import { logout } from "@/modules/auth/auth.service";

export async function POST() {
  await logout();
  return Response.json({ ok: true });
}
