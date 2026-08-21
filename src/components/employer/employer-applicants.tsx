"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Download, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmployerNav } from "@/components/employer/employer-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ApplicationStatus = "SUBMITTED" | "REVIEWING" | "SHORTLISTED" | "INTERVIEW" | "OFFERED" | "REJECTED" | "WITHDRAWN";
type Application = {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  resumeSnapshotName: string;
  candidate: { id: string; email: string; candidateProfile: { displayName: string } | null };
  job: { id: string; title: string; companyName: string; companyId: string | null };
};

const statusLabels: Record<ApplicationStatus, string> = {
  SUBMITTED: "ส่งใบสมัครแล้ว",
  REVIEWING: "กำลังพิจารณา",
  SHORTLISTED: "ผ่านการคัดเลือกเบื้องต้น",
  INTERVIEW: "นัดสัมภาษณ์",
  OFFERED: "เสนอจ้าง",
  REJECTED: "ไม่ผ่านการคัดเลือก",
  WITHDRAWN: "ถอนใบสมัคร",
};

const nextStatuses: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  SUBMITTED: ["REVIEWING", "REJECTED"],
  REVIEWING: ["SHORTLISTED", "REJECTED"],
  SHORTLISTED: ["INTERVIEW", "REJECTED"],
  INTERVIEW: ["OFFERED", "REJECTED"],
};

