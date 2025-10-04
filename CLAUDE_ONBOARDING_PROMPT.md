# Claude Code Onboarding Prompt

Copy this entire prompt to the new Claude Code window:

---

## Project Context

You're working on **CertNode** - a cryptographic receipt platform that creates tamper-proof evidence chains for transactions, content, and operations. Think "blockchain for business evidence" but practical.

**Core Value:** Cryptographic proof chains that win disputes, verify authenticity, and automate compliance.

**Tech Stack:**
- Next.js 14.2.15 (App Router) in `nextjs-pricing/`
- TypeScript, Tailwind CSS
- Deployed on Vercel at https://certnode.io
- Git repo at C:\Dev\certnode

---

## What's Been Built (Current State)

### ✅ Completed Features:
1. **Receipt Graph Demo** - Interactive DAG visualization showing cross-domain receipts
   - Located: `nextjs-pricing/components/ReceiptGraphMultiMode.tsx`
   - Shows: Transaction → Content → Operations linked receipts
   - Features: Industry presets, tier simulation, CFO query mode
   - **NEW:** Crypto details panel (click receipt nodes to see hash, signature, timestamp, key ID)

2. **Pricing Page** - ROI calculator with dispute shield recommendations
   - Located: `nextjs-pricing/app/pricing/page.tsx`
   - Calculates savings from reduced chargebacks and labor costs

3. **Homepage** - Universal Receipt Protocol positioning
   - Located: `nextjs-pricing/app/page.tsx`
   - Uses ReceiptGraphMultiMode component (same as platform page)

4. **Platform Page** - Technical deep-dive on receipt graph
   - Located: `nextjs-pricing/app/platform/page.tsx`

5. **Support/Security Pages** - Standard marketing pages

### ✅ Recent Fixes (Last Session):
1. **SLA Consistency** - All pages now show 99.9% uptime from `nextjs-pricing/lib/config.ts`
2. **Crypto Details** - Receipts now show cryptographic metadata (hash, signature, timestamp)
3. **Honest Messaging** - Removed fake "70% reduction" claims from homepage
4. **Receipt Graph Consistency** - Homepage and platform use same advanced component

---

## Known Issues & Constraints

### 🚨 Deployment Cache Bug (CRITICAL - READ THIS):
**Problem:** Buttons stop working after deployment, CSS breaks, 404 errors for .js files.

**Root Cause:** Next.js build cache corruption OR incorrect assetPrefix config.

**Permanent Fix Applied:** `next.config.js` now has conditional assetPrefix:
```javascript
const isVercelDeployment = Boolean(process.env.VERCEL);
assetPrefix: isVercelDeployment ? undefined : '/nextjs-pricing',
```

**Quick Recovery If It Happens Again:**
```bash
cd nextjs-pricing && rm -rf .next && rm -rf node_modules/.cache && npm run build && vercel --prod --yes --force
vercel alias set <new-deployment-url> certnode.io
```

**Documentation:** See `DEPLOYMENT_CACHE_FIX_GUIDE.md` for full details.

### ⚠️ Messaging Honesty Rules:
- ❌ NO made-up stats (we have zero customers)
- ❌ NO "70% reduction" claims (unverified)
- ❌ NO "AI detection" claims (we do provenance proof, not AI detection)
- ✅ YES honest claims: "Crypto proof", "Tamper detection", "<30s evidence generation"

---

## Current Priorities (What to Work On)

### Priority 1: Fix Homepage "AI Detection" Claim 🔴 URGENT
**File:** `nextjs-pricing/app/page.tsx` around line 235

**Current (WRONG):**
```tsx
<div className="text-3xl font-bold text-orange-600 mb-1">95%</div>
<div className="text-sm text-gray-600">AI detection accuracy</div>
```

**Should Be:**
```tsx
<div className="text-3xl font-bold text-orange-600 mb-1">100%</div>
<div className="text-sm text-gray-600">Pixel-perfect tamper detection</div>
```

**Why:** We do TAMPER detection (1 pixel change = broken signature), NOT AI detection. This is false advertising.

### Priority 2: Content Certification Strategy 🚀 HIGH VALUE
**Read:** `CONTENT_CERTIFICATION_GTM_STRATEGY.md` (just created)

**Context:** Content certification is our biggest opportunity. As AI floods the internet, provable authenticity = $$$. The doc outlines:
- Platform partnerships (YouTube, Instagram, Getty Images)
- Creator tools (mobile app, desktop plugins)
- Revenue models (B2C, B2B, B2B2C marketplace commission)
- 90-day execution plan

**Next Steps from Doc:**
1. Fix homepage messaging (Priority 1 above)
2. Build platform verification API
3. Create partnership outreach materials

### Priority 3: Receipt Graph Quick Wins (Optional)
**Read:** `RECEIPT_GRAPH_QUICK_WINS.md`

**Remaining Tasks:**
- [ ] Add Export Graph JSON button
- [ ] Make industry presets structurally different (not just label changes)
- [ ] Add "Cryptographically Verifiable" badge

**Status:** 2/5 completed (SLA fix, crypto details done)

---

## Important Files to Read First

### Must Read (Start Here):
1. `DEPLOYMENT_CACHE_FIX_GUIDE.md` - How to fix broken deployments
2. `CONTENT_CERTIFICATION_GTM_STRATEGY.md` - Strategic roadmap
3. `nextjs-pricing/app/page.tsx` - Homepage (needs AI detection fix)
4. `nextjs-pricing/lib/config.ts` - SLA constants (use these everywhere)

