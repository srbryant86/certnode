/**
 * Usage Limits Plugin - Free tier enforcement for CertNode monetization
 *
 * Features:
 * - Monthly usage tracking per IP address OR API key
 * - Free tier: 1000 receipts/month
 * - Paid tiers: Higher limits based on Stripe subscription
 * - Graceful degradation with upgrade messaging
 * - Memory-based storage (production would use Redis/database)
 */

const { emit } = require('./metrics');
const billing = require('./stripe-billing');
const crypto = require('crypto');

// In-memory usage tracking (production should use Redis/database)
const usageStore = new Map();
const FREE_TIER_LIMIT = process.env.FREE_TIER_MONTHLY_LIMIT || 1000;

/**
 * Get current month key for usage tracking
 */
function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get usage key for IP address and month
 */
function getUsageKey(ipAddress) {
  const monthKey = getCurrentMonthKey();
  return `${ipAddress}:${monthKey}`;
}

/**
 * Get current usage count for IP address this month
 */
function getCurrentUsage(ipAddress) {
  const key = getUsageKey(ipAddress);
  return usageStore.get(key) || 0;
}

/**
 * Increment usage count for IP address
 */
function incrementUsage(ipAddress) {
  const key = getUsageKey(ipAddress);
  const currentUsage = getCurrentUsage(ipAddress);
  const newUsage = currentUsage + 1;

  usageStore.set(key, newUsage);

  // Emit usage metrics
  emit('usage_incremented', 1, {
    ip: ipAddress,
    usage: newUsage,
    limit: FREE_TIER_LIMIT,
    month: getCurrentMonthKey()
  });

  return newUsage;
}

/**
 * Check if IP address has exceeded free tier limits
 */
function isOverLimit(ipAddress) {
  const usage = getCurrentUsage(ipAddress);
  return usage >= FREE_TIER_LIMIT;
}

/**
 * Get usage status for IP address
 */
function getUsageStatus(ipAddress) {
  const usage = getCurrentUsage(ipAddress);
  const remaining = Math.max(0, FREE_TIER_LIMIT - usage);
  const percentUsed = Math.round((usage / FREE_TIER_LIMIT) * 100);

  return {
    used: usage,
    limit: FREE_TIER_LIMIT,
    remaining,
    percentUsed,
    overLimit: usage >= FREE_TIER_LIMIT
  };
}

/**
 * Middleware to enforce usage limits on sign endpoint
 * Now supports both API key authentication and IP-based free tier
 */
