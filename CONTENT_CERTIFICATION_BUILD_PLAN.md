# Content Certification - Full Build Plan

**Goal:** Build functional content certification product before partnership outreach.

**Timeline:** 6-8 weeks

**Current State:** Marketing pages + demo API only (no real functionality)

---

## Phase 1: Site-Wide Authentication (Week 1)

### Why This First
- Required for creator upload, dashboards, API keys
- Foundation for all protected features
- User roles needed before building role-specific UIs

### Tech Stack Decision: **Clerk** (Recommended)
- **Pros:** Beautiful UI, <1 hour setup, built-in user management, $25/mo
- **Cons:** Vendor lock-in
- **Alternative:** NextAuth (free, more setup, flexible)

### Deliverables

#### 1.1 Clerk Setup
**Files:**
- `nextjs-pricing/.env.local` - Add Clerk keys
- `nextjs-pricing/middleware.ts` - Protected routes config
- `nextjs-pricing/app/layout.tsx` - Wrap with ClerkProvider

**Commands:**
```bash
npm install @clerk/nextjs
```

#### 1.2 Auth Pages
**Routes:**
- `/sign-in` - Login page
- `/sign-up` - Signup page (creator, platform, enterprise options)
- `/sign-up/creator` - Creator-specific signup
- `/sign-up/platform` - Platform partner signup
- `/sign-up/enterprise` - Enterprise signup

**Files to Create:**
- `nextjs-pricing/app/sign-in/[[...sign-in]]/page.tsx`
- `nextjs-pricing/app/sign-up/[[...sign-up]]/page.tsx`
- `nextjs-pricing/app/sign-up/creator/page.tsx`
- `nextjs-pricing/app/sign-up/platform/page.tsx`
- `nextjs-pricing/app/sign-up/enterprise/page.tsx`

#### 1.3 User Roles & Metadata
**Clerk Metadata Structure:**
```typescript
{
  publicMetadata: {
    role: 'creator' | 'platform' | 'enterprise' | 'admin',
    tier: 'free' | 'starter' | 'pro' | 'business' | 'platform' | 'custom',
    apiKey?: string, // For platform partners
    organizationId?: string, // For enterprise
    verified: boolean
  }
}
```

#### 1.4 Protected Routes
**Middleware Config:**
```typescript
// nextjs-pricing/middleware.ts
export default authMiddleware({
  publicRoutes: [
    "/",
    "/pricing",
    "/platform",
    "/platform-api",
    "/api/verify-content",
    // ... marketing pages
  ],
  afterAuth(auth, req) {
    // Role-based redirects
    if (auth.userId && req.nextUrl.pathname === '/dashboard') {
      const role = auth.sessionClaims?.publicMetadata?.role;
      if (role === 'creator') return NextResponse.redirect('/creator/dashboard');
      if (role === 'platform') return NextResponse.redirect('/platform/dashboard');
      if (role === 'enterprise') return NextResponse.redirect('/enterprise/dashboard');
    }
  }
});
```

### Acceptance Criteria
- [ ] Users can sign up with role selection
- [ ] Login/logout works across site
- [ ] Protected routes redirect to login
- [ ] User role stored in metadata
- [ ] Middleware enforces auth on protected routes

---

## Phase 2: Creator Upload & Receipts (Week 2-3)

### Database Setup
**Tech Stack:** Supabase (PostgreSQL + Storage)

