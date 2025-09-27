# CertNode Unified Platform Implementation Plan

**Last Updated:** 2025-09-27
**Vision:** Complete cryptographic infrastructure for digital trust across three pillars
**Timeline:** 6 weeks to full platform launch

---

## Platform Taxonomy & Vision

### CertNode: Cryptographic Infrastructure for Digital Trust

**Three Pillars of Trust:**

1. **🔄 Content Authenticity (media)** → Assets with a file hash you intend to publish/share
   - Image/video/audio/text/document certification
   - C2PA manifests / provenance chains
   - AI detector scores (in-house, proprietary)
   - File hash verification with cryptographic receipts

2. **✅ Transactions (commerce)** → Events around a sale or payout *(LIVE)*
   - Payment receipts, affiliate attribution receipts
   - Consent/offer disclosure acceptance
   - Digital-fulfillment/delivery proof

3. **⏳ Operational Trust (compliance/dev)** → Controls & system integrity *(PLANNED)*
   - Incident & SLA receipts
   - Build/release provenance (SLSA, SBOM)
   - Report/export integrity receipts
   - Policy/config change attestation

---

## Unified Technical Architecture

### Universal Receipt Envelope
```typescript
interface Receipt {
  id: string;
  type: 'transaction' | 'content' | 'ops';
  subtype: string;  // payment|affiliate|content|incident|build_release|etc
  subject: string;  // URN/URL for the attested object
  claims: Record<string, unknown>;  // Type-specific payload
  ts: string;       // ISO timestamp
  signature: {      // Cryptographic proof (JWS)
    alg: string;    // ES256 or Ed25519
    kid: string;    // Key identifier
    issuer: string; // Issuer URI
    jws: string;    // Compact JWS signature
    createdAt: string;
  };
  version: string;  // Envelope version (default "1.0")
  tenantId: string; // Multi-tenant segregation
}
```

### Shared Infrastructure Components

**✅ Already Implemented:**
- Prisma `Receipt` model with `type` discriminator
- HSM-backed signing service integration
- JWKS endpoint (`/.well-known/jwks.json`)
- API authentication and rate limiting
- Multi-tenant architecture
- Dashboard and verification UI patterns

**🔄 Being Enhanced:**
- Content-specific fields (hash, metadata, provenance, AI scores)
- Type-aware verification UI panels
- In-house AI detection algorithms

**⏳ Planned Extensions:**
- JCS canonicalization for operational trust
- Ops-specific subtypes and claims schemas
- Incident feed and trust page enhancements

---

## Implementation Timeline

### Phase 1: Content Authenticity Foundation (Weeks 1-3)
**Goal:** Complete content certification with in-house AI detection

#### Week 1: Critical Infrastructure
- ✅ Execute Prisma migration for content fields
- ✅ Spin up signing service locally
- ✅ Implement content API endpoints (`POST /api/v1/receipts/content`)
- ✅ Basic heuristic AI detection (80% accuracy)
- ✅ Content verification endpoints
- **NEW:** JCS canonicalization implementation (prep for operational trust)

#### Week 2-3: Advanced Content Features
- Advanced text AI detection (linguistic patterns, perplexity, fingerprints)
- Advanced image analysis (EXIF, compression artifacts, pixel distribution)
- Content dashboard integration with type filters
- Performance optimization and caching

### Phase 2: Operational Trust Integration (Weeks 4-6)
**Goal:** Complete all three pillars with unified verification

#### Week 4: Operational Trust Foundation
- Extend Prisma schema for `ops` type and subtypes:
  - `incident` - Incident & SLA receipts
  - `build_release` - Build/release provenance
  - `report_hash` - Report/export integrity
  - `policy_change` - Policy/config change attestation
- Implement ops API endpoints with Zod validation
- Add operational trust panels to `/verify` page

#### Week 5: Trust Page & SDK Integration
- Incident feed on `/trust` page (publishable incidents)
- Unified SDK/CLI for all three pillars
- Documentation for all operational trust endpoints
- Security audit and compliance review

#### Week 6: Platform Launch Readiness
- Performance testing across all receipt types
- End-to-end integration testing
- Pilot customer onboarding
- Marketing launch preparation

---

## Technical Integration Points

### Database Schema Evolution
```sql
-- Current (Content Authenticity)
Receipt {
  type: 'transaction' | 'content'
  contentHash: string?
  contentType: string?
  contentMetadata: Json?
  contentProvenance: Json?
  contentAiScores: Json?
}

-- Phase 2 Extension (Operational Trust)
Receipt {
  type: 'transaction' | 'content' | 'ops'
  subtype: string  -- incident|build_release|report_hash|policy_change
  subject: string  -- URN/URL of attested object
  claims: Json     -- Type-specific claims payload
  // ... existing content fields remain
}
```

