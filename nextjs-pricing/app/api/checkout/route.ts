import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const tierMap: Record<string, string> = {
  starter: 'starter',
  professional: 'pro',
  growth: 'pro',
  pro: 'pro',
  business: 'business',
};

const yearlyPaymentLinks: Record<string, string | undefined> = {
  starter: 'https://buy.stripe.com/28E8wOeMices0nYduZbAs06',
  pro: 'https://buy.stripe.com/7sY28qdIe4M02w61MhbAs07',
  business: 'https://buy.stripe.com/bJe4gyaw2fqE0nY76BbAs08',
};

const monthlyPriceIds: Record<string, string | undefined> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID,
  pro: process.env.STRIPE_PRO_PRICE_ID,
  business: process.env.STRIPE_BUSINESS_PRICE_ID,
};

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret
  ? new Stripe(stripeSecret, {
      apiVersion: '2025-08-27.basil',
    })
  : null;

const BILLING_API_BASE_URL = process.env.BILLING_API_BASE_URL
  ? process.env.BILLING_API_BASE_URL.replace(/\/$/, '')
  : undefined;
const BILLING_API_TIMEOUT_MS = Number(process.env.BILLING_API_TIMEOUT_MS || 6000);
const BILLING_API_PORT = process.env.BILLING_API_PORT || '3000';

function resolveBaseUrl(request: Request): string {
  const originHeader = request.headers.get('origin');
  if (originHeader) {
    return originHeader;
  }

  const host = request.headers.get('host');
  if (!host) {
    return process.env.PUBLIC_SITE_URL || 'http://localhost:3000';
  }

  const isLocalHost = host.includes('localhost') || host.includes('127.0.0.1');
  const protocol = isLocalHost ? 'http' : 'https';
  return protocol + '://' + host;
}

function resolveBillingApiBase(request: Request): string | undefined {
  if (BILLING_API_BASE_URL) {
    return BILLING_API_BASE_URL;
  }

  const host = request.headers.get('host') || '';
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return 'http://localhost:' + BILLING_API_PORT;
  }

  return undefined;
}

type CheckoutPayload = {
  tier: string;
  billing: 'monthly' | 'yearly';
  email: string | null;
  success_url: string;
  cancel_url: string;
};

async function createViaBillingApi(payload: CheckoutPayload, baseUrl: string | undefined) {
  if (!baseUrl) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BILLING_API_TIMEOUT_MS);

  try {
    const response = await fetch(baseUrl + '/api/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Billing API error:', error);
      return null;
    }

    const data = await response.json();
    return {
      ...data,
      url: data.url || data.checkout_url || data.payment_link || null,
    } as { url: string | null } & Record<string, unknown>;
  } catch (error) {
    console.error('Billing API request failed:', error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function createViaStripe(payload: CheckoutPayload) {
  if (!stripe) {
    console.warn('Stripe secret key not configured; skipping direct Stripe checkout session creation.');
    return null;
  }

  const priceId = monthlyPriceIds[payload.tier];
  if (!priceId) {
    console.error('Missing Stripe price id for tier:', payload.tier);
    return null;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: payload.success_url,
      cancel_url: payload.cancel_url,
      automatic_tax: { enabled: true },
      allow_promotion_codes: true,
      metadata: {
        billing: payload.billing,
        tier: payload.tier,
      },
      ...(payload.email ? { customer_email: payload.email } : {}),
    });

    return {
      url: session.url || null,
      session_id: session.id,
      customer_id: session.customer ?? null,
    };
  } catch (error) {
    console.error('Stripe checkout session creation failed:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { tier, billing = 'monthly', email = null } = await request.json();

    const mappedTier = tierMap[tier];
    if (!mappedTier) {
      return Response.json({ error: 'Invalid tier' }, { status: 400 });
    }

    if (billing === 'yearly') {
      const paymentLink = yearlyPaymentLinks[mappedTier];
      if (paymentLink) {
        return Response.json({ url: paymentLink });
      }
      return Response.json({ error: 'Yearly billing is not configured for this tier' }, { status: 400 });
    }

    // For monthly billing, fall through to use the billing API

    const baseUrl = resolveBaseUrl(request);
    const billingBase = resolveBillingApiBase(request);

    const payload: CheckoutPayload = {
      tier: mappedTier,
      billing,
      email,
      success_url: baseUrl + '/pricing?success=true',
      cancel_url: baseUrl + '/pricing?canceled=true',
    };

    const billingResponse = await createViaBillingApi(payload, billingBase);
    if (billingResponse?.url) {
      return Response.json(billingResponse);
    }

    const stripeResponse = await createViaStripe(payload);
    if (stripeResponse?.url) {
      return Response.json(stripeResponse);
    }

    return Response.json({ error: 'Checkout creation failed' }, { status: 500 });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
