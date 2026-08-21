import { prisma } from "@/lib/db/prisma";

export class CandidateProfileNotFoundError extends Error {
  constructor() {
    super("Candidate profile not found");
    this.name = "CandidateProfileNotFoundError";
  }
}

const profileSelect = { displayName: true } as const;

export async function getCandidateProfile(candidateId: string) {
  const profile = await prisma.candidateProfile.findUnique({ where: { userId: candidateId }, select: profileSelect });
  if (!profile) throw new CandidateProfileNotFoundError();
  return profile;
}

export async function updateCandidateProfile(input: { candidateId: string; displayName: string }) {
  const profile = await prisma.candidateProfile.update({
    where: { userId: input.candidateId },
    data: { displayName: input.displayName },
    select: profileSelect,
  }).catch((error: unknown) => {
    if (isPrismaRecordNotFoundError(error)) throw new CandidateProfileNotFoundError();
    throw error;
  });
  return profile;
}

function isPrismaRecordNotFoundError(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "P2025";
}
