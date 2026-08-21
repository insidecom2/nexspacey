import { JobSearch } from "@/components/jobs/job-search";
import { SiteNav } from "@/components/layout/site-nav";

export default function PublicJobsPage() {
  return <><SiteNav /><main className="mx-auto max-w-6xl px-5 py-8 sm:py-12"><JobSearch /></main></>;
}
