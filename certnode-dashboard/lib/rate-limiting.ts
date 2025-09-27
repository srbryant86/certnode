import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimitConfig {
  windowMs: number;     // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  keyGenerator?: (request: NextRequest) => string;
}

// Enterprise tier rate limits
export const RATE_LIMITS = {
  FREE: { windowMs: 60000, maxRequests: 10 },      // 10 requests per minute
  STARTER: { windowMs: 60000, maxRequests: 100 },   // 100 requests per minute
  PRO: { windowMs: 60000, maxRequests: 1000 },      // 1000 requests per minute
  ENTERPRISE: { windowMs: 60000, maxRequests: 10000 } // 10000 requests per minute
};

// In-memory store for rate limiting (in production, use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = config.keyGenerator ? config.keyGenerator(request) : getDefaultKey(request);
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Clean up old entries
  cleanupOldEntries(windowStart);

  // Get current count for this key
  const current = requestCounts.get(key);
  const resetTime = Math.ceil((now + config.windowMs) / 1000);

  if (!current || current.resetTime <= now) {
    // First request in window or window expired
    requestCounts.set(key, { count: 1, resetTime: now + config.windowMs });
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime
    };
  }

  if (current.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime,
      retryAfter: Math.ceil((current.resetTime - now) / 1000)
    };
  }

  // Increment count
  current.count += 1;
  requestCounts.set(key, current);

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - current.count,
    resetTime
  };
}

export async function getRateLimitForApiKey(apiKeyId: string): Promise<RateLimitConfig> {
  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: apiKeyId },
      include: {
        enterprise: {
          select: {
            tier: true
          }
        }
      }
    });

    if (!apiKey?.enterprise) {
      return RATE_LIMITS.FREE;
    }

    const tier = apiKey.enterprise.tier as keyof typeof RATE_LIMITS;
    return RATE_LIMITS[tier] || RATE_LIMITS.FREE;

  } catch (error) {
    console.error('Error getting rate limit for API key:', error);
    return RATE_LIMITS.FREE;
  }
}

function getDefaultKey(request: NextRequest): string {
  // Try to get API key from header
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) {
    return `api:${apiKey}`;
  }

  // Fall back to IP address
  const ip = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';
  return `ip:${ip}`;
}

function cleanupOldEntries(windowStart: number): void {
  for (const [key, data] of requestCounts.entries()) {
    if (data.resetTime <= windowStart) {
      requestCounts.delete(key);
    }
  }
}

export async function applyRateLimit(
  request: NextRequest,
  apiKeyId?: string
): Promise<RateLimitResult> {
  let config: RateLimitConfig;

  if (apiKeyId) {
    config = await getRateLimitForApiKey(apiKeyId);
  } else {
    // Use IP-based rate limiting for unauthenticated requests
    config = RATE_LIMITS.FREE;
  }

  return rateLimit(request, config);
}

export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
  };

  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}