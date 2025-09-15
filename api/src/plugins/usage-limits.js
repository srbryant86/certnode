/**
 * Usage Limits Plugin - Free tier enforcement for CertNode monetization
 *
 * Features:
 * - Monthly usage tracking per IP address
 * - Free tier: 1000 receipts/month
 * - Graceful degradation with upgrade messaging
 * - Memory-based storage (production would use Redis/database)
 */

const { emit } = require('./metrics');

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
 */
function enforceUsageLimits(req, res) {
  const ipAddress = req.headers['x-forwarded-for'] ||
                   req.headers['x-real-ip'] ||
                   req.connection?.remoteAddress ||
                   '127.0.0.1';

  // Check if over limit before processing
  if (isOverLimit(ipAddress)) {
    const status = getUsageStatus(ipAddress);

    // Emit limit exceeded event
    emit('usage_limit_exceeded', 1, {
      ip: ipAddress,
      usage: status.used,
      limit: FREE_TIER_LIMIT
    });

    // Return 429 with upgrade message
    const headers = {
      "Content-Type": "application/json",
      "X-Usage-Limit": String(FREE_TIER_LIMIT),
      "X-Usage-Used": String(status.used),
      "X-Usage-Remaining": "0",
      "Retry-After": String(getSecondsUntilNextMonth())
    };

    if (req && req.id) headers['X-Request-Id'] = req.id;

    res.writeHead(429, headers);

    const body = {
      error: "usage_limit_exceeded",
      message: `Free tier limit of ${FREE_TIER_LIMIT} receipts per month exceeded`,
      usage: status,
      upgrade: {
        message: "Upgrade to Pro for unlimited receipts and enterprise features",
        contact: "https://certnode.io/#contact-sales",
        pricing: "Starting at $297/month"
      },
      retry_after_seconds: getSecondsUntilNextMonth()
    };

    if (req && req.id) body.request_id = req.id;

    return res.end(JSON.stringify(body, null, 2));
  }

  // Increment usage for successful requests
  const newUsage = incrementUsage(ipAddress);
  const status = getUsageStatus(ipAddress);

  // Add usage headers to response
  res.setHeader("X-Usage-Limit", String(FREE_TIER_LIMIT));
  res.setHeader("X-Usage-Used", String(status.used));
  res.setHeader("X-Usage-Remaining", String(status.remaining));

  // Emit warning when approaching limit
  if (status.percentUsed >= 80) {
    emit('usage_limit_warning', 1, {
      ip: ipAddress,
      usage: status.used,
      limit: FREE_TIER_LIMIT,
      percentUsed: status.percentUsed
    });
  }

  return { allowed: true, status };
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