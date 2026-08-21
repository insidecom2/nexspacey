import { describe, expect, it } from "vitest";
import { AdminModerationValidationError, validateModerationReason } from "@/modules/moderation/job-moderation.service";

describe("moderation reason validation", () => {
  it("trims and returns a valid reason", () => expect(validateModerationReason("  policy violation  ")).toBe("policy violation"));
  it.each([undefined, "", "no", "a".repeat(1001)])("rejects invalid reason %s", (reason) => expect(() => validateModerationReason(reason)).toThrow(AdminModerationValidationError));
});
