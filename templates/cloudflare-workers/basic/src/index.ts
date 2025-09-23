/**
 * CertNode Cloudflare Workers Template
 * Edge computing receipt verification with global distribution
 */

import { verifyReceipt } from '@certnode/sdk';

// Types for Cloudflare Workers environment
interface Env {
  CERTNODE_JWKS_URL: string;
  ALLOWED_ORIGINS?: string;
  RATE_LIMIT_PER_MINUTE?: string;
  CERTNODE_KV?: KVNamespace;
}

interface VerifyRequest {
  receipt: {
    protected: string;
    payload: any;
    signature: string;
    kid: string;
    receipt_id?: string;
  };
  jwks?: {
    keys: any[];
  };
}

interface VerifyResponse {
  valid: boolean;
  reason?: string;
  receiptId?: string;
  algorithm?: string;
  timestamp: string;
  edge?: {
    datacenter: string;
    country: string;
  };
}

// JWKS Cache using KV storage
class CloudflareJWKSManager {
  private kvNamespace?: KVNamespace;
  private jwksUrl: string;
  private cacheTTL: number;

  constructor(kvNamespace: KVNamespace | undefined, jwksUrl: string, cacheTTL = 300) {
    this.kvNamespace = kvNamespace;
    this.jwksUrl = jwksUrl;
    this.cacheTTL = cacheTTL; // 5 minutes default
  }

