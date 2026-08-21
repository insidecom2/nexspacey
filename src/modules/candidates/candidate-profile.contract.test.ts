import { describe, expect, it } from "vitest";
import { candidateProfileUpdateSchema } from "@/modules/candidates/candidate-profile.contract";

describe("candidateProfileUpdateSchema", () => {
  it("trims and accepts a display name within the allowed length", () => {
    expect(candidateProfileUpdateSchema.parse({ displayName: "  ชื่อผู้สมัคร  " })).toEqual({ displayName: "ชื่อผู้สมัคร" });
  });

  it("rejects blank, over-length, and unknown fields", () => {
    expect(candidateProfileUpdateSchema.safeParse({ displayName: "   " }).success).toBe(false);
    expect(candidateProfileUpdateSchema.safeParse({ displayName: "a".repeat(161) }).success).toBe(false);
    expect(candidateProfileUpdateSchema.safeParse({ displayName: "Candidate", role: "ADMIN" }).success).toBe(false);
  });
});
