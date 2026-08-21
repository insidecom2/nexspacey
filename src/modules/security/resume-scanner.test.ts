import { afterEach, describe, expect, it } from "vitest";
import { scanResumeContent } from "@/modules/security/resume-scanner";

describe("resume malware scanner", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalMode = process.env.RESUME_MALWARE_SCANNER;

  afterEach(() => {
    (process.env as Record<string, string | undefined>)["NODE_ENV"] = originalNodeEnv;
    process.env.RESUME_MALWARE_SCANNER = originalMode;
  });

  it("allows local development when scanning is explicitly disabled", async () => {
    (process.env as Record<string, string | undefined>)["NODE_ENV"] = "test";
    process.env.RESUME_MALWARE_SCANNER = "disabled";
    await expect(scanResumeContent(new Uint8Array([1, 2, 3]))).resolves.toBeUndefined();
  });

  it("fails closed in production without a scanner configuration", async () => {
    (process.env as Record<string, string | undefined>)["NODE_ENV"] = "production";
    delete process.env.RESUME_MALWARE_SCANNER;
    await expect(scanResumeContent(new Uint8Array([1, 2, 3]))).rejects.toThrow("ClamAV configuration is incomplete");
  });
});
