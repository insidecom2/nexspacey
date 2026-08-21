import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const RESUME_SIGNED_URL_TTL_SECONDS = 60;

export class ResumeTokenConfigurationError extends Error {
  constructor() {
    super("Resume signing secret is not configured");
    this.name = "ResumeTokenConfigurationError";
  }
}

export class InvalidResumeTokenError extends Error {
  constructor() {
    super("Invalid or expired Resume token");
    this.name = "InvalidResumeTokenError";
  }
}

type ResumeTokenPayload = {
  applicationId: string;
  exp: number;
};

export function createResumeDownloadToken(applicationId: string, now = Date.now()) {
  const payload: ResumeTokenPayload = {
    applicationId,
    exp: now + RESUME_SIGNED_URL_TTL_SECONDS * 1000,
  };
  const encodedPayload = encode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyResumeDownloadToken(token: string, now = Date.now()) {
  const [encodedPayload, encodedSignature, ...extraParts] = token.split(".");
  if (!encodedPayload || !encodedSignature || extraParts.length > 0) throw new InvalidResumeTokenError();

  const expectedSignature = sign(encodedPayload);
  const receivedSignature = Buffer.from(encodedSignature, "base64url");
  const expectedSignatureBytes = Buffer.from(expectedSignature, "base64url");
  if (receivedSignature.length !== expectedSignatureBytes.length || !timingSafeEqual(receivedSignature, expectedSignatureBytes)) {
    throw new InvalidResumeTokenError();
  }

  let payload: ResumeTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as ResumeTokenPayload;
  } catch {
    throw new InvalidResumeTokenError();
  }

  if (typeof payload.applicationId !== "string" || !payload.applicationId || !Number.isSafeInteger(payload.exp) || payload.exp <= now) {
    throw new InvalidResumeTokenError();
  }
  return payload;
}

function sign(value: string) {
  return createHmac("sha256", getSigningSecret()).update(value).digest("base64url");
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function getSigningSecret() {
  const configuredSecret = process.env.RESUME_SIGNING_SECRET?.trim() || process.env.AUTH_SECRET?.trim();
  if (configuredSecret) return configuredSecret;
  if (process.env.NODE_ENV === "production") throw new ResumeTokenConfigurationError();

  // Keep local MVP development usable without making a production fallback possible.
  return createHash("sha256").update(process.env.DATABASE_URL ?? "nexspacey-local-resume-signing").digest("hex");
}
