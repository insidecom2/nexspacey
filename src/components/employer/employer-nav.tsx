"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/employer", label: "ผู้สมัคร" },
  { href: "/employer/jobs", label: "ประกาศงาน" },
  { href: "/employer/company", label: "บริษัทของฉัน" },
];

export function EmployerNav() {
  const pathname = usePathname();
  return <nav className="mb-8 flex flex-wrap gap-x-5 gap-y-1 border-b border-slate-200" aria-label="เมนูผู้ประกอบการ">{items.map((item) => <Link key={item.href} className={`inline-flex min-h-11 items-center border-b-2 px-1 text-sm font-semibold transition-colors ${pathname === item.href ? "border-sky-700 text-sky-800" : "border-transparent text-slate-600 hover:border-sky-300 hover:text-sky-800"}`} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>{item.label}</Link>)}</nav>;
}
