import { notFound } from "next/navigation";
import { z } from "zod";
import { JobDetail } from "@/components/jobs/job-detail";
import { SiteNav } from "@/components/layout/site-nav";
import { PublicJobNotFoundError, getPublicJob } from "@/modules/jobs/public-job.service";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; if (!z.string().uuid().safeParse(id).success) notFound(); let job; try { job = await getPublicJob(id); } catch (error) { if (error instanceof PublicJobNotFoundError) notFound(); throw error; } return <><SiteNav /><JobDetail job={{ ...job, publishedAt: job.publishedAt?.toISOString() ?? null, expiresAt: job.expiresAt?.toISOString() ?? null }} /></>; }