export function EmployerApplicants() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [jobFilter, setJobFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ApplicationStatus>("all");
  const [pendingId, setPendingId] = useState("");
  const [downloadPendingId, setDownloadPendingId] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [downloadRetryId, setDownloadRetryId] = useState("");

  async function loadApplications() {
    setLoading(true);
    setError("");
    setForbidden(false);
    try {
      const response = await fetch("/api/employer/applications", { cache: "no-store" });
      const data = await response.json() as { applications?: Application[]; error?: string };
      if (response.status === 401) {
        setError("กรุณาเข้าสู่ระบบด้วยบัญชีผู้ประกอบการ");
        return;
      }
      if (response.status === 403) {
        setForbidden(true);
        return;
      }
      if (!response.ok) {
        setError(data.error ?? "ไม่สามารถโหลดข้อมูลผู้สมัครได้");
        return;
      }
      setApplications(data.applications ?? []);
    } catch {
      setError("เชื่อมต่อระบบไม่ได้ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => { void loadApplications(); }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const jobs = useMemo(() => Array.from(new Map(applications.map((application) => [application.job.id, application.job.title])).entries()), [applications]);
  const filteredApplications = useMemo(() => applications.filter((application) => (jobFilter === "all" || application.job.id === jobFilter) && (statusFilter === "all" || application.status === statusFilter)), [applications, jobFilter, statusFilter]);

  async function updateStatus(applicationId: string, status: ApplicationStatus) {
    const current = applications.find((application) => application.id === applicationId);
    if (!current || current.status === status) return;
    setPendingId(applicationId);
    setError("");
    try {
      const response = await fetch(`/api/employer/applications/${applicationId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const data = await response.json() as { application?: { status: ApplicationStatus }; error?: string };
      if (!response.ok) {
        setError(data.error ?? "ไม่สามารถเปลี่ยนสถานะใบสมัครได้");
        return;
      }
      setApplications((items) => items.map((item) => item.id === applicationId ? { ...item, status: data.application?.status ?? status } : item));
    } catch {
      setError("เชื่อมต่อระบบไม่ได้ สถานะใบสมัครยังไม่ถูกเปลี่ยน");
    } finally {
      setPendingId("");
    }
  }

  async function downloadResume(applicationId: string) {
    if (downloadPendingId) return;
    setDownloadPendingId(applicationId);
    setDownloadError("");
    setDownloadRetryId("");
    try {
      const response = await fetch(`/api/employer/applications/${applicationId}/resume-url`, { cache: "no-store" });
      const data = await response.json() as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setDownloadError(data.error ?? "ไม่สามารถเตรียมไฟล์ Resume ได้");
        setDownloadRetryId(applicationId);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setDownloadError("เชื่อมต่อระบบไม่ได้ กรุณาลองดาวน์โหลด Resume อีกครั้ง");
      setDownloadRetryId(applicationId);
    } finally {
      setDownloadPendingId("");
    }
  }

  return <AppShell title="ผู้สมัครของบริษัท" description="ตรวจสอบใบสมัครและติดตามผู้สมัครในงานของบริษัทคุณ"><EmployerNav />
    {error && <section className="mb-5 rounded-xl border border-red-200 bg-red-50 p-5 text-red-800" role="alert"><p>{error}</p>{!forbidden && <Button className="mt-3" variant="secondary" onClick={() => void loadApplications()}>ลองใหม่</Button>}{error.includes("เข้าสู่ระบบ") && <Link className="ml-3 inline-flex min-h-11 items-center font-semibold underline" href="/login">เข้าสู่ระบบ</Link>}</section>}
    {downloadError && <section className="mb-5 rounded-xl border border-red-200 bg-red-50 p-5 text-red-800" role="alert"><p>{downloadError}</p>{downloadRetryId && <Button className="mt-3" variant="secondary" onClick={() => void downloadResume(downloadRetryId)}>ลองดาวน์โหลดอีกครั้ง</Button>}</section>}
    {forbidden ? <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center"><Users className="mx-auto size-8 text-slate-500" aria-hidden="true" /><h2 className="mt-3 text-lg font-semibold">บัญชีนี้ไม่มีสิทธิ์ผู้ประกอบการ</h2><p className="mt-1 text-slate-600">กรุณาเข้าสู่ระบบด้วยบัญชี Employer ที่เป็นสมาชิกบริษัท</p></section> : loading ? <ApplicantsLoading /> : <>
      <section className="mb-5 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4" aria-label="ตัวกรองใบสมัคร"><label className="text-sm font-semibold text-slate-800">ตำแหน่งงาน<select className="ml-2 min-h-11 rounded-lg border border-slate-300 bg-white px-3 font-normal" value={jobFilter} onChange={(event) => setJobFilter(event.target.value)}><option value="all">ทุกตำแหน่ง</option>{jobs.map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label><label className="text-sm font-semibold text-slate-800">สถานะ<select className="ml-2 min-h-11 rounded-lg border border-slate-300 bg-white px-3 font-normal" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | ApplicationStatus)}><option value="all">ทุกสถานะ</option>{Object.entries(statusLabels).map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select></label></section>
      {filteredApplications.length === 0 ? <section className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center"><Users className="mx-auto size-8 text-slate-500" aria-hidden="true" /><h2 className="mt-3 text-lg font-semibold">ยังไม่มีผู้สมัครในตัวกรองนี้</h2><p className="mt-1 text-slate-600">เมื่อมีผู้สมัคร ใบสมัครจะแสดงในหน้านี้</p></section> : <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="divide-y divide-slate-200">{filteredApplications.map((application) => <article className="p-5" key={application.id}><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><h2 className="font-semibold text-slate-950">{application.candidate.candidateProfile?.displayName ?? application.candidate.email}</h2><p className="mt-1 text-sm text-slate-600">{application.candidate.email}</p><p className="mt-2 text-sm text-slate-700">ตำแหน่ง <Link className="font-semibold text-sky-700 hover:underline" href={`/jobs/${application.job.id}`}>{application.job.title}</Link></p><p className="mt-1 text-xs text-slate-500">สมัครเมื่อ {formatDate(application.createdAt)} · {application.resumeSnapshotName}</p></div><div className="flex flex-wrap items-center gap-2"><Badge>{statusLabels[application.status]}</Badge><button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60" onClick={() => void downloadResume(application.id)} disabled={downloadPendingId === application.id}><Download className="size-4" aria-hidden="true" />{downloadPendingId === application.id ? "กำลังเตรียมไฟล์..." : "ดาวน์โหลด Resume"}</button></div></div><div className="mt-4 flex flex-wrap items-center gap-3"><label className="text-sm font-semibold text-slate-800">เปลี่ยนสถานะ<select aria-label={`เปลี่ยนสถานะของ ${application.candidate.candidateProfile?.displayName ?? application.candidate.email}`} className="ml-2 min-h-11 rounded-lg border border-slate-300 bg-white px-3 font-normal" value={application.status} onChange={(event) => void updateStatus(application.id, event.target.value as ApplicationStatus)} disabled={pendingId === application.id || !nextStatuses[application.status]}><option value={application.status}>{statusLabels[application.status]}</option>{(nextStatuses[application.status] ?? []).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label>{pendingId === application.id && <span className="text-sm text-slate-600" role="status" aria-live="polite">กำลังบันทึก...</span>}</div></article>)}</div></section>}
    </>}
  </AppShell>;
}

function ApplicantsLoading() { return <div className="space-y-4" aria-busy="true"><div className="h-20 animate-pulse rounded-xl bg-slate-200" /><div className="h-36 animate-pulse rounded-xl bg-slate-200" /><div className="h-36 animate-pulse rounded-xl bg-slate-200" /></div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(value)); }
