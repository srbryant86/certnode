//---------------------------------------------------------------------
export interface Receipt {
  protected: string;
  signature: string;
  payload: any;
  kid: string;
  payload_jcs_sha256?: string;
  receipt_id?: string;
}
export interface JWK { kty: 'EC'; crv: 'P-256'; x: string; y: string; kid?: string }
export interface JWKS { keys: JWK[] }

export function verifyReceipt(receipt: Receipt, jwks: JWKS): { ok: boolean; reason?: string };
export function verifyReceiptFromFiles(receiptPath: string, jwksPath: string): { ok: boolean; reason?: string };
export function verifyReceiptFromFilesOrUrl(receiptPath: string, jwksSrc: string): Promise<{ ok: boolean; reason?: string }>;
//---------------------------------------------------------------------