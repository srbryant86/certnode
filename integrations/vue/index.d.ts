//---------------------------------------------------------------------
// integrations/vue/index.d.ts
// TypeScript definitions for CertNode Vue composables

import { Ref, ComputedRef } from 'vue';
import { Receipt, JWKS, VerifyResult, JWKSManager } from '@certnode/sdk';

export interface VerificationComposableOptions {
  receipt?: Ref<Receipt> | Receipt;
  jwks?: Ref<JWKS> | JWKS;
  autoVerify?: Ref<boolean> | boolean;
}

export interface VerificationComposableResult {
  // Reactive state
  result: ComputedRef<VerifyResult | null>;
  loading: ComputedRef<boolean>;
  error: ComputedRef<Error | null>;
  isValid: ComputedRef<boolean>;
  isInvalid: ComputedRef<boolean>;

  // Input refs (for two-way binding)
  receipt: Ref<Receipt>;
  jwks: Ref<JWKS>;
  autoVerify: Ref<boolean>;

  // Methods
  verify: (receipt?: Receipt, jwks?: JWKS) => Promise<VerifyResult>;
  reset: () => void;
}

export interface JWKSManagerComposableOptions {
  ttlMs?: number;
  fetcher?: (url: string, headers?: Record<string, string>) => Promise<{
    status: number;
    headers: Record<string, string>;
    body: string;
  }>;
}

export interface JWKSManagerComposableResult {
  // Reactive state
  jwks: ComputedRef<JWKS | null>;
  loading: ComputedRef<boolean>;
  error: ComputedRef<Error | null>;
  thumbprints: ComputedRef<string[]>;

  // Methods
  fetchJwks: (url: string) => Promise<JWKS>;
  setJwks: (jwks: JWKS) => JWKS;
  reset: () => void;

  // Manager instance
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

export interface BatchVerificationComposableOptions {
  receipts?: Ref<Receipt[]> | Receipt[];
  jwks?: Ref<JWKS> | JWKS;
  autoVerify?: Ref<boolean> | boolean;
}

export interface BatchVerificationComposableResult {
  // Reactive state
  results: ComputedRef<BatchVerificationResult[]>;
  loading: ComputedRef<boolean>;
  error: ComputedRef<Error | null>;
  summary: ComputedRef<BatchVerificationSummary>;

  // Input refs
  receipts: Ref<Receipt[]>;
  jwks: Ref<JWKS>;
  autoVerify: Ref<boolean>;

  // Methods
  verify: (receipts?: Receipt[], jwks?: JWKS) => Promise<BatchVerificationResult[]>;
  reset: () => void;
}

export interface CertNodeClientComposableOptions {
  jwksUrl?: string;
  retryAttempts?: number;
  retryDelay?: number;
  autoInitialize?: boolean;
}

export interface CertNodeClientComposableResult {
  // JWKS management
  jwks: ComputedRef<JWKS | null>;
  fetchJwks: (url: string) => Promise<JWKS>;
  thumbprints: ComputedRef<string[]>;

  // Verification
  verify: (receipt: Receipt) => Promise<VerifyResult>;
  result: ComputedRef<VerifyResult | null>;
  isValid: ComputedRef<boolean>;
  isInvalid: ComputedRef<boolean>;

  // Combined state
  loading: ComputedRef<boolean>;
  error: ComputedRef<Error | null>;
  retryCount: ComputedRef<number>;
  initialized: ComputedRef<boolean>;

  // Actions
  initialize: () => Promise<void>;
  reset: () => void;
}

export interface ReceiptValidationResult {
  isValid: ComputedRef<boolean>;
  errors: ComputedRef<string[]>;
  algorithm: ComputedRef<string | null>;
}

export function useCertNodeVerification(options?: VerificationComposableOptions): VerificationComposableResult;
export function useJWKSManager(options?: JWKSManagerComposableOptions): JWKSManagerComposableResult;
export function useBatchVerification(options?: BatchVerificationComposableOptions): BatchVerificationComposableResult;
export function useCertNodeClient(options?: CertNodeClientComposableOptions): CertNodeClientComposableResult;
export function useReceiptValidation(receipt: Ref<Receipt>): ReceiptValidationResult;
//---------------------------------------------------------------------