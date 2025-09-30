# Stripe Product Setup Guide - CertNode

**Last Updated:** 2024-09-30

This guide contains exact Stripe product names and metadata for all CertNode pricing tiers.

---

## SMB Self-Service Tiers

### 1. Starter - Monthly
**Product Name:** `certnode-starter-monthly`
**Price:** $49/month
**Billing:** Monthly recurring

**Metadata:**
```json
{
  "plan_id": "starter",
  "billing_period": "monthly",
  "receipts_included": "1000",
  "overage_rate": "0.10",
  "graph_depth_limit": "5",
  "api_rate_limit": "5000",
  "support_sla_hours": "48",
  "tier_category": "smb"
}
```

---

### 2. Starter - Annual
**Product Name:** `certnode-starter-annual`
**Price:** $490/year (10 months price - 2 months free)
**Billing:** Annual

**Metadata:**
```json
{
  "plan_id": "starter",
  "billing_period": "annual",
  "receipts_included": "1000",
  "overage_rate": "0.10",
  "graph_depth_limit": "5",
  "api_rate_limit": "5000",
  "support_sla_hours": "48",
  "tier_category": "smb",
  "discount_months": "2"
}
```

---

### 3. Professional - Monthly
**Product Name:** `certnode-professional-monthly`
**Price:** $199/month
**Billing:** Monthly recurring

**Metadata:**
```json
{
  "plan_id": "professional",
  "billing_period": "monthly",
  "receipts_included": "5000",
  "overage_rate": "0.05",
  "graph_depth_limit": "10",
  "api_rate_limit": "25000",
  "support_sla_hours": "24",
  "tier_category": "smb",
  "webhooks": "true",
  "batch_operations": "100"
}
```

---

### 4. Professional - Annual
**Product Name:** `certnode-professional-annual`
**Price:** $1,990/year (10 months price - 2 months free)
**Billing:** Annual

**Metadata:**
```json
{
  "plan_id": "professional",
  "billing_period": "annual",
  "receipts_included": "5000",
  "overage_rate": "0.05",
  "graph_depth_limit": "10",
  "api_rate_limit": "25000",
  "support_sla_hours": "24",
  "tier_category": "smb",
  "webhooks": "true",
  "batch_operations": "100",
  "discount_months": "2"
}
```

---

### 5. Scale - Monthly
**Product Name:** `certnode-scale-monthly`
**Price:** $499/month
**Billing:** Monthly recurring

**Metadata:**
```json
{
  "plan_id": "scale",
  "billing_period": "monthly",
  "receipts_included": "25000",
  "overage_rate": "0.03",
  "graph_depth_limit": "unlimited",
  "api_rate_limit": "100000",
  "support_sla_hours": "12",
  "tier_category": "smb",
  "webhooks": "true",
  "batch_operations": "1000",
  "sso": "true",
  "multi_tenant": "true"
}
```

---

### 6. Scale - Annual
**Product Name:** `certnode-scale-annual`
**Price:** $4,990/year (10 months price - 2 months free)
**Billing:** Annual

**Metadata:**
```json
{
  "plan_id": "scale",
  "billing_period": "annual",
  "receipts_included": "25000",
  "overage_rate": "0.03",
  "graph_depth_limit": "unlimited",
  "api_rate_limit": "100000",
  "support_sla_hours": "12",
  "tier_category": "smb",
  "webhooks": "true",
  "batch_operations": "1000",
  "sso": "true",
  "multi_tenant": "true",
  "discount_months": "2"
}
```

---

## Dispute Shield Tiers (High-Touch Sales)

### 7. Dispute Shield Pro
**Product Name:** `certnode-dispute-shield-pro-annual`
**Price:** $12,000/year
**Billing:** Annual (invoice with net-30 terms)

**Metadata:**
```json
{
  "plan_id": "dispute_shield_pro",
  "billing_period": "annual",
  "gmv_ceiling": "2000000",
  "evidence_sla_hours": "48",
  "merchant_ids_included": "1",
  "graph_depth_limit": "10",
  "performance_guarantee": "false",
  "direct_support": "false",
  "processor_advocacy": "template_updates",
  "business_reviews": "quarterly",
  "implementation": "workshop",
  "tier_category": "dispute_shield"
}
```

**Payment Terms:**
- Annual invoice
- Net-30 payment terms
- Can be split into quarterly payments ($3,000/quarter) upon request

---

### 8. Dispute Shield Elite
**Product Name:** `certnode-dispute-shield-elite-annual`
**Price:** $30,000/year
**Billing:** Annual (invoice with net-30 terms)

**Metadata:**
```json
{
  "plan_id": "dispute_shield_elite",
  "billing_period": "annual",
  "gmv_ceiling": "10000000",
  "evidence_sla_hours": "24",
  "merchant_ids_included": "5",
  "graph_depth_limit": "unlimited",
  "performance_guarantee": "true",
  "service_credit_pct": "15",
  "direct_support": "true",
  "processor_advocacy": "full_coordination",
  "business_reviews": "monthly",
  "executive_qbr": "quarterly",
  "implementation": "full_audit",
  "custom_integrations": "true",
  "team_training_sessions": "3",
  "tier_category": "dispute_shield"
}
```

**Payment Terms:**
- Annual invoice
- Net-30 payment terms
- Can be split into quarterly payments ($7,500/quarter) upon request

---

## Enterprise Platform Tiers (Contact Sales)

