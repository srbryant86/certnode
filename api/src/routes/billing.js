/**
 * Billing Routes - Stripe integration for CertNode monetization
 *
 * Routes:
 * - POST /api/create-checkout - Create Stripe checkout session
 * - POST /api/create-portal - Create customer portal session
 * - POST /api/stripe-webhook - Handle Stripe webhook events
 * - GET /api/pricing - Get pricing tiers
 * - GET /api/account - Get account info (requires API key)
 */

const { readJsonLimited, toPosInt } = require('../plugins/validation');
const billing = require('../plugins/stripe-billing');

/**
 * Handle billing routes
 */
async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Expose-Headers': 'X-RateLimit-Limit, X-RateLimit-Remaining, X-Usage-Limit, X-Usage-Used, X-Usage-Remaining, X-Request-Id, Retry-After',
    'Access-Control-Max-Age': '86400'
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    return res.end();
  }

  try {
    // GET /api/pricing - Public pricing information
    if (req.method === 'GET' && pathname === '/api/pricing') {
      const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
      const body = {
        tiers: Object.entries(billing.PRICING_TIERS).map(([key, tier]) => ({
          id: key,
          name: tier.name,
          monthly_limit: tier.monthly_limit,
          price: tier.price,
          price_display: tier.price ? `$${(tier.price / 100).toFixed(2)}` : 'Free'
        })),
        currency: 'USD'
      };

      res.writeHead(200, headers);
      return res.end(JSON.stringify(body, null, 2));
    }

    // POST /api/create-checkout - Create Stripe checkout session (or return Payment Link if configured)
    if (req.method === 'POST' && pathname === '/api/create-checkout') {
      const raw = await readJsonLimited(req, { limitBytes: 1024 });
      const { email, tier } = raw || {};

      if (!tier) {
        const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
        res.writeHead(400, headers);
        return res.end(JSON.stringify({ error: 'client_error', message: 'tier is required' }));
      }

      const tierConfig = billing.PRICING_TIERS[tier];

      // Fallback to Payment Link URLs if price id not configured
      const linkEnvMap = {
        'starter': process.env.STARTER_PAYMENT_LINK_URL,
        'pro': process.env.PRO_PAYMENT_LINK_URL,
        'business': process.env.BUSINESS_PAYMENT_LINK_URL
      };
      const paymentLink = linkEnvMap[tier];
      if (!tierConfig) {
        const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
        res.writeHead(400, headers);
        return res.end(JSON.stringify({ error: 'client_error', message: 'invalid tier' }));
      }
      // If a Payment Link is configured for this tier (and no price id), allow missing email
      if (!tierConfig.stripe_price_id && paymentLink) {
        const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
        res.writeHead(200, headers);
        return res.end(JSON.stringify({ checkout_url: paymentLink, session_id: null, customer_id: null }));
      }
      if (!tierConfig.stripe_price_id && !paymentLink) {
        const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
        res.writeHead(400, headers);
        return res.end(JSON.stringify({ error: 'client_error', message: 'tier not configured (missing Stripe price id or Payment Link URL)' }));
      }

      // At this point we will use Stripe checkout and require email
      if (!email) {
        const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
        res.writeHead(400, headers);
        return res.end(JSON.stringify({ error: 'client_error', message: 'email is required' }));
      }

      const baseUrl = req.headers.host.includes('localhost')
        ? 'http://localhost:3000'
        : `https://${req.headers.host}`;

      const successUrl = `${baseUrl}/account?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}/pricing`;

      const checkout = await billing.createCheckoutSession(
        email,
        tierConfig.stripe_price_id,
        successUrl,
        cancelUrl
      );

      const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
      res.writeHead(200, headers);
      return res.end(JSON.stringify(checkout));
    }

    // POST /api/create-portal - Create customer portal session
    if (req.method === 'POST' && pathname === '/api/create-portal') {
      const apiKey = req.headers.authorization?.replace('Bearer ', '');
      const customer = billing.getCustomerByApiKey(apiKey);

      if (!customer) {
        const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
        res.writeHead(401, headers);
        return res.end(JSON.stringify({
          error: 'unauthorized',
          message: 'Valid API key required'
        }));
      }

      const baseUrl = req.headers.host.includes('localhost')
        ? 'http://localhost:3000'
        : `https://${req.headers.host}`;

      const returnUrl = `${baseUrl}/account`;

      const portalUrl = await billing.createPortalSession(customer.id, returnUrl);

      const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
      res.writeHead(200, headers);
      return res.end(JSON.stringify({ portal_url: portalUrl }));
    }

    // GET /api/account - Get account information
    if (req.method === 'GET' && pathname === '/api/account') {
      const apiKey = req.headers.authorization?.replace('Bearer ', '');
      const customer = billing.getCustomerByApiKey(apiKey);

      if (!customer) {
        const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
        res.writeHead(401, headers);
        return res.end(JSON.stringify({
          error: 'unauthorized',
          message: 'Valid API key required'
        }));
      }

      const tier = billing.getCustomerTier(customer);

      const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
      const body = {
        customer: {
          id: customer.id,
          email: customer.email,
          api_key: customer.api_key,
          tier: tier.name,
          monthly_limit: tier.monthly_limit,
          subscription_status: customer.subscription_status,
          created_at: customer.created_at,
          updated_at: customer.updated_at
        }
      };

      res.writeHead(200, headers);
      return res.end(JSON.stringify(body, null, 2));
    }

    // POST /stripe-webhook or /api/stripe/webhook - Stripe webhook handler (raw body required)
    if (req.method === 'POST' && (pathname === '/stripe-webhook' || pathname === '/api/stripe/webhook')) {
      // Collect raw body bytes for Stripe signature verification
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        try {
          // Attach raw body buffer so plugin can verify signature
          req.body = Buffer.concat(chunks);
          return billing.handleStripeWebhook(req, res);
        } catch (e) {
          const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
          res.writeHead(400, headers);
          return res.end(JSON.stringify({ error: 'client_error', message: 'invalid webhook payload' }));
        }
      });
      return; // do not fall through
    }

    // 404 Not Found
    const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
    res.writeHead(404, headers);
    return res.end(JSON.stringify({
      error: 'not_found',
      message: 'Billing endpoint not found'
    }));

  } catch (e) {
    console.error('Billing error:', e);

    const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
    res.writeHead(500, headers);
    return res.end(JSON.stringify({
      error: 'server_error',
      message: 'Internal billing error'
    }));
  }
}

module.exports = { handle };
