import crypto from "crypto";

export interface HashResult {
  algorithm: "sha256";
  digest: string;
  sizeBytes: number;
}

export function hashBuffer(buffer: Buffer): HashResult {
  const hash = crypto.createHash("sha256");
  hash.update(buffer);
  return {
    algorithm: "sha256",
    digest: `sha256:${hash.digest("hex")}`,
    sizeBytes: buffer.length,
  };
}

export function hashBase64(encoded: string): HashResult {
  const buffer = Buffer.from(encoded, "base64");
  return hashBuffer(buffer);
}

export function normalizeContentHash(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.startsWith("sha256:")) {
    return trimmed.toLowerCase();
  }
  if (/^[a-f0-9]{64}$/i.test(trimmed)) {
    return `sha256:${trimmed.toLowerCase()}`;
  }
  return null;
}
