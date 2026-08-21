import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export type ResumeStorageProvider = "postgres" | "r2";

export class ResumeStorageConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeStorageConfigurationError";
  }
}

export class ResumeStorageReadError extends Error {
  constructor() {
    super("Resume storage could not be read");
    this.name = "ResumeStorageReadError";
  }
}

let r2Client: S3Client | undefined;

export function getResumeStorageProvider(): ResumeStorageProvider {
  const configured = process.env.RESUME_STORAGE_PROVIDER?.trim().toLowerCase();
  if (configured === "r2") return "r2";
  if (configured && configured !== "postgres") throw new ResumeStorageConfigurationError("RESUME_STORAGE_PROVIDER must be postgres or r2");
  if (process.env.NODE_ENV === "production") throw new ResumeStorageConfigurationError("Production Resume storage must use R2");
  return "postgres";
}

export async function putResumeObject(input: { key: string; content: Uint8Array; mimeType: string }) {
  const config = getR2Config();
  await getR2Client(config).send(new PutObjectCommand({ Bucket: config.bucket, Key: input.key, Body: input.content, ContentType: input.mimeType }));
}

export async function deleteResumeObject(key: string) {
  const config = getR2Config();
  await getR2Client(config).send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
}

export async function getResumeObject(key: string) {
  const config = getR2Config();
  const result = await getR2Client(config).send(new GetObjectCommand({ Bucket: config.bucket, Key: key }));
  if (!result.Body) throw new ResumeStorageReadError();
  try {
    return new Uint8Array(await result.Body.transformToByteArray());
  } catch {
    throw new ResumeStorageReadError();
  }
}

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) throw new ResumeStorageConfigurationError("R2 storage configuration is incomplete");
  return { accountId, bucket, accessKeyId, secretAccessKey, endpoint: process.env.R2_ENDPOINT?.trim() || `https://${accountId}.r2.cloudflarestorage.com` };
}

function getR2Client(config: ReturnType<typeof getR2Config>) {
  r2Client ??= new S3Client({ region: "auto", endpoint: config.endpoint, credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey } });
  return r2Client;
}
