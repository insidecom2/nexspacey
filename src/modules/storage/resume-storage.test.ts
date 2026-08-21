import { afterEach, describe, expect, it } from "vitest";
import { putResumeObject, ResumeStorageConfigurationError } from "@/modules/storage/resume-storage";

describe("resume storage configuration", () => {
  const originalProvider = process.env.RESUME_STORAGE_PROVIDER;
  const originalAccount = process.env.R2_ACCOUNT_ID;
  const originalBucket = process.env.R2_BUCKET;
  const originalAccessKey = process.env.R2_ACCESS_KEY_ID;
  const originalSecret = process.env.R2_SECRET_ACCESS_KEY;

  afterEach(() => {
    process.env.RESUME_STORAGE_PROVIDER = originalProvider;
    process.env.R2_ACCOUNT_ID = originalAccount;
    process.env.R2_BUCKET = originalBucket;
    process.env.R2_ACCESS_KEY_ID = originalAccessKey;
    process.env.R2_SECRET_ACCESS_KEY = originalSecret;
  });

  it("fails before network access when R2 credentials are incomplete", async () => {
    process.env.RESUME_STORAGE_PROVIDER = "r2";
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_BUCKET;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    await expect(putResumeObject({ key: "private/test", content: new Uint8Array([1]), mimeType: "application/pdf" })).rejects.toThrow(ResumeStorageConfigurationError);
  });
});
