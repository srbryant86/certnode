/**
 * Stripe Billing Plugin - Usage-based billing for CertNode
 *
 * Features:
 * - Subscription management
 * - Usage-based billing tiers
 * - Customer portal integration
 * - Webhook handling for payment events
 * - API key management
 */

const crypto = require('crypto');

// Pricing tiers
const PRICING_TIERS = {
  free: {
    name: 'Free',
    monthly_limit: 1000,
    price: 0,
    stripe_price_id: null
  },
  starter: {
    name: 'Starter',
    monthly_limit: 50000,
    price: 4900, // $49.00 in cents
    stripe_price_id: process.env.STRIPE_STARTER_PRICE_ID
  },
  pro: {
    name: 'Professional',
    monthly_limit: 500000,
    price: 19900, // $199.00 in cents
    stripe_price_id: process.env.STRIPE_PRO_PRICE_ID
  },
  business: {
    name: 'Business',
    monthly_limit: 2000000, // 2,000,000 receipts/month included
    price: 49900, // $499.00 in cents
    stripe_price_id: process.env.STRIPE_BUSINESS_PRICE_ID
  },
  enterprise: {
    name: 'Enterprise',
    monthly_limit: null, // Unlimited
    price: null, // Custom pricing
    stripe_price_id: null
  }
};

// In-memory customer store (production would use database)
const customers = new Map();
const apiKeys = new Map();

/**
 * Generate API key for authenticated usage
 */
function generateApiKey(customerId) {
  const key = 'ck_' + crypto.randomBytes(32).toString('hex');
  apiKeys.set(key, {
    customer_id: customerId,
    created_at: new Date().toISOString(),
    last_used: null
  });
  return key;
}

/**
 * Get customer by API key
 */
function getCustomerByApiKey(apiKey) {
  const keyData = apiKeys.get(apiKey);
  if (!keyData) return null;

  // Update last used
  keyData.last_used = new Date().toISOString();

  return customers.get(keyData.customer_id);
}

/**
 * Create or update customer
 */
function upsertCustomer(customerId, data) {
  const existing = customers.get(customerId) || {};
  const updated = {
    ...existing,
    ...data,
    id: customerId,
    updated_at: new Date().toISOString()
  };

  customers.set(customerId, updated);
  return updated;
}

/**
 * Get customer's current tier
 */
function getCustomerTier(customer) {
  if (!customer || !customer.subscription_status || customer.subscription_status !== 'active') {
    return PRICING_TIERS.free;
  }

  // Check subscription tier
  for (const [key, tier] of Object.entries(PRICING_TIERS)) {
    if (tier.stripe_price_id === customer.stripe_price_id) {
      return tier;
    }
  }

  return PRICING_TIERS.free;
}

/**
 * Check if customer can make request (usage limits)
 */
function canMakeRequest(customer, usage) {
  const tier = getCustomerTier(customer);

  // Enterprise has no limits
  if (tier.monthly_limit === null) return { allowed: true, tier };

  // Check monthly usage
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthlyUsage = usage[currentMonth] || 0;

  return {
    allowed: monthlyUsage < tier.monthly_limit,
    tier,
    usage: monthlyUsage,
    limit: tier.monthly_limit,
    remaining: Math.max(0, tier.monthly_limit - monthlyUsage)
  };
}

/**
 * Create Stripe customer and checkout session
 */
async function createCheckoutSession(email, priceId, successUrl, cancelUrl) {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  // If email provided, try to attach to existing customer for better continuity.
  // Otherwise let Checkout collect email and create the customer implicitly.
  let session;
  if (email) {
    try {
      let customer;
      const found = await stripe.customers.list({ email, limit: 1 });
      if (found.data.length > 0) {
        customer = found.data[0];
      } else {
        customer = await stripe.customers.create({ email });
      }
      session = await stripe.checkout.sessions.create({
        customer: customer.id,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { customer_email: email }
      });
      return { checkout_url: session.url, session_id: session.id, customer_id: customer.id };
    } catch (e) {
      // Fall through to anonymous session
      console.warn('Checkout with email failed, falling back to anonymous session:', e.message);
    }
  }

  // Anonymous session - Stripe will collect email and create a Customer
  session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl
  });
  return { checkout_url: session.url, session_id: session.id };
}

/**
 * Create customer portal session
 */
async function createPortalSession(customerId, returnUrl) {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

/**
 * Handle Stripe webhook events
 */
function handleStripeWebhook(req, res) {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    res.writeHead(400);
    return res.end('Webhook Error: ' + err.message);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      handleCheckoutCompleted(event.data.object);
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      handleSubscriptionChanged(event.data.object);
      break;

    case 'customer.subscription.deleted':
      handleSubscriptionCancelled(event.data.object);
      break;

    case 'invoice.payment_succeeded':
      handlePaymentSucceeded(event.data.object);
      break;

    case 'invoice.payment_failed':
      handlePaymentFailed(event.data.object);
      break;

    default:
      console.log('Unhandled event type:', event.type);
  }

  res.writeHead(200);
  res.end('ok');
}

/**
 * Handle successful checkout completion
 */
function handleCheckoutCompleted(session) {
  const customerId = session.customer;
  const customerEmail = session.metadata?.customer_email;

  console.log('Checkout completed:', {
    customer_id: customerId,
    email: customerEmail,
    session_id: session.id
  });

  // Generate API key for new customer
  const apiKey = generateApiKey(customerId);

  // Update customer record
  upsertCustomer(customerId, {
    email: customerEmail,
    api_key: apiKey,
    subscription_status: 'active',
    checkout_completed_at: new Date().toISOString()
  });

  // Emit revenue tracking event
  require('./metrics').emit('revenue_event', session.amount_total / 100, {
    type: 'subscription_started',
    customer_id: customerId,
    session_id: session.id
  });
}

/**
 * Handle subscription changes
 */
function handleSubscriptionChanged(subscription) {
  const customerId = subscription.customer;

  const priceId = subscription.items.data[0]?.price?.id;

  upsertCustomer(customerId, {
    subscription_id: subscription.id,
    subscription_status: subscription.status,
    stripe_price_id: priceId,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
  });

  console.log('Subscription updated:', {
    customer_id: customerId,
    status: subscription.status,
    price_id: priceId
  });
}

/**
 * Handle subscription cancellation
 */
function handleSubscriptionCancelled(subscription) {
  const customerId = subscription.customer;

  upsertCustomer(customerId, {
    subscription_status: 'cancelled',
    cancelled_at: new Date().toISOString()
  });

  console.log('Subscription cancelled:', { customer_id: customerId });
}

/**
 * Handle successful payment
 */
function handlePaymentSucceeded(invoice) {
  const customerId = invoice.customer;
  const amount = invoice.amount_paid / 100; // Convert from cents

  console.log('Payment succeeded:', {
    customer_id: customerId,
    amount: amount,
    invoice_id: invoice.id
  });

  // Emit revenue tracking event
  require('./metrics').emit('revenue_event', amount, {
    type: 'subscription_payment',
    customer_id: customerId,
    invoice_id: invoice.id
  });
}

/**
 * Handle failed payment
 */
function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;

  console.log('Payment failed:', {
    customer_id: customerId,
    invoice_id: invoice.id
  });

  // Could send email notification here
}

module.exports = {
  PRICING_TIERS,
  generateApiKey,
  getCustomerByApiKey,
  upsertCustomer,
  getCustomerTier,
  canMakeRequest,
  createCheckoutSession,
  createPortalSession,
  handleStripeWebhook
};
