# ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ **The Billion Dollar CertNode Blueprint**

*Strategic roadmap for building CertNode into a billion-dollar receipt infrastructure empire*

## ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ **STRATEGIC CONTEXT UPDATE (Sept 2025)**

**HYBRID EXECUTION APPROACH CONFIRMED:**
- **Foundation:** Professional infrastructure (Trust center, JWKS rotation, enterprise security)
- **Vision:** Universal receipt standard (not SaaS service)
- **Positioning:** Protocol owner building ecosystem (like Stripe for payments)
- **Revenue Model:** Infrastructure usage-based pricing (avoid SaaS ceiling)

**KEY INSIGHT:** ChatGPT audit = Perfect Phase 1 foundation, but execute with billion-dollar infrastructure mindset, not SaaS service mindset.

**CURRENT STATUS:** Executing enterprise-grade infrastructure foundation while maintaining standards positioning for long-term dominance.

## ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ **Phase 1: Prove the Standard Works (0-6 months)**

### **Month 1-2: Foundation & Launch**

#### Roadmap Update (Sept 2025)

- [x] Completed item - Semantic HTML landmarks, progressive demo JS, JSON-LD schema, CSP tightened on /, Core Web Vitals logging, a11y focus styles, mobile haptics
- [ ] ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â¨ CURRENT PRIORITY: Remove inline handlers across all pages to enforce strict CSP globally
- [x] Completed item - Trust Center: externalized JS, JWKS/log rendering with explicit errors, added key summary and last rotation
- [x] Completed item - OpenAPI: confirmed /openapi.json and visible download link in viewer
- [x] Completed item - Pricing: buttons now call /api/create-checkout or redirect appropriately; enterprise lead form posts to /api/leads
- [x] Completed item - CI guards: conflict marker check + endpoint smoke tests (HOST override)
- [ ] ÃƒÂ°Ã…Â¸Ã…Â¡Ã‚Â¨ CURRENT PRIORITY: Remove inline handlers on pricing/openapi/trust pages and enforce strict CSP sitewide
- [ ] Next item - Add copy buttons to quickstarts, Postman collection link, and surface test vectors on site
- [ ] Next item - Unify schema/vitals + add connection status UX sitewide
#### Roadmap Update (Sept 2025)

- [x] Completed item - Encoding normalization across public routes (/verify, /openapi, /pricing, /trust) with UTF-8 stubs/rewrites
- [ ] ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â¨ CURRENT PRIORITY: Extract homepage CSS to web/assets with long-lived caching
- [ ] Next item - Standardize error shape across API routes and sync OpenAPI examples

- [x] Completed item - Payment Link fallback in `/api/create-checkout` to enable sales without secrets
- [x] Completed item - Stripe webhook raw-body handling and CORS exposed headers for usage/rate metrics
- [x] Completed item - Pricing page hero copy: added Stripe checkout and 4-hour key delivery notice (pilot)
- [x] Completed item - Trust Center: resolved merge conflicts; added robust JWKS/rotation fetch with error surfacing
- [x] Completed item - Vercel rewrites: canonical Trust page mapped to cleaned file; Payment Links set across all envs
- [x] Completed item - Pricing copy polish: replaced "Direct founder support" with "Priority support"
- [x] Completed item - Free tier unified at 5,000/month (env + copy)
- [ ] ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ CURRENT PRIORITY: Security (Week 1): HMAC API key validation, composite rate limiting, strict CORS, enhanced security headers
- [x] Completed item - Checkout Sessions enabled with Stripe price IDs (Starter/Pro); success redirects to /account
- [x] Completed item - Introduced Business plan ($499/mo, 2M receipts) in pricing and billing config
- [x] Completed item - Pricing terminology aligned: ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œProfessionalÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â (UI/API)
- [x] Completed item - Audit progress document added at docs/AUDIT_PROGRESS.md
- [ ] ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ CURRENT PRIORITY: Encoding normalization ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ CSS extraction ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ Full API error model standardization (OpenAPI)
- [ ] Next item - Performance (Week 2): static caching + gzip, externalize inline CSS
- [ ] ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ CURRENT PRIORITY: Set Payment Link env vars on Vercel and redeploy; wire CTAs
- [ ] Next item - Unify JWKS source across API/site; minimal account handoff after checkout
- [ ] Next item - Fix visible title encoding artifacts across web pages (index, trust, verify, openapi, pricing)

#### **IMMEDIATE PRIORITY: Professional Infrastructure Foundation**
- [x] **Complete SDKs** - Python, Go, Rust with comprehensive examples
- [x] **Billion-dollar roadmap** documented and committed
- [x] **Agent operating protocols** - AGENTS.md ensures consistent strategic execution
- [x] **ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ COMPLETED: Enterprise-grade site infrastructure**
  - [x] Professional JWKS endpoint with rotation logging
  - [x] Trust center with transparency and governance signals
  - [x] Status page with infrastructure metrics
  - [x] Enterprise security headers (HSTS, CSP, etc.)
  - [x] Interactive OpenAPI with ecosystem positioning
  - [x] Public test vectors for standards compliance
  - [x] Usage metering foundation for infrastructure scaling
- [x] **Standards-first messaging** - Position as universal receipt protocol, not SaaS

#### **Technical Launch**
- [x] **Publish SDKs** to package managers (PyPI, npm, crates.io)
- [x] **Launch CertNode.io** with developer-focused landing page
- [x] **Create receipt viewer** - public tool to verify any CertNode receipt
- [x] **Open source examples** for common use cases (e-commerce, APIs, IoT)

#### **Market Validation** - ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ IN PROGRESS
- [x] **Target 50 early adopters** - fintech startups, crypto projects, API companies
  - ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ **Batch 1 Outreach Created** - 6 personalized emails to Stripe, Coinbase, Plaid, Square, Shopify, Twilio
  - ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ **Launch Week:** Sept 17, 2025 - Ready to send first batch
- [x] **Infrastructure pricing model** - Usage-based for scale, not SaaS tiers
- [x] **Build showcase** - public gallery of companies using CertNode receipts
- [x] **Developer community** - Discord, GitHub discussions, Stack Overflow presence
- [x] **Standards governance signals** - Position as protocol steward, not vendor

#### **Content & Positioning**
- [ ] **"Why Every API Needs Receipts"** - viral developer blog post
- [ ] **Live demos** at developer meetups and conferences
- [ ] **Documentation site** - comprehensive guides for all three SDKs
- [ ] **Case studies** from early customers

### **Month 3-4: Early Traction**

#### **Strategic Partnerships**
- [ ] **Stripe integration** - plugin for payment receipts
- [ ] **Shopify app** - tamper-evident order confirmations
- [ ] **API marketplace** listings (RapidAPI, Postman, etc.)
- [ ] **Framework integrations** - official plugins for Express, Django, etc.

#### **Technical Expansion**
- [ ] **JavaScript SDK** (browser + Node.js)
- [ ] **Mobile SDKs** (iOS Swift, Android Kotlin)
- [ ] **Receipt embedding** - widgets for websites
- [ ] **Webhook infrastructure** - real-time receipt notifications

#### **Metrics to Hit**
- **1,000+ developers** signed up
- **100+ applications** actively generating receipts
- **50,000+ receipts** generated monthly
- **10+ paying customers** (early enterprise deals)

### **Month 5-6: Standard Emergence**

#### **Industry Recognition**
- [ ] **Speaking at conferences** - position as thought leader
- [ ] **Technical papers** - submit to security/cryptography journals
- [ ] **Industry partnerships** - work with trade associations
- [ ] **Media coverage** - TechCrunch, Hacker News, developer podcasts

#### **Infrastructure Scaling**
- [ ] **Multi-region deployment** - global JWKS distribution
- [ ] **Enterprise features** - SLAs, custom domains, white-labeling
- [ ] **Compliance documentation** - SOC 2, GDPR, HIPAA readiness
- [ ] **Performance optimization** - sub-100ms receipt generation

---

## ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â **Phase 2: Make it Inevitable (6-18 months)**

### **Month 7-12: Standards Evolution**

#### **Open Standard Launch**
- [ ] **CertNode RFC** - formal specification document
- [ ] **Reference implementation** - open source core library
- [ ] **Conformance test suite** - validation for other implementations
- [ ] **Standards governance** - CertNode Foundation or similar body

