/**
 * CertNode SDK - TypeScript definitions for Web/Browser
 */

export interface VerifyResult {
  /** Whether verification succeeded */
  ok: boolean;
  /** Reason for failure (only present when ok is false) */
  reason?: string;
}

export interface Receipt {
  /** Base64url-encoded protected header */
  protected: string;
  /** Base64url-encoded signature */
  signature: string;
  /** The payload object */
  payload: any;
  /** Key ID for signature verification */
  kid: string;
  /** Optional: Base64url-encoded SHA256 of JCS payload */
  payload_jcs_sha256?: string;
  /** Optional: Base64url-encoded SHA256 of full receipt */
  receipt_id?: string;
}

export interface JWK {
  /** Key type - must be 'EC' for P-256 */
  kty: 'EC';
  /** Curve - must be 'P-256' */
  crv: 'P-256';
  /** Base64url-encoded x coordinate */
  x: string;
  /** Base64url-encoded y coordinate */
  y: string;
  /** Optional key ID */
  kid?: string;
}

export interface JWKS {
  /** Array of JSON Web Keys */
  keys: JWK[];
}

export interface VerifyOptions {
  /** The receipt to verify */
  receipt: Receipt | string;
  /** The JWKS containing public keys */
  jwks: JWKS;
}

/**
 * Verify a CertNode receipt using a JWKS object (Web/Browser version)
 * @param options - Verification options containing receipt and JWKS
 * @returns Promise resolving to verification result
 */
export function verifyReceipt(options: VerifyOptions): Promise<VerifyResult>;

declare const _default: {
  verifyReceipt: typeof verifyReceipt;
  JWKSManager: typeof JWKSManager;
};

export default _default;

// Global namespace for browser usage
declare global {
  interface Window {
    CertNode?: {
      verifyReceipt: typeof verifyReceipt;
      JWKSManager: typeof JWKSManager;
    };
  }
}

export class JWKSManager {
  constructor(options?: { ttlMs?: number });
  getFresh(): JWKS | null;
  setFromObject(jwks: JWKS): JWKS;
  fetchFromUrl(url: string): Promise<JWKS>;
  thumbprints(jwks?: JWKS): Promise<string[]>;
}
