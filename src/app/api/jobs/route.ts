import { z } from "zod";
import { WorkModel } from "@/generated/prisma/client";
import { listPublicJobs } from "@/modules/jobs/public-job.service";

const querySchema = z.object({
  q: z.string().trim().max(120).optional(),
  location: z.string().trim().max(180).optional(),
  category: z.string().trim().max(120).optional(),
  workModel: z.nativeEnum(WorkModel).optional(),
  salaryMin: z.coerce.number().int().nonnegative().max(10_000_000).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ q: url.searchParams.get("q") ?? undefined, location: url.searchParams.get("location") ?? undefined, category: url.searchParams.get("category") ?? undefined, workModel: url.searchParams.get("workModel") ?? undefined, salaryMin: url.searchParams.get("salaryMin") ?? undefined });
  if (!parsed.success) return Response.json({ error: "เงื่อนไขการค้นหาไม่ถูกต้อง" }, { status: 400 });
  try {
    return Response.json({ jobs: await listPublicJobs(parsed.data) });
  } catch {
    return Response.json({ error: "ไม่สามารถค้นหางานได้" }, { status: 500 });
  }
}