**Tables:**
```sql
-- Receipts table
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- Clerk user ID
  content_hash TEXT NOT NULL,
  content_url TEXT NOT NULL, -- Supabase storage URL
  content_type TEXT NOT NULL, -- image/jpeg, video/mp4
  file_size INTEGER NOT NULL,
  crypto_signature TEXT NOT NULL,
  crypto_timestamp TIMESTAMPTZ NOT NULL,
  crypto_key_id TEXT NOT NULL,
  parent_hash TEXT, -- For DAG relationships
  c2pa_manifest JSONB, -- C2PA metadata if available
  status TEXT NOT NULL DEFAULT 'pending', -- pending, verified, failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Platform verifications table
CREATE TABLE verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_id UUID REFERENCES receipts(id),
  platform TEXT NOT NULL, -- youtube, instagram, getty
  platform_content_id TEXT, -- External content ID
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_response JSONB
);

-- Webhooks table
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL, -- ['receipt.created', 'receipt.verified']
  secret TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Deliverables

#### 2.1 Creator Dashboard
**Route:** `/creator/dashboard`

**Features:**
- Upload new content button (prominent CTA)
- Recent receipts list
- Stats: Total receipts, verified content, storage used
- Quick actions: Upload, View all, Settings

**Files:**
- `nextjs-pricing/app/creator/dashboard/page.tsx`
- `nextjs-pricing/components/creator/UploadButton.tsx`
- `nextjs-pricing/components/creator/ReceiptsList.tsx`
- `nextjs-pricing/components/creator/DashboardStats.tsx`

#### 2.2 Content Upload Interface
**Route:** `/creator/upload`

**Flow:**
1. Drag & drop or file picker (images/videos)
2. Show file preview
3. Generate content hash (SHA-256)
4. Upload to Supabase Storage
5. Create cryptographic signature
6. Store receipt in database
7. Show success + receipt details

**Files:**
- `nextjs-pricing/app/creator/upload/page.tsx`
- `nextjs-pricing/components/creator/FileUploader.tsx`
- `nextjs-pricing/lib/crypto.ts` - Real crypto signing
- `nextjs-pricing/lib/supabase.ts` - Storage client

**Crypto Implementation:**
```typescript
// lib/crypto.ts
import { webcrypto } from 'crypto';

export async function generateReceipt(file: File) {
  // 1. Generate SHA-256 hash
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await webcrypto.subtle.digest('SHA-256', arrayBuffer);
  const hash = Buffer.from(hashBuffer).toString('hex');

  // 2. Generate signature (ES256)
  const key = await getSigningKey(); // From env or key management
  const signature = await webcrypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    arrayBuffer
  );

  // 3. Create receipt
  return {
    hash: `sha256:${hash}`,
    signature: Buffer.from(signature).toString('base64'),
    timestamp: new Date().toISOString(),
    keyId: 'certnode-2025-01'
  };
}
```

#### 2.3 Receipt Viewing
**Route:** `/creator/receipts/[id]`

**Features:**
- Content preview (image/video player)
- Cryptographic details (hash, signature, timestamp)
- Verification status
- Public verification link
- Download receipt (JSON/PDF)
- Share receipt button

**Files:**
- `nextjs-pricing/app/creator/receipts/[id]/page.tsx`
- `nextjs-pricing/components/creator/ReceiptDetails.tsx`
- `nextjs-pricing/components/creator/VerificationBadge.tsx`

#### 2.4 Public Verification Page
**Route:** `/verify/[receiptId]`

**Features:**
- Anyone can verify without login
- Shows: Hash, signature, timestamp, verification status
- "Verify on blockchain" button (if anchored)
- No private user info shown

**Files:**
- `nextjs-pricing/app/verify/[receiptId]/page.tsx` (public route)

### Acceptance Criteria
- [ ] Creators can upload images/videos
- [ ] Real cryptographic receipts generated (SHA-256 + ES256)
- [ ] Receipts stored in Supabase
- [ ] Creator can view all their receipts
- [ ] Receipt detail page shows crypto metadata
- [ ] Public verification link works

---

## Phase 3: Platform Integration Features (Week 4-5)

### Deliverables

#### 3.1 Platform Dashboard
**Route:** `/platform/dashboard`

**Features:**
- API key display + regenerate
- Verification stats (total, by content type)
- Recent verifications table
- Webhook configuration
- Usage/billing metrics

**Files:**
- `nextjs-pricing/app/platform/dashboard/page.tsx`
- `nextjs-pricing/components/platform/APIKeyManager.tsx`
- `nextjs-pricing/components/platform/VerificationStats.tsx`
- `nextjs-pricing/components/platform/WebhookConfig.tsx`

#### 3.2 API Key Management
**Implementation:**
- Generate API key on platform signup (format: `certnode_live_xxxxx`)
- Store hashed version in database
- Show plaintext only once at creation
- Regenerate with confirmation

**Files:**
- `nextjs-pricing/lib/apiKeys.ts`
- API route: `nextjs-pricing/app/api/platform/keys/route.ts`

```typescript
// lib/apiKeys.ts
import crypto from 'crypto';

export function generateAPIKey() {
  const key = crypto.randomBytes(32).toString('hex');
  return `certnode_live_${key}`;
}

