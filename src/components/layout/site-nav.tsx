"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type UserRole = "CANDIDATE" | "EMPLOYER" | "ADMIN";
type SessionResponse = { user?: { role?: UserRole } | null };

const roleLinks = [
  { href: "/candidate", label: "โปรไฟล์ผู้สมัคร", role: "CANDIDATE" as const },
  { href: "/employer", label: "พื้นที่บริษัท", role: "EMPLOYER" as const },
  { href: "/admin", label: "ศูนย์ตรวจสอบ", role: "ADMIN" as const },
];

export function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<UserRole | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/auth/me", { cache: "no-store", signal: controller.signal })
      .then(async (response) => response.ok ? await response.json() as SessionResponse : { user: null })
      .then((data) => setRole(data.user?.role ?? null))
      .catch(() => setRole(null));
    return () => controller.abort();
  }, []);

  async function signOut() {
    setSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setRole(null);
    setSigningOut(false);
    router.push("/");
  }

  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);
  const visibleRoleLinks = roleLinks.filter((link) => link.role === role);

  return <nav className="w-full bg-sky-700 text-white" aria-label="เมนูหลัก">
    <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center gap-x-4 px-4 sm:flex-nowrap sm:px-5">
      <Link className="inline-flex min-h-11 shrink-0 items-center rounded-md pr-2 text-lg font-extrabold tracking-tight text-white transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" href="/">
        Nexspacey
      </Link>
      <div className="order-3 flex basis-full items-center gap-1 border-t border-white/15 py-1 sm:order-none sm:min-w-0 sm:flex-1 sm:basis-auto sm:border-t-0 sm:py-0">
        <NavItem href="/" label="หางาน" active={isActive("/")} />
        {visibleRoleLinks.map((link) => <NavItem href={link.href} label={link.label} active={isActive(link.href)} key={link.href} />)}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        {role ? <button className="inline-flex min-h-11 items-center rounded-md px-2 text-sm font-semibold text-white/90 transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={() => void signOut()} disabled={signingOut}>{signingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}</button> : <><Link className="inline-flex min-h-11 items-center rounded-md px-2 text-sm font-semibold text-white/90 transition-opacity hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" href="/login">เข้าสู่ระบบ</Link><Link className="inline-flex min-h-10 items-center rounded-full bg-white px-4 text-sm font-bold text-sky-800 transition-colors hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" href="/register">สมัครสมาชิก</Link></>}
      </div>
    </div>
  </nav>;
}

function NavItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return <Link className={`inline-flex min-h-11 items-center border-b-2 px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${active ? "border-white text-white" : "border-transparent text-white/80 hover:border-white/50 hover:text-white"}`} href={href} aria-current={active ? "page" : undefined}>{label}</Link>;
}
