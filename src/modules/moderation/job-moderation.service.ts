import { JobModerationStatus, JobStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

export type JobModerationAction = "approve" | "reject" | "suspend";

export class AdminModerationNotFoundError extends Error {
  constructor() {
    super("Moderation job not found");
    this.name = "AdminModerationNotFoundError";
  }
}

export class AdminModerationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminModerationValidationError";
  }
}

export class AdminModerationConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminModerationConflictError";
  }
}

const moderationJobSelect = {
  id: true,
  title: true,
  companyName: true,
  location: true,
  description: true,
  status: true,
  moderationStatus: true,
  moderationReason: true,
  publishedAt: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
  company: { select: { id: true, name: true } },
  _count: { select: { applications: true } },
} as const;

export async function listPendingModerationJobs() {
  return prisma.job.findMany({
    where: { status: JobStatus.PENDING_REVIEW, moderationStatus: JobModerationStatus.PENDING },
    orderBy: { createdAt: "asc" },
    select: moderationJobSelect,
  });
}

export async function listModeratableJobs() {
  return prisma.job.findMany({
    where: { status: { in: [JobStatus.PUBLISHED, JobStatus.PAUSED] } },
    orderBy: { createdAt: "asc" },
    select: moderationJobSelect,
  });
}

export async function moderateJob(input: { adminId: string; jobId: string; action: JobModerationAction; reason?: string }) {
  if (input.action === "reject" || input.action === "suspend") {
    validateModerationReason(input.reason);
  }

  return prisma.$transaction(async (tx) => {
    const current = await tx.job.findUnique({ where: { id: input.jobId }, select: { id: true, status: true, moderationStatus: true, expiresAt: true } });
    if (!current) throw new AdminModerationNotFoundError();
    const isPending = current.status === JobStatus.PENDING_REVIEW && current.moderationStatus === JobModerationStatus.PENDING;
    const isSuspendable = current.status === JobStatus.PUBLISHED || current.status === JobStatus.PAUSED;
    if ((input.action === "suspend" && !isSuspendable) || (input.action !== "suspend" && !isPending)) throw new AdminModerationConflictError("ประกาศงานนี้ไม่อยู่ในสถานะที่ดำเนินการได้");
    if (input.action === "approve" && current.expiresAt !== null && current.expiresAt <= new Date()) {
      throw new AdminModerationValidationError("ไม่สามารถอนุมัติประกาศที่หมดอายุแล้วได้");
    }

    const now = new Date();
    const approved = input.action === "approve";
    const suspended = input.action === "suspend";
    const result = await tx.job.updateMany({
      where: suspended ? { id: input.jobId, status: { in: [JobStatus.PUBLISHED, JobStatus.PAUSED] } } : { id: input.jobId, status: JobStatus.PENDING_REVIEW, moderationStatus: JobModerationStatus.PENDING },
      data: {
        status: approved ? JobStatus.PUBLISHED : suspended ? JobStatus.SUSPENDED : JobStatus.DRAFT,
        moderationStatus: approved ? JobModerationStatus.APPROVED : JobModerationStatus.REJECTED,
        moderationReason: approved ? null : input.reason?.trim(),
        moderatedAt: now,
        moderatedBy: input.adminId,
        publishedAt: approved ? now : suspended ? null : null,
      },
    });
    if (result.count !== 1) throw new AdminModerationConflictError("ประกาศงานนี้ถูกตรวจสอบไปแล้วหรือไม่อยู่ในคิว");

    const job = await tx.job.findUnique({ where: { id: input.jobId }, select: moderationJobSelect });
    if (!job) throw new AdminModerationNotFoundError();
    await tx.auditLog.create({
      data: {
        actorId: input.adminId,
        action: approved ? "JOB_APPROVED" : suspended ? "JOB_SUSPENDED" : "JOB_REJECTED",
        resourceType: "JOB",
        resourceId: input.jobId,
        metadata: approved ? {} : { reason: input.reason?.trim() },
      },
    });
    return job;
  });
}

export function validateModerationReason(reason?: string) {
  const trimmed = reason?.trim() ?? "";
  if (trimmed.length < 5 || trimmed.length > 1000) throw new AdminModerationValidationError("เหตุผลการปฏิเสธต้องมี 5–1000 ตัวอักษร");
  return trimmed;
}
