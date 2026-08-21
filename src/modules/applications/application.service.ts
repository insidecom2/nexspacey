import { ApplicationStatus, JobStatus, ResumeStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

export class ApplicationConflictError extends Error {
  constructor() {
    super("สมัครงานนี้ไปแล้ว");
    this.name = "ApplicationConflictError";
  }
}

export class ApplicationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApplicationValidationError";
  }
}

export class ApplicationNotFoundError extends Error {
  constructor() {
    super("Application not found");
    this.name = "ApplicationNotFoundError";
  }
}

export class ApplicationTransitionConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApplicationTransitionConflictError";
  }
}

export async function applyToJob(input: { jobId: string; candidateId: string; resumeId: string }) {
  try {
    return await prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({ where: { id: input.jobId }, select: { id: true, status: true, expiresAt: true } });
      if (!job || job.status !== JobStatus.PUBLISHED || (job.expiresAt !== null && job.expiresAt <= new Date())) {
        throw new ApplicationValidationError("ประกาศงานนี้ไม่เปิดรับสมัครแล้ว");
      }

      const resume = await tx.resume.findFirst({
        where: { id: input.resumeId, candidateId: input.candidateId, status: ResumeStatus.READY },
        select: { id: true, originalName: true, version: true, mimeType: true, sizeBytes: true },
      });
      if (!resume) throw new ApplicationValidationError("ไม่พบ Resume ที่พร้อมใช้งานของคุณ");

      return tx.application.create({
        data: {
          jobId: input.jobId,
          candidateId: input.candidateId,
          resumeId: resume.id,
          resumeSnapshotName: resume.originalName,
          resumeSnapshotVersion: resume.version,
          resumeSnapshotMimeType: resume.mimeType,
          resumeSnapshotSizeBytes: resume.sizeBytes,
          status: ApplicationStatus.SUBMITTED,
        },
        select: { id: true, jobId: true, resumeSnapshotName: true, status: true, createdAt: true },
      });
    });
  } catch (error) {
    if (isPrismaUniqueError(error)) throw new ApplicationConflictError();
    throw error;
  }
}

export async function listCandidateApplications(candidateId: string) {
  return prisma.application.findMany({
    where: { candidateId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      resumeSnapshotName: true,
      job: { select: { id: true, title: true, companyName: true, location: true } },
    },
  });
}

export async function withdrawCandidateApplication(input: { applicationId: string; candidateId: string }) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.application.findFirst({
      where: { id: input.applicationId, candidateId: input.candidateId },
      select: { id: true, status: true },
    });
    if (!current) throw new ApplicationNotFoundError();
    if (current.status === ApplicationStatus.WITHDRAWN) return current;
    const terminalStatuses: ApplicationStatus[] = [ApplicationStatus.OFFERED, ApplicationStatus.REJECTED];
    if (terminalStatuses.includes(current.status)) {
      throw new ApplicationTransitionConflictError("ใบสมัครนี้อยู่ในสถานะปลายทางและถอนต่อไม่ได้");
    }

    const result = await tx.application.updateMany({
      where: { id: input.applicationId, candidateId: input.candidateId, status: current.status },
      data: { status: ApplicationStatus.WITHDRAWN },
    });
    if (result.count !== 1) {
      const latest = await tx.application.findFirst({ where: { id: input.applicationId, candidateId: input.candidateId }, select: { id: true, status: true } });
      if (latest?.status === ApplicationStatus.WITHDRAWN) return latest;
      throw new ApplicationTransitionConflictError("ใบสมัครถูกเปลี่ยนสถานะแล้ว กรุณาโหลดข้อมูลใหม่");
    }

    const application = await tx.application.findUnique({ where: { id: input.applicationId }, select: { id: true, status: true } });
    if (!application) throw new ApplicationNotFoundError();
    await tx.auditLog.create({
      data: {
        actorId: input.candidateId,
        action: "APPLICATION_WITHDRAWN",
        resourceType: "APPLICATION",
        resourceId: input.applicationId,
        metadata: { previousStatus: current.status },
      },
    });
    return application;
  });
}

function isPrismaUniqueError(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "P2002";
}
