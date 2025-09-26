# Billion Dollar Blueprint - Phase 1

## Roadmap Rollup
- [x] Restore pricing asset delivery via Vercel multi-build alignment
- [ ] CURRENT PRIORITY - Confirm production deploy serves `/_next` assets without rewrites
- [ ] Next item - Automate asset health check in deployment validation

## Strategic Insights
- Replacing the manual `/_next` rewrite with an explicit asset prefix keeps the Next.js builder in control of canonical bundle URLs, preventing ecosystem fragmentation.
- Keeping business-route rewrites separate from framework internals protects infrastructure scale and credibility as we evolve into the universal receipt protocol owner.
- Aligning Vercel asset delivery with an explicit Next.js asset prefix keeps the multi-app deployment resilient without entangling API and static layers.

## Execution Notes
- Pricing experience at `certnode.io/pricing` now satisfies the professional site infrastructure objective with full styling and interactivity restored.
- Checkout analytics events typed (`checkout_start`/`checkout_error`) so revenue instrumentation stays intact while passing production builds.
