# Stripe Product Renaming Guide

**Date:** 2024-09-30
**Task:** Rename existing Stripe products to match new naming convention

---

## Current Products in Stripe

### Active Products (Keep & Rename)

| Current Name | Price | New Name | Action |
|-------------|-------|----------|--------|
| CertNode Starter (Monthly) | $49/mo | `certnode-starter-monthly` | Rename |
| CertNode Starter (Yearly) | $490/yr | `certnode-starter-annual` | Rename |
| CertNode Professional (Monthly) | $199/mo | `certnode-professional-monthly` | Rename |
| CertNode Professional (Yearly) | $1,990/yr | `certnode-professional-annual` | Rename |
| CertNode Enterprise (Monthly) | $499/mo | `certnode-scale-monthly` | **Rename + Rebrand** |
| CertNode Enterprise (Yearly) | $4,990/yr | `certnode-scale-annual` | **Rename + Rebrand** |
| CertNode Dispute Shield Pro (Yearly) | $12,000/yr | `certnode-dispute-shield-pro-annual` | Rename |
| CertNode Dispute Shield Elite (Yearly) | $30,000/yr | `certnode-dispute-shield-elite-annual` | Rename |

### Deactivated Products (Ignore)
- ❌ CertNode Dispute Fortress (Yearly) - $30,000
- ❌ OptiStack Tier 2 License
- ❌ OptiStack Tier 2 License and 1 more
- ❌ OptiStack Tier 3 License

---

## Important Note: "Enterprise" → "Scale"

**You're renaming "Enterprise (Monthly/Yearly)" to "Scale (Monthly/Yearly)"**

**Why:**
- "Enterprise" tier is now reserved for $60K-150K+ custom platform deals
- $499/mo tier is actually the top SMB self-service tier
- "Scale" better describes businesses growing past Pro tier

**Marketing impact:**
- Update all pricing page references from "Enterprise" to "Scale"
- Old customers on "Enterprise" plan won't be confused (still works)
- New customers see clear progression: Starter → Professional → Scale

---

## Step-by-Step Renaming Instructions

### For Each Product:

1. **Go to:** Stripe Dashboard → Products
2. **Click on product name**
3. **Click "Edit product" (top right)**
4. **Change "Name" field** to new name from table above
5. **Add/Update Metadata** (see section below)
6. **Click "Save product"**

---

## Metadata to Add (For Each Product)

### Starter Monthly
```
plan_id: starter
billing_period: monthly
receipts_included: 1000
overage_rate: 0.10
graph_depth_limit: 5
api_rate_limit: 5000
support_sla_hours: 48
tier_category: smb
```

### Starter Annual
```
plan_id: starter
billing_period: annual
receipts_included: 1000
overage_rate: 0.10
graph_depth_limit: 5
api_rate_limit: 5000
support_sla_hours: 48
tier_category: smb
discount_months: 2
```

### Professional Monthly
```
plan_id: professional
billing_period: monthly
receipts_included: 5000
overage_rate: 0.05
graph_depth_limit: 10
api_rate_limit: 25000
support_sla_hours: 24
tier_category: smb
webhooks: true
batch_operations: 100
```

### Professional Annual
```
plan_id: professional
billing_period: annual
receipts_included: 5000
overage_rate: 0.05
graph_depth_limit: 10
api_rate_limit: 25000
support_sla_hours: 24
tier_category: smb
webhooks: true
batch_operations: 100
discount_months: 2
```

### Scale Monthly (was "Enterprise Monthly")
```
plan_id: scale
billing_period: monthly
receipts_included: 25000
overage_rate: 0.03
graph_depth_limit: unlimited
api_rate_limit: 100000
support_sla_hours: 12
tier_category: smb
webhooks: true
batch_operations: 1000
sso: true
multi_tenant: true
```

### Scale Annual (was "Enterprise Yearly")
```
plan_id: scale
billing_period: annual
receipts_included: 25000
overage_rate: 0.03
graph_depth_limit: unlimited
api_rate_limit: 100000
support_sla_hours: 12
tier_category: smb
webhooks: true
batch_operations: 1000
sso: true
multi_tenant: true
discount_months: 2
```

### Dispute Shield Pro Annual
```
plan_id: dispute_shield_pro
billing_period: annual
gmv_ceiling: 2000000
evidence_sla_hours: 48
merchant_ids_included: 1
graph_depth_limit: 10
performance_guarantee: false
direct_support: false
processor_advocacy: template_updates
business_reviews: quarterly
implementation: workshop
tier_category: dispute_shield
```

### Dispute Shield Elite Annual
```
plan_id: dispute_shield_elite
billing_period: annual
gmv_ceiling: 10000000
evidence_sla_hours: 24
merchant_ids_included: 5
graph_depth_limit: unlimited
performance_guarantee: true
service_credit_pct: 15
direct_support: true
processor_advocacy: full_coordination
business_reviews: monthly
executive_qbr: quarterly
implementation: full_audit
custom_integrations: true
team_training_sessions: 3
tier_category: dispute_shield
```

---

## How to Add Metadata in Stripe

1. **Edit product** (as above)
2. **Scroll to "Metadata" section**
3. **Click "Add metadata"** for each key-value pair
4. **Enter key** (e.g., `plan_id`)
5. **Enter value** (e.g., `starter`)
6. **Repeat** for all metadata fields
7. **Save product**

**Why metadata matters:**
- Your webhook handlers use this to determine features
- Dashboard reads metadata to show plan details
- API uses it for rate limiting and feature gating

---

## Checklist (Do in Order)

