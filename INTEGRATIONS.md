# CertNode Turnkey Integrations

Automatic receipt creation from popular platforms. Configure your platform to send webhooks to CertNode, and we'll automatically create cryptographically-linked receipts.

## Supported Platforms

### 🎓 High-Ticket Sales & Course Platforms
- **Kajabi** - Courses, coaching, memberships
- **Teachable** - Online courses
- Thinkific, Podia (coming soon)

### 🛒 E-Commerce
- **Shopify** - Online stores
- **WooCommerce** - WordPress e-commerce
- BigCommerce, Magento (coming soon)

### 💳 Payments
- **Stripe** - Payments, subscriptions, disputes
- PayPal, Square (coming soon)

### 📦 Shipping & Logistics
- **Shippo** - Multi-carrier shipping
- **ShipStation** - Order fulfillment
- EasyPost, FedEx, UPS (coming soon)

---

## How It Works

1. **Configure webhook** in your platform (Kajabi, Shopify, etc.)
2. **Point to CertNode** integration endpoint
3. **Receipts created automatically** for every event (payment, login, delivery, etc.)
4. **Receipts linked** to create a complete audit trail

---

## Setup Guides

### Kajabi Integration

**What gets tracked:**
- ✅ Offer purchased → Transaction receipt
- ✅ Member logged in → Operations receipt
- ✅ Lesson viewed → Content receipt
- ✅ Course completed → Content receipt
- ✅ Assessment submitted → Content receipt

**Setup steps:**

1. **In Kajabi Admin:**
   - Settings → Webhooks → Add Webhook
   - URL: `https://certnode.io/api/integrations/kajabi`
   - Events: Select all (or specific events you want)
   - Secret: Your CertNode API key

2. **In CertNode Dashboard:**
   - Settings → Integrations → Kajabi
   - Paste your API key
   - Save

3. **Test the integration:**
   - Make a test purchase or login in Kajabi
   - Check CertNode dashboard for new receipts

**Receipt graph example:**
```
Payment ($15K) → Course Access → Login → Lesson Viewed → Assessment Submitted → Course Completed
```

When a student disputes: "Never got access", you have **cryptographic proof** of their entire journey.

---

### Shopify Integration

**What gets tracked:**
- ✅ Order created → Transaction receipt
- ✅ Order fulfilled → Operations receipt (with tracking)
- ✅ Refund created → Transaction receipt (linked to order)
- ✅ Dispute filed → Operations receipt
- ✅ Checkout abandoned → Operations receipt

**Setup steps:**

1. **In Shopify Admin:**
   - Settings → Notifications → Webhooks → Create webhook
   - Event: Select event (e.g., "Order creation")
   - URL: `https://certnode.io/api/integrations/shopify`
   - Format: JSON
   - API version: Latest

2. **Repeat for all events:**
   - orders/create
   - orders/fulfilled
   - refunds/create
   - disputes/create
   - checkouts/create

3. **Verify webhooks:**
   - Test an order
   - Check CertNode dashboard for receipts

**Receipt graph example:**
```
Order ($150) → Fulfillment (FedEx #123) → Delivery Photo → Chargeback → Evidence Submitted
```

---

### Stripe Integration

**What gets tracked:**
- ✅ Charge succeeded → Transaction receipt
- ✅ Charge refunded → Transaction receipt (linked)
- ✅ Dispute created → Operations receipt
- ✅ Dispute updated → Operations receipt
- ✅ Subscription created → Transaction receipt
- ✅ Invoice paid → Transaction receipt

**Setup steps:**

1. **In Stripe Dashboard:**
   - Developers → Webhooks → Add endpoint
   - Endpoint URL: `https://certnode.io/api/integrations/stripe`
   - Events: Select all or specific events
   - API version: Latest

2. **Get webhook secret:**
   - Copy the signing secret (starts with `whsec_`)
   - Paste in CertNode dashboard

3. **Test the integration:**
   - Make a test charge
   - Check CertNode for receipt

**Receipt graph example:**
```
Charge ($500) → Invoice Paid → Subscription Renewed → Refund Requested → Refund Processed
```

---

### Shippo/ShipStation Integration

**What gets tracked:**
- ✅ Shipping label created → Content receipt
- ✅ Tracking updated → Operations receipt
- ✅ Delivered → Operations receipt
- ✅ Delivery exception → Operations receipt

**Setup (Shippo):**

1. **In Shippo Dashboard:**
   - Settings → Webhooks → Add webhook
   - URL: `https://certnode.io/api/integrations/shippo`
   - Events: All

2. **Webhooks fire automatically** when you create labels via Shippo

**Setup (ShipStation):**

1. **In ShipStation:**
   - Settings → Integrations → Webhooks
   - Target URL: `https://certnode.io/api/integrations/shipstation`
   - Select events: SHIP_NOTIFY, ITEM_SHIP_NOTIFY

**Receipt graph example:**
```
Order → Shipping Label (FedEx) → In Transit → Out for Delivery → Delivery Photo → Signed
```

---

## Receipt Linking

All integration receipts are **automatically linked** to form a complete graph:

### E-commerce Example
```
Shopify Order → Shippo Label → FedEx Tracking → Delivery → Stripe Chargeback → Evidence
```

Every receipt links to the previous one, creating an **unbreakable chain of proof**.

### High-Ticket Example
```
Kajabi Purchase → Course Access → 47 Logins → 12 Lessons → 8 Downloads → Refund Request
```

When a customer claims "never got access", you show them **their own activity log**, cryptographically signed.

---

## API Endpoints

All integrations are available at:
```
https://certnode.io/api/integrations/{platform}
```

**Available endpoints:**
- `/api/integrations/kajabi`
- `/api/integrations/shopify`
- `/api/integrations/stripe`
- `/api/integrations/shippo`
- `/api/integrations/shipstation`
- `/api/integrations/teachable`
- `/api/integrations/woocommerce`

**Authentication:**
Include your CertNode API key in the platform webhook settings.

**Testing:**
All integrations return:
```json
{
  "success": true,
  "receipt_id": "rcpt_abc123",
  "message": "Receipt created for order.created"
}
```

---

## Custom Integrations

Don't see your platform? You can build custom integrations using the CertNode API.

### Example: Custom Webhook Handler

```javascript
// Your server receives platform webhooks
app.post('/my-platform-webhook', async (req, res) => {
  const event = req.body;

  // Create CertNode receipt
  await fetch('https://certnode.io/api/receipts', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer sk_live_YOUR_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      domain: 'operations',
      type: 'custom-event',
      data: event,
      parentIds: [] // Or link to previous receipt
    })
  });

  res.json({ success: true });
});
```

---

## Support

Questions about integrations?
- **Technical support:** https://certnode.io/support
- **Email:** contact@certnode.io
- **Documentation:** https://certnode.io/docs

---

## Roadmap

Coming soon:
- Auth0/Clerk (authentication logs)
- YouTube (content verification)
- Vimeo (video hosting)
- Substack (content publishing)
- Calendly (appointment scheduling)
- Zoom (session recordings)

Request an integration: contact@certnode.io
