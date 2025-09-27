# Content Authenticity Implementation Handoff

## Product Scope: Content Authenticity (Media)
**Part of CertNode's clean taxonomy:**
- **Content Authenticity (media)** → Assets with a file hash you intend to publish/share
- **Transactions (commerce)** → Events around a sale or payout
- **Operational Trust (compliance/dev)** → Controls & system integrity

### Content Authenticity Features
- Image/video/audio/text/document certification
- C2PA manifests / provenance chains
- AI detector scores (advisory)
- File hash verification with cryptographic receipts

## Current Implementation Status (2025-09-27)

### ✅ Phase 0 Complete - Foundation Ready
- **Database schema** - `Receipt.type` discriminator with content-specific fields
- **Content helpers** - Hash generation, metadata extraction, provenance handling
- **Service layer** - `ContentReceiptService` orchestrates signing + database insert
- **Migration ready** - Database changes prepared for execution

### 🔄 Phase 1 In Progress - Critical Path Items
- **API endpoints** - Need `POST /api/v1/receipts/content` and verification routes
- **Basic AI detection** - Heuristic detectors for 80% accuracy baseline
- **Signing service** - Must spin up locally for development/testing

### ⏳ Pending Implementation
- **Dashboard integration** - Content receipt views, filters, analytics
- **Advanced AI detection** - Proprietary algorithms for competitive advantage
- **SDK/CLI extensions** - Developer tools for content certification
- **Performance optimization** - Background processing, caching, monitoring

## Implementation Roadmap (v2.0 Optimized)

### Week 1: Immediate Value Stream
**Critical path to basic functionality:**
1. **Execute database migration** - Apply content receipt schema changes
2. **Spin up signing service** - Local Docker/node process for development
3. **Implement API endpoints:**
   - `POST /api/v1/receipts/content` - Content certification using existing service
   - `GET /api/v1/verify/content/:id` - Receipt lookup by ID
   - `GET /api/v1/verify/content?hash=` - Content verification by hash
4. **Basic heuristic AI detection:**
   - Text pattern analysis (repetition, vocabulary, syntax)
   - Image metadata inconsistency detection
   - Document statistical analysis
   - **Target:** 80% accuracy baseline, zero vendor dependencies

### Week 2-3: Enhanced Detection & UX (Parallel)
**Stream A: Advanced AI Detection (In-house)**
- Proprietary text AI detection (linguistic patterns, perplexity, fingerprints)
- Advanced image analysis (EXIF, compression artifacts, pixel distribution)
- Multi-modal detection scoring and confidence calibration

**Stream B: Dashboard Integration**
- Content receipt listing with type filters and confidence scores
- Detail modals showing metadata, provenance, AI analysis breakdown
- Analytics cards for certifications/day, detection metrics

### Week 4-6: Production Readiness & Launch
- Background processing queue for large files
- Performance optimization and caching layer
- SDK/CLI extensions for developer adoption
- Security audit and compliance review
- Pilot customer onboarding and feedback

## Current Blockers (Immediate Attention)
1. **Signing service unavailable** - Need `SIGNING_SERVICE_URL` endpoint responding
   - **Solution:** Spin up local signing service (Docker or node process)
   - **Impact:** Blocks all content certification functionality
2. **Database migration pending** - Schema changes not applied
   - **Solution:** Execute `npm run db:migrate` with proper DATABASE_URL
   - **Impact:** API endpoints will fail without content receipt fields

## Eliminated Dependencies (v2.0 Optimization)
- ~~Detector vendor access keys~~ → **Replaced with in-house AI detection**
- ~~External API dependencies~~ → **Proprietary algorithms for competitive advantage**
- ~~Data residency concerns~~ → **All processing stays in-house**

## Immediate Next Actions (Week 1)
1. **Resolve signing service blocker** - Critical for any testing/development
2. **Execute database migration** - Enable content receipt storage
3. **Implement API endpoints** - Ship basic certification functionality
4. **Build heuristic detectors** - Achieve 80% accuracy without external deps

## Testing Notes
- No automated coverage yet for new content helpers; plan to add Jest tests under `certnode-dashboard/lib/content/__tests__`.
- After API routes land, add integration tests in `certnode-dashboard/app/api/receipts/__tests__` (new directory) to exercise content flows.
- Monitor for breaking changes to existing transaction receipts; perform regression suite once new routes enabled.

## References
- Strategic plan: `docs/CONTENT_CERTIFICATION_PLAN.md`.
- Pending migration: `certnode-dashboard/prisma/migrations/20240927_add_content_receipts`.
- Core service implementation: `certnode-dashboard/lib/content/service.ts`.
- Blocked on signing service: `certnode-dashboard/lib/signing.ts`.
