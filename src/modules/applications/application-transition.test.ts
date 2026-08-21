import { describe, expect, it } from "vitest";
import { ApplicationStatus } from "@/generated/prisma/client";
import { isAllowedTransition } from "@/modules/applications/employer-application.service";

describe("application status transitions", () => {
  it.each([
    [ApplicationStatus.SUBMITTED, ApplicationStatus.REVIEWING],
    [ApplicationStatus.REVIEWING, ApplicationStatus.SHORTLISTED],
    [ApplicationStatus.SHORTLISTED, ApplicationStatus.INTERVIEW],
    [ApplicationStatus.INTERVIEW, ApplicationStatus.OFFERED],
    [ApplicationStatus.SUBMITTED, ApplicationStatus.REJECTED],
    [ApplicationStatus.REVIEWING, ApplicationStatus.REJECTED],
    [ApplicationStatus.SHORTLISTED, ApplicationStatus.REJECTED],
    [ApplicationStatus.INTERVIEW, ApplicationStatus.REJECTED],
  ])("allows %s -> %s", (current, next) => expect(isAllowedTransition(current, next)).toBe(true));

  it.each([
    [ApplicationStatus.OFFERED, ApplicationStatus.REJECTED],
    [ApplicationStatus.REJECTED, ApplicationStatus.REVIEWING],
    [ApplicationStatus.WITHDRAWN, ApplicationStatus.REVIEWING],
    [ApplicationStatus.SUBMITTED, ApplicationStatus.INTERVIEW],
    [ApplicationStatus.REVIEWING, ApplicationStatus.OFFERED],
  ])("rejects %s -> %s", (current, next) => expect(isAllowedTransition(current, next)).toBe(false));
});
