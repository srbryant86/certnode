# CertNode Customer Onboarding Guide

Welcome to CertNode. This guide walks new teams through the essential steps to prove every transaction, content event, and operational action with cryptographic receipts.

## Quick Start Checklist

1. **Generate an API key**
   - Dashboard > Settings > API Keys > Create.
   - Copy the token (format `cert_live_...`). Store it in your secret manager.
2. **Verify connectivity**
   ```bash
   curl https://api.certnode.io/api/v1/validation/health \
     -H "Authorization: Bearer cert_live_YOUR_KEY"
   ```
   Expected JSON response: `{ "success": true, "data": { "status": "healthy" } }`.
3. **Create a proof-of-concept receipt**
   ```bash
   curl -X POST https://api.certnode.io/api/v1/receipts/graph \
     -H "Authorization: Bearer cert_live_YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "transaction",
       "data": {
         "amount": 199.00,
         "currency": "USD",
         "invoice": "INV-1001",
         "customer": "customer_123"
       }
     }'
   ```

## Integration Event Ledger

Every turnkey connector flows through the Integration Event Ledger. The ledger:
- Authenticates HMAC signatures from each provider.
- Computes `(provider, external_id, checksum)` for perfect idempotency.
- Writes receipts via `createReceiptWithGraph`, linking parents automatically.
- Emits metrics so you can monitor retries, dedupe rates, and end-to-end latency.

Keep your API key secret aligned with the provider's webhook secret. The UI will display dedupe stats per integration once events start flowing.

## Platform Setups

### Shopify (Commerce)

1. Shopify Admin ? **Settings ? Notifications ? Webhooks** ? Create webhook.
2. URL: `https://certnode.io/api/integrations/shopify`
3. Format: `JSON`
4. Secret: your CertNode API key.
5. Subscribe to:
   - `orders/create`
   - `orders/fulfilled`
   - `refunds/create`
   - `disputes/create`
6. Outcomes:
   - Each webhook is verified (HMAC SHA-256 using your key).
   - The ledger dedupes retries and attaches fulfillments, refunds, and disputes to the originating charge receipt.
   - Dispute defense bundles combine payment, delivery, and evidence receipts in one DAG.

### Kajabi / Teachable (High-ticket Courses)

1. Kajabi Admin ? **Settings ? Webhooks ? Add Webhook**.
2. URL: `https://certnode.io/api/integrations/kajabi`
3. Secret: your CertNode API key.
4. Recommended events:
   - `offer.purchased`
   - `member.logged_in`
   - `course.progress`
   - `course.completed`
   - `assessment.submitted`
5. Outcomes:
   - Purchases become signed transaction receipts keyed by offer + member IDs.
   - Logins, lessons, and completions link automatically to the original payment.
   - Ledger deduplication removes duplicate events and preserves chronological order for disputes.

### Stripe (Payments)

1. Stripe Dashboard ? **Developers ? Webhooks ? Add endpoint**.
2. URL: `https://certnode.io/api/integrations/stripe`
3. Secret: your CertNode API key (stored in Stripe's signing secret field).
4. Subscribe to:
   - `charge.succeeded`
   - `charge.refunded`
   - `charge.dispute.created`
   - `payment_intent.succeeded`
   - `invoice.payment_succeeded`
   - `customer.subscription.*`
5. Outcomes:
   - Stripe signatures are validated using the `t=` timestamp and `v1=` signature.
   - Charges, refunds, invoices, and disputes link together inside the receipt graph.
   - Ledger metrics surface dedupe hits and latency in the dashboard.

## Receipt Graph Tips

- **Domains** map to business concerns: transaction, content, operations.
- **Relation types** describe causality (CAUSES, EVIDENCES, FULFILLS, AMENDS, INVALIDATES).
- **Depth limits** follow your pricing tier; upgrade when chains require deeper evidence.
- Use `/api/v1/receipts/graph/[id]` to fetch full ancestry and `/api/v1/receipts/graph/analytics` for completeness metrics.

## Verification & Compliance

- JWKS endpoint: `https://certnode.io/.well-known/jwks.json`
- Signatures can be verified offline with JOSE libraries.
- Export evidence packs from the dashboard (Enterprise tier) for regulators, banks, or arbitration teams.

## Need Help?

- Protocol engineering: `contact@certnode.io`
- Support steward: [https://certnode.io/support](https://certnode.io/support)
- Status page: [https://certnode.io/status](https://certnode.io/status)

Welcome to the universal receipt protocol. Your entire ecosystem can now prove what happened.
