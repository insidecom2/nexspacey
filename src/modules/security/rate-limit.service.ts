import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

export class RateLimitExceededError extends Error { constructor() { super("ทำรายการบ่อยเกินไป กรุณาลองใหม่ภายหลัง"); } }

export function getRateLimitWindow(now: Date, windowMs: number) {
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

export async function enforceRateLimit(input: { action: string; subjectId: string; limit: number; windowMs: number }) {
  const windowStartedAt = getRateLimitWindow(new Date(), input.windowMs);
  const rows = await prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
    INSERT INTO rate_limit_windows (action, subject_id, window_started_at, count)
    VALUES (${input.action}, ${input.subjectId}::uuid, ${windowStartedAt}, 1)
    ON CONFLICT (action, subject_id, window_started_at)
    DO UPDATE SET count = rate_limit_windows.count + 1
    RETURNING count
  `);
  if ((rows[0]?.count ?? input.limit + 1) > input.limit) throw new RateLimitExceededError();
}
