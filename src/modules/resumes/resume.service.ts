import { createHash, randomUUID } from "node:crypto";
import { ResumeStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { deleteResumeObject, getResumeObject, getResumeStorageProvider, putResumeObject, ResumeStorageReadError } from "@/modules/storage/resume-storage";
import { scanResumeContent } from "@/modules/security/resume-scanner";

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
export const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export class ResumeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeValidationError";
  }
}

export async function createResume(input: {
  candidateId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  content: Uint8Array;
}) {
  validateResumeMetadata(input);
  await scanResumeContent(input.content);
  const version = (await prisma.resume.aggregate({ where: { candidateId: input.candidateId }, _max: { version: true } }))._max.version ?? 0;
  const storageProvider = getResumeStorageProvider();
  const storageKey = `private/resumes/${input.candidateId}/${randomUUID()}`;
  const checksumSha256 = createHash("sha256").update(input.content).digest("hex");
  let objectUploaded = false;

  if (storageProvider === "r2") {
    await putResumeObject({ key: storageKey, content: input.content, mimeType: input.mimeType });
    objectUploaded = true;
  }

  try {
    return await prisma.resume.create({
      data: {
        candidateId: input.candidateId,
        originalName: input.originalName.slice(0, 255),
        storageKey,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        content: storageProvider === "postgres" ? Buffer.from(input.content) : null,
        storageProvider,
        checksumSha256,
        version: version + 1,
        status: ResumeStatus.READY,
      },
      select: resumeSummarySelect,
    });
  } catch (error) {
    if (objectUploaded) await deleteResumeObject(storageKey).catch(() => undefined);
    throw error;
  }
}

export async function loadResumeContent(input: { storageProvider: string; storageKey: string; content: Uint8Array | null; checksumSha256?: string | null }) {
  let loadedContent: Uint8Array;
  if (input.storageProvider === "postgres") {
    if (!input.content) throw new Error("Resume content is missing");
    loadedContent = new Uint8Array(input.content);
  } else if (input.storageProvider === "r2") {
    loadedContent = await getResumeObject(input.storageKey);
  } else {
    throw new Error("Unsupported Resume storage provider");
  }
  if (input.checksumSha256 && createHash("sha256").update(loadedContent).digest("hex") !== input.checksumSha256.trim()) throw new ResumeStorageReadError();
  return loadedContent;
}

export function validateResumeMetadata(input: { originalName: string; mimeType: string; sizeBytes: number; content: Uint8Array }) {
  if (!input.originalName.trim()) throw new ResumeValidationError("กรุณาระบุชื่อไฟล์");
  if (!ALLOWED_RESUME_TYPES.includes(input.mimeType as (typeof ALLOWED_RESUME_TYPES)[number])) throw new ResumeValidationError("รองรับเฉพาะไฟล์ PDF, DOC และ DOCX");
  if (input.sizeBytes <= 0 || input.sizeBytes > MAX_RESUME_BYTES) throw new ResumeValidationError("ขนาดไฟล์ต้องไม่เกิน 5 MB");
  if (!hasExpectedSignature(input.mimeType, input.content)) throw new ResumeValidationError("รูปแบบไฟล์ไม่ตรงกับชนิดไฟล์ที่ส่งมา");
}

function hasExpectedSignature(mimeType: string, content: Uint8Array) {
  if (mimeType === "application/pdf") return new TextDecoder().decode(content.slice(0, 5)) === "%PDF-";
  if (mimeType === "application/msword") return startsWithBytes(content, [0xd0, 0xcf, 0x11, 0xe0]);
  return startsWithBytes(content, [0x50, 0x4b, 0x03, 0x04]);
}

function startsWithBytes(content: Uint8Array, signature: number[]) {
  return signature.every((value, index) => content[index] === value);
}

const resumeSummarySelect = {
  id: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  version: true,
  status: true,
  createdAt: true,
} as const;

export async function listCandidateResumes(candidateId: string) {
  return prisma.resume.findMany({ where: { candidateId }, orderBy: { createdAt: "desc" }, select: resumeSummarySelect });
}
