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

const { readJsonLimited, toPosInt } = require('../utils');
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

    // POST /api/create-checkout - Create Stripe checkout session
    if (req.method === 'POST' && pathname === '/api/create-checkout') {
      const raw = await readJsonLimited(req, { limitBytes: 1024 });
      const { email, tier } = raw;

      if (!email || !tier) {
        const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
        res.writeHead(400, headers);
        return res.end(JSON.stringify({
          error: 'client_error',
          message: 'email and tier are required'
        }));
      }

      const tierConfig = billing.PRICING_TIERS[tier];
      if (!tierConfig || !tierConfig.stripe_price_id) {
        const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
        res.writeHead(400, headers);
        return res.end(JSON.stringify({
          error: 'client_error',
          message: 'invalid tier'
        }));
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

    // POST /stripe-webhook - Stripe webhook handler
    if (req.method === 'POST' && pathname === '/stripe-webhook') {
      return billing.handleStripeWebhook(req, res);
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