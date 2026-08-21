import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ApplicationConflictError, applyToJob } from "@/modules/applications/application.service";
import { listPublicJobs, saveJob, unsaveJob } from "@/modules/jobs/public-job.service";
import { updateEmployerApplicationStatus } from "@/modules/applications/employer-application.service";
import { withdrawCandidateApplication } from "@/modules/applications/application.service";
import { moderateJob } from "@/modules/moderation/job-moderation.service";
import { enforceRateLimit, RateLimitExceededError } from "@/modules/security/rate-limit.service";
import { prisma } from "@/lib/db/prisma";

describe.sequential("core marketplace database workflows", () => {
  const candidateId = "a1000000-0000-4000-8000-000000000001";
  const companyId = "a2000000-0000-4000-8000-000000000001";
  const employerId = "a3000000-0000-4000-8000-000000000001";
  const adminId = "a3000000-0000-4000-8000-000000000002";
  const publishedJobId = "a4000000-0000-4000-8000-000000000001";
  const draftJobId = "a4000000-0000-4000-8000-000000000002";
  const expiredJobId = "a4000000-0000-4000-8000-000000000003";
  const resumeId = "a5000000-0000-4000-8000-000000000001";

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [candidateId, employerId, adminId] } } });
    await prisma.job.deleteMany({ where: { id: { in: [publishedJobId, draftJobId, expiredJobId] } } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.user.create({ data: { id: candidateId, email: "integration-candidate@local.test", passwordHash: "test", role: "CANDIDATE", candidateProfile: { create: { displayName: "Integration Candidate" } } } });
    await prisma.company.create({ data: { id: companyId, name: "Integration Company" } });
    await prisma.user.create({ data: { id: employerId, email: "integration-employer@local.test", passwordHash: "test", role: "EMPLOYER", companyMemberships: { create: { companyId, role: "OWNER" } } } });
    await prisma.user.create({ data: { id: adminId, email: "integration-admin@local.test", passwordHash: "test", role: "ADMIN" } });
    await prisma.resume.create({ data: { id: resumeId, candidateId, originalName: "resume.pdf", storageKey: `integration/${resumeId}`, mimeType: "application/pdf", sizeBytes: 4, content: Buffer.from("test") } });
    await prisma.job.createMany({ data: [
      { id: publishedJobId, companyId, companyName: "Integration Company", title: "Integration Developer", location: "Bangkok", category: "Technology", workModel: "REMOTE", salaryMin: 30000, salaryMax: 50000, salaryCurrency: "THB", description: "Integration test published job", status: "PUBLISHED", publishedAt: new Date(), expiresAt: new Date(Date.now() + 86_400_000), updatedAt: new Date() },
      { id: draftJobId, companyId, companyName: "Integration Company", title: "Hidden Draft", location: "Bangkok", category: "Technology", workModel: "ONSITE", description: "Integration test draft job", status: "DRAFT", updatedAt: new Date() },
      { id: expiredJobId, companyId, companyName: "Integration Company", title: "Expired Job", location: "Bangkok", category: "Technology", workModel: "HYBRID", description: "Integration test expired job", status: "PUBLISHED", publishedAt: new Date(), expiresAt: new Date(Date.now() - 86_400_000), updatedAt: new Date() },
    ] });
  });

  afterAll(async () => {
    await prisma.job.deleteMany({ where: { id: { in: [publishedJobId, draftJobId, expiredJobId] } } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.user.deleteMany({ where: { id: { in: [candidateId, employerId, adminId] } } });
  });

  it("searches only published, non-expired jobs and applies filters", async () => {
    const jobs = await listPublicJobs({ q: "Integration", workModel: "REMOTE", salaryMin: 40000 });
    expect(jobs.map((job) => job.id)).toEqual([publishedJobId]);
  });

  it("creates one application and rejects a duplicate", async () => {
    const application = await applyToJob({ jobId: publishedJobId, candidateId, resumeId });
    expect(application.status).toBe("SUBMITTED");
    await expect(applyToJob({ jobId: publishedJobId, candidateId, resumeId })).rejects.toBeInstanceOf(ApplicationConflictError);
  });

  it("saves idempotently and removes the saved job", async () => {
    await saveJob({ candidateId, jobId: publishedJobId });
    await saveJob({ candidateId, jobId: publishedJobId });
    expect(await prisma.savedJob.count({ where: { candidateId, jobId: publishedJobId } })).toBe(1);
    await unsaveJob({ candidateId, jobId: publishedJobId });
    expect(await prisma.savedJob.count({ where: { candidateId, jobId: publishedJobId } })).toBe(0);
  });

  it("enforces employer application transitions and writes an audit record", async () => {
    const application = await prisma.application.findFirstOrThrow({ where: { jobId: publishedJobId, candidateId } });
    const auditCountBefore = await prisma.auditLog.count({ where: { action: "APPLICATION_STATUS_UPDATED", resourceId: application.id } });
    const updated = await updateEmployerApplicationStatus({ companyId, employerId, applicationId: application.id, nextStatus: "REVIEWING" });
    expect(updated?.status).toBe("REVIEWING");
    expect(await prisma.auditLog.count({ where: { action: "APPLICATION_STATUS_UPDATED", resourceId: application.id } })).toBe(auditCountBefore + 1);
  });

  it("withdraws an application idempotently and records the first withdrawal", async () => {
    const application = await prisma.application.findFirstOrThrow({ where: { jobId: publishedJobId, candidateId } });
    const auditCountBefore = await prisma.auditLog.count({ where: { action: "APPLICATION_WITHDRAWN", resourceId: application.id } });
    expect((await withdrawCandidateApplication({ applicationId: application.id, candidateId })).status).toBe("WITHDRAWN");
    expect((await withdrawCandidateApplication({ applicationId: application.id, candidateId })).status).toBe("WITHDRAWN");
    expect(await prisma.auditLog.count({ where: { action: "APPLICATION_WITHDRAWN", resourceId: application.id } })).toBe(auditCountBefore + 1);
  });

  it("enforces a bounded mutation window", async () => {
    const action = `integration_${Date.now()}`;
    await enforceRateLimit({ action, subjectId: candidateId, limit: 2, windowMs: 60 * 60 * 1000 });
    await enforceRateLimit({ action, subjectId: candidateId, limit: 2, windowMs: 60 * 60 * 1000 });
    await expect(enforceRateLimit({ action, subjectId: candidateId, limit: 2, windowMs: 60 * 60 * 1000 })).rejects.toBeInstanceOf(RateLimitExceededError);
    await prisma.rateLimitWindow.deleteMany({ where: { action, subjectId: candidateId } });
  });

  it("suspends a published job with an audit trail and hides it from public search", async () => {
    const auditCountBefore = await prisma.auditLog.count({ where: { action: "JOB_SUSPENDED", resourceId: publishedJobId } });
    const suspended = await moderateJob({ adminId, jobId: publishedJobId, action: "suspend", reason: "Policy review required" });
    expect(suspended.status).toBe("SUSPENDED");
    expect(await prisma.auditLog.count({ where: { action: "JOB_SUSPENDED", resourceId: publishedJobId } })).toBe(auditCountBefore + 1);
    expect((await listPublicJobs({ q: "Integration Developer" })).some((job) => job.id === publishedJobId)).toBe(false);
  });
});
