# Stripe Billing Setup Guide

## Environment Variables Needed

Add these to your Vercel environment variables:

```bash
# Required Stripe Keys (you should add these)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (created after setting up webhook)

# Required Stripe Price IDs (create these in Stripe Dashboard)
STRIPE_STARTER_PRICE_ID=price_... (for $49/month Starter plan)
STRIPE_PRO_PRICE_ID=price_... (for $200/month Pro plan)
STRIPE_BUSINESS_PRICE_ID=price_... (for $99/month Business plan)
```

## Steps to Complete Setup:

### 1. Create Stripe Products & Prices
Go to https://dashboard.stripe.com/products and create:

**Starter Plan:**
- Product name: "CertNode Starter"
- Price: $49.00 USD
- Billing: Recurring monthly
- Copy the Price ID to `STRIPE_STARTER_PRICE_ID`

**Pro Plan:**
- Product name: "CertNode Pro"
- Price: $200.00 USD
- Billing: Recurring monthly
- Copy the Price ID to `STRIPE_PRO_PRICE_ID`

**Business Plan:**
- Product name: "CertNode Business"
- Price: $99.00 USD
- Billing: Recurring monthly
- Copy the Price ID to `STRIPE_BUSINESS_PRICE_ID`

### 2. Set up Webhook Endpoint
1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://certnode.io/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 3. Add Environment Variables to Vercel
```bash
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add STRIPE_STARTER_PRICE_ID
vercel env add STRIPE_PRO_PRICE_ID
vercel env add STRIPE_BUSINESS_PRICE_ID
```

### 4. Deploy Updated Code
The billing system is ready! After adding the environment variables, redeploy:

```bash
vercel --prod
```

## Features Included:

✅ **Usage-based billing** - Free (1K), Pro (10K), Business (50K) receipts/month
✅ **API key authentication** - Customers get API keys after payment
✅ **Upgrade prompts** - 429 errors include upgrade links when limits exceeded
✅ **Customer portal** - Self-service billing management
✅ **Webhook handling** - Automatic subscription management
✅ **Revenue tracking** - Events logged for analytics

## Revenue Flow:

1. **Free users** hit 1K limit → see upgrade prompt
2. **Users upgrade** → Stripe checkout → get API key
3. **Paid users** get higher limits + authentication
4. **Enterprise leads** contact sales for custom deals

## Testing:

Use Stripe test keys first:
- Test card: `4242 4242 4242 4242`
- Any future date and CVC
- Test the full flow before going live

The system is ready to generate revenue immediately after setup!