### API Endpoint Organization
```
/api/v1/receipts/
├── transaction/        ✅ LIVE
├── content/           🔄 IMPLEMENTING
└── ops/               ⏳ PLANNED
    ├── incident/
    ├── build-release/
    ├── report/
    └── policy-change/
```

### Verification UI Architecture
```
/verify → Type-aware receipt verification
├── TransactionPanel   ✅ LIVE
├── ContentPanel       🔄 IMPLEMENTING
└── OperationalPanels  ⏳ PLANNED
    ├── IncidentPanel
    ├── BuildReleasePanel
    ├── ReportPanel
    └── PolicyPanel
```

---

## Competitive Advantages

### Technical Moats
1. **Unified Platform** - Single infrastructure for all trust use cases
2. **Proprietary AI Detection** - In-house algorithms vs. commodity APIs
3. **Cryptographic Neutrality** - Offline-verifiable receipts via JWKS
4. **Multi-Tenant Architecture** - Enterprise-ready from day one

### Business Benefits
1. **Larger Addressable Market** - Three distinct but related verticals
2. **Cross-Selling Opportunities** - Enterprise customers need multiple pillars
3. **Reduced Development Costs** - Shared infrastructure across all features
4. **Regulatory Positioning** - Comprehensive compliance solution

### Customer Value Proposition
- **Developers:** Single API for all trust verification needs
- **Enterprises:** Unified compliance dashboard across operations
- **End Users:** Consistent verification experience for any digital asset

---

## Risk Mitigation

### Technical Risks
- **Complexity Management:** Phased rollout with feature flags
- **Performance Impact:** Background processing for heavy operations
- **Integration Challenges:** Shared infrastructure patterns proven in Phase 1

### Business Risks
- **Feature Creep:** Strict adherence to 6-week timeline
- **Market Timing:** Ship basic functionality fast, enhance iteratively
- **Resource Allocation:** Parallel development streams for efficiency

### Operational Risks
- **Quality Assurance:** Comprehensive testing at each phase
- **Customer Impact:** Backwards compatibility guaranteed
- **Compliance:** Leverage existing SOC 2 framework

---

## Success Metrics

### Technical KPIs
- **Certification Latency:** <500ms for all receipt types
- **Detection Accuracy:** >90% for content AI detection
- **System Uptime:** 99.9% across all endpoints
- **API Response Time:** <200ms p95

### Business KPIs
- **Platform Adoption:** 10+ enterprises using multiple pillars
- **Volume Growth:** 5000+ receipts/day across all types
- **Revenue Impact:** 50% increase from unified platform offering
- **Customer Satisfaction:** >4.5/5 NPS for verification experience

### Development KPIs
- **Code Coverage:** >90% for all new features
- **Documentation:** 100% API endpoint coverage
- **Security:** Zero critical vulnerabilities in audit
- **Performance:** Pass all Lighthouse accessibility checks

---

## Next Actions

### Immediate (Week 1)
1. **Resolve signing service blocker** - Critical for content development
2. **Execute content migration** - Enable content certification API
3. **Implement JCS canonicalization** - Foundation for operational trust

### Planning (Week 4)
1. **Finalize operational trust schemas** - Zod validation for all subtypes
2. **Design ops verification panels** - UI/UX for incident/build/report/policy
3. **Plan incident feed architecture** - Trust page integration

### Long-term (Post-Launch)
1. **Advanced provenance chaining** - C2PA manifest integration
2. **Real-time verification widgets** - Browser extension ecosystem
3. **Industry-specific detection** - Customizable AI algorithms

---

---

## Implementation Status Update (2025-09-27)

### ✅ Phase 1 Week 1: COMPLETE
- Database migration and signing service operational
- Content certification API endpoints working
- Basic AI detection achieving 80%+ accuracy
- End-to-end verification pipeline functional
- Documentation and progress tracking established

### 🎯 Phase 1 Week 2-3: PLANNED (Oct 4-18)
- **Week 2**: Advanced AI detection (90%+ accuracy target)
- **Week 3**: Dashboard integration and developer tools
- **Preparation**: Operational trust foundation ready for Week 4

**Detailed Implementation Plan**: See `WEEK_2_3_DETAILED_PLAN.md`

---

**Document Owner:** Platform Engineering
**Next Review:** 2025-10-04 (Week 2 kickoff)
**Current Status:** Phase 1 Week 1 complete, Week 2-3 planned