  async getJWKS(): Promise<any> {
    const cacheKey = `jwks:${this.jwksUrl}`;

    // Try to get from KV cache first
    if (this.kvNamespace) {
      try {
        const cached = await this.kvNamespace.get(cacheKey, 'json');
        if (cached) {
          return cached;
        }
      } catch (error) {
        console.warn('KV cache read failed:', error);
      }
    }

    // Fetch fresh JWKS
    try {
      const response = await fetch(this.jwksUrl, {
        headers: {
          'User-Agent': 'CertNode-CloudflareWorker/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`JWKS fetch failed: ${response.status} ${response.statusText}`);
      }

      const jwks = await response.json();

      // Cache in KV if available
      if (this.kvNamespace) {
        try {
          await this.kvNamespace.put(cacheKey, JSON.stringify(jwks), {
            expirationTtl: this.cacheTTL
          });
        } catch (error) {
          console.warn('KV cache write failed:', error);
        }
      }

      return jwks;
    } catch (error) {
      throw new Error(`Failed to fetch JWKS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Rate limiting using KV storage
class CloudflareRateLimiter {
  private kvNamespace?: KVNamespace;
  private limitPerMinute: number;

  constructor(kvNamespace: KVNamespace | undefined, limitPerMinute = 60) {
    this.kvNamespace = kvNamespace;
    this.limitPerMinute = limitPerMinute;
  }

  async isAllowed(identifier: string): Promise<{ allowed: boolean; remaining: number }> {
    if (!this.kvNamespace) {
      return { allowed: true, remaining: this.limitPerMinute };
    }

    const now = Date.now();
    const windowStart = Math.floor(now / 60000) * 60000; // Start of current minute
    const key = `rate_limit:${identifier}:${windowStart}`;

    try {
      const current = await this.kvNamespace.get(key);
      const count = current ? parseInt(current) : 0;

      if (count >= this.limitPerMinute) {
        return { allowed: false, remaining: 0 };
      }

      // Increment counter
      await this.kvNamespace.put(key, (count + 1).toString(), {
        expirationTtl: 120 // Expire after 2 minutes to be safe
      });

      return { allowed: true, remaining: this.limitPerMinute - count - 1 };
    } catch (error) {
      console.warn('Rate limiting failed:', error);
      return { allowed: true, remaining: this.limitPerMinute };
    }
  }
}

// CORS helper
function corsResponse(response: Response, request: Request, env: Env): Response {
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || ['*'];
  const origin = request.headers.get('Origin');

  let allowOrigin = '*';
  if (origin && allowedOrigins.includes(origin)) {
    allowOrigin = origin;
  }

  response.headers.set('Access-Control-Allow-Origin', allowOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

// Main request handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const jwksManager = new CloudflareJWKSManager(env.CERTNODE_KV, env.CERTNODE_JWKS_URL);
    const rateLimiter = new CloudflareRateLimiter(
      env.CERTNODE_KV,
      parseInt(env.RATE_LIMIT_PER_MINUTE || '60')
    );

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      const response = new Response(null, { status: 204 });
      return corsResponse(response, request, env);
    }

    // Rate limiting
    const clientId = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimit = await rateLimiter.isAllowed(clientId);

    if (!rateLimit.allowed) {
      const response = new Response(JSON.stringify({
        error: 'rate_limited',
        message: 'Too many requests. Please try again later.',
        retryAfter: 60
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
          'X-RateLimit-Limit': env.RATE_LIMIT_PER_MINUTE || '60',
          'X-RateLimit-Remaining': '0'
        }
      });
      return corsResponse(response, request, env);
    }

    try {
      // Route handling
      switch (url.pathname) {
        case '/':
          return handleHome(request, env);

        case '/health':
          return handleHealth(request, env);

        case '/verify':
          return handleVerify(request, env, jwksManager);

        case '/jwks':
          return handleJWKS(request, env, jwksManager);

        default:
          const response = new Response(JSON.stringify({
            error: 'not_found',
            message: 'Endpoint not found'
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
          return corsResponse(response, request, env);
      }
    } catch (error) {
      console.error('Worker error:', error);

      const response = new Response(JSON.stringify({
        error: 'internal_error',
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
      return corsResponse(response, request, env);
    }
  }
};

// Route handlers
async function handleHome(request: Request, env: Env): Promise<Response> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>CertNode Cloudflare Worker</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .method { font-weight: bold; color: #0066cc; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔐 CertNode Cloudflare Worker</h1>
        <p>Edge computing receipt verification with global distribution</p>
      </div>

      <h2>Available Endpoints</h2>

      <div class="endpoint">
        <div class="method">GET /health</div>
        <p>Health check endpoint with edge location information</p>
      </div>

      <div class="endpoint">
        <div class="method">POST /verify</div>
        <p>Verify CertNode receipts at the edge</p>
        <pre>{
  "receipt": { ... },
  "jwks": { ... } // optional
}</pre>
      </div>

      <div class="endpoint">
        <div class="method">GET /jwks</div>
        <p>Cached JWKS proxy endpoint</p>
      </div>

      <p><strong>Edge Location:</strong> ${request.cf?.colo || 'Unknown'}</p>
      <p><strong>Country:</strong> ${request.cf?.country || 'Unknown'}</p>
    </body>
    </html>
  `;

  const response = new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
  return corsResponse(response, request, env);
}

async function handleHealth(request: Request, env: Env): Promise<Response> {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    edge: {
      datacenter: request.cf?.colo || 'unknown',
      country: request.cf?.country || 'unknown',
      region: request.cf?.region || 'unknown'
    },
    version: '1.0.0'
  };

  const response = new Response(JSON.stringify(health, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
  return corsResponse(response, request, env);
}

async function handleVerify(
  request: Request,
  env: Env,
  jwksManager: CloudflareJWKSManager
): Promise<Response> {
  if (request.method !== 'POST') {
    const response = new Response(JSON.stringify({
      error: 'method_not_allowed',
      message: 'Only POST method is allowed'
    }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
    return corsResponse(response, request, env);
  }

  try {
    const body: VerifyRequest = await request.json();
    const { receipt, jwks: providedJwks } = body;

    if (!receipt) {
      const response = new Response(JSON.stringify({
        error: 'missing_receipt',
        message: 'Receipt is required for verification'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
      return corsResponse(response, request, env);
    }

    // Use provided JWKS or fetch cached version
    const jwks = providedJwks || await jwksManager.getJWKS();

    // Verify receipt
    const result = await verifyReceipt({ receipt, jwks });

    // Extract algorithm
    let algorithm: string | undefined;
    try {
      const protectedHeader = JSON.parse(
        atob(receipt.protected.replace(/-/g, '+').replace(/_/g, '/'))
      );
      algorithm = protectedHeader.alg;
    } catch {
      // Algorithm extraction failed
    }

    const verifyResponse: VerifyResponse = {
      valid: result.ok,
      reason: result.reason || undefined,
      receiptId: receipt.receipt_id || receipt.kid,
      algorithm,
      timestamp: new Date().toISOString(),
      edge: {
        datacenter: request.cf?.colo || 'unknown',
        country: request.cf?.country || 'unknown'
      }
    };

    const response = new Response(JSON.stringify(verifyResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    return corsResponse(response, request, env);

  } catch (error) {
    const response = new Response(JSON.stringify({
      error: 'verification_error',
      message: 'Failed to verify receipt',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
    return corsResponse(response, request, env);
  }
}

async function handleJWKS(
  request: Request,
  env: Env,
  jwksManager: CloudflareJWKSManager
): Promise<Response> {
  try {
    const jwks = await jwksManager.getJWKS();

    const response = new Response(JSON.stringify(jwks), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // 5 minutes
      }
    });
    return corsResponse(response, request, env);
  } catch (error) {
    const response = new Response(JSON.stringify({
      error: 'jwks_fetch_error',
      message: 'Failed to fetch JWKS',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
    return corsResponse(response, request, env);
  }
}