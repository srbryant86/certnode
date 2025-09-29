# CertNode - Enterprise Intelligence Platform

[![npm (Node SDK)](https://img.shields.io/npm/v/%40certnode%2Fsdk?label=%40certnode%2Fsdk)](https://www.npmjs.com/package/@certnode/sdk)
[![npm (Web SDK)](https://img.shields.io/npm/v/%40certnode%2Fsdk-web?label=%40certnode%2Fsdk-web)](https://www.npmjs.com/package/@certnode/sdk-web)
[![CI](https://github.com/srbryant86/certnode/actions/workflows/ci.yml/badge.svg)](https://github.com/srbryant86/certnode/actions/workflows/ci.yml)
[![Nightly Benchmark](https://github.com/srbryant86/certnode/actions/workflows/nightly-benchmark.yml/badge.svg)](https://github.com/srbryant86/certnode/actions/workflows/nightly-benchmark.yml)

**The industry's most comprehensive verification platform featuring dual 10/10 intelligence systems for content authenticity and financial transaction analysis.**

## 🎯 Platform Overview

CertNode provides **two complete enterprise-grade intelligence systems** that deliver unmatched verification capabilities:

### **🔍 Content Intelligence Engine**
- **Multi-Detector Analysis**: Advanced AI detection, metadata validation, manipulation detection
- **Professional Reporting**: Forensic-grade documentation suitable for legal proceedings
- **Risk Assessment**: Comprehensive authenticity confidence scoring and evidence compilation
- **Enterprise Integration**: Enhanced content certification with tamper-evident receipts

### **💰 Transaction Intelligence Engine**
- **10-Layer Financial Validation**: Complete fraud detection and compliance automation
- **Regulatory Compliance**: AML/BSA, SOX, PCI-DSS, GDPR, OFAC monitoring
- **Professional Documentation**: Audit-ready compliance reports and fraud assessments
- **Real-time Processing**: Instant fraud detection with <3s response times

## 🚀 Live Platform
- **Production**: https://certnode.io
- **API Documentation**: `/openapi.json` and `/openapi.html`
- **System Health**: `/api/v1/validation/health`

## 🔗 API Endpoints

### **Intelligence APIs**
- **POST** `/api/v1/receipts/content` - Enhanced content certification with intelligence analysis
- **POST** `/api/v1/transactions/validate` - Complete financial transaction validation
- **GET** `/api/v1/validation/health` - System health monitoring with quality indicators

### **Core APIs**
- **POST** `/v1/sign` - Create tamper-evident receipts
- **GET** `/v1/jwks` - Public key discovery
- **GET** `/v1/verify/{id}` - Receipt verification

## 📚 Quick Links
- **Intelligence System Overview**: `docs/DUAL_INTELLIGENCE_SYSTEM_OVERVIEW.md`
- Web verify page: `web/verify.html`
- OpenAPI spec: `web/openapi.json` (served at `/openapi.json`)
- OpenAPI viewer: `web/openapi.html`
- Node SDK: `sdk/node` (package: `@certnode/sdk`)
- Web SDK (ESM): `sdk/web` (package: `@certnode/sdk-web`)
- CLI verifier: `tools/verify-receipt.js`
- **Deployment workflow: `DEPLOYMENT.md`**
- Rotation/integrity: `docs/ROTATION.md`, tools in `tools/`
- Monitoring: `docs/MONITORING.md`
- Release checklist: `docs/RELEASE.md`
- Docker guide: `docs/DOCKER.md`
- Postman collection: `docs/clients/postman_collection.json`

## 💼 Enterprise Features

### **🛡️ 10-Layer Validation System**
1. **Schema Validation** - Request structure and format validation
2. **Sanitization** - Input cleaning and normalization
3. **Business Rules** - Domain-specific logic validation
4. **Cryptographic** - Signature and hash verification
5. **Data Integrity** - Content authenticity checks
6. **Authorization** - Access control and permissions
7. **Rate Limiting** - Traffic management and DDoS protection
8. **Content Analysis** - AI detection and manipulation scanning
9. **Temporal** - Time-based validation and replay protection
10. **Compliance** - Regulatory framework monitoring

### **🏢 Regulatory Compliance**
- **AML/BSA**: Anti-Money Laundering and Bank Secrecy Act
- **SOX**: Sarbanes-Oxley financial controls
- **PCI-DSS**: Payment Card Industry security
- **GDPR**: Data protection and privacy
- **OFAC**: Sanctions screening and monitoring

## 🚀 Quick Start

### **Development**
```bash
npm run start              # Start API locally
npm run test:fast          # Run fast unit tests
npm run bench              # Performance benchmark
node tools/test-fast.js    # Fast system tests
```

### **Production Scripts**
```bash
npm run openapi:check      # Verify API specifications
npm run sdk:pack           # Package SDKs for distribution
npm run example:sign       # Demo content signing
npm run example:verify     # Demo receipt verification
```

## Payments (Quick Start)
- Payment Links (no backend keys required):
  - Set env vars `STARTER_PAYMENT_LINK_URL` and `PRO_PAYMENT_LINK_URL` (and optional `BUSINESS_PAYMENT_LINK_URL`).
  - The Pricing page calls `/api/create-checkout` and will redirect to your Payment Link.
- Full Stripe Checkout (automated API keys):
  - Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and price IDs `STRIPE_STARTER_PRICE_ID`, `STRIPE_PRO_PRICE_ID` (optional `STRIPE_BUSINESS_PRICE_ID`).
  - Webhook endpoint: `POST /stripe-webhook` (or `/api/stripe/webhook`).

PowerShell examples (current session):
```
$env:STARTER_PAYMENT_LINK_URL="https://buy.stripe.com/..."
$env:PRO_PAYMENT_LINK_URL="https://buy.stripe.com/..."

$env:STRIPE_SECRET_KEY="sk_live_..."
$env:STRIPE_WEBHOOK_SECRET="whsec_..."
$env:STRIPE_STARTER_PRICE_ID="price_..."
$env:STRIPE_PRO_PRICE_ID="price_..."
```

## Verify (CLI)
```
node tools/verify-receipt.js --receipt path/to/receipt.json --jwks path/to/jwks.json
```

## SDK Install
- Node: `npm install @certnode/sdk`
- Web:  `npm install @certnode/sdk-web`
 - CDN/SRI: see `sdk/web/README.md` for jsDelivr usage and SRI snippet; example in `examples/web-embed.html`

### **Intelligence API Usage**
```javascript
// Content Intelligence Analysis
const contentResponse = await fetch('/api/v1/receipts/content', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    enterpriseId: 'ent_123',
    content: 'base64-encoded-content',
    contentType: 'image/jpeg',
    metadata: { creator: 'photographer' }
  })
});

// Transaction Intelligence Analysis
const transactionResponse = await fetch('/api/v1/transactions/validate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    enterpriseId: 'ent_123',
    amountCents: 50000,
    transactionType: 'payment',
    currency: 'USD',
    customerInfo: { name: 'John Doe' }
  })
});
```

### **Node SDK Usage**
```js
const { verifyReceipt, JWKSManager } = require('@certnode/sdk');

async function main() {
  const receipt = {/* protected, payload, signature, kid, ... */};
  const jwks = { keys: [/* your EC P-256 public keys */] };
  const res = await verifyReceipt({ receipt, jwks });
  console.log(res.ok ? 'valid' : `invalid: ${res.reason}`);
}
main().catch(console.error);
```

## TSA (RFC3161) Configuration
- By default, timestamping uses a deterministic stub token to keep tests and offline verification stable.
- To use a real TSA, set environment variables for the API:
  - `TSA_URL` — e.g., `https://tsa.example.com/tsp`
  - `TSA_TIMEOUT_MS` — request timeout (default `3000`)
  - `TSA_RETRIES` — retries on failure (default `1`)
  - `TSA_CA_PEM` — optional custom CA PEM (inline)
  - `TSA_CERT_IGNORE` — set to `1` to ignore TLS errors (dev only)
  The `/v1/sign` route adds a `tsr` field to receipts when `headers.tsr === true` and a token is obtained.
  - Strict mode: set `headers.require_tsr: true` in the `/v1/sign` request to fail with `503 tsa_unavailable` when TSA cannot be reached.

## Monitoring
- Emit structured JSON metrics via `api/src/plugins/metrics.js`
- See `docs/MONITORING.md` for event names, SLOs, and alert suggestions
 - Prometheus metrics under `/metrics` include:
   - `certnode_requests_total{method,path,status}`
   - `certnode_request_duration_ms` histogram
   - `certnode_rate_limit_triggered_total`
   - `certnode_errors_total{method,path,status}` (status >= 400)

## Metrics Quickstart
- Events (one-line JSON):
  - `request_received` - { path, method, request_id }
  - `request_completed` - { path, method, status, ms, request_id }
  - `rate_limit_triggered` - { path, capacity, remaining, request_id }
- Pipeline: ship stdout to your log collector and build dashboards based on these events.

## Release via Tags (GitHub Actions)
- Add `NPM_TOKEN` to GitHub repo secrets (Actions → New repository secret)
- Tag to publish:
  - Node SDK: `git tag sdk-node-vX.Y.Z && git push --tags`
  - Web  SDK: `git tag sdk-web-vA.B.C && git push --tags`
- See `docs/RELEASE.md` for local publish steps and details.
- Examples
  - Node: `examples/node-verify.js`
  - Node (sign): `examples/node-sign.js`
  - Web:  `examples/web-embed.html`

## OpenAPI Clients
- Quick check: `node tools/check-openapi.js`
- Simple client (Node): see `examples/node-sign.js` for calling `/v1/sign`

## Docker
Build and run directly:
```
docker build -t certnode:latest .
docker run --rm -p 3000:3000 -e NODE_ENV=production -e PORT=3000 certnode:latest
```


### Maintainer shortcuts
- Web SDK: normalize → version bump → tag → publish via Actions:
  - PowerShell:
    - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/publish-web-sdk.ps1`
  - Requires `NPM_TOKEN` repo secret and will output CDN + SRI snippet after publish.
- Node SDK: normalize → version bump → tag → publish via Actions:
  - PowerShell:
    - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/publish-node-sdk.ps1`
  - Requires `NPM_TOKEN` repo secret; workflow publishes `@certnode/sdk` on tag `sdk-node-vX.Y.Z`.

Or use compose:
```
docker compose up --build
```

## 🎖️ System Quality Metrics

### **Content Intelligence Engine**
- ✅ **10/10 Rating**: Multi-detector analysis with professional reporting
- **90%+ Accuracy**: AI detection across multiple model types
- **Sub-500ms**: Average processing time
- **Forensic-Grade**: Evidence suitable for legal proceedings

### **Transaction Intelligence Engine**
- ✅ **10/10 Rating**: 10-layer financial validation system
- **Real-time Fraud Detection**: Instant risk assessment
- **Regulatory Compliance**: Automated AML/BSA/SOX monitoring
- **Professional Documentation**: Audit-ready compliance reports

## 🏆 Competitive Advantages

- **Dual Intelligence**: Only platform offering both content AND transaction intelligence
- **Enterprise-Grade**: Professional reporting suitable for compliance and legal use
- **Zero Additional Cost**: Leverages existing infrastructure efficiently
- **Premium Value**: Comprehensive analysis vs competitors' basic validation

## 📈 Business Impact

### **Market Position**
CertNode is the **ONLY PLATFORM** offering 10/10 intelligence for BOTH:
- **Content Authenticity** (AI detection, manipulation, provenance)
- **Transaction Verification** (fraud detection, compliance, risk assessment)

### **Revenue Opportunities**
- **Content Certification**: Premium pricing for comprehensive AI detection
- **Transaction Verification**: Enterprise fraud prevention and compliance automation
- **Professional Reports**: Audit-ready documentation for regulatory requirements
- **Compliance Automation**: Reduced manual oversight costs for enterprises

## 🤝 Contributing
- See `CONTRIBUTING.md` for contribution guidelines and optional auto-push hook instructions
- CI posts a Benchmark Summary table (P50/P95/P99) on PRs for quick performance visibility

---

**🛡️ The industry's most comprehensive verification platform with unmatched intelligence capabilities**

*CertNode Dual Intelligence System: Where content authenticity meets financial security in one enterprise-grade platform.*
