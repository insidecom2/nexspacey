import { z } from "zod";
import { PublicJobNotFoundError, getPublicJob } from "@/modules/jobs/public-job.service";

const idSchema = z.string().uuid();

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const jobId = idSchema.parse((await params).id);
    return Response.json({ job: await getPublicJob(jobId) });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof PublicJobNotFoundError) return Response.json({ error: "ไม่พบประกาศงานนี้" }, { status: 404 });
    return Response.json({ error: "ไม่สามารถโหลดประกาศงานได้" }, { status: 500 });
  }
}
