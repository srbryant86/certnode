//---------------------------------------------------------------------
// sdk/node/enhanced.d.ts
// Enhanced TypeScript definitions for CertNode Node SDK v2.0
//---------------------------------------------------------------------

// ============================================================================
// Core Types and Interfaces
// ============================================================================

/** Base receipt structure with cryptographic signature */
export interface Receipt {
  /** Base64URL-encoded JWS protected header */
  protected: string;
  /** Base64URL-encoded JWS signature */
  signature: string;
  /** The actual payload data (can be any JSON object) */
  payload: any;
  /** Key ID that signed this receipt */
  kid: string;
  /** SHA256 hash of the JCS-canonicalized payload (optional) */
  payload_jcs_sha256?: string;
  /** Unique receipt identifier (optional) */
  receipt_id?: string;
  /** Timestamp when the receipt was generated (ISO 8601) */
  timestamp?: string;
  /** Additional metadata (optional) */
  metadata?: Record<string, any>;
}

/** EC P-256 JSON Web Key */
export interface ECJWK {
  kty: 'EC';
  crv: 'P-256';
  x: string;
  y: string;
  kid?: string;
  alg?: 'ES256';
  use?: 'sig';
  key_ops?: string[];
}

/** Ed25519 JSON Web Key */
export interface OKPJwk {
  kty: 'OKP';
  crv: 'Ed25519';
  x: string;
  kid?: string;
  alg?: 'EdDSA';
  use?: 'sig';
  key_ops?: string[];
}

/** Union type for supported JWK formats */
export type JWK = ECJWK | OKPJwk;

/** JSON Web Key Set containing multiple keys */
export interface JWKS {
  keys: JWK[];
  /** Optional metadata about the key set */
  metadata?: {
    issuer?: string;
    updated?: string;
    version?: string;
  };
}

// ============================================================================
// Error Handling
// ============================================================================

/** Base error class for CertNode SDK operations */
export class CertNodeError extends Error {
  /** Error code for programmatic handling */
  readonly code: string;
  /** Additional error context */
  readonly context?: Record<string, any>;
  /** Original error if this wraps another error */
  readonly cause?: Error;

  constructor(message: string, code: string, context?: Record<string, any>, cause?: Error);
}

/** Verification-specific errors */
export class VerificationError extends CertNodeError {
  /** Specific verification failure reason */
  readonly verificationCode: VerificationFailureCode;
}

/** Network/HTTP related errors */
export class NetworkError extends CertNodeError {
  /** HTTP status code if applicable */
  readonly statusCode?: number;
  /** Response headers if available */
  readonly headers?: Record<string, string>;
}

/** Configuration or validation errors */
export class ConfigurationError extends CertNodeError {}

/** Enum for specific verification failure codes */
export enum VerificationFailureCode {
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  KEY_NOT_FOUND = 'KEY_NOT_FOUND',
  MALFORMED_RECEIPT = 'MALFORMED_RECEIPT',
  MALFORMED_JWKS = 'MALFORMED_JWKS',
  UNSUPPORTED_ALGORITHM = 'UNSUPPORTED_ALGORITHM',
  PAYLOAD_MISMATCH = 'PAYLOAD_MISMATCH',
  EXPIRED_KEY = 'EXPIRED_KEY',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// ============================================================================
// Enhanced Results and Options
// ============================================================================

/** Enhanced verification result with detailed information */
export interface VerifyResult {
  /** Whether verification succeeded */
  ok: boolean;
  /** Human-readable reason for failure */
  reason?: string;
  /** Machine-readable error code */
  code?: VerificationFailureCode;
  /** Performance metrics */
  performance?: {
    /** Total verification time in milliseconds */
    totalTimeMs: number;
    /** Time breakdown for different operations */
    breakdown: {
      keyLookupMs: number;
      signatureVerificationMs: number;
      payloadValidationMs: number;
    };
  };
  /** Information about the key used for verification */
  keyInfo?: {
    kid: string;
    algorithm: string;
    thumbprint: string;
  };
  /** Additional verification metadata */
  metadata?: Record<string, any>;
}

/** Options for receipt verification */
export interface VerifyOptions {
  /** The receipt to verify */
  receipt: Receipt;
  /** JWKS containing verification keys */
  jwks: JWKS;
  /** Enable performance tracking (default: false) */
  enablePerformanceTracking?: boolean;
  /** Maximum allowed age for receipt (in seconds) */
  maxAge?: number;
  /** Additional validation options */
  validation?: {
    /** Verify payload hash if present (default: true) */
    verifyPayloadHash?: boolean;
    /** Strict mode for additional validations (default: false) */
    strictMode?: boolean;
    /** Custom payload validators */
    customValidators?: Array<(payload: any) => boolean>;
  };
}

// ============================================================================
// Enhanced Classes and Functions
// ============================================================================

/** Enhanced JWKS manager with caching and retry logic */
export class JWKSManager {
  /** Create a new JWKS manager */
  constructor(options?: JWKSManagerOptions);

