import { JobStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

const expirableStatuses: JobStatus[] = [JobStatus.PUBLISHED, JobStatus.PAUSED];

export async function expireDueJobs(now = new Date()) {
  return prisma.$transaction(async (tx) => {
    const dueJobs = await tx.$queryRaw<Array<{ id: string; previousStatus: string }>>(Prisma.sql`
      SELECT id, status::text AS "previousStatus"
      FROM jobs
      WHERE status IN ('PUBLISHED'::"JobStatus", 'PAUSED'::"JobStatus")
        AND expires_at <= ${now}
      FOR UPDATE SKIP LOCKED
    `);
    if (dueJobs.length === 0) return { expiredCount: 0 };

    await tx.job.updateMany({
      where: { id: { in: dueJobs.map((job) => job.id) }, status: { in: expirableStatuses } },
      data: { status: JobStatus.EXPIRED },
    });
    await tx.auditLog.createMany({
      data: dueJobs.map((job) => ({
        action: "JOB_EXPIRED",
        resourceType: "JOB",
        resourceId: job.id,
        metadata: { previousStatus: job.previousStatus },
      })),
    });
    return { expiredCount: dueJobs.length };
  });
}