#### **Ecosystem Development**
- [ ] **Enterprise implementations** - work with IBM, Microsoft, AWS to build CertNode services
- [ ] **Industry verticals** - specialized solutions for healthcare, finance, legal
- [ ] **Academic partnerships** - research collaborations on tamper-evident systems
- [ ] **Government adoption** - pilot programs with digital services

#### **Platform Domination**
- [ ] **Big tech partnerships** - Google Cloud, Azure, AWS marketplace
- [ ] **Database integrations** - MongoDB, PostgreSQL, Redis native support
- [ ] **Blockchain bridges** - CertNode receipts on Ethereum, Solana, etc.
- [ ] **IoT platforms** - Arduino, Raspberry Pi, industrial systems

### **Month 13-18: Network Effects**

#### **Critical Mass**
- [ ] **1 million+ receipts** generated daily
- [ ] **10,000+ developers** in ecosystem
- [ ] **500+ companies** using CertNode in production
- [ ] **Multiple implementations** by other vendors

#### **Revenue Diversification**
- [ ] **Certification program** - charge others to be "CertNode Compatible"
- [ ] **Enterprise licensing** - white-label solutions for big platforms
- [ ] **Professional services** - consulting for major implementations
- [ ] **Training programs** - developer certification courses

#### **Market Leadership**
- [ ] **Industry standard** - CertNode becomes the default receipt format
- [ ] **Regulatory adoption** - government agencies recommend CertNode
- [ ] **Legal precedent** - courts accept CertNode receipts as evidence
- [ ] **Media positioning** - "The person who invented digital receipts"

---

## ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â  **Phase 3: Own the Infrastructure (18-36 months)**

### **Month 19-30: Infrastructure Empire**

#### **Ecosystem Control**
- [ ] **Standards body leadership** - chair the CertNode consortium
- [ ] **Premium infrastructure** - best-in-class hosted CertNode service
- [ ] **Enterprise solutions** - on-premise, hybrid cloud deployments
- [ ] **Global partnerships** - work with telcos, governments, enterprises

#### **Technology Evolution**
- [ ] **Quantum-resistant crypto** - future-proof the standard
- [ ] **Performance optimization** - microsecond receipt generation
- [ ] **Advanced features** - receipt analytics, fraud detection, AI insights
- [ ] **Next-gen protocols** - CertNode 2.0 specification

#### **Market Expansion**
- [ ] **International markets** - Europe, Asia, Latin America
- [ ] **New verticals** - healthcare records, legal documents, IoT sensors
- [ ] **B2B2C platforms** - every SaaS company offers CertNode receipts
- [ ] **Consumer applications** - CertNode wallet, receipt manager apps

### **Month 31-36: Billion Dollar Exit**

#### **Strategic Options**
- [ ] **IPO preparation** - if market is $1B+ annual revenue
- [ ] **Strategic acquisition** - by Stripe, Microsoft, or similar
- [ ] **Private equity** - growth capital for global expansion
- [ ] **Continue building** - own the entire receipt infrastructure forever

#### **Legacy Positioning**
- [ ] **Industry standard** - CertNode is synonymous with digital receipts
- [ ] **Infrastructure moat** - network effects make competition impossible
- [ ] **Global presence** - CertNode receipts generated in every country
- [ ] **Next innovations** - what comes after receipts?

---

## ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â° **Revenue Trajectory**

### **Year 1: $1M ARR**
- 1,000 paying customers
- Average $83/month
- Freemium conversion + early enterprise

### **Year 2: $25M ARR**
- 10,000 paying customers
- Platform partnerships
- Enterprise licensing deals

### **Year 3: $250M ARR**
- Standards ecosystem revenue
- Global enterprise deployments
- Multiple revenue streams

### **Year 4+: $1B+ Valuation**
- Infrastructure monopoly
- Network effects at scale
- Exit opportunities emerge

---

## ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ **Success Metrics by Phase**

### **Phase 1 Success:**
- CertNode receipts are recognized as "the way" to do tamper-evident receipts
- Developer ecosystem momentum is undeniable
- Early enterprise traction proves business model

### **Phase 2 Success:**
- Multiple vendors implement CertNode standard
- Industry leaders publicly endorse approach
- Network effects make CertNode inevitable

