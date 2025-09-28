import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface ContentCertificationRequest {
  content: string | Buffer;
  contentType: string;
  metadata?: Record<string, unknown>;
  provenance?: Record<string, unknown>;
}

export interface AIDetectionResult {
  confidence: number;
  methods: {
    linguistic: number;
    statistical: number;
    perplexity: number;
    fingerprint: number;
  };
  detectedModels: string[];
  indicators: string[];
  reasoning: string;
  confidenceInterval: [number, number];
  processingTime: number;
}

export interface ContentReceipt {
  id: string;
  contentHash: string;
  contentType: string;
  status: 'PENDING' | 'VERIFIED' | 'FAILED';
  createdAt: string;
  aiDetection: AIDetectionResult;
  cryptographicProof: {
    signature: string;
    merkleRoot: string;
    algorithm: string;
    issuedAt: string;
  };
}

export interface CertificationResponse {
  success: boolean;
  receipt: ContentReceipt;
}

export interface VerificationResponse {
  valid: boolean;
  receipt: ContentReceipt;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export class CertNodeError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly rateLimitInfo?: RateLimitInfo;

  constructor(message: string, statusCode: number, code: string, rateLimitInfo?: RateLimitInfo) {
    super(message);
    this.name = 'CertNodeError';
    this.statusCode = statusCode;
    this.code = code;
    this.rateLimitInfo = rateLimitInfo;
  }
}

export interface CertNodeClientOptions {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  retries?: number;
}

export class CertNodeClient {
  private client: AxiosInstance;
  private retries: number;

  constructor(options: CertNodeClientOptions) {
    this.retries = options.retries || 3;

    this.client = axios.create({
      baseURL: options.baseURL || 'https://certnode.io/api/v1',
      timeout: options.timeout || 30000,
      headers: {
        'X-API-Key': options.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': `@certnode/sdk/2.0.0 (Node.js ${process.version})`
      }
    });

    // Response interceptor for rate limiting and error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const rateLimitInfo = this.extractRateLimitInfo(error.response);
          throw new CertNodeError(
            error.response.data?.error || 'API request failed',
            error.response.status,
            error.response.data?.code || 'UNKNOWN_ERROR',
            rateLimitInfo
          );
        }
        throw new CertNodeError(error.message, 0, 'NETWORK_ERROR');
      }
    );
  }

  /**
   * Certify content and receive AI detection analysis
   */
  async certifyContent(request: ContentCertificationRequest): Promise<CertificationResponse> {
    const contentBase64 = Buffer.isBuffer(request.content)
      ? request.content.toString('base64')
      : Buffer.from(request.content).toString('base64');

    const payload = {
      contentBase64,
      contentType: request.contentType,
      metadata: request.metadata,
      provenance: request.provenance
    };

    const response = await this.makeRequest<CertificationResponse>(
      'POST',
      '/receipts/content',
      payload
    );

    return response.data;
  }

  /**
   * Verify a content receipt
   */
  async verifyContent(receiptId: string): Promise<VerificationResponse> {
    const response = await this.makeRequest<VerificationResponse>(
      'GET',
      `/verify/content/${receiptId}`
    );

    return response.data;
  }

  /**
   * Batch certify multiple content items
   */
  async certifyBatch(requests: ContentCertificationRequest[]): Promise<CertificationResponse[]> {
    if (requests.length > 100) {
      throw new CertNodeError('Batch size cannot exceed 100 items', 400, 'BATCH_SIZE_EXCEEDED');
    }

    const payload = requests.map(request => ({
      contentBase64: Buffer.isBuffer(request.content)
        ? request.content.toString('base64')
        : Buffer.from(request.content).toString('base64'),
      contentType: request.contentType,
      metadata: request.metadata,
      provenance: request.provenance
    }));

    const response = await this.makeRequest<{ results: CertificationResponse[] }>(
      'POST',
      '/receipts/content/batch',
      { items: payload }
    );

    return response.data.results;
  }

  /**
   * Get API usage statistics
   */
  async getUsageStats(): Promise<{
    currentPeriod: {
      requests: number;
      limit: number;
      resetDate: string;
    };
    tier: string;
  }> {
    const response = await this.makeRequest<any>('GET', '/usage');
    return response.data;
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST',
    endpoint: string,
    data?: any,
    attempt: number = 1
  ): Promise<AxiosResponse<T>> {
    try {
      return await this.client.request<T>({
        method,
        url: endpoint,
        data
      });
    } catch (error) {
      if (error instanceof CertNodeError && error.statusCode === 429 && attempt <= this.retries) {
        // Rate limited - wait and retry
        const waitTime = error.rateLimitInfo?.retryAfter
          ? error.rateLimitInfo.retryAfter * 1000
          : Math.pow(2, attempt) * 1000; // Exponential backoff

        await this.sleep(waitTime);
        return this.makeRequest<T>(method, endpoint, data, attempt + 1);
      }
      throw error;
    }
  }

  private extractRateLimitInfo(response: AxiosResponse): RateLimitInfo | undefined {
    const limit = response.headers['x-ratelimit-limit'];
    const remaining = response.headers['x-ratelimit-remaining'];
    const reset = response.headers['x-ratelimit-reset'];
    const retryAfter = response.headers['retry-after'];

    if (limit && remaining && reset) {
      return {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        reset: parseInt(reset),
        retryAfter: retryAfter ? parseInt(retryAfter) : undefined
      };
    }

    return undefined;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Convenience function for quick usage
export function createClient(apiKey: string, options?: Omit<CertNodeClientOptions, 'apiKey'>): CertNodeClient {
  return new CertNodeClient({ apiKey, ...options });
}

// Export types for consumers
export type {
  ContentCertificationRequest,
  AIDetectionResult,
  ContentReceipt,
  CertificationResponse,
  VerificationResponse,
  CertNodeClientOptions
};