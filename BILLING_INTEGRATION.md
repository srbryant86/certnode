# CertNode Billing Integration Documentation

## Overview

This document provides comprehensive documentation for the CertNode billing integration, including Stripe checkout, security configurations, and the subscription flow.

## Architecture

### Components
- **Frontend**: `web/pricing.html` with JavaScript checkout handling
- **Backend**: Billing routes in `api/src/routes/billing.js`
- **Security**: Security middleware bypass for billing endpoints
- **Stripe Integration**: Custom checkout sessions with CertNode branding

## Frontend Integration

### Subscribe Button Implementation
Location: `web/pricing.html:763-835`

```javascript
// Tier-based subscription handling
document.querySelectorAll('[data-tier]').forEach(button => {
  button.addEventListener('click', function() {
    const tier = this.getAttribute('data-tier');

    // Free tier → signup page
    if (tier === 'developer') {
      window.location.href = '/signup/developer';
      return;
    }

    // Enterprise → contact page
    if (tier === 'enterprise') {
      window.location.href = '/enterprise';
      return;
    }

    // Paid tiers → Stripe checkout
    if (stripePrices[tier]) {
      handleSubscription(tier, stripePrices[tier]);
    }
  });
});
```

### Checkout Session Creation
```javascript
function handleSubscription(tier, priceId) {
  // Show loading state
  button.textContent = 'Loading...';
  button.disabled = true;

  // Call backend API
  fetch('/api/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tier: tier,
      email: null // Collected by Stripe
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.checkout_url || data.url) {
      window.location.href = data.checkout_url || data.url;
    } else {
      throw new Error(data.error || 'Failed to create checkout session');
    }
  });
}
```

## Backend Integration

### Billing Routes
Location: `api/src/routes/billing.js`

#### Endpoint: `POST /api/create-checkout`
**Purpose**: Creates Stripe checkout session for subscription

**Request Payload**:
```json
{
  "tier": "starter|pro|business",
  "email": null // Optional, collected by Stripe if not provided
}
```

**Response**:
```json
{
  "checkout_url": "https://checkout.stripe.com/pay/...",
  "session_id": "cs_...",
  "customer_id": "cus_..." // If email provided
}
```

**Implementation Details**:
```javascript
// Pricing tier validation
const tierConfig = billing.PRICING_TIERS[tier];
if (!tierConfig) return sendError(res, req, 400, 'client_error', 'invalid tier');

// Success/cancel URLs
const baseUrl = req.headers.host.includes('localhost')
  ? 'http://localhost:3000'
  : `https://${req.headers.host}`;

const successUrl = `${baseUrl}/account?session_id={CHECKOUT_SESSION_ID}`;
const cancelUrl = `${baseUrl}/pricing`;

// Create checkout session
const checkout = await billing.createCheckoutSession(
  email,
  tierConfig.stripe_price_id,
  successUrl,
  cancelUrl
);
```

#### Endpoint: `POST /api/create-portal`
**Purpose**: Creates customer portal for subscription management

**Authorization**: Bearer token (API key) required

#### Endpoint: `GET /api/account`
**Purpose**: Retrieves account information for authenticated users

**Authorization**: Bearer token (API key) required

#### Endpoint: `GET /api/pricing`
**Purpose**: Public endpoint returning pricing tier information

## Stripe Integration

### Checkout Session Configuration
Location: `api/src/plugins/stripe-billing.js:154-167`

```javascript
session = await stripe.checkout.sessions.create({
  customer: customer.id,
  mode: 'subscription',
  payment_method_types: ['card'],
  line_items: [{ price: cleanPriceId, quantity: 1 }],
  success_url: successUrl,
  cancel_url: cancelUrl,
  metadata: { customer_email: cleanEmail },
  custom_text: {
    submit: {
      message: 'Subscribe to CertNode - Enterprise cryptographic receipt platform'
    }
  }
});
```

### Custom Branding
- **Business Name**: Set in Stripe Dashboard → Business settings → "CertNode"
- **Custom Text**: Added via `custom_text.submit.message` for professional branding
- **Statement Descriptor**: Should be set to "CERTNODE" for credit card statements

## Security Implementation

### Content Security Policy
Location: `vercel.json:22` and `web/pricing.html:11`

**CSP Headers Allow**:
- `script-src 'self' 'unsafe-inline' https://js.stripe.com`
- `connect-src 'self' https: https://api.stripe.com`
- `frame-src https://js.stripe.com`

### Security Middleware Bypass
Location: `api/src/server.js:105-115`

**Critical Implementation**: Billing endpoints bypass security middleware to prevent false positives

```javascript
// Security bypass for billing endpoints
const isBillingEndpoint = url.pathname.startsWith('/api/') && (
  url.pathname === '/api/create-checkout' ||
  url.pathname === '/api/create-portal' ||
  url.pathname === '/api/pricing' ||
  url.pathname === '/api/account'
);

if (securityMiddleware && !isBillingEndpoint) {
  await runMiddleware(securityMiddleware.middleware());
}
```

**Reason**: Security middleware was flagging JSON payloads with `{}` characters as command injection attempts, blocking legitimate billing requests.

## Success Flow

### Post-Checkout Redirect
1. User completes Stripe checkout
2. Redirected to `/account?session_id={CHECKOUT_SESSION_ID}`
3. Account page displays success banner
4. JavaScript handles success notification and URL cleanup

### Account Page Implementation
Location: `web/js/account.js:9-14`

```javascript
// Handle successful subscription redirect
const sessionId = urlParams.get('session_id');
const isSuccess = urlParams.get('success') === 'true';

if (sessionId || isSuccess) {
  showSuccessNotification('Welcome to CertNode! Your subscription is now active.');
  // Clean URL without refreshing
  window.history.replaceState({}, document.title, window.location.pathname);
}
```

## Pricing Tiers

### Configuration
Location: `api/src/plugins/stripe-billing.js:15-46`

```javascript
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
    monthly_limit: 2000000,
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
```

## Environment Variables

### Required Stripe Configuration
```bash
STRIPE_SECRET_KEY=sk_live_... # or sk_test_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...
```

### Optional Payment Links (Alternative to Price IDs)
```bash
STARTER_PAYMENT_LINK_URL=https://buy.stripe.com/...
PRO_PAYMENT_LINK_URL=https://buy.stripe.com/...
BUSINESS_PAYMENT_LINK_URL=https://buy.stripe.com/...
```

## Testing

### End-to-End Flow
1. Navigate to `/pricing`
2. Click "Subscribe" on any paid tier
3. Complete Stripe checkout (use test card `4242 4242 4242 4242`)
4. Verify redirect to `/account?session_id=...`
5. Confirm success notification displays
6. Check that URL cleans up (removes session_id parameter)

### Error Handling
- Invalid tier → 400 error with clear message
- Missing Stripe configuration → Fallback to payment links
- Authentication failures → Proper 401 responses
- Network errors → User-friendly error messages

## Performance Optimizations

### Frontend
- Font preloading: `<link rel="preload" href="..." as="style">`
- DNS prefetching: `<link rel="dns-prefetch" href="https://api.stripe.com">`
- Resource preconnection: `<link rel="preconnect" href="https://js.stripe.com">`

### Mobile UX
- Minimum 48px touch targets for buttons
- Responsive grid with `minmax(320px, 1fr)`
- Mobile-optimized spacing and padding

## Troubleshooting

### Common Issues

#### 1. "Request blocked due to security policy"
**Cause**: Security middleware blocking JSON payloads
**Solution**: Verify billing endpoints are in bypass list (server.js:105-115)

#### 2. Stripe checkout shows wrong business name
**Cause**: Stripe account business name not updated
**Solution**: Update in Stripe Dashboard → Business settings

#### 3. CSP blocking Stripe resources
**Cause**: Content Security Policy too restrictive
**Solution**: Verify CSP allows Stripe domains (vercel.json:22)

#### 4. Subscription redirect fails
**Cause**: Success URL configuration mismatch
**Solution**: Check baseUrl generation in billing.js:84-86

## Security Considerations

### Implemented Safeguards
- ✅ Server-side validation of all tier parameters
- ✅ CORS headers properly configured
- ✅ CSP allows only necessary Stripe domains
- ✅ No sensitive data in frontend JavaScript
- ✅ Proper authentication for account endpoints

### Security Bypass Rationale
The billing endpoint security bypass is necessary because:
1. JSON payloads contain `{}` characters
2. Security middleware flags these as command injection attempts
3. Bypass only applies to specific billing endpoints
4. All other security measures remain active

## Deployment Notes

### Vercel Configuration
- CSP headers defined in `vercel.json`
- Routing rules redirect `/pricing` to `/web/pricing.html`
- Static file caching configured for optimal performance

### DNS/CDN Considerations
- Stripe checkout requires HTTPS in production
- Ensure custom domain SSL certificates are valid
- CDN should not cache `/api/*` endpoints

---

**Last Updated**: Based on implementations through commit `e829bd8`
**Next Review**: After any Stripe or security middleware changes