### **Phase 3 Success:**
- CertNode is infrastructure, like TCP/IP or HTTP
- You own the premium layer of global receipt infrastructure
- Billion dollar valuation reflects monopoly position

---

## ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â  **Market Opportunity**

### **Total Addressable Market**
- **E-commerce transactions:** $6 trillion globally
- **Digital payments:** $8 trillion annually
- **B2B transactions:** $20+ trillion
- **Government/compliance:** Massive regulatory markets

### **Infrastructure Precedents**
- **Stripe** ($95B valuation) - Payment infrastructure
- **Twilio** ($25B) - Communication infrastructure
- **Auth0** (sold for $6.5B) - Authentication infrastructure
- **Certificate Authorities** - Multi-billion trust infrastructure

### **Revenue Model Evolution**
1. **SaaS Phase:** Direct customer billing ($1-25M ARR)
2. **Platform Phase:** Enterprise licensing and partnerships ($25-250M ARR)
3. **Infrastructure Phase:** Standards ecosystem and certification ($250M+ ARR)

---

## ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ **Core Value Proposition**

**"Every digital transaction deserves a tamper-evident receipt"**

- **For Developers:** Simple SDKs to add receipt functionality to any application
- **For Businesses:** Bulletproof audit trails and customer trust
- **For Industries:** Compliance-ready infrastructure for regulated environments
- **For Consumers:** Permanent, verifiable proof of digital transactions

---

## ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ **Why This Will Win**

### **Technical Advantages**
- **RFC-compliant implementation** - Built on proven cryptographic standards
- **Cross-platform compatibility** - Works everywhere, any language
- **Performance optimized** - Sub-second receipt generation at scale
- **Security first** - Tamper-evident by design, not bolt-on feature

### **Market Timing**
- **Digital transformation** accelerating across all industries
- **Audit requirements** increasing due to regulations
- **Trust deficit** in digital transactions
- **Developer tooling** expectations rising

### **Competitive Moat**
- **Network effects** - More users = more valuable standard
- **Switching costs** - Receipts are permanent, hard to migrate
- **Standards ownership** - Control the entire ecosystem
- **Technical complexity** - High barrier to entry for competitors

---

## ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ **Immediate Next Steps**

### **Week 1-2**
1. **Publish SDKs** to package managers
2. **Launch simple landing page** at certnode.io
3. **Create GitHub organization** with open source repositories
4. **Write initial blog post** announcing CertNode

### **Month 1**
1. **Build developer community** (Discord, GitHub discussions)
2. **Create documentation site** with comprehensive guides
3. **Develop partnership pipeline** (Stripe, Shopify, etc.)
4. **Start speaking at developer meetups**

### **Quarter 1**
1. **Hit 1,000 developers** using CertNode
2. **Land first 10 enterprise customers**
3. **Generate 50,000+ receipts** monthly
4. **Establish thought leadership** in receipt/audit space

---

## ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ **Mission Statement**

*To make every digital transaction verifiable, permanent, and trustworthy through universal adoption of tamper-evident receipts, ultimately creating the foundational infrastructure for global digital commerce.*

---

**Generated:** January 2025
**Author:** Steven Bryant
**Vision:** Billion-dollar receipt infrastructure empire
**Timeline:** 36 months to exit
**Status:** Ready to execute Phase 1

ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ **Let's build the future of digital receipts!**

- [x] Completed item - Stripe Checkout branding documented to show CertNode (Dashboard > Settings > Branding/Public info/Descriptor)
- [ ] Next item - Optional: add Stripe API branding verifier script for CI reminder
- [x] Completed item - Added Stripe branding verifier script (npm run stripe:branding:check)
- [x] Completed item - OpenAPI inline JS removed; viewer now externalized + CSP-friendly
- [x] Completed item - Copy-to-clipboard for code snippets on Home/Spec
- [x] Completed item - Pricing UX: disable/Redirecting state and error restore
- [x] Completed item - Trust page aria-live for outputs
- [x] Completed item - Site-wide CSP updated to allow only self + unpkg for scripts
- [ ] 🚨 CURRENT PRIORITY: Remove remaining inline handlers sitewide and move any inline scripts to external files
- [ ] Next item - Add Manage Billing/Portal link in Account nav and validate post-purchase state
