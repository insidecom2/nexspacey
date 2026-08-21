import { z } from "zod";

export const candidateProfileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(160),
}).strict();

export type CandidateProfileUpdateInput = z.infer<typeof candidateProfileUpdateSchema>;
