import { beforeEach, describe, expect, it } from "vitest";
import { createResumeDownloadToken, InvalidResumeTokenError, verifyResumeDownloadToken } from "@/lib/security/resume-signed-token";

describe("resume signed token", () => {
  beforeEach(() => {
    (process.env as Record<string, string | undefined>)["NODE_ENV"] = "test";
    process.env.RESUME_SIGNING_SECRET = "test-resume-secret";
  });

  it("creates and verifies a short-lived token", () => {
    const token = createResumeDownloadToken("application-1", 1_000_000);
    expect(verifyResumeDownloadToken(token, 1_000_001)).toEqual({ applicationId: "application-1", exp: 1_060_000 });
  });

  it("rejects tampered and expired tokens", () => {
    const token = createResumeDownloadToken("application-1", 1_000_000);
    expect(() => verifyResumeDownloadToken(`${token}x`, 1_000_001)).toThrow(InvalidResumeTokenError);
    expect(() => verifyResumeDownloadToken(token, 1_060_000)).toThrow(InvalidResumeTokenError);
  });
});
