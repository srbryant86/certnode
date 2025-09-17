//---------------------------------------------------------------------
// sdk/node/index.d.ts
// TypeScript definitions for CertNode Node SDK

export interface Receipt {
  protected: string;
  signature: string;
  payload: any;
  kid: string;
  payload_jcs_sha256?: string;
  receipt_id?: string;
}

export interface ECJWK {
  kty: 'EC';
  crv: 'P-256';
  x: string;
  y: string;
  kid?: string;
  alg?: 'ES256';
}

export interface OKPJwk {
  kty: 'OKP';
  crv: 'Ed25519';
  x: string;
  kid?: string;
  alg?: 'EdDSA';
}

export type JWK = ECJWK | OKPJwk;

export interface JWKS { 
  keys: JWK[] 
}

export interface VerifyResult {
  ok: boolean;
  reason?: string;
}

export interface VerifyOptions {
  receipt: Receipt;
  jwks: JWKS;
}

export function verifyReceipt(options: VerifyOptions): Promise<VerifyResult>;

export class JWKSManager {
  constructor(options?: { ttlMs?: number, fetcher?: (url: string, headers?: Record<string, string>) => Promise<{ status: number, headers: Record<string, string>, body: string }> });
  getFresh(): JWKS | null;
  setFromObject(jwks: JWKS): JWKS;
  fetchFromUrl(url: string): Promise<JWKS>;
  thumbprints(jwks?: JWKS): string[];
}
//---------------------------------------------------------------------