export function hashAPIKey(key: string) {
  return crypto.createHash('sha256').update(key).digest('hex');
}
```

#### 3.3 Enhanced Verify API
**Update:** `/api/verify-content`

**Features:**
- Require API key auth for platform partners
- Rate limiting per API key
- Log all verifications
- Return detailed provenance data

**Files:**
- Update `nextjs-pricing/app/api/verify-content/route.ts`
- `nextjs-pricing/middleware/apiAuth.ts`

#### 3.4 Webhook System
**Flow:**
1. Platform configures webhook URL + events
2. When event occurs (receipt.created, receipt.verified)
3. POST to webhook URL with signature
4. Retry logic (3 attempts, exponential backoff)
5. Delivery status tracking

**Files:**
- `nextjs-pricing/app/api/webhooks/route.ts` - CRUD
- `nextjs-pricing/lib/webhooks.ts` - Delivery logic
- `nextjs-pricing/components/platform/WebhookLogs.tsx`

**Webhook Payload:**
```json
{
  "event": "receipt.verified",
  "timestamp": "2025-10-04T12:00:00Z",
  "data": {
    "receipt_id": "rcpt_123",
    "content_hash": "sha256:abc...",
    "verified": true,
    "provenance": {
      "device": "Canon EOS R5",
      "capture_time": "2025-10-03T12:00:00Z",
      "c2pa_compliant": true
    }
  },
  "signature": "sha256=abc..." // HMAC signature for verification
}
```

### Acceptance Criteria
- [ ] Platform partners get API key on signup
- [ ] API key required for /api/verify-content
- [ ] Platforms can configure webhooks
- [ ] Webhooks deliver with retry logic
- [ ] Platform dashboard shows verifications + webhooks

---

## Phase 4: Enterprise Features (Week 6)

### Deliverables

#### 4.1 Enterprise Dashboard
**Route:** `/enterprise/dashboard`

**Features:**
- Multi-user team management
- Bulk receipt generation
- Advanced analytics (by department, product)
- Compliance exports (SOC 2, ISO 27001)
- Custom integrations

**Files:**
- `nextjs-pricing/app/enterprise/dashboard/page.tsx`
- `nextjs-pricing/components/enterprise/TeamManager.tsx`
- `nextjs-pricing/components/enterprise/ComplianceExports.tsx`

#### 4.2 Batch Upload API
**Route:** `/api/enterprise/batch-upload`

**Features:**
- Upload multiple files at once
- Return array of receipts
- Progress tracking
- Webhook on completion

#### 4.3 SSO Integration
**Tech:** Clerk supports SAML/OIDC
**Setup:** Enterprise tier only
**Providers:** Okta, Azure AD, Google Workspace

---

## Phase 5: Advanced Features (Week 7-8)

### Deliverables

#### 5.1 C2PA Metadata Extraction
**Library:** `c2pa-node` or `exiftool`

**Flow:**
1. On upload, check for C2PA manifest
2. Extract device info, capture time, edits
3. Store in `c2pa_manifest` JSONB field
4. Display in receipt details

#### 5.2 Blockchain Anchoring (Optional)
**Tech:** Ethereum (via Infura) or Polygon (cheaper)

**Flow:**
1. User opts-in for blockchain anchoring
2. Batch receipts (e.g., every hour)
3. Create Merkle tree of hashes
4. Anchor root hash on-chain
5. Store transaction ID with receipts

**Files:**
- `nextjs-pricing/lib/blockchain.ts`
- `nextjs-pricing/components/creator/BlockchainStatus.tsx`

#### 5.3 Receipt Export
**Formats:**
- **JSON:** Full receipt with crypto data
- **PDF:** Human-readable certificate
- **CSV:** Bulk export for analytics

**Files:**
- `nextjs-pricing/app/api/receipts/[id]/export/route.ts`
- `nextjs-pricing/lib/pdfGenerator.ts` (use `pdfkit`)

#### 5.4 Mobile App (React Native - Future)
**Scope:** Camera capture → auto-receipt
**Timeline:** Post-web MVP

---

## Tech Stack Summary

| Component | Technology | Why |
|-----------|-----------|-----|
| Auth | Clerk | Fast setup, beautiful UI, user management |
| Database | Supabase (PostgreSQL) | Free tier, real-time, easy setup |
| Storage | Supabase Storage | Integrated with DB, CDN included |
| Crypto | Node.js Web Crypto API | Native, no dependencies |
| Webhooks | Custom implementation | Control, no vendor lock-in |
| C2PA | `c2pa-node` or `exiftool` | Standard library |
| Blockchain | Infura (Ethereum) | Established, reliable |
| PDF | `pdfkit` | Lightweight, server-side |

---

## File Structure (New Files)

```
nextjs-pricing/
├── app/
│   ├── creator/
│   │   ├── dashboard/page.tsx
│   │   ├── upload/page.tsx
│   │   └── receipts/[id]/page.tsx
│   ├── platform/
│   │   └── dashboard/page.tsx
│   ├── enterprise/
│   │   └── dashboard/page.tsx
│   ├── verify/[receiptId]/page.tsx (public)
│   ├── sign-in/[[...sign-in]]/page.tsx
│   ├── sign-up/
│   │   ├── [[...sign-up]]/page.tsx
│   │   ├── creator/page.tsx
│   │   ├── platform/page.tsx
│   │   └── enterprise/page.tsx
│   └── api/
│       ├── receipts/
│       │   └── route.ts (CRUD)
│       ├── platform/
│       │   └── keys/route.ts
│       ├── webhooks/
│       │   └── route.ts
│       └── verify-content/route.ts (enhanced)
├── components/
│   ├── creator/
│   │   ├── UploadButton.tsx
│   │   ├── FileUploader.tsx
│   │   ├── ReceiptsList.tsx
│   │   ├── ReceiptDetails.tsx
│   │   └── DashboardStats.tsx
│   ├── platform/
│   │   ├── APIKeyManager.tsx
│   │   ├── VerificationStats.tsx
│   │   ├── WebhookConfig.tsx
│   │   └── WebhookLogs.tsx
│   └── enterprise/
│       ├── TeamManager.tsx
│       └── ComplianceExports.tsx
├── lib/
│   ├── crypto.ts (real signing)
│   ├── supabase.ts
│   ├── apiKeys.ts
│   ├── webhooks.ts
│   ├── blockchain.ts
│   └── pdfGenerator.ts
└── middleware.ts (auth + API key validation)
```

---

## Environment Variables Needed

```bash
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Crypto Signing (generate ES256 key pair)
SIGNING_PRIVATE_KEY=xxx
SIGNING_PUBLIC_KEY=xxx

