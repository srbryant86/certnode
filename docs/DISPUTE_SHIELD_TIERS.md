# CertNode Dispute Shield: Pro vs Elite

**Last Updated:** 2024-09-30
**Status:** Production Ready

---

## Core Positioning

**Pro ($12,000/year):** Complete dispute defense for growing businesses
**Elite ($30,000/year):** Enterprise-grade protection with performance guarantees

---

## The 5 Core Differentiators

### 1. Coverage & Scale

#### Pro
- GMV up to **$2M/year**
- **1 merchant ID / brand**
- All Visa/MC/Amex/Discover core reason codes
- Standard receipt graph depth (10 levels)
- Transaction, content, and operations receipts

#### Elite
- GMV up to **$10M/year** (custom pricing above)
- **Up to 5 merchant IDs / brands**
- All reason codes + friendly fraud patterns + subscription disputes
- **Unlimited receipt graph depth**
- Transaction, content, and operations receipts

**Self-selection:** Businesses know their GMV. No confusion about which tier fits.

---

### 2. Evidence Delivery SLA

#### Pro
- Evidence pack ready within **48 hours** of dispute notification
- Business hours support (Mon-Fri, 9am-6pm ET)
- Standard queue
- Automated evidence generation

#### Elite
- Evidence pack ready within **24 hours** (priority queue)
- **Direct support line** to CertNode founder
- After-hours escalation for critical disputes
- Pre-submission evidence review before filing
- Manual QA on all evidence packs

**Why it matters:** Dispute deadlines are tight. Faster turnaround = higher win rate.

---

### 3. Implementation & Integration

#### Pro
- **Onboarding workshop** (2 hours)
- Standard evidence templates
- Receipt Graph API integration guide
- Webhook setup
- Self-service documentation
- Email/chat support for setup

#### Elite
- **Deep operations audit** (full week engagement):
  - Sales process review (checkout flow, scripts, recordings)
  - Policy documentation analysis
  - Customer communication audit
  - Evidence gap identification
- **Custom integrations:**
  - CRM/helpdesk connectors (Stripe, Shopify, Salesforce, Zendesk, Intercom)
  - Custom data pipelines (SFTP, S3, direct database)
  - BI feed setup (weekly analytics exports)
- **White-glove migration** from existing dispute tools
- Dedicated setup engineer

**Why it matters:** Elite customers have complex systems. Self-service won't cut it.

---

### 4. Strategic Support & Optimization

#### Pro
- **Quarterly business reviews** (QBR)
  - Win/loss analysis
  - Chargeback rate trends
  - Evidence effectiveness review
- Evidence template updates (as processors change requirements)
- Email support
- Standard reporting dashboard

#### Elite
- **Monthly optimization sessions** (30 min)
  - Real-time cohort analysis
  - A/B testing evidence variations
  - Reason code pattern analysis
  - Processor-specific recommendations
- **Quarterly executive briefing** (C-suite ready)
- **Payment processor advocacy:**
  - Direct coordination with your acquirer/processor
  - Joint evidence alignment sessions
  - Processor requirement updates (direct from source)
  - Escalation support for pattern disputes
- **Team training** (up to 3 sessions/year):
  - CS team dispute prevention
  - Evidence collection best practices
  - Internal certification program

**Why it matters:** Pro customers manage disputes. Elite customers prevent them strategically.

---

### 5. Performance Guarantee

#### Pro
- Best-effort service
- Industry-standard evidence practices
- No performance commitments
- Standard SLA compliance

#### Elite
- **Performance commitment:** Achieve ≥30% improvement in dispute win rate vs. 60-day baseline
- **Service credit:** Up to **15% annual fee credit** ($4,500) if targets missed*
- Quarterly performance attestation report
- Root-cause analysis if goals not met
- Continuous optimization until targets achieved

***Conditions for service credit:**
- Evidence kits used for ≥90% of eligible disputes
- Processor accepts CertNode evidence format (we ensure this during onboarding)
- Customer provides timely access to dispute data
- Not an insurance product; credit only applies if service delivery was compliant

**Why it matters:** Elite pays 2.5× more. They get skin-in-the-game assurance.

---

## Feature Comparison Table

| Feature | **Pro — $12k/yr** | **Elite — $30k/yr** |
|---------|------------------|---------------------|
| **GMV Coverage** | Up to $2M/year | Up to $10M/year |
| **Merchant IDs** | 1 | Up to 5 |
| **Evidence SLA** | 48 hours | **24 hours (priority)** |
| **Support** | Business hours, email | **Direct support line + escalation** |
| **Implementation** | 2-hour workshop | **Full week operations audit** |
| **Integrations** | Standard webhooks | **Custom CRM/data pipelines** |
| **Business Reviews** | Quarterly | **Monthly + Executive QBR** |
| **Processor Advocacy** | Template updates | **Direct processor coordination** |
| **Team Training** | Documentation | **3 live sessions/year** |
| **Performance Guarantee** | Best-effort | **30% improvement or 15% credit** |
| **Receipt Graph Depth** | 10 levels | Unlimited |
| **Evidence QA** | Automated only | **Manual review + QA** |

---

## Stripe Product Setup

### Product Names
```
certnode-dispute-shield-pro-annual
certnode-dispute-shield-elite-annual
```

### Pro Metadata
```json
{
  "plan_id": "pro",
  "gmv_ceiling": "2000000",
  "evidence_sla_hours": "48",
  "merchant_ids_included": "1",
  "graph_depth_limit": "10",
  "performance_guarantee": "false",
  "direct_support": "false",
  "processor_advocacy": "template_updates"
}
```

