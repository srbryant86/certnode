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

export interface JWK { 
  kty: 'EC'; 
  crv: 'P-256'; 
  x: string; 
  y: string; 
  kid?: string;
}

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
//---------------------------------------------------------------------