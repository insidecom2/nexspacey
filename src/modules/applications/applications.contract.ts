export type ApplicationStatus = "submitted" | "reviewing" | "shortlisted" | "interview" | "offered" | "rejected" | "withdrawn";

export type ApplicationStatusTransition = {
  applicationId: string;
  nextStatus: ApplicationStatus;
};
