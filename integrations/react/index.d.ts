//---------------------------------------------------------------------
// integrations/react/index.d.ts
// TypeScript definitions for CertNode React hooks

import { Receipt, JWKS, VerifyResult, JWKSManager } from '@certnode/sdk';

export interface VerificationHookOptions {
  receipt?: Receipt;
  jwks?: JWKS;
  autoVerify?: boolean;
}

export interface VerificationHookResult {
  verify: (receipt?: Receipt, jwks?: JWKS) => Promise<VerifyResult>;
  result: VerifyResult | null;
  loading: boolean;
  error: Error | null;
  reset: () => void;
  isValid: boolean;
  isInvalid: boolean;
}

export interface JWKSManagerHookOptions {
  ttlMs?: number;
  fetcher?: (url: string, headers?: Record<string, string>) => Promise<{
    status: number;
    headers: Record<string, string>;
    body: string;
  }>;
}

export interface JWKSManagerHookResult {
  jwks: JWKS | null;
  fetchJwks: (url: string) => Promise<JWKS>;
  setJwks: (jwks: JWKS) => JWKS;
  loading: boolean;
  error: Error | null;
  reset: () => void;
  thumbprints: string[];
  manager: JWKSManager;
}

export interface BatchVerificationResult {
  index: number;
  receipt: Receipt;
  result: VerifyResult;
  receiptId: string;
  valid: boolean;
  reason?: string;
}

export interface BatchVerificationSummary {
  total: number;
  valid: number;
  invalid: number;
  validPercentage: number;
  allValid: boolean;
  allInvalid: boolean;
}

export interface BatchVerificationHookOptions {
  receipts?: Receipt[];
  jwks?: JWKS;
  autoVerify?: boolean;
}

export interface BatchVerificationHookResult {
  verify: (receipts?: Receipt[], jwks?: JWKS) => Promise<BatchVerificationResult[]>;
  results: BatchVerificationResult[];
  loading: boolean;
  error: Error | null;
  reset: () => void;
  summary: BatchVerificationSummary;
}

export interface CertNodeClientHookOptions {
  jwksUrl?: string;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface CertNodeClientHookResult {
  // JWKS management
  jwks: JWKS | null;
  fetchJwks: (url: string) => Promise<JWKS>;
  thumbprints: string[];

  // Verification
  verify: (receipt: Receipt) => Promise<VerifyResult>;
  result: VerifyResult | null;
  isValid: boolean;
  isInvalid: boolean;

  // State
  loading: boolean;
  error: Error | null;
  retryCount: number;

  // Actions
  initialize: () => Promise<void>;
  reset: () => void;
}

export function useCertNodeVerification(options?: VerificationHookOptions): VerificationHookResult;
export function useJWKSManager(options?: JWKSManagerHookOptions): JWKSManagerHookResult;
export function useBatchVerification(options?: BatchVerificationHookOptions): BatchVerificationHookResult;
export function useCertNodeClient(options?: CertNodeClientHookOptions): CertNodeClientHookResult;
//---------------------------------------------------------------------