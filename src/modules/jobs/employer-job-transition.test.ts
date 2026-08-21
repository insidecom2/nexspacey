import { describe, expect, it } from "vitest";
import { JobStatus } from "@/generated/prisma/client";
import { isAllowedEmployerTransition } from "@/modules/jobs/employer-job.service";

describe("employer job lifecycle", () => {
  it.each([
    [JobStatus.DRAFT, JobStatus.PENDING_REVIEW],
    [JobStatus.PENDING_REVIEW, JobStatus.DRAFT],
    [JobStatus.PUBLISHED, JobStatus.PAUSED],
    [JobStatus.PUBLISHED, JobStatus.CLOSED],
    [JobStatus.PAUSED, JobStatus.PUBLISHED],
    [JobStatus.PAUSED, JobStatus.CLOSED],
  ])("allows %s -> %s", (current, next) => expect(isAllowedEmployerTransition(current, next)).toBe(true));

  it.each([
    [JobStatus.DRAFT, JobStatus.PUBLISHED],
    [JobStatus.PENDING_REVIEW, JobStatus.PUBLISHED],
    [JobStatus.CLOSED, JobStatus.PUBLISHED],
    [JobStatus.EXPIRED, JobStatus.PUBLISHED],
    [JobStatus.SUSPENDED, JobStatus.PUBLISHED],
  ])("rejects %s -> %s", (current, next) => expect(isAllowedEmployerTransition(current, next)).toBe(false));
});
