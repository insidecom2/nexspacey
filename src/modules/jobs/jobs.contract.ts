export type JobListQuery = {
  cursor?: string;
  keyword?: string;
  location?: string;
  employmentType?: "full_time" | "part_time" | "contract" | "internship";
  workModel?: "onsite" | "hybrid" | "remote";
};

export type JobListItem = {
  id: string;
  title: string;
  companyName: string;
  location: string;
  employmentType: NonNullable<JobListQuery["employmentType"]>;
  workModel: NonNullable<JobListQuery["workModel"]>;
  publishedAt: string;
};
