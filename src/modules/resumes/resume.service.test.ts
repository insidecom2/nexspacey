import { describe, expect, it } from "vitest";
import { MAX_RESUME_BYTES, loadResumeContent, validateResumeMetadata } from "@/modules/resumes/resume.service";

describe("resume validation", () => {
  it("accepts a PDF with the expected signature", () => {
    expect(() => validateResumeMetadata({ originalName: "resume.pdf", mimeType: "application/pdf", sizeBytes: 5, content: new TextEncoder().encode("%PDF-") })).not.toThrow();
  });

  it("rejects mismatched signatures and oversized files", () => {
    expect(() => validateResumeMetadata({ originalName: "resume.pdf", mimeType: "application/pdf", sizeBytes: 5, content: new TextEncoder().encode("not-pdf") })).toThrow();
    expect(() => validateResumeMetadata({ originalName: "resume.pdf", mimeType: "application/pdf", sizeBytes: MAX_RESUME_BYTES + 1, content: new TextEncoder().encode("%PDF-") })).toThrow();
  });

  it("rejects a stored Resume when its checksum does not match", async () => {
    await expect(loadResumeContent({ storageProvider: "postgres", storageKey: "private/test", content: new TextEncoder().encode("%PDF-"), checksumSha256: "0".repeat(64) })).rejects.toThrow("Resume storage could not be read");
  });
});