  /** Get cached JWKS if available and valid */
  getFresh(): JWKS | null;

  /** Set JWKS from object with validation */
  setFromObject(jwks: JWKS): JWKS;

  /** Fetch JWKS from URL with retry logic */
  fetchFromUrl(url: string, options?: FetchOptions): Promise<JWKS>;

  /** Get thumbprints of all keys in JWKS */
  thumbprints(jwks?: JWKS): string[];

  /** Validate JWKS structure */
  validate(jwks: JWKS): ValidationResult;

  /** Get statistics about cache hits/misses */
  getStats(): CacheStats;

  /** Clear the cache */
  clearCache(): void;
}

/** Enhanced JWKS manager with circuit breaker protection */
export class EnhancedJWKSManager extends JWKSManager {
  /** Create a new enhanced JWKS manager */
  constructor(options?: EnhancedJWKSManagerOptions);

  /** Fetch JWKS from URL with circuit breaker and retry protection */
  fetchFromUrl(url: string, options?: EnhancedFetchOptions): Promise<JWKS>;

  /** Get enhanced statistics including circuit breaker metrics */
  getStats(): EnhancedCacheStats;
}

/** Configuration options for JWKS manager */
export interface JWKSManagerOptions {
  /** TTL for cached JWKS in milliseconds (default: 300000 = 5 minutes) */
  ttlMs?: number;
  /** Custom fetch function */
  fetcher?: (url: string, headers?: Record<string, string>) => Promise<FetchResponse>;
  /** Enable automatic retry on failure (default: true) */
  enableRetry?: boolean;
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay between retries in milliseconds (default: 1000) */
  retryDelayMs?: number;
  /** Enable cache statistics (default: false) */
  enableStats?: boolean;
}

/** Fetch response interface */
export interface FetchResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

/** Options for URL fetching */
export interface FetchOptions {
  /** Request timeout in milliseconds (default: 5000) */
  timeoutMs?: number;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Disable retry for this request (default: false) */
  disableRetry?: boolean;
}

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** Cache statistics */
export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  lastFetchTime?: Date;
  cacheSize: number;
}

// ============================================================================
// Performance and Benchmarking
// ============================================================================

/** Performance benchmarking utility */
export class PerformanceBenchmark {
  /** Start a new benchmark session */
  static start(name: string): BenchmarkSession;

  /** Run a verification benchmark */
  static benchmarkVerification(options: VerifyOptions, iterations?: number): Promise<BenchmarkResult>;

  /** Run a JWKS fetch benchmark */
  static benchmarkJWKSFetch(url: string, iterations?: number): Promise<BenchmarkResult>;
}

/** Benchmark session for custom measurements */
export interface BenchmarkSession {
  /** Mark a checkpoint */
  checkpoint(name: string): void;

  /** Finish the benchmark and get results */
  finish(): BenchmarkResult;
}

/** Benchmark results */
export interface BenchmarkResult {
  /** Operation name */
  name: string;
  /** Number of iterations */
  iterations: number;
  /** Total time in milliseconds */
  totalTimeMs: number;
  /** Average time per operation in milliseconds */
  averageTimeMs: number;
  /** Minimum time observed */
  minTimeMs: number;
  /** Maximum time observed */
  maxTimeMs: number;
  /** Standard deviation */
  stdDevMs: number;
  /** Operations per second */
  opsPerSecond: number;
  /** Checkpoints if available */
  checkpoints?: Array<{ name: string; timeMs: number }>;
}

