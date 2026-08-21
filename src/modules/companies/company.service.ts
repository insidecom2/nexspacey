import { prisma } from "@/lib/db/prisma";

export class CompanyNotFoundError extends Error {
  constructor() {
    super("Company not found");
    this.name = "CompanyNotFoundError";
  }
}

const companySelect = {
  id: true,
  name: true,
  location: true,
  industry: true,
  about: true,
  updatedAt: true,
} as const;

export async function getEmployerCompany(companyId: string) {
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: companySelect });
  if (!company) throw new CompanyNotFoundError();
  return company;
}

export async function updateEmployerCompany(input: { companyId: string; name: string; location: string | null; industry: string | null; about: string | null }) {
  return prisma.$transaction(async (tx) => {
    const company = await tx.company.findUnique({ where: { id: input.companyId }, select: { id: true } });
    if (!company) throw new CompanyNotFoundError();
    const { companyId, ...data } = input;
    const updated = await tx.company.update({ where: { id: companyId }, data, select: companySelect });
    await tx.job.updateMany({ where: { companyId }, data: { companyName: updated.name } });
    return updated;
  });
}
