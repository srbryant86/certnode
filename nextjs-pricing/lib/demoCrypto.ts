/**
 * Demo cryptographic value generator
 * Produces deterministic, realistic-looking hashes and signatures for demo purposes
 */

export interface CryptoFields {
  hash: string;
  signature: string;
  timestamp: string;
  jwksKeyId: string;
  parentHash: string | null;
}

/**
 * Generate a deterministic SHA-256-like hash from an ID
 */
export function generateHash(id: string, seed: string = ''): string {
  const combined = `${id}${seed}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to hex and pad to 64 characters (SHA-256 length)
  const base = Math.abs(hash).toString(16);
  const padded = base.padStart(64, '0').slice(0, 64);
  return `sha256:${padded}`;
}

/**
 * Generate a deterministic JWS ES256 signature
 */
export function generateSignature(id: string, seed: string = ''): string {
  const combined = `${id}${seed}signature`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  // Generate base64-like string
  const base = Math.abs(hash).toString(36);
  const signature = base.padStart(86, 'A').slice(0, 86);
  return `ES256:${signature}`;
}

/**
 * Generate an ISO 8601 timestamp
 */
export function generateTimestamp(offsetMinutes: number = 0): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + offsetMinutes);
  return now.toISOString();
}

/**
 * Get the current JWKS key ID
 */
export function getKeyId(): string {
  return 'certnode-2024-01';
}

/**
 * Generate complete crypto fields for a receipt
 */
export function generateCryptoFields(
  receiptId: string,
  parentIds?: string[],
  timestampOffset: number = 0
): CryptoFields {
  const hash = generateHash(receiptId);
  const signature = generateSignature(receiptId);
  const timestamp = generateTimestamp(timestampOffset);
  const jwksKeyId = getKeyId();

  // If there are parent IDs, generate parent hash from first parent
  const parentHash = parentIds && parentIds.length > 0
    ? generateHash(parentIds[0], 'parent')
    : null;

  return {
    hash,
    signature,
    timestamp,
    jwksKeyId,
    parentHash
  };
}