function enforceUsageLimits(req, res) {
  const ipAddress = req.headers['x-forwarded-for'] ||
                   req.headers['x-real-ip'] ||
                   req.connection?.remoteAddress ||
                   '127.0.0.1';

  // Check for API key authentication
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  let customer = null;
  let usageKey = ipAddress;

  // Optional: HMAC API key validation (format: keyId.signatureB64u)
  // - When present and properly formatted, require validation
  // - If invalid, return 401 immediately
  // - On success, use derived identity as usage key
  if (apiKey && apiKey.includes('.')) {
    const valid = validateApiKey(apiKey);
    if (!valid) {
      const { sendError } = require('../middleware/errorHandler');
      return sendError(res, req, 401, 'unauthorized', 'Invalid API key');
    }
    // use HMAC keyId as identity (namespaced)
    const keyId = apiKey.split('.')[0];
    usageKey = `hmac:${keyId}`;
  }

  if (apiKey) {
    customer = billing.getCustomerByApiKey(apiKey);
    if (customer) {
      usageKey = customer.id; // Use customer ID for usage tracking
    }
  }

  // Get current usage for this user/IP
  const currentUsage = getCurrentUsage(usageKey);
  const usageData = { [getCurrentMonthKey()]: currentUsage };

  // Check limits based on customer tier or free tier
  let canRequest;
  if (customer) {
    canRequest = billing.canMakeRequest(customer, usageData);
  } else {
    // Free tier (IP-based)
    canRequest = {
      allowed: currentUsage < FREE_TIER_LIMIT,
      tier: billing.PRICING_TIERS.free,
      usage: currentUsage,
      limit: FREE_TIER_LIMIT,
      remaining: Math.max(0, FREE_TIER_LIMIT - currentUsage)
    };
  }

  // If limit exceeded, return 429 with upgrade messaging
  if (!canRequest.allowed) {
    // Track usage limit hit for conversion analytics
    require('./customer-analytics').trackUsageLimitHit(req, canRequest.usage, canRequest.limit);

    // Emit limit exceeded event
    emit('usage_limit_exceeded', 1, {
      ip: ipAddress,
      customer_id: customer?.id,
      usage: canRequest.usage,
      limit: canRequest.limit,
      tier: canRequest.tier?.name
    });

    // Return 429 with upgrade message
    const headers = {
      "Content-Type": "application/json",
      "X-Usage-Limit": String(canRequest.limit || FREE_TIER_LIMIT),
      "X-Usage-Used": String(canRequest.usage || 0),
      "X-Usage-Remaining": String(canRequest.remaining || 0),
      "Retry-After": String(getSecondsUntilNextMonth())
    };

    if (req && req.id) headers['X-Request-Id'] = req.id;

    res.writeHead(429, headers);

    const upgradeMessage = customer ?
      "Your current plan limit has been exceeded. Please upgrade to a higher tier." :
      "Free tier limit exceeded. Sign up for a paid plan to continue.";

    const body = {
      error: "usage_limit_exceeded",
      message: `${canRequest.tier?.name || 'Free'} tier limit of ${canRequest.limit || FREE_TIER_LIMIT} receipts per month exceeded`,
      current_usage: canRequest.usage,
      limit: canRequest.limit,
      tier: canRequest.tier?.name || 'Free',
      upgrade: {
        message: upgradeMessage,
        pricing_url: `https://${req.headers.host}/pricing`,
        contact_url: `https://${req.headers.host}/#contact-sales`
      },
      retry_after_seconds: getSecondsUntilNextMonth(),
      timestamp: new Date().toISOString()
    };

    if (req && req.id) body.request_id = req.id;

    return res.end(JSON.stringify(body, null, 2));
  }

  // Increment usage for successful requests
  incrementUsage(usageKey);

  // Add usage headers to response
  res.setHeader("X-Usage-Limit", String(canRequest.limit || FREE_TIER_LIMIT));
  res.setHeader("X-Usage-Used", String(canRequest.usage + 1 || 1));
  res.setHeader("X-Usage-Remaining", String((canRequest.remaining - 1) || 0));
  if (canRequest.tier) {
    res.setHeader("X-Usage-Tier", canRequest.tier.name);
  }

  // Emit warning when approaching limit (80% of current tier limit)
  const percentUsed = Math.round((canRequest.usage / canRequest.limit) * 100);
  if (percentUsed >= 80) {
    emit('usage_limit_warning', 1, {
      ip: ipAddress,
      customer_id: customer?.id,
      usage: canRequest.usage,
      limit: canRequest.limit,
      percentUsed: percentUsed,
      tier: canRequest.tier?.name
    });
  }

  return {
    allowed: true,
    status: canRequest,
    customer: customer,
    tier: canRequest.tier?.name
  };
}

/**
 * Get seconds until next month for Retry-After header
 */
function getSecondsUntilNextMonth() {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return Math.ceil((nextMonth - now) / 1000);
}

/**
 * Clean up old usage data (call periodically)
 */
function cleanupOldUsage() {
  const currentMonth = getCurrentMonthKey();

  for (const key of usageStore.keys()) {
    if (!key.endsWith(`:${currentMonth}`)) {
      usageStore.delete(key);
    }
  }

  emit('usage_cleanup', 1, {
    currentMonth,
    remainingKeys: usageStore.size
  });
}

module.exports = {
  enforceUsageLimits,
  getCurrentUsage,
  getUsageStatus,
  incrementUsage,
  isOverLimit,
  cleanupOldUsage,
  FREE_TIER_LIMIT
};

// --- helpers ---
function validateApiKey(token) {
  try {
    const secret = process.env.API_KEY_SECRET;
    if (!secret) return false;
    const parts = String(token).split('.');
    if (parts.length !== 2) return false;
    const [keyId, sigB64] = parts;
    const expected = crypto.createHmac('sha256', secret).update(keyId).digest('base64url');
    const a = Buffer.from(sigB64 || '', 'base64url');
    const b = Buffer.from(expected, 'base64url');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
