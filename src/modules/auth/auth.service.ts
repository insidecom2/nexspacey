import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { CompanyMemberRole, UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

const scrypt = promisify(nodeScrypt);
const SESSION_COOKIE = "nexspacey_session";
const SESSION_DAYS = 30;

export class AuthRequiredError extends Error {
  constructor() {
    super("Authentication is required");
    this.name = "AuthRequiredError";
  }
}

export class RoleRequiredError extends Error {
  constructor() {
    super("This account does not have permission for this resource");
    this.name = "RoleRequiredError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid credentials");
    this.name = "InvalidCredentialsError";
  }
}

export class EmailAlreadyUsedError extends Error {
  constructor() {
    super("Email is already registered");
    this.name = "EmailAlreadyUsedError";
  }
}

export type AuthenticatedCandidate = {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
};

export type AuthenticatedEmployer = {
  id: string;
  email: string;
  role: typeof UserRole.EMPLOYER;
  companyId: string;
  companyName: string;
  membershipRole: CompanyMemberRole;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
};

export type AuthenticatedAdmin = {
  id: string;
  email: string;
  role: typeof UserRole.ADMIN;
};

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, encodedHash: string) {
  const [algorithm, salt, encodedKey] = encodedHash.split(":");
  if (algorithm !== "scrypt" || !salt || !encodedKey) return false;

  const expected = Buffer.from(encodedKey, "hex");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function setSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { userId, tokenHash: hashSessionToken(token), expiresAt } });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function registerCandidate(input: { email: string; password: string; displayName: string }) {
  const email = input.email.trim().toLowerCase();
  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          passwordHash: await hashPassword(input.password),
          role: UserRole.CANDIDATE,
          candidateProfile: { create: { displayName: input.displayName.trim() } },
        },
        include: { candidateProfile: true },
      });
      return created;
    });
    await setSession(user.id);
    return { id: user.id, email: user.email, displayName: user.candidateProfile?.displayName ?? input.displayName };
  } catch (error) {
    if (isPrismaUniqueError(error)) throw new EmailAlreadyUsedError();
    throw error;
  }
}

export async function registerEmployer(input: { email: string; password: string; companyName: string }) {
  const email = input.email.trim().toLowerCase();
  try {
    const user = await prisma.$transaction(async (tx) => {
      return tx.user.create({
        data: {
          email,
          passwordHash: await hashPassword(input.password),
          role: UserRole.EMPLOYER,
          companyMemberships: {
            create: {
              role: CompanyMemberRole.OWNER,
              company: { create: { name: input.companyName.trim() } },
            },
          },
        },
        include: { companyMemberships: { include: { company: true } } },
      });
    });
    await setSession(user.id);
    const membership = user.companyMemberships[0];
    if (!membership) throw new Error("Employer company membership was not created");
    return { id: user.id, email: user.email, role: user.role, companyId: membership.companyId, companyName: membership.company.name };
  } catch (error) {
    if (isPrismaUniqueError(error)) throw new EmailAlreadyUsedError();
    throw error;
  }
}

export async function loginCandidate(input: { email: string; password: string }) {
  const user = await loginUser(input);
  if (user.role !== UserRole.CANDIDATE) {
    throw new InvalidCredentialsError();
  }
  const candidate = await prisma.user.findUnique({ where: { id: user.id }, include: { candidateProfile: true } });
  return { id: user.id, email: user.email, displayName: candidate?.candidateProfile?.displayName ?? user.email };
}

export async function loginEmployer(input: { email: string; password: string }) {
  const user = await loginUser(input);
  if (user.role !== UserRole.EMPLOYER) throw new InvalidCredentialsError();
  return getEmployerMembership(user.id);
}

export async function loginUser(input: { email: string; password: string }): Promise<AuthenticatedUser> {
  const user = await prisma.user.findUnique({ where: { email: input.email.trim().toLowerCase() } });
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) throw new InvalidCredentialsError();
  await setSession(user.id);
  return { id: user.id, email: user.email, role: user.role };
}

export async function getCurrentCandidate(): Promise<AuthenticatedCandidate> {
  const user = await getCurrentUser();
  if (user.role !== UserRole.CANDIDATE) throw new AuthRequiredError();
  const candidate = await prisma.user.findUnique({ where: { id: user.id }, include: { candidateProfile: true } });
  if (!candidate?.candidateProfile) throw new AuthRequiredError();

  return {
    id: candidate.id,
    email: candidate.email,
    role: candidate.role,
    displayName: candidate.candidateProfile.displayName,
  };
}

export async function getCurrentEmployer(): Promise<AuthenticatedEmployer> {
  const user = await getCurrentUser();
  if (user.role !== UserRole.EMPLOYER) throw new RoleRequiredError();
  return getEmployerMembership(user.id);
}

export async function getCurrentAdmin(): Promise<AuthenticatedAdmin> {
  const user = await getCurrentUser();
  if (user.role !== UserRole.ADMIN) throw new RoleRequiredError();
  return { id: user.id, email: user.email, role: UserRole.ADMIN };
}

export async function getCurrentUser(): Promise<AuthenticatedUser> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) throw new AuthRequiredError();
  const session = await prisma.session.findFirst({
    where: { tokenHash: hashSessionToken(token), expiresAt: { gt: new Date() } },
    select: { user: { select: { id: true, email: true, role: true } } },
  });
  if (!session) throw new AuthRequiredError();
  return session.user;
}

async function getEmployerMembership(userId: string): Promise<AuthenticatedEmployer> {
  const membership = await prisma.companyMember.findFirst({
    where: { userId, role: { in: [CompanyMemberRole.OWNER, CompanyMemberRole.MEMBER] } },
    select: { companyId: true, role: true, company: { select: { name: true } }, user: { select: { id: true, email: true, role: true } } },
  });
  if (!membership || membership.user.role !== UserRole.EMPLOYER) throw new RoleRequiredError();
  return { id: membership.user.id, email: membership.user.email, role: UserRole.EMPLOYER, companyId: membership.companyId, companyName: membership.company.name, membershipRole: membership.role };
}

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  cookieStore.delete(SESSION_COOKIE);
}

function isPrismaUniqueError(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "P2002";
}
