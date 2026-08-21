import { JobModerationStatus, JobStatus, WorkModel } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { expireDueJobs } from "@/modules/jobs/job-expiration.service";

export class EmployerJobNotFoundError extends Error {
  constructor() {
    super("Job not found");
    this.name = "EmployerJobNotFoundError";
  }
}

export class EmployerJobValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmployerJobValidationError";
  }
}

export class EmployerJobConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmployerJobConflictError";
  }
}

const jobSummarySelect = {
  id: true,
  title: true,
  companyName: true,
  location: true,
  category: true,
  workModel: true,
  salaryMin: true,
  salaryMax: true,
  salaryCurrency: true,
  description: true,
  status: true,
  moderationStatus: true,
  moderationReason: true,
  publishedAt: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { applications: true } },
} as const;

type JobContentInput = {
  title?: string;
  location?: string;
  category?: string;
  workModel?: WorkModel;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  description?: string;
  expiresAt?: Date | null;
};

export async function listEmployerJobs(companyId: string) {
  await expireDueJobs();
  return prisma.job.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, select: jobSummarySelect });
}

export async function createEmployerJob(input: { companyId: string; companyName: string; title: string; location: string; category: string; workModel: WorkModel; salaryMin: number | null; salaryMax: number | null; salaryCurrency: string | null; description: string; expiresAt: Date | null; status: JobStatus }) {
  validateSalaryRange(input);
  if (input.status === JobStatus.PENDING_REVIEW) validateReviewable(input);
  return prisma.job.create({
    data: {
      companyId: input.companyId,
      companyName: input.companyName,
      title: input.title,
      location: input.location,
      category: input.category,
      workModel: input.workModel,
      salaryMin: input.salaryMin,
      salaryMax: input.salaryMax,
      salaryCurrency: input.salaryCurrency,
      description: input.description,
      expiresAt: input.expiresAt,
      status: input.status,
      moderationStatus: input.status === JobStatus.PENDING_REVIEW ? JobModerationStatus.PENDING : JobModerationStatus.REJECTED,
    },
    select: jobSummarySelect,
  });
}

export async function updateEmployerJob(input: { companyId: string; companyName: string; jobId: string; content: JobContentInput; nextStatus?: JobStatus }) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.job.findFirst({ where: { id: input.jobId, companyId: input.companyId }, select: { ...jobSummarySelect } });
    if (!current) throw new EmployerJobNotFoundError();

    const hasContentChange = Object.values(input.content).some((value) => value !== undefined);
    let nextStatus = input.nextStatus ?? current.status;
    if (hasContentChange && ([JobStatus.PUBLISHED, JobStatus.PAUSED] as JobStatus[]).includes(current.status)) {
      if (input.nextStatus && input.nextStatus !== JobStatus.DRAFT) throw new EmployerJobValidationError("แก้ไข Job ที่เผยแพร่แล้วต้องกลับเป็นฉบับร่างก่อน");
      nextStatus = JobStatus.DRAFT;
    }
    if (nextStatus !== current.status && !isAllowedEmployerTransition(current.status, nextStatus)) throw new EmployerJobValidationError("เปลี่ยนสถานะประกาศงานตามลำดับนี้ไม่ได้");

    const merged = {
      title: input.content.title ?? current.title,
      location: input.content.location ?? current.location,
      category: input.content.category ?? current.category,
      workModel: input.content.workModel ?? current.workModel,
      salaryMin: input.content.salaryMin === undefined ? current.salaryMin : input.content.salaryMin,
      salaryMax: input.content.salaryMax === undefined ? current.salaryMax : input.content.salaryMax,
      salaryCurrency: input.content.salaryCurrency === undefined ? current.salaryCurrency : input.content.salaryCurrency,
      description: input.content.description ?? current.description,
      expiresAt: input.content.expiresAt === undefined ? current.expiresAt : input.content.expiresAt,
    };
    validateSalaryRange(merged);
    if (nextStatus === JobStatus.PENDING_REVIEW) validateReviewable(merged);

    const updated = await tx.job.update({
      where: { id: input.jobId },
      data: {
        ...input.content,
        companyName: input.companyName,
        status: nextStatus,
        ...(nextStatus === JobStatus.PENDING_REVIEW
          ? { moderationStatus: JobModerationStatus.PENDING, moderationReason: null, moderatedAt: null, moderatedBy: null }
          : hasContentChange && ([JobStatus.PUBLISHED, JobStatus.PAUSED] as JobStatus[]).includes(current.status)
            ? { moderationStatus: JobModerationStatus.REJECTED, moderationReason: null, moderatedAt: null, moderatedBy: null }
            : {}),
        publishedAt: nextStatus === JobStatus.DRAFT ? null : nextStatus === JobStatus.PUBLISHED && current.status === JobStatus.PAUSED ? new Date() : current.publishedAt,
      },
      select: jobSummarySelect,
    });
    return updated;
  });
}

export async function deleteEmployerJob(input: { companyId: string; jobId: string }) {
  return prisma.$transaction(async (tx) => {
    const job = await tx.job.findFirst({ where: { id: input.jobId, companyId: input.companyId }, select: { id: true, status: true, _count: { select: { applications: true } } } });
    if (!job) throw new EmployerJobNotFoundError();
    if (job.status !== JobStatus.DRAFT) throw new EmployerJobValidationError("ลบได้เฉพาะประกาศฉบับร่าง");
    if (job._count.applications > 0) throw new EmployerJobConflictError("ประกาศที่มีผู้สมัครแล้วไม่สามารถลบได้");
    await tx.job.delete({ where: { id: job.id } });
    return { id: job.id };
  });
}

export function isAllowedEmployerTransition(current: JobStatus, next: JobStatus) {
  if (current === next) return true;
  const transitions: Partial<Record<JobStatus, JobStatus[]>> = {
    [JobStatus.DRAFT]: [JobStatus.PENDING_REVIEW],
    [JobStatus.PENDING_REVIEW]: [JobStatus.DRAFT],
    [JobStatus.PUBLISHED]: [JobStatus.PAUSED, JobStatus.CLOSED],
    [JobStatus.PAUSED]: [JobStatus.PUBLISHED, JobStatus.CLOSED],
  };
  return transitions[current]?.includes(next) ?? false;
}

function validateReviewable(input: { title: string; location: string; category: string | null; workModel: WorkModel; description: string; expiresAt: Date | null }) {
  if (!input.title || !input.location || !input.category || !input.workModel || !input.description) throw new EmployerJobValidationError("กรุณากรอกข้อมูลประกาศงานให้ครบก่อนส่งตรวจสอบ");
  if (!input.expiresAt || input.expiresAt <= new Date()) throw new EmployerJobValidationError("วันหมดอายุประกาศต้องอยู่ในอนาคต");
}

function validateSalaryRange(input: { salaryMin: number | null; salaryMax: number | null; salaryCurrency: string | null }) {
  const values = [input.salaryMin, input.salaryMax, input.salaryCurrency];
  if (values.every((value) => value === null)) return;
  if (values.some((value) => value === null) || input.salaryMin! > input.salaryMax!) {
    throw new EmployerJobValidationError("กรุณาระบุช่วงเงินเดือนและสกุลเงินให้ครบถ้วน");
  }
}
