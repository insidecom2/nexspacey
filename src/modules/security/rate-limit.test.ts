import { describe, expect, it } from "vitest";
import { getRateLimitWindow, RateLimitExceededError } from "@/modules/security/rate-limit.service";

describe("rate-limit contracts", () => {
  it("groups timestamps into deterministic windows", () => {
    const now = new Date("2026-08-21T10:17:42.123Z");
    expect(getRateLimitWindow(now, 60_000).toISOString()).toBe("2026-08-21T10:17:00.000Z");
  });
  it("exposes a safe client-facing exceeded error", () => expect(new RateLimitExceededError().message).toContain("ลองใหม่ภายหลัง"));
});