### 9. Enterprise Platform - Base
**Product Name:** `certnode-enterprise-platform-60k`
**Price:** $60,000/year
**Billing:** Annual (custom contract)

**Metadata:**
```json
{
  "plan_id": "enterprise_platform_base",
  "billing_period": "annual",
  "receipts_included": "custom",
  "graph_depth_limit": "unlimited",
  "merchant_ids_included": "unlimited",
  "white_label": "true",
  "custom_sla": "true",
  "dedicated_support": "true",
  "custom_integrations": "unlimited",
  "tier_category": "enterprise"
}
```

**Use Case:** Marketplaces, platforms managing multiple sub-merchants

---

### 10. Enterprise Platform - Premium
**Product Name:** `certnode-enterprise-platform-150k`
**Price:** $150,000/year
**Billing:** Annual (custom contract)

**Metadata:**
```json
{
  "plan_id": "enterprise_platform_premium",
  "billing_period": "annual",
  "receipts_included": "custom",
  "graph_depth_limit": "unlimited",
  "merchant_ids_included": "unlimited",
  "white_label": "true",
  "custom_sla": "true",
  "dedicated_support": "true",
  "dedicated_infrastructure": "true",
  "custom_integrations": "unlimited",
  "onsite_training": "true",
  "tier_category": "enterprise"
}
```

**Use Case:** Large enterprises, high-volume platforms

---

### 11. Enterprise Custom
**Product Name:** `certnode-enterprise-custom`
**Price:** Custom quote
**Billing:** Custom contract

**Metadata:**
```json
{
  "plan_id": "enterprise_custom",
  "billing_period": "custom",
  "tier_category": "enterprise",
  "contact_sales": "true"
}
```

**Use Case:** Unique requirements, multi-year contracts, custom infrastructure

---

## Stripe Setup Instructions

### Creating Products in Stripe Dashboard

1. **Navigate to:** Products → Add Product

2. **For each tier, fill in:**
   - **Name:** Use exact product name from above (e.g., `certnode-starter-monthly`)
   - **Description:** Brief description for internal reference
   - **Pricing:**
     - **Type:** Recurring (for monthly/annual) or One-time (for enterprise invoices)
     - **Price:** Amount from above
     - **Billing period:** Monthly or Yearly
   - **Metadata:** Copy JSON from above, add as key-value pairs

3. **Tax settings:**
   - Enable tax collection
   - Use Stripe Tax for automatic calculation

4. **Invoice settings (for high-touch tiers):**
   - Payment terms: Net 30
   - Auto-advance: Off (manual invoice approval)
   - Email invoice: On

### Using Stripe CLI (Faster)

```bash
# Example: Create Starter Monthly
stripe products create \
  --name "certnode-starter-monthly" \
  --description "CertNode Starter - Monthly" \
  --metadata[plan_id]=starter \
  --metadata[billing_period]=monthly \
  --metadata[receipts_included]=1000 \
  --metadata[overage_rate]=0.10 \
  --metadata[graph_depth_limit]=5 \
  --metadata[api_rate_limit]=5000 \
  --metadata[support_sla_hours]=48 \
  --metadata[tier_category]=smb

# Then create price
stripe prices create \
  --product prod_XXXXXXXXXXXXX \
  --unit-amount 4900 \
  --currency usd \
  --recurring[interval]=month
```

### Payment Links

After creating products, create payment links:

1. **Navigate to:** Payment Links → Create payment link
2. **Select product**
3. **Customize:**
   - Success URL: `https://certnode.io/welcome?plan={PLAN_ID}`
   - Cancel URL: `https://certnode.io/pricing`
   - Collect customer info: Name, email, billing address
4. **Copy link** for use on pricing page

---

## Verification Checklist

After setup, verify:

- [ ] All 11 products created in Stripe
- [ ] Metadata matches exactly (used by webhook handlers)
- [ ] Payment links working for SMB tiers
- [ ] Invoice templates ready for Dispute Shield tiers
- [ ] Webhook endpoint configured to receive subscription events
- [ ] Test purchase completes end-to-end
- [ ] Dashboard correctly displays plan based on metadata
- [ ] Overage billing logic tested (for SMB tiers)

---

## Webhook Events to Handle

Configure webhook endpoint at: `https://certnode.io/api/webhooks/stripe`

**Critical events:**
- `checkout.session.completed` - New subscription
- `customer.subscription.updated` - Plan change/upgrade
- `customer.subscription.deleted` - Cancellation
- `invoice.paid` - Successful payment
- `invoice.payment_failed` - Failed payment
- `customer.subscription.trial_will_end` - 3 days before trial ends

---

## Testing

### Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

### Test Flow
1. Create payment link in test mode
2. Complete checkout with test card
3. Verify webhook received
4. Check customer portal access
5. Test upgrade/downgrade flow
6. Test cancellation flow

---

## Migration Notes

If migrating existing customers:

```bash
# Update customer subscription
stripe subscriptions update sub_XXXXX \
  --items[0][price]=price_XXXXX \
  --proration_behavior=none
```

---

## Support Resources

- **Stripe Dashboard:** https://dashboard.stripe.com/products
- **Stripe Docs:** https://stripe.com/docs/billing
- **CertNode Billing Code:** `certnode-dashboard/app/api/webhooks/stripe/route.ts`
- **Internal Docs:** `/docs/MASTER_IMPLEMENTATION_PLAN.md`

---

**Ready to go.** Copy these exact product names into Stripe and you're live.
