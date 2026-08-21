import { ApplicationStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { loadResumeContent } from "@/modules/resumes/resume.service";

export class EmployerApplicationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmployerApplicationValidationError";
  }
}

export class EmployerApplicationNotFoundError extends Error {
  constructor() {
    super("Application not found");
    this.name = "EmployerApplicationNotFoundError";
  }
}

export class EmployerApplicationConflictError extends Error {
  constructor() {
    super("Application was changed by another request");
    this.name = "EmployerApplicationConflictError";
  }
}

const applicationSummarySelect = {
  id: true,
  status: true,
  createdAt: true,
  resumeSnapshotName: true,
  candidate: { select: { id: true, email: true, candidateProfile: { select: { displayName: true } } } },
  job: { select: { id: true, title: true, companyName: true, companyId: true } },
} as const;

export async function listEmployerApplications(input: { companyId: string; jobId?: string; status?: ApplicationStatus }) {
  return prisma.application.findMany({
    where: {
      job: { companyId: input.companyId },
      ...(input.jobId ? { jobId: input.jobId } : {}),
      ...(input.status ? { status: input.status } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: applicationSummarySelect,
  });
}

export async function updateEmployerApplicationStatus(input: { companyId: string; employerId: string; applicationId: string; nextStatus: ApplicationStatus }) {
  return prisma.$transaction(async (tx) => {
    const application = await tx.application.findFirst({
      where: { id: input.applicationId, job: { companyId: input.companyId } },
      select: { status: true },
    });
    if (!application) throw new EmployerApplicationNotFoundError();
    if (application.status === input.nextStatus) return tx.application.findUnique({ where: { id: input.applicationId }, select: { id: true, status: true, updatedAt: true } });
    if (!isAllowedTransition(application.status, input.nextStatus)) throw new EmployerApplicationValidationError("เปลี่ยนสถานะใบสมัครตามลำดับนี้ไม่ได้");

    const updated = await tx.application.updateMany({
      where: { id: input.applicationId, status: application.status, job: { companyId: input.companyId } },
      data: { status: input.nextStatus },
    });
    if (updated.count !== 1) throw new EmployerApplicationConflictError();
    await tx.auditLog.create({ data: { actorId: input.employerId, action: "APPLICATION_STATUS_UPDATED", resourceType: "APPLICATION", resourceId: input.applicationId, metadata: { previousStatus: application.status, nextStatus: input.nextStatus } } });
    return tx.application.findUnique({ where: { id: input.applicationId }, select: { id: true, status: true, updatedAt: true } });
  });
}

export async function getEmployerApplicationResume(input: { companyId: string; employerId: string; applicationId: string }) {
  const application = await prisma.application.findFirst({
    where: { id: input.applicationId, job: { companyId: input.companyId } },
    select: { resumeSnapshotName: true, resume: { select: { mimeType: true, storageKey: true, storageProvider: true, checksumSha256: true, content: true } } },
  });
  if (!application) throw new EmployerApplicationNotFoundError();
  const content = await loadResumeContent(application.resume);
  await prisma.auditLog.create({ data: { actorId: input.employerId, action: "RESUME_DOWNLOADED", resourceType: "APPLICATION", resourceId: input.applicationId, metadata: { method: "session" } } });
  return { fileName: application.resumeSnapshotName, mimeType: application.resume.mimeType, content };
}

export async function assertEmployerApplicationResumeAccess(input: { companyId: string; applicationId: string }) {
  const application = await prisma.application.findFirst({
    where: { id: input.applicationId, job: { companyId: input.companyId } },
    select: { id: true },
  });
  if (!application) throw new EmployerApplicationNotFoundError();
}

export async function getApplicationResumeById(applicationId: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { resumeSnapshotName: true, resume: { select: { mimeType: true, storageKey: true, storageProvider: true, checksumSha256: true, content: true } } },
  });
  if (!application) throw new EmployerApplicationNotFoundError();
  const content = await loadResumeContent(application.resume);
  await prisma.auditLog.create({ data: { action: "RESUME_DOWNLOADED", resourceType: "APPLICATION", resourceId: applicationId, metadata: { method: "signed_url" } } });
  return { fileName: application.resumeSnapshotName, mimeType: application.resume.mimeType, content };
}

export function isAllowedTransition(current: ApplicationStatus, next: ApplicationStatus) {
  if (next === ApplicationStatus.REJECTED) return ([ApplicationStatus.SUBMITTED, ApplicationStatus.REVIEWING, ApplicationStatus.SHORTLISTED, ApplicationStatus.INTERVIEW] as ApplicationStatus[]).includes(current);
  const transitions: Partial<Record<ApplicationStatus, ApplicationStatus>> = {
    [ApplicationStatus.SUBMITTED]: ApplicationStatus.REVIEWING,
    [ApplicationStatus.REVIEWING]: ApplicationStatus.SHORTLISTED,
    [ApplicationStatus.SHORTLISTED]: ApplicationStatus.INTERVIEW,
    [ApplicationStatus.INTERVIEW]: ApplicationStatus.OFFERED,
  };
  return transitions[current] === next;
}
