"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmployerNav } from "@/components/employer/employer-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Company = { id: string; name: string; location: string | null; industry: string | null; about: string | null; updatedAt: string };
type CompanyForm = { name: string; location: string; industry: string; about: string };

export function CompanyProfile() {
  const [company, setCompany] = useState<Company | null>(null);
  const [form, setForm] = useState<CompanyForm>({ name: "", location: "", industry: "", about: "" });
  const [membershipRole, setMembershipRole] = useState("MEMBER");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadCompany() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/employer/company", { cache: "no-store" });
      const data = await response.json() as { company?: Company; membershipRole?: string; error?: string };
      if (!response.ok) { setError(data.error ?? "ไม่สามารถโหลดข้อมูลบริษัทได้"); return; }
      if (!data.company) { setError("ไม่พบข้อมูลบริษัท"); return; }
      setCompany(data.company); setMembershipRole(data.membershipRole ?? "MEMBER"); setForm({ name: data.company.name, location: data.company.location ?? "", industry: data.company.industry ?? "", about: data.company.about ?? "" });
    } catch { setError("เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่"); }
    finally { setLoading(false); }
  }

  useEffect(() => { const timeout = window.setTimeout(() => { void loadCompany(); }, 0); return () => window.clearTimeout(timeout); }, []);

  async function saveCompany(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) { setError("กรุณาระบุชื่อบริษัท"); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/employer/company", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json() as { company?: Company; error?: string };
      if (!response.ok) { setError(data.error ?? "ไม่สามารถบันทึกข้อมูลบริษัทได้"); return; }
      if (data.company) setCompany(data.company);
      setSuccess("บันทึกข้อมูลบริษัทแล้ว");
    } catch { setError("เชื่อมต่อระบบไม่ได้ ข้อมูลบริษัทยังไม่ถูกบันทึก"); }
    finally { setSaving(false); }
  }

  return <AppShell title="บริษัทของฉัน" description="จัดการข้อมูลบริษัทที่จะแสดงในประกาศงาน"><EmployerNav />
    {error && <section className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800" role="alert"><p>{error}</p><Button className="mt-3" variant="secondary" onClick={() => void loadCompany()}>ลองใหม่</Button></section>}
    {success && <p className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800" role="status" aria-live="polite">{success}</p>}
    {loading ? <CompanyLoading /> : company ? <section className="max-w-3xl rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-start gap-3"><div className="grid size-11 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-700"><Building2 className="size-5" aria-hidden="true" /></div><div><h2 className="text-lg font-semibold">ข้อมูลบริษัท</h2><p className="mt-1 text-sm text-slate-600">{membershipRole === "OWNER" ? "Owner สามารถแก้ไขข้อมูลบริษัทได้" : "สมาชิกบริษัทดูข้อมูลได้ แต่ไม่มีสิทธิ์แก้ไข"}</p></div></div><form className="mt-6 space-y-4" onSubmit={saveCompany}><label className="block text-sm font-semibold">ชื่อบริษัท<Input className="mt-1" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength={180} disabled={membershipRole !== "OWNER"} required /></label><label className="block text-sm font-semibold">สถานที่ตั้ง<Input className="mt-1" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} maxLength={180} disabled={membershipRole !== "OWNER"} /></label><label className="block text-sm font-semibold">อุตสาหกรรม<Input className="mt-1" value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })} maxLength={120} disabled={membershipRole !== "OWNER"} /></label><label className="block text-sm font-semibold">เกี่ยวกับบริษัท<textarea className="mt-1 min-h-36 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base outline-none focus:border-sky-700 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100" value={form.about} onChange={(event) => setForm({ ...form, about: event.target.value })} maxLength={5000} disabled={membershipRole !== "OWNER"} /></label>{membershipRole === "OWNER" && <Button type="submit" disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึกข้อมูลบริษัท"}</Button>}</form></section> : <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center"><Building2 className="mx-auto size-8 text-slate-500" aria-hidden="true" /><p className="mt-3 text-slate-600">ยังไม่มีข้อมูลบริษัท</p></section>}
  </AppShell>;
}

function CompanyLoading() { return <div className="max-w-3xl space-y-3" aria-busy="true"><div className="h-16 animate-pulse rounded-xl bg-slate-200" /><div className="h-96 animate-pulse rounded-xl bg-slate-200" /></div>; }