# Blockchain (optional)
INFURA_PROJECT_ID=xxx
INFURA_PROJECT_SECRET=xxx

# Webhooks
WEBHOOK_SIGNING_SECRET=xxx
```

---

## Development Milestones

### Week 1: Auth Foundation
- [ ] Clerk setup
- [ ] Login/signup pages
- [ ] User roles
- [ ] Protected routes

### Week 2: Creator MVP
- [ ] Supabase setup
- [ ] File upload
- [ ] Receipt generation
- [ ] Creator dashboard

### Week 3: Receipt Features
- [ ] Receipt detail page
- [ ] Public verification
- [ ] Receipt list/search
- [ ] Download receipt

### Week 4: Platform Features
- [ ] API key management
- [ ] Enhanced verify API
- [ ] Platform dashboard

### Week 5: Webhooks
- [ ] Webhook CRUD
- [ ] Delivery system
- [ ] Retry logic
- [ ] Logs UI

### Week 6: Enterprise
- [ ] Team management
- [ ] Bulk upload
- [ ] SSO setup

### Week 7-8: Polish
- [ ] C2PA extraction
- [ ] Blockchain anchoring
- [ ] PDF export
- [ ] Testing + bug fixes

---

## Success Metrics

**Phase 1-2 (Creator MVP):**
- [ ] 10 test creators can upload and verify content
- [ ] 100% receipt generation success rate
- [ ] <5 second upload → receipt flow

**Phase 3 (Platform):**
- [ ] 3 platform partners with API keys
- [ ] 1000+ verifications per day
- [ ] Webhook delivery 99%+ success

**Phase 4-5 (Scale):**
- [ ] Enterprise customer onboarded
- [ ] C2PA metadata extracted from 80%+ files
- [ ] Blockchain anchoring operational

---

## Next Immediate Steps

1. **Set up Clerk** (30 min)
   - Create Clerk account
   - Install package
   - Add env vars

2. **Build auth pages** (1-2 hours)
   - Sign-in/sign-up routes
   - Role selection UI

3. **Protected routes** (30 min)
   - Middleware config
   - Test auth flow

4. **Set up Supabase** (1 hour)
   - Create project
   - Set up tables
   - Configure storage

5. **Creator upload MVP** (4-6 hours)
   - Upload UI
   - Real crypto signing
   - Receipt storage

**Ready to start with Phase 1 (Auth)?**
