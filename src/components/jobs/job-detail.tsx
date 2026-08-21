"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Bookmark, Briefcase, FileText, MapPin, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type PublicJob = { id: string; title: string; companyName: string; location: string; description: string; publishedAt: string | null; expiresAt: string | null; applicantCount: number };
type Resume = { id: string; originalName: string; version: number; status: string };

export function JobDetail({ job }: { job: PublicJob }) {
  const [saved, setSaved] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [applied, setApplied] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetch("/api/candidate/saved-jobs", { cache: "no-store" }).then(async (response) => {
        if (!response.ok) return;
        const data = await response.json() as { savedJobs?: { job: { id: string } }[] };
        setSaved((data.savedJobs ?? []).some((savedJob) => savedJob.job.id === job.id));
      }).catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [job.id]);

  async function toggleSaved() {
    setSavePending(true);
    setSaveError("");
    try {
      const response = await fetch(`/api/jobs/${job.id}/saved`, { method: saved ? "DELETE" : "POST" });
      const data = await response.json() as { error?: string };
      if (!response.ok) { setSaveError(response.status === 401 ? "กรุณาเข้าสู่ระบบเพื่อบันทึกงาน" : data.error ?? "ไม่สามารถบันทึกงานได้"); return; }
      setSaved(!saved);
    } catch { setSaveError("เชื่อมต่อระบบไม่ได้ งานยังไม่ถูกบันทึก"); }
    finally { setSavePending(false); }
  }

  async function openApply(open: boolean) {
    setDialogOpen(open);
    if (!open) return;
    setResumeLoading(true);
    setApplyError("");
    setAuthRequired(false);
    try {
      const response = await fetch("/api/profile/resumes");
      const data = await response.json() as { resumes?: Resume[]; error?: string };
      if (response.status === 401) { setAuthRequired(true); return; }
      if (!response.ok) { setApplyError(data.error ?? "ไม่สามารถโหลด Resume ได้"); return; }
      const availableResumes = (data.resumes ?? []).filter((resume) => resume.status === "READY");
      setResumes(availableResumes);
      setSelectedResumeId(availableResumes[0]?.id ?? "");
    } catch { setApplyError("เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่"); }
    finally { setResumeLoading(false); }
  }

  async function confirmApply() {
    if (!selectedResumeId) return;
    setSubmitting(true);
    setApplyError("");
    try {
      const response = await fetch(`/api/jobs/${job.id}/applications`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resumeId: selectedResumeId }) });
      const data = await response.json() as { error?: string };
      if (response.status === 201) { setApplied(true); setDialogOpen(false); return; }
      setApplyError(data.error ?? "ไม่สามารถสมัครงานได้");
    } catch { setApplyError("เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่"); }
    finally { setSubmitting(false); }
  }

  return <main className="mx-auto max-w-6xl px-5 py-6 pb-32 sm:py-10 lg:pb-10"><Link href="/" className="text-sm font-semibold text-sky-700 hover:underline">← กลับไปหางาน</Link><div className="mt-7 grid gap-8 lg:grid-cols-[1fr_320px]"><section><div className="flex gap-4"><div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-sky-100 font-bold text-sky-700">{job.companyName.slice(0, 2)}</div><div><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{job.title}</h1><p className="mt-2 text-slate-600">{job.companyName} · {job.location}</p></div></div><div className="mt-5 flex flex-wrap gap-2"><Badge><MapPin className="mr-1 size-3" aria-hidden="true" />{job.location}</Badge><Badge><Briefcase className="mr-1 size-3" aria-hidden="true" />เปิดรับสมัคร</Badge><Badge>ผู้สมัคร {job.applicantCount} คน</Badge></div><DetailSection title="รายละเอียดงาน"><p className="whitespace-pre-wrap">{job.description}</p></DetailSection><DetailSection title="ข้อมูลประกาศ"><p>เผยแพร่เมื่อ {formatDate(job.publishedAt)} · หมดอายุ {formatDate(job.expiresAt)}</p></DetailSection></section><aside className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white p-4 lg:static lg:border lg:p-5"><div className="grid gap-2"><Dialog.Root open={dialogOpen} onOpenChange={(open) => void openApply(open)}><Dialog.Trigger asChild><Button disabled={applied}>{applied ? "ส่งใบสมัครแล้ว" : "สมัครงานนี้"}</Button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="fixed inset-0 bg-slate-950/50" /><Dialog.Content className="fixed left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6"><Dialog.Close className="absolute right-4 top-4 rounded-full p-2 transition-colors hover:bg-sky-50" aria-label="ปิด"><X className="size-5" /></Dialog.Close><Dialog.Title className="text-xl font-bold">ยืนยันการสมัครงาน</Dialog.Title><Dialog.Description className="mt-2 text-slate-600">คุณกำลังสมัครตำแหน่ง {job.title} ที่ {job.companyName}</Dialog.Description>{resumeLoading ? <p className="mt-5 rounded-xl bg-sky-50 p-4 text-sm text-slate-600" aria-live="polite">กำลังโหลด Resume...</p> : authRequired ? <div className="mt-5 rounded-xl bg-sky-50 p-4 text-sm text-sky-900">กรุณา<Link className="mx-1 font-semibold underline" href="/login">เข้าสู่ระบบ</Link>ก่อนสมัครงาน</div> : resumes.length === 0 ? <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">ยังไม่มี Resume ที่พร้อมใช้ กรุณา<Link className="mx-1 font-semibold underline" href="/candidate">อัปโหลด Resume</Link>ก่อนสมัครงาน</div> : <div className="mt-5 space-y-2"><p className="text-sm font-semibold text-slate-900">เลือก Resume ที่ใช้สมัคร</p>{resumes.map((resume) => <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3" key={resume.id}><input type="radio" name="resume" value={resume.id} checked={selectedResumeId === resume.id} onChange={() => setSelectedResumeId(resume.id)} /><FileText className="size-5 text-sky-700" aria-hidden="true" /><span className="min-w-0"><span className="block truncate text-sm font-semibold">{resume.originalName}</span><span className="block text-xs text-slate-500">Version {resume.version}</span></span></label>)}</div>}{applyError && <p className="mt-3 text-sm text-red-700" role="alert">{applyError}</p>}<div className="mt-6 flex justify-end gap-3"><Dialog.Close asChild><Button variant="secondary">ยกเลิก</Button></Dialog.Close><Button onClick={() => void confirmApply()} disabled={resumeLoading || authRequired || !selectedResumeId || submitting}>{submitting ? "กำลังส่งใบสมัคร..." : "ยืนยันสมัคร"}</Button></div></Dialog.Content></Dialog.Portal></Dialog.Root><Button variant="secondary" onClick={() => void toggleSaved()} disabled={savePending}><Bookmark className={saved ? "mr-2 size-4 fill-sky-700 text-sky-700" : "mr-2 size-4"} aria-hidden="true" />{savePending ? "กำลังบันทึก..." : saved ? "ยกเลิกการบันทึก" : "บันทึกงานนี้"}</Button>{saveError && <p className="text-sm text-red-700" role="alert">{saveError}{saveError.includes("เข้าสู่ระบบ") && <Link className="ml-1 font-semibold underline" href="/login">เข้าสู่ระบบ</Link>}</p>}</div></aside></div></main>;
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) { return <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-slate-700"><h2 className="text-lg font-semibold text-slate-950">{title}</h2><div className="mt-3 leading-7">{children}</div></section>; }
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(value)) : "ไม่ระบุ"; }