### SMB Tiers (Do First - Easiest)
- [ ] Rename "CertNode Starter (Monthly)" → `certnode-starter-monthly`
- [ ] Add metadata to Starter Monthly
- [ ] Rename "CertNode Starter (Yearly)" → `certnode-starter-annual`
- [ ] Add metadata to Starter Annual
- [ ] Rename "CertNode Professional (Monthly)" → `certnode-professional-monthly`
- [ ] Add metadata to Professional Monthly
- [ ] Rename "CertNode Professional (Yearly)" → `certnode-professional-annual`
- [ ] Add metadata to Professional Annual

### Scale Tier (Rebrand from Enterprise)
- [ ] Rename "CertNode Enterprise (Monthly)" → `certnode-scale-monthly`
- [ ] Add metadata to Scale Monthly (plan_id: `scale`, NOT `enterprise`)
- [ ] Rename "CertNode Enterprise (Yearly)" → `certnode-scale-annual`
- [ ] Add metadata to Scale Annual (plan_id: `scale`, NOT `enterprise`)
- [ ] **Update pricing page:** Change "Enterprise" to "Scale" everywhere
- [ ] **Update dashboard:** Change tier display name

### Dispute Shield Tiers
- [ ] Rename "CertNode Dispute Shield Pro (Yearly)" → `certnode-dispute-shield-pro-annual`
- [ ] Add metadata to Dispute Shield Pro
- [ ] Rename "CertNode Dispute Shield Elite (Yearly)" → `certnode-dispute-shield-elite-annual`
- [ ] Add metadata to Dispute Shield Elite

### Verification
- [ ] Test webhook with metadata: Create test subscription
- [ ] Verify dashboard reads metadata correctly
- [ ] Check payment links still work
- [ ] Update any hardcoded product IDs in code (if any)
- [ ] Test plan upgrade flow
- [ ] Test plan downgrade flow

---

## Code Changes Needed

### Check these files for hardcoded product names:

```bash
# Search for old product references
cd certnode-dashboard
grep -r "CertNode Enterprise" .
grep -r "enterprise" . --include="*.tsx" --include="*.ts"
```

**Files likely to need updates:**
- `app/pricing/page.tsx` - Change "Enterprise" to "Scale"
- `app/api/webhooks/stripe/route.ts` - Verify metadata handling
- `components/PricingTable.tsx` - Update tier names
- Any dashboard components showing plan name

### Example code change:

**Before:**
```typescript
if (subscription.plan === 'enterprise') {
  // ...
}
```

**After:**
```typescript
if (subscription.metadata.plan_id === 'scale') {
  // ...
}
```

---

## Migration Notes for Existing Customers

**Good news:** Renaming products in Stripe does NOT affect existing subscriptions.

**What happens:**
- Existing customers keep their subscriptions
- Their invoices will show the new name on next billing cycle
- No action needed from customers
- Payment links continue to work
- Subscription IDs stay the same

**If a customer asks:**
> "We've updated our product naming for clarity. Your plan features and pricing remain exactly the same. The 'Enterprise' tier is now called 'Scale' to better reflect its position as our top self-service plan."

---

## Testing After Renaming

### Create Test Subscriptions

```bash
# Use Stripe test mode
# Test card: 4242 4242 4242 4242

# Test each payment link:
1. Click Starter Monthly link
2. Complete checkout with test card
3. Verify webhook received
4. Check metadata in subscription object
5. Verify dashboard shows correct plan
6. Repeat for each tier
```

### Verify Metadata Accessible

```javascript
// In webhook handler or API
const subscription = await stripe.subscriptions.retrieve('sub_xxx', {
  expand: ['plan.product']
});

console.log(subscription.plan.product.metadata);
// Should show: { plan_id: 'starter', tier_category: 'smb', ... }
```

---

## Rollback Plan (If Needed)

**If something breaks:**

1. **Don't panic** - Stripe keeps version history
2. **Revert product names** in Stripe dashboard
3. **Keep metadata** - it doesn't hurt anything
4. **Contact Stripe support** if subscriptions are affected (they won't be)

**Most likely issues:**
- Payment links cached in browser (clear cache)
- Hardcoded product names in code (update code)
- Webhook metadata parsing (check handler logic)

---

## Timeline

**Estimated time:** 30-45 minutes

- **5 min:** Rename SMB tiers (6 products)
- **10 min:** Add metadata to SMB tiers
- **5 min:** Rename Dispute Shield tiers (2 products)
- **10 min:** Add metadata to Dispute Shield tiers
- **10 min:** Test one product end-to-end
- **5 min:** Update pricing page copy (Enterprise → Scale)

---

## After Completion

- [ ] Update payment links on pricing page (if URLs changed)
- [ ] Screenshot new Stripe products dashboard
- [ ] Notify team of naming change
- [ ] Update customer-facing docs (if "Enterprise" is mentioned)
- [ ] Update sales collateral
- [ ] Mark old "Dispute Fortress" as archived (if not already)

---

## Quick Reference: Old → New Names

```
Starter (Monthly)      → certnode-starter-monthly
Starter (Yearly)       → certnode-starter-annual
Professional (Monthly) → certnode-professional-monthly
Professional (Yearly)  → certnode-professional-annual
Enterprise (Monthly)   → certnode-scale-monthly        ⚠️ REBRAND
Enterprise (Yearly)    → certnode-scale-annual         ⚠️ REBRAND
Dispute Shield Pro     → certnode-dispute-shield-pro-annual
Dispute Shield Elite   → certnode-dispute-shield-elite-annual
```

---

**Ready to go.** Start with Starter Monthly and work your way down the list. Take your time with the metadata - it's critical for your application to work correctly.