### Elite Metadata
```json
{
  "plan_id": "elite",
  "gmv_ceiling": "10000000",
  "evidence_sla_hours": "24",
  "merchant_ids_included": "5",
  "graph_depth_limit": "unlimited",
  "performance_guarantee": "true",
  "service_credit_pct": "15",
  "direct_support": "true",
  "processor_advocacy": "full_coordination"
}
```

---

## Sales Talk Tracks

### Pro (15 seconds)
"Complete dispute defense: evidence automation with Receipt Graph, 48-hour turnaround, quarterly optimization—everything you need up to $2M in sales."

### Elite (15 seconds)
"White-glove program: 24-hour priority SLAs, direct support line, processor advocacy, custom integrations, and a performance guarantee. Built for businesses doing $2-10M."

### Upgrade Path (Pro → Elite)
"As you scale past $2M, Elite gives you faster SLAs, unlimited graph depth, monthly optimization, and direct processor advocacy—plus a performance guarantee."

---

## What You're Actually Delivering (Internal)

### Pro - Time Commitment per Customer
- **Onboarding:** 1-2 hours (call + setup)
- **Ongoing support:** 5-10 hours/year (email, bug fixes)
- **Quarterly review:** 30 min (automated report + email)
- **Total:** ~10 hours/year per customer

**Capacity:** Can handle 20+ Pro customers solo (~200 hours/year = 4 hours/week)

### Elite - Time Commitment per Customer
- **Onboarding:** 40-60 hours (full week audit + custom integrations)
- **Monthly calls:** 6 hours/year (30 min × 12)
- **Processor coordination:** 4-8 hours (one-time or as-needed)
- **Priority support:** 20-30 hours/year (faster response, evidence QA)
- **Training sessions:** 6 hours/year (3 sessions × 2 hours)
- **Total:** ~100 hours/year per customer (60 first month + 40 rest of year)

**Capacity:** Can handle 5-6 Elite customers solo (~500 hours/year = 10 hours/week)

### Realistic Starting Mix
- **2-3 Elite customers:** $60-90K
- **8-10 Pro customers:** $96-120K
- **Total:** $156-210K/year while working solo

---

## What You're NOT Doing (Set Expectations)

❌ **NOT** managing their disputes for them (they submit to processor)
❌ **NOT** providing legal advice (evidence preparation only)
❌ **NOT** guaranteeing dispute outcomes (guarantee is service delivery)
❌ **NOT** 24/7 instant support (escalation = same-day response, not instant)
❌ **NOT** custom software features beyond integrations
❌ **NOT** processing payments (they use their existing processor)

---

## The Real Value Proposition

Both tiers get the **same Receipt Graph platform**:
- Transaction receipts (payment proof)
- Content receipts (delivery/service proof)
- Operations receipts (process compliance proof)
- Cryptographic linking across all three

**The difference is implementation intensity:**

- **Pro:** Self-service with support when needed
- **Elite:** We personally help you maximize it

You're selling **your expertise** and **implementation depth**, not different software.

---

## Upsell Triggers (Pro → Elite)

Watch for these signals to recommend Elite upgrade:

1. Customer hits **$1.5M GMV** (approaching Pro limit)
2. Chargeback rate **>1%** (needs optimization)
3. Asks for **custom integration** (CRM, helpdesk)
4. Wants **processor advocacy** (alignment meetings)
5. Adds **2nd merchant ID** (Elite includes 5)
6. Requests **faster SLA** (critical disputes)
7. Needs **monthly reporting** for board/investors

---

## Custom/Enterprise (Above $10M GMV)

For customers exceeding $10M GMV:

- Start with Elite as base
- Custom pricing based on:
  - GMV volume
  - Number of merchant IDs
  - Custom SLA requirements
  - White-label needs
  - API rate limits
- Minimum: $50K/year
- Typical: $75-150K/year

Contact sales for custom quote.

---

## Competitive Differentiation

**vs Veriff/Onfido (identity verification):**
- They verify users; we prove the entire transaction chain

**vs Sift/Ravelin (fraud prevention):**
- They prevent fraud; we provide evidence after disputes happen

**vs Signifyd/NoFraud (chargeback insurance):**
- They insure; we provide cryptographic proof (better for customer relationship)

**vs Stripe Radar (fraud detection):**
- They decline suspicious transactions; we prove legitimate ones

**CertNode is the only platform that:**
1. Connects transaction + content + operations in one graph
2. Provides cryptographic evidence chain
3. Offers performance guarantees on dispute outcomes
4. Direct processor advocacy

---

## Legal/Compliance Notes

**Include in all contracts:**

1. "CertNode provides evidence preparation services, not legal advice."
2. "Service credit applies only if evidence kits are used for ≥90% of eligible disputes and CertNode's service delivery meets stated SLAs."
3. "Performance guarantee is based on evidence quality, not dispute outcomes, which are determined by payment processors and card networks."
4. "Not an insurance product. No reimbursement for lost disputes."
5. "Customer retains all responsibility for dispute submission and processor communication."

---

## Next Steps

1. ✅ Create Stripe products with metadata
2. ✅ Update pricing page with comparison table
3. ✅ Create onboarding templates (Pro vs Elite)
4. ✅ Build evidence SLA monitoring
5. ✅ Create quarterly/monthly review templates
6. ✅ Document processor advocacy process
7. ✅ Build performance tracking dashboard
8. ✅ Create service credit calculation logic

---

**This is production-ready.** The differentiation is clear, deliverable, and defensible. Ship it.
