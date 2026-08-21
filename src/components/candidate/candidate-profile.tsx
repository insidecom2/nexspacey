"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { AlertCircle, Bookmark, CheckCircle2, FileText, Undo2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/layout/app-shell";

type Resume = { id: string; originalName: string; mimeType: string; sizeBytes: number; version: number; status: string; createdAt: string };
type Application = { id: string; status: string; createdAt: string; resumeSnapshotName: string; job: { id: string; title: string; companyName: string; location: string } };
type SavedJob = { id: string; createdAt: string; job: { id: string; title: string; companyName: string; location: string; status: string; expiresAt: string | null } };
type CandidateProfileData = { displayName: string };

const statusLabels: Record<string, string> = {
  SUBMITTED: "ส่งใบสมัครแล้ว",
  REVIEWING: "กำลังพิจารณา",
  SHORTLISTED: "ผ่านการคัดเลือกเบื้องต้น",
  INTERVIEW: "นัดสัมภาษณ์",
  OFFERED: "เสนอจ้าง",
  REJECTED: "ไม่ผ่านการคัดเลือก",
  WITHDRAWN: "ถอนใบสมัคร",
};

export function CandidateProfile() {
  const [profile, setProfile] = useState<CandidateProfileData | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [pendingWithdrawId, setPendingWithdrawId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [authenticated, setAuthenticated] = useState(true);

  async function loadProfile() {
    setLoading(true);
    setError("");
    const [profileResponse, resumeResponse, applicationResponse, savedResponse] = await Promise.all([fetch("/api/profile", { cache: "no-store" }), fetch("/api/profile/resumes"), fetch("/api/candidate/applications"), fetch("/api/candidate/saved-jobs")]);
    if (profileResponse.status === 401 || resumeResponse.status === 401 || applicationResponse.status === 401 || savedResponse.status === 401) {
      setAuthenticated(false);
      setLoading(false);
      return;
    }
    if (!profileResponse.ok || !resumeResponse.ok || !applicationResponse.ok || !savedResponse.ok) {
      setError("ไม่สามารถโหลดข้อมูลโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
      return;
    }
    const profileData = await profileResponse.json() as { profile: CandidateProfileData };
    const resumeData = await resumeResponse.json() as { resumes: Resume[] };
    const applicationData = await applicationResponse.json() as { applications: Application[] };
    const savedData = await savedResponse.json() as { savedJobs: SavedJob[] };
    setProfile(profileData.profile);
    setDisplayName(profileData.profile.displayName);
    setResumes(resumeData.resumes);
    setApplications(applicationData.applications);
    setSavedJobs(savedData.savedJobs);
    setLoading(false);
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => { void loadProfile(); }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  async function uploadResume(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadError("");
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/profile/resumes", { method: "POST", body: formData });
    const data = await response.json() as { error?: string };
    setUploading(false);
    if (!response.ok) {
      setUploadError(data.error ?? "ไม่สามารถอัปโหลด Resume ได้");
      return;
    }
    await loadProfile();
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!displayName.trim()) { setProfileError("กรุณาระบุชื่อที่แสดง"); return; }
    setSavingProfile(true);
    setProfileError("");
    setProfileSuccess("");
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName }) });
      const data = await response.json() as { profile?: CandidateProfileData; error?: string };
      if (!response.ok || !data.profile) { setProfileError(data.error ?? "ไม่สามารถบันทึกข้อมูลโปรไฟล์ได้"); return; }
      setProfile(data.profile);
      setDisplayName(data.profile.displayName);
      setProfileSuccess("บันทึกข้อมูลโปรไฟล์แล้ว");
    } catch { setProfileError("เชื่อมต่อระบบไม่ได้ ข้อมูลโปรไฟล์ยังไม่ถูกบันทึก"); }
    finally { setSavingProfile(false); }
  }

  async function withdrawApplication(application: Application) {
    if (!window.confirm(`ต้องการถอนใบสมัครตำแหน่ง “${application.job.title}” หรือไม่`)) return;
    setPendingWithdrawId(application.id);
    setWithdrawError("");
    try {
      const response = await fetch(`/api/candidate/applications/${application.id}/withdraw`, { method: "POST" });
      const data = await response.json() as { application?: { status: string }; error?: string };
      if (!response.ok) { setWithdrawError(data.error ?? "ไม่สามารถถอนใบสมัครได้"); return; }
      setApplications((items) => items.map((item) => item.id === application.id ? { ...item, status: data.application?.status ?? "WITHDRAWN" } : item));
    } catch { setWithdrawError("เชื่อมต่อระบบไม่ได้ ใบสมัครยังไม่ถูกถอน"); }
    finally { setPendingWithdrawId(""); }
  }

  if (!authenticated) {
    return <AppShell title="โปรไฟล์ผู้สมัคร" description="จัดการ Resume และติดตามสถานะใบสมัครของคุณ"><section className="rounded-2xl border border-dashed border-sky-200 bg-white p-8 text-center"><AlertCircle className="mx-auto size-8 text-sky-700" /><h2 className="mt-3 text-lg font-semibold">กรุณาเข้าสู่ระบบ</h2><p className="mt-1 text-slate-600">โปรไฟล์ Resume และใบสมัครเป็นข้อมูลส่วนตัว</p><Link className="mt-5 inline-flex min-h-11 items-center rounded-full bg-sky-700 px-5 text-sm font-semibold text-white" href="/login">เข้าสู่ระบบ</Link></section></AppShell>;
  }

  return <AppShell title="โปรไฟล์ผู้สมัคร" description="จัดการ Resume และติดตามสถานะใบสมัครของคุณ">
    {withdrawError && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800" role="alert">{withdrawError}</p>}
    {loading ? <ProfileLoading /> : error ? <section className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800" role="alert">{error}<Button className="ml-3" variant="secondary" onClick={() => void loadProfile()}>ลองใหม่</Button></section> : <><section className="mb-6 max-w-xl rounded-xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-semibold text-slate-950">ข้อมูลโปรไฟล์</h2><p className="mt-1 text-sm text-slate-600">ชื่อที่แสดงจะใช้กับการสมัครงานของคุณ</p><form className="mt-5 space-y-4" onSubmit={saveProfile}><label className="block text-sm font-semibold text-slate-900" htmlFor="candidate-display-name">ชื่อที่แสดง<Input id="candidate-display-name" className="mt-1" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={160} required aria-describedby={profileError ? "candidate-display-name-error" : undefined} /></label>{profileError && <p id="candidate-display-name-error" className="text-sm text-red-700" role="alert">{profileError}</p>}{profileSuccess && <p className="text-sm text-emerald-700" role="status" aria-live="polite">{profileSuccess}</p>}<Button type="submit" disabled={savingProfile || !profile}>{savingProfile ? "กำลังบันทึก..." : "บันทึกข้อมูลโปรไฟล์"}</Button></form></section><div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-950">Resume ของฉัน</h2><p className="mt-1 text-sm text-slate-600">รองรับ PDF, DOC, DOCX ขนาดไม่เกิน 5 MB</p></div><Upload className="size-5 text-sky-700" aria-hidden="true" /></div>
        <label className="mt-5 flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-sky-700 px-4 text-sm font-semibold text-white hover:bg-sky-800"><input className="sr-only" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={uploadResume} disabled={uploading} />{uploading ? "กำลังอัปโหลด..." : "อัปโหลด Resume"}</label>
        {uploadError && <p className="mt-3 text-sm text-red-700" role="alert">{uploadError}</p>}
        <div className="mt-5 space-y-3">{resumes.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">ยังไม่มี Resume กรุณาอัปโหลดก่อนสมัครงาน</p> : resumes.map((resume) => <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3" key={resume.id}><FileText className="size-5 shrink-0 text-sky-700" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{resume.originalName}</p><p className="text-xs text-slate-500">Version {resume.version} · {formatBytes(resume.sizeBytes)}</p></div>{resume.status === "READY" && <Badge className="bg-emerald-50 text-emerald-800"><CheckCircle2 className="mr-1 size-3" />พร้อมใช้</Badge>}</div>)}</div>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-semibold text-slate-950">ใบสมัครของฉัน</h2><p className="mt-1 text-sm text-slate-600">ติดตามความคืบหน้าของงานที่สมัคร</p><div className="mt-5 space-y-3">{applications.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">ยังไม่มีใบสมัคร <Link className="font-semibold text-sky-700" href="/">ค้นหางานที่สนใจ</Link></p> : applications.map((application) => <article className="rounded-lg border border-slate-200 p-4" key={application.id}><div className="flex items-start justify-between gap-3"><div><Link className="font-semibold text-slate-950 hover:text-sky-700" href={`/jobs/${application.job.id}`}>{application.job.title}</Link><p className="mt-1 text-sm text-slate-600">{application.job.companyName} · {application.job.location}</p></div><Badge>{statusLabels[application.status] ?? application.status}</Badge></div><p className="mt-3 text-xs text-slate-500">สมัครเมื่อ {formatDate(application.createdAt)} · ใช้ {application.resumeSnapshotName}</p>{isWithdrawable(application.status) && <Button className="mt-4" variant="secondary" disabled={pendingWithdrawId === application.id} onClick={() => void withdrawApplication(application)}><Undo2 className="mr-2 size-4" aria-hidden="true" />{pendingWithdrawId === application.id ? "กำลังถอนใบสมัคร..." : "ถอนใบสมัคร"}</Button>}</article>)}</div></section>
    </div></>}
    {!loading && !error && <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-start gap-3"><Bookmark className="mt-1 size-5 text-sky-700" aria-hidden="true" /><div><h2 className="text-lg font-semibold text-slate-950">งานที่บันทึกไว้</h2><p className="mt-1 text-sm text-slate-600">กลับมาดูงานที่สนใจได้จากหน้านี้</p></div></div>{savedJobs.length === 0 ? <p className="mt-5 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">ยังไม่มีงานที่บันทึกไว้ <Link className="font-semibold text-sky-700" href="/">ค้นหางาน</Link></p> : <div className="mt-5 grid gap-3 md:grid-cols-2">{savedJobs.map((savedJob) => <article className="rounded-lg border border-slate-200 p-4" key={savedJob.id}><div className="flex items-start justify-between gap-3"><div>{savedJob.job.status === "PUBLISHED" ? <Link className="font-semibold text-slate-950 hover:text-sky-700" href={`/jobs/${savedJob.job.id}`}>{savedJob.job.title}</Link> : <p className="font-semibold text-slate-700">{savedJob.job.title}</p>}<p className="mt-1 text-sm text-slate-600">{savedJob.job.companyName} · {savedJob.job.location}</p></div><Badge className={savedJob.job.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}>{savedJob.job.status === "PUBLISHED" ? "เปิดรับสมัคร" : "ไม่เปิดรับแล้ว"}</Badge></div></article>)}</div>}</section>}
  </AppShell>;
}

function ProfileLoading() { return <div className="grid gap-6 lg:grid-cols-2" aria-busy="true"><div className="h-72 animate-pulse rounded-xl bg-slate-200" /><div className="h-72 animate-pulse rounded-xl bg-slate-200" /></div>; }
function formatBytes(bytes: number) { return `${(bytes / 1024 / 1024).toFixed(2)} MB`; }
function formatDate(value: string) { return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(value)); }
function isWithdrawable(status: string) { return ["SUBMITTED", "REVIEWING", "SHORTLISTED", "INTERVIEW"].includes(status); }
