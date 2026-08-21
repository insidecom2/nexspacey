import net from "node:net";

export class ResumeMalwareDetectedError extends Error {
  constructor() {
    super("Resume malware detected");
    this.name = "ResumeMalwareDetectedError";
  }
}

export class ResumeScannerConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeScannerConfigurationError";
  }
}

export class ResumeScannerUnavailableError extends Error {
  constructor() {
    super("Resume malware scanner is unavailable");
    this.name = "ResumeScannerUnavailableError";
  }
}

export async function scanResumeContent(content: Uint8Array) {
  const configuredMode = process.env.RESUME_MALWARE_SCANNER?.trim().toLowerCase();
  const mode = configuredMode ?? (process.env.NODE_ENV === "production" ? "clamav" : "disabled");
  if (mode === "disabled" && process.env.NODE_ENV !== "production") return;
  if (mode !== "clamav") throw new ResumeScannerConfigurationError("RESUME_MALWARE_SCANNER must be clamav in production");
  await scanWithClamav(content);
}

function scanWithClamav(content: Uint8Array) {
  const host = process.env.CLAMAV_HOST?.trim();
  const port = Number(process.env.CLAMAV_PORT ?? 3310);
  const timeoutMs = Number(process.env.CLAMAV_TIMEOUT_MS ?? 10000);
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !Number.isInteger(timeoutMs) || timeoutMs < 1000) {
    throw new ResumeScannerConfigurationError("ClamAV configuration is incomplete");
  }

  return new Promise<void>((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    let response = "";
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (error) reject(error); else resolve();
    };

    socket.setTimeout(timeoutMs, () => finish(new ResumeScannerUnavailableError()));
    socket.on("error", () => finish(new ResumeScannerUnavailableError()));
    socket.on("data", (chunk) => { response += chunk.toString("utf8"); });
    socket.on("end", () => {
      if (response.includes("FOUND")) return finish(new ResumeMalwareDetectedError());
      if (response.includes("OK")) return finish();
      finish(new ResumeScannerUnavailableError());
    });
    socket.on("connect", () => {
      socket.write("zINSTREAM\0");
      for (let offset = 0; offset < content.byteLength; offset += 64 * 1024) {
        const chunk = content.slice(offset, offset + 64 * 1024);
        const length = Buffer.alloc(4);
        length.writeUInt32BE(chunk.byteLength, 0);
        socket.write(length);
        socket.write(chunk);
      }
      socket.write(Buffer.alloc(4));
    });
  });
}
