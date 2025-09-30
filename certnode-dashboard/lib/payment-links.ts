/**
 * Stripe Payment Links Configuration
 *
 * All payment link URLs for CertNode pricing tiers.
 * Update these URLs when creating new payment links in Stripe.
 */

export const PAYMENT_LINKS = {
  // SMB Tiers - Monthly
  'starter-monthly': 'https://buy.stripe.com/eVqbJ0cEa2DS2w69eJbAs03',
  'professional-monthly': 'https://buy.stripe.com/dRmbJ0gUq6U8gmW62xbAs04',
  'scale-monthly': 'https://buy.stripe.com/7sYbJ0dIe0vK3Aa2QlbAs05',

  // SMB Tiers - Annual
  'starter-annual': 'https://buy.stripe.com/28E8wOeMices0nYduZbAs06',
  'professional-annual': 'https://buy.stripe.com/7sY28qdIe4M02w61MhbAs07',
  'scale-annual': 'https://buy.stripe.com/bJe4gyaw2fqE0nY76BbAs08',

  // Dispute Shield - Annual Only
  'dispute-shield-pro-annual': 'https://buy.stripe.com/28E7sK9rYces1s2fD7bAs09',
  'dispute-shield-elite-annual': 'https://buy.stripe.com/aFa7sK8nU1zO9YycqVbAs0b',
} as const;

/**
 * Get payment link URL for a specific tier and billing period
 */
export function getPaymentLink(tierId: string, billing: 'monthly' | 'annual' = 'monthly'): string | null {
  // Map tier IDs to payment link keys
  const tierMap: Record<string, string> = {
    'core-starter': 'starter',
    'core-professional': 'professional',
    'core-scale': 'scale',
    'starter': 'starter',
    'professional': 'professional',
    'scale': 'scale',
    'dispute-shield-pro': 'dispute-shield-pro',
    'dispute-shield-elite': 'dispute-shield-elite',
  };

  const mappedTier = tierMap[tierId];
  if (!mappedTier) {
    console.error(`Invalid tier ID: ${tierId}`);
    return null;
  }

  const linkKey = `${mappedTier}-${billing}` as keyof typeof PAYMENT_LINKS;
  const link = PAYMENT_LINKS[linkKey];

  if (!link) {
    console.error(`No payment link found for: ${linkKey}`);
    return null;
  }

  return link;
}

/**
 * Type-safe payment link keys
 */
export type PaymentLinkKey = keyof typeof PAYMENT_LINKS;