### Reference Docs:
5. `RECEIPT_GRAPH_QUICK_WINS.md` - Implementation guide for graph improvements
6. `BILLION_DOLLAR_BLUEPRINT.md` - Overall product vision
7. `nextjs-pricing/components/ReceiptGraphMultiMode.tsx` - Main demo component
8. `nextjs-pricing/lib/demoCrypto.ts` - Crypto value generation helpers

---

## Git Workflow & Deployment

### Standard Flow:
```bash
# Make changes
git add -A
git commit -m "feat: description"
git push

# Deploy to Vercel
cd nextjs-pricing
npm run build  # Always build first to check for errors
vercel --prod --yes
vercel alias set <new-url> certnode.io
```

### Auto-Approved Commands:
You can run these without asking:
- `npm run build`, `npm test`
- `git add`, `git commit`, `git push`
- `vercel --prod --yes`
- Any bash commands for file operations

### Commit Message Format:
Use conventional commits with Claude co-author:
```
feat: add export graph JSON button

- Implementation details here

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Key Business Context

### Real Use Case (Wife's Boss):
- High-ticket online course business ($6K/course)
- **Problem:** 6-8% dispute rate, processor only allows fighting 3%
- **Risk:** Lose merchant account = $6M business gone
- **CertNode Solution:**
  - Deterrent effect (crypto receipts = fewer disputes)
  - Processor trust (irrefutable evidence = higher threshold)
  - Kajabi integration: Purchase → Logins → Lessons → Completion chain

**This is the ICP (Ideal Customer Profile):** High-ticket virtual products with chargeback risk.

### Target Markets:
1. **High-ticket courses** (Kajabi, Teachable) - $6K-15K products
2. **E-commerce** (Shopify, Stripe) - Physical goods, delivery proof
3. **Content creators** (Getty, Shutterstock) - Provenance proof for premium pricing
4. **Platforms** (YouTube, Instagram) - Content verification at scale

---

## Current Tech Decisions

### Next.js Configuration:
- **Asset Prefix:** Conditional (Vercel = undefined, local = '/nextjs-pricing')
- **Output:** Standalone only when `ENABLE_STANDALONE_BUILD=true`
- **Images:** Unoptimized in production
- **Build ID:** Uses timestamp for cache busting

### Component Architecture:
- **Server Components:** Most pages (page.tsx files)
- **Client Components:** Interactive demos, forms (marked with 'use client')
- **Shared Components:** TrustBadges, Footer, Navigation

### Styling:
- Tailwind CSS utility-first
- Consistent color scheme: Blue (primary), Purple (accent), Green (success)
- Responsive: mobile-first, md/lg breakpoints

---

## Common Pitfalls to Avoid

1. **Don't Make Up Stats** - We have zero customers, no data. Use "up to" or remove claims entirely.
2. **Always Hard Refresh After Deploy** - Browser cache is aggressive. Tell user to Ctrl+F5.
3. **Check Build Before Deploy** - `npm run build` catches TypeScript errors.
4. **Use Config Constants** - Import from `lib/config.ts`, don't hardcode SLA values.
5. **Don't Over-Engineer** - Quick wins > perfect solutions. Ship fast, iterate.

---

## Immediate Action Items (First Hour)

### Task 1: Fix AI Detection Claim (15 min)
1. Open `nextjs-pricing/app/page.tsx`
2. Find "95% AI detection accuracy" around line 235
3. Replace with "100% Pixel-perfect tamper detection"
4. Update description to match
5. Build, deploy, verify

### Task 2: Review Content Strategy (30 min)
1. Read `CONTENT_CERTIFICATION_GTM_STRATEGY.md` thoroughly
2. Understand the platform partnership approach
3. Note the messaging framework (provenance proof, not AI detection)

### Task 3: Check Current State (15 min)
1. Visit https://certnode.io
2. Test receipt graph (click nodes to see crypto details)
3. Verify all pages show 99.9% SLA consistently
4. Check pricing ROI calculator functionality

---

## Questions for the User

Before starting work, you might want to clarify:
1. **Priority:** Fix AI detection claim first, or start on content strategy implementation?
2. **Scope:** Just messaging fixes, or build new features (platform API, creator tools)?
3. **Timeline:** What's the deadline/urgency?

But if unclear, **default to Priority 1** (fix AI detection claim) - it's false advertising and needs immediate correction.

---

## Success Metrics

**You'll know you're on track if:**
- ✅ No deployment cache issues (buttons work, CSS loads)
- ✅ All messaging is honest (no made-up stats)
- ✅ Build succeeds with no TypeScript errors
- ✅ User can verify changes at https://certnode.io after hard refresh
- ✅ Git commits follow format with co-author attribution

---

## Emergency Contacts

**If something breaks:**
1. Check `DEPLOYMENT_CACHE_FIX_GUIDE.md` first
2. Run the nuclear option: `cd nextjs-pricing && rm -rf .next && npm run build && vercel --prod --yes --force`
3. Update domain alias: `vercel alias set <url> certnode.io`

**User context:**
- Working from Windows machine (use Windows commands, not Unix)
- Vercel CLI installed and authenticated
- Git configured and pushed to remote

---

## Ready to Start?

**Your first command should be:**
```bash
cd C:\Dev\certnode && git pull && cd nextjs-pricing && npm run build
```

This ensures you have latest code and everything compiles.

**Then ask the user:**
"I've reviewed the context. Current priority is fixing the AI detection claim on the homepage (it's false advertising - we do tamper detection, not AI detection). Should I proceed with this fix, or is there something more urgent?"

---

*Last updated: After completing SLA consistency, crypto details, honest messaging, and receipt graph consolidation fixes.*