// ============================================================================
// Main SDK Functions
// ============================================================================

/** Enhanced receipt verification with detailed results */
export function verifyReceipt(options: VerifyOptions): Promise<VerifyResult>;

/** Batch verify multiple receipts efficiently */
export function verifyReceiptBatch(receipts: Receipt[], jwks: JWKS, options?: Partial<VerifyOptions>): Promise<VerifyResult[]>;

/** Utility function to validate receipt structure */
export function validateReceiptStructure(receipt: any): ValidationResult;

/** Utility function to validate JWKS structure */
export function validateJWKSStructure(jwks: any): ValidationResult;

/** Parse and validate a JWS token */
export function parseJWS(token: string): { header: any; payload: any; signature: string } | null;

/** Calculate JCS canonical hash of an object */
export function calculateJCSHash(obj: any): string;

// ============================================================================
// Circuit Breaker Types
// ============================================================================

/** Circuit breaker states */
export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

/** Circuit breaker configuration options */
export interface CircuitBreakerOptions {
  /** Number of failures before opening circuit (default: 5) */
  failureThreshold?: number;
  /** Time to wait before attempting recovery in milliseconds (default: 60000) */
  recoveryTimeoutMs?: number;
  /** Period for resetting failure count in milliseconds (default: 60000) */
  monitoringPeriodMs?: number;
  /** Successes needed in half-open state to close circuit (default: 3) */
  successThreshold?: number;
  /** Function to determine if result is a failure */
  isFailure?: (result: any) => boolean;
}

/** Circuit breaker statistics */
export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  totalCalls: number;
  totalFailures: number;
  totalSuccesses: number;
  circuitOpenCount: number;
  lastReset: Date;
  averageResponseTimeMs: number;
  healthPercentage: number;
  isHealthy: boolean;
}

/** Circuit breaker class */
export class CircuitBreaker {
  constructor(options?: CircuitBreakerOptions);
  execute<T>(fn: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T>;
  getState(): CircuitState;
  getStats(): CircuitBreakerStats;
  reset(): void;
  forceOpen(): void;
  destroy(): void;
}

/** Circuit breaker factory */
export class CircuitBreakerFactory {
  getBreaker(name: string, config?: CircuitBreakerOptions): CircuitBreaker;
  getAllStats(): Record<string, CircuitBreakerStats>;
  resetAll(): void;
  destroy(): void;
}

/** Enhanced JWKS manager options with circuit breaker support */
export interface EnhancedJWKSManagerOptions extends JWKSManagerOptions {
  /** Enable circuit breaker protection (default: true) */
  enableCircuitBreaker?: boolean;
  /** Request timeout in milliseconds (default: 5000) */
  timeoutMs?: number;
}

/** Enhanced fetch options */
export interface EnhancedFetchOptions extends FetchOptions {
  /** Disable retry for this specific request */
  disableRetry?: boolean;
}

/** Enhanced cache statistics with circuit breaker metrics */
export interface EnhancedCacheStats extends CacheStats {
  /** Fetch failure rate */
  failureRate: number;
  /** Total fetch attempts */
  fetchAttempts: number;
  /** Total fetch failures */
  fetchFailures: number;
  /** Average fetch time in milliseconds */
  averageFetchTimeMs: number;
  /** Whether cache is currently active */
  isCached: boolean;
  /** Age of cached data in milliseconds */
  cacheAge: number | null;
}

/** Create a circuit breaker protected version of a function */
export function withCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string,
  config?: CircuitBreakerOptions
): T;

/** Get circuit breaker stats for a named service */
export function getCircuitBreakerStats(name: string): CircuitBreakerStats | null;

/** Get all circuit breaker stats */
export function getAllCircuitBreakerStats(): Record<string, CircuitBreakerStats>;

//---------------------------------------------------------------------