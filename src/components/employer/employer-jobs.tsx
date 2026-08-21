"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Briefcase, Pencil, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmployerNav } from "@/components/employer/employer-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type JobStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "PAUSED" | "CLOSED" | "EXPIRED";
type WorkModel = "ONSITE" | "HYBRID" | "REMOTE";
type Job = { id: string; title: string; companyName: string; location: string; category: string | null; workModel: WorkModel; salaryMin: number | null; salaryMax: number | null; salaryCurrency: string | null; description: string; status: JobStatus; moderationStatus: "PENDING" | "APPROVED" | "REJECTED"; moderationReason: string | null; publishedAt: string | null; expiresAt: string | null; createdAt: string; updatedAt: string; _count: { applications: number } };
type JobForm = { title: string; location: string; category: string; workModel: WorkModel; salaryMin: string; salaryMax: string; salaryCurrency: string; description: string; expiresAt: string };

const emptyForm: JobForm = { title: "", location: "", category: "", workModel: "ONSITE", salaryMin: "", salaryMax: "", salaryCurrency: "THB", description: "", expiresAt: "" };
const statusLabels: Record<JobStatus, string> = { DRAFT: "ฉบับร่าง", PENDING_REVIEW: "รอตรวจสอบ", PUBLISHED: "เผยแพร่แล้ว", PAUSED: "พักประกาศ", CLOSED: "ปิดประกาศ", EXPIRED: "หมดอายุ" };
const statusClasses: Record<JobStatus, string> = { DRAFT: "bg-slate-100 text-slate-700", PENDING_REVIEW: "bg-amber-50 text-amber-800", PUBLISHED: "bg-emerald-50 text-emerald-800", PAUSED: "bg-sky-50 text-sky-800", CLOSED: "bg-slate-100 text-slate-700", EXPIRED: "bg-red-50 text-red-800" };

export function EmployerJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [form, setForm] = useState<JobForm>(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingAction, setPendingAction] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadJobs() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/employer/jobs", { cache: "no-store" });
      const data = await response.json() as { jobs?: Job[]; error?: string };
      if (!response.ok) { setError(data.error ?? "ไม่สามารถโหลดประกาศงานได้"); return; }
      setJobs(data.jobs ?? []);
    } catch { setError("เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่"); }
    finally { setLoading(false); }
  }

  useEffect(() => { const timeout = window.setTimeout(() => { void loadJobs(); }, 0); return () => window.clearTimeout(timeout); }, []);

  function startCreate() { setEditingId(""); setForm(emptyForm); setFormOpen(true); setError(""); setSuccess(""); }
  function startEdit(job: Job) { setEditingId(job.id); setForm({ title: job.title, location: job.location, category: job.category ?? "", workModel: job.workModel, salaryMin: job.salaryMin?.toString() ?? "", salaryMax: job.salaryMax?.toString() ?? "", salaryCurrency: job.salaryCurrency ?? "THB", description: job.description, expiresAt: job.expiresAt ? job.expiresAt.slice(0, 10) : "" }); setFormOpen(true); setError(""); setSuccess(""); }

  async function saveJob(status: "DRAFT" | "PENDING_REVIEW") {
    if (!form.title.trim() || !form.location.trim() || !form.category.trim() || !form.description.trim()) { setError("กรุณากรอกตำแหน่ง สถานที่ หมวดหมู่ และรายละเอียดงาน"); return; }
    if ((form.salaryMin || form.salaryMax) && (!form.salaryMin || !form.salaryMax || Number(form.salaryMin) > Number(form.salaryMax))) { setError("กรุณาระบุช่วงเงินเดือนให้ครบและให้ค่าต่ำสุดไม่เกินค่าสูงสุด"); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      const response = await fetch(editingId ? `/api/employer/jobs/${editingId}` : "/api/employer/jobs", { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, salaryMin: form.salaryMin ? Number(form.salaryMin) : null, salaryMax: form.salaryMax ? Number(form.salaryMax) : null, salaryCurrency: form.salaryMin ? form.salaryCurrency : null, expiresAt: form.expiresAt || null, ...(editingId ? {} : { status }) }) });
      const data = await response.json() as { job?: Job; error?: string };
      if (!response.ok) { setError(data.error ?? "ไม่สามารถบันทึกประกาศงานได้"); return; }
      setFormOpen(false); setSuccess(status === "PENDING_REVIEW" ? "ส่งประกาศงานเข้าตรวจสอบแล้ว" : "บันทึกฉบับร่างแล้ว"); await loadJobs();
    } catch { setError("เชื่อมต่อระบบไม่ได้ ประกาศงานยังไม่ถูกบันทึก"); }
    finally { setSaving(false); }
  }

  async function changeStatus(job: Job, status: JobStatus) {
    setPendingAction(`${job.id}:${status}`); setError(""); setSuccess("");
    try {
      const response = await fetch(`/api/employer/jobs/${job.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) { setError(data.error ?? "ไม่สามารถเปลี่ยนสถานะประกาศได้"); return; }
      setSuccess(`เปลี่ยนสถานะเป็น${statusLabels[status]}แล้ว`); await loadJobs();
    } catch { setError("เชื่อมต่อระบบไม่ได้ สถานะประกาศยังไม่ถูกเปลี่ยน"); }
    finally { setPendingAction(""); }
  }

  async function deleteJob(job: Job) {
    if (!window.confirm(`ต้องการลบประกาศ “${job.title}” หรือไม่`)) return;
    setPendingAction(`${job.id}:DELETE`); setError(""); setSuccess("");
    try {
      const response = await fetch(`/api/employer/jobs/${job.id}`, { method: "DELETE" });
      const data = await response.json() as { error?: string };
      if (!response.ok) { setError(data.error ?? "ไม่สามารถลบประกาศงานได้"); return; }
      setSuccess("ลบประกาศงานแล้ว"); await loadJobs();
    } catch { setError("เชื่อมต่อระบบไม่ได้ ประกาศงานยังไม่ถูกลบ"); }
    finally { setPendingAction(""); }
  }

  return <AppShell title="จัดการประกาศงาน" description="สร้าง แก้ไข และจัดการสถานะประกาศงานของบริษัท"><EmployerNav />
    {error && <section className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800" role="alert"><p>{error}</p><Button className="mt-3" variant="secondary" onClick={() => void loadJobs()}>ลองใหม่</Button></section>}
    {success && <p className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800" role="status" aria-live="polite">{success}</p>}
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-slate-600">ประกาศงานทั้งหมด {jobs.length} รายการ</p><p className="mt-1 text-sm text-slate-500">ประกาศใหม่จะต้องผ่านการตรวจสอบก่อนเผยแพร่</p></div><Button onClick={startCreate}><Plus className="mr-2 size-4" aria-hidden="true" />ลงประกาศงานใหม่</Button></div>
    {formOpen && <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5" aria-labelledby="job-form-title"><div className="flex items-start justify-between gap-3"><div><h2 id="job-form-title" className="text-lg font-semibold">{editingId ? "แก้ไขประกาศงาน" : "ลงประกาศงานใหม่"}</h2><p className="mt-1 text-sm text-slate-600">กรอกข้อมูลให้ครบก่อนส่งตรวจสอบ</p></div><Button variant="ghost" onClick={() => setFormOpen(false)}>ยกเลิก</Button></div><form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); void saveJob(editingId ? "DRAFT" : "PENDING_REVIEW"); }}><label className="block text-sm font-semibold">ตำแหน่งงาน<Input className="mt-1" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} maxLength={180} required /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">สถานที่ทำงาน<Input className="mt-1" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} maxLength={180} required /></label><label className="block text-sm font-semibold">หมวดหมู่งาน<Input className="mt-1" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} maxLength={120} required /></label><label className="block text-sm font-semibold">รูปแบบการทำงาน<select className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base outline-none focus:border-sky-700 focus:ring-2 focus:ring-sky-100" value={form.workModel} onChange={(event) => setForm({ ...form, workModel: event.target.value as WorkModel })}><option value="ONSITE">ทำงานที่บริษัท</option><option value="HYBRID">Hybrid</option><option value="REMOTE">Remote</option></select></label></div><div className="grid gap-4 sm:grid-cols-3"><label className="block text-sm font-semibold">เงินเดือนต่ำสุด (ไม่บังคับ)<Input className="mt-1" type="number" min="0" value={form.salaryMin} onChange={(event) => setForm({ ...form, salaryMin: event.target.value })} /></label><label className="block text-sm font-semibold">เงินเดือนสูงสุด (ไม่บังคับ)<Input className="mt-1" type="number" min="0" value={form.salaryMax} onChange={(event) => setForm({ ...form, salaryMax: event.target.value })} /></label><label className="block text-sm font-semibold">สกุลเงิน<select className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base outline-none focus:border-sky-700 focus:ring-2 focus:ring-sky-100" value={form.salaryCurrency} onChange={(event) => setForm({ ...form, salaryCurrency: event.target.value })}><option value="THB">THB</option><option value="USD">USD</option></select></label></div><label className="block text-sm font-semibold">รายละเอียดงาน<textarea className="mt-1 min-h-36 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base outline-none focus:border-sky-700 focus:ring-2 focus:ring-sky-100" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} maxLength={20000} required /></label><label className="block max-w-xs text-sm font-semibold">วันหมดอายุประกาศ<Input className="mt-1" type="date" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} /></label><div className="flex flex-wrap gap-3"><Button type="button" variant="secondary" disabled={saving} onClick={() => void saveJob("DRAFT")}>{saving ? "กำลังบันทึก..." : "บันทึกเป็นฉบับร่าง"}</Button>{!editingId && <Button type="submit" disabled={saving || !form.expiresAt}>{saving ? "กำลังส่ง..." : "ส่งตรวจสอบ"}</Button>}{editingId && <Button type="button" disabled={saving} onClick={() => void saveJob("DRAFT")}>{saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}</Button>}</div></form></section>}
    {loading ? <JobsLoading /> : jobs.length === 0 ? <section className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center"><Briefcase className="mx-auto size-8 text-slate-500" aria-hidden="true" /><h2 className="mt-3 text-lg font-semibold">ยังไม่มีประกาศงาน</h2><p className="mt-1 text-slate-600">เริ่มสร้างประกาศงานแรกของบริษัทได้เลย</p><Button className="mt-5" onClick={startCreate}>สร้างประกาศงาน</Button></section> : <section className="space-y-3">{jobs.map((job) => <article className="rounded-xl border border-slate-200 bg-white p-5" key={job.id}><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><h2 className="text-lg font-semibold text-slate-950">{job.title}</h2><p className="mt-1 text-sm text-slate-600">{job.location} · ผู้สมัคร {job._count.applications} คน</p><p className="mt-2 text-xs text-slate-500">หมดอายุ {job.expiresAt ? formatDate(job.expiresAt) : "ยังไม่กำหนด"}</p></div><Badge className={statusClasses[job.status]}>{statusLabels[job.status]}</Badge></div>{job.moderationStatus === "REJECTED" && job.moderationReason && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900"><p className="font-semibold">เหตุผลที่ต้องแก้ไข</p><p className="mt-1 whitespace-pre-wrap">{job.moderationReason}</p></div>}<div className="mt-4 flex flex-wrap gap-2">{(job.status === "DRAFT" || job.status === "PENDING_REVIEW" || job.status === "PUBLISHED" || job.status === "PAUSED") && <Button variant="secondary" onClick={() => startEdit(job)}><Pencil className="mr-2 size-4" aria-hidden="true" />แก้ไข</Button>}{job.status === "DRAFT" && <Button variant="secondary" disabled={pendingAction === `${job.id}:PENDING_REVIEW`} onClick={() => void changeStatus(job, "PENDING_REVIEW")}>ส่งตรวจสอบ</Button>}{job.status === "PENDING_REVIEW" && <Button variant="secondary" disabled={pendingAction === `${job.id}:DRAFT`} onClick={() => void changeStatus(job, "DRAFT")}>ถอนการตรวจสอบ</Button>}{job.status === "PUBLISHED" && <><Button variant="secondary" disabled={pendingAction === `${job.id}:PAUSED`} onClick={() => void changeStatus(job, "PAUSED")}>พักประกาศ</Button><Button variant="destructive" disabled={pendingAction === `${job.id}:CLOSED`} onClick={() => void changeStatus(job, "CLOSED")}>ปิดประกาศ</Button></>}{job.status === "PAUSED" && <><Button variant="secondary" disabled={pendingAction === `${job.id}:PUBLISHED`} onClick={() => void changeStatus(job, "PUBLISHED")}>เปิดประกาศอีกครั้ง</Button><Button variant="destructive" disabled={pendingAction === `${job.id}:CLOSED`} onClick={() => void changeStatus(job, "CLOSED")}>ปิดประกาศ</Button></>}{job.status === "DRAFT" && <Button variant="ghost" disabled={pendingAction === `${job.id}:DELETE`} onClick={() => void deleteJob(job)}><Trash2 className="mr-2 size-4" aria-hidden="true" />ลบ</Button>}</div></article>)}</section>}
  </AppShell>;
}

function JobsLoading() { return <div className="space-y-3" aria-busy="true"><div className="h-32 animate-pulse rounded-xl bg-slate-200" /><div className="h-32 animate-pulse rounded-xl bg-slate-200" /></div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(value)); }
