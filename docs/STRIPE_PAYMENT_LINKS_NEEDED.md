# Stripe Payment Links Needed

**Last Updated:** 2024-09-30

You need to create payment links in Stripe Dashboard for each tier and paste the URLs into the code.

---

## SMB Tiers - Where to Add Payment Links

The payment links for SMB tiers (Starter, Professional, Scale) will be handled automatically by the `/api/checkout` endpoint in the pricing page.

Currently, the PricingTable component calls `handleCheckout(tier.id)` which makes an API call.

**You need to update the TIER_API_MAP** in `nextjs-pricing/components/PricingTable.tsx`:

```typescript
const TIER_API_MAP: Record<string, string> = {
  'core-starter': 'starter',     // ← Maps to Stripe product
  'core-professional': 'professional',
  'core-scale': 'scale',         // ← Add this mapping
};
```

Then the `/api/checkout` endpoint should return the correct Stripe payment link based on the tier.

---

## Dispute Shield Tiers - Direct Payment Links

For Dispute Shield Pro and Elite, update the hardcoded onClick handlers in:
**File:** `nextjs-pricing/components/PricingTabs.tsx`

### Current (Lines 200-205 and 252-257):

```typescript
// Dispute Shield Pro button
<button
  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
  onClick={() => window.location.href = 'https://buy.stripe.com/OLD_LINK_HERE'}
>
  Get Started
</button>

// Dispute Shield Elite button
<button
  className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
  onClick={() => window.location.href = 'https://buy.stripe.com/OLD_LINK_HERE'}
>
  Get Started
</button>
```

### What You Need:

Go to Stripe Dashboard → Payment Links → Find these products:
1. **CertNode Dispute Shield Pro (Yearly)** - Copy payment link URL
2. **CertNode Dispute Shield Elite (Yearly)** - Copy payment link URL

Then update the code with the actual URLs.

---

## How to Get Payment Links from Stripe

### Method 1: Stripe Dashboard (Easiest)

1. Go to https://dashboard.stripe.com/payment-links
2. Make sure you're in **Live mode** (toggle in top-left)
3. Find each product
4. Click on the payment link
5. Copy the URL (looks like: `https://buy.stripe.com/XXXXXXX`)

### Method 2: Create New Payment Links

If payment links don't exist yet:

1. Go to Stripe Dashboard → Payment Links
2. Click **"+ Create payment link"**
3. Select the product (e.g., "CertNode Starter (Monthly)")
4. Configure:
   - **Collect customer information:** Name, Email, Billing Address
   - **After payment:** Redirect to `https://certnode.io/welcome`
   - **Allow promotion codes:** Yes (optional)
5. Click **"Create link"**
6. Copy the URL

Repeat for all 8 products.

---

## Payment Links Needed

Create payment links for these products and note the URLs:

### SMB Tiers (Handled by API - no hardcoded links needed)
- ✅ Starter (Monthly) - `price_1S8o5QCrtISu7TieGYfl5rx7`
- ✅ Starter (Annual) - `price_1SBRWwCrtISu7Tie6ySLN1UC`
- ✅ Professional (Monthly) - `price_1S8o8vCrtISu7TiePQrC4Dgi`
- ✅ Professional (Annual) - `price_1SBRZCCrtISu7TieVZkutBpf`
- ✅ Scale (Monthly) - `price_1S8uLJCrtISu7TieV4IvB3ZB`
- ✅ Scale (Annual) - `price_1SBRaaCrtISu7Tie9ZXpwYaI`

### Dispute Shield Tiers (Need hardcoded URLs)
- ⚠️ **Dispute Shield Pro (Annual)** - Product ID: `prod_T89ZxsjeKUh7Tn`
  - Create payment link in Stripe
  - Copy URL here: `___________________________________________`

- ⚠️ **Dispute Shield Elite (Annual)** - Product ID: `prod_T89ZEPwlPYkaxF`
  - Create payment link in Stripe
  - Copy URL here: `___________________________________________`

---

## After Getting Payment Links

### For Dispute Shield Pro ($12K):

Update line ~201 in `nextjs-pricing/components/PricingTabs.tsx`:

```typescript
onClick={() => window.location.href = 'PASTE_PRO_PAYMENT_LINK_HERE'}
```

### For Dispute Shield Elite ($30K):

Update line ~253 in `nextjs-pricing/components/PricingTabs.tsx`:

```typescript
onClick={() => window.location.href = 'PASTE_ELITE_PAYMENT_LINK_HERE'}
```

---

## Verification

After updating:

1. **Test in development:**
   ```bash
   cd nextjs-pricing
   npm run dev
   ```

2. **Visit:** http://localhost:3000/pricing

3. **Click buttons:**
   - SMB tier buttons should redirect to correct Stripe checkout
   - Dispute Shield buttons should redirect to Stripe payment links

4. **Use test mode** to verify before going live

---

## Success URL Configuration

All payment links should redirect to:
```
https://certnode.io/welcome?plan={PLAN_NAME}
```

This allows you to show a personalized welcome message based on which plan they purchased.

---

**Next step:** Get those two Dispute Shield payment link URLs from Stripe and paste them into the code!
