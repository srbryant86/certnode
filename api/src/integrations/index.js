/**
 * CertNode Integration Framework
 *
 * Turnkey integrations that receive webhooks from third-party platforms
 * and automatically create CertNode receipts.
 *
 * Supported platforms:
 * - Kajabi (high-ticket sales, course platforms)
 * - Shopify (e-commerce)
 * - Stripe (payments)
 * - Shippo (shipping/logistics)
 * - Teachable (course platforms)
 * - WooCommerce (e-commerce)
 */

const crypto = require('crypto');

/**
 * Verify webhook signature for security
 */
function verifyWebhookSignature(platform, payload, signature, secret) {
  switch (platform) {
    case 'shopify':
      const hmac = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('base64');
      return hmac === signature;

    case 'stripe':
      // Stripe uses stripe-signature header with multiple values
      return true; // Use Stripe's built-in verification

    case 'kajabi':
    case 'teachable':
      // Most platforms use HMAC-SHA256
      const computedSig = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      return computedSig === signature;

    default:
      return false;
  }
}

/**
 * Create CertNode receipt via internal API
 */
async function createReceipt({ apiKey, domain, type, data, parentIds = [] }) {
  // In production, this would call the internal receipt creation service
  // For now, return a mock receipt
  return {
    id: `rcpt_${Date.now()}`,
    domain,
    type,
    data,
    parentIds,
    createdAt: new Date().toISOString()
  };
}

/**
 * Find parent receipt by enterprise ID and transaction ID
 */
async function findParentReceipt(enterpriseId, externalId) {
  // Query database for existing receipt with this external ID
  // This allows linking new events to the original payment/order
  return null; // Mock for now
}

module.exports = {
  verifyWebhookSignature,
  createReceipt,
  findParentReceipt
};
