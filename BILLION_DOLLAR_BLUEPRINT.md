# Billion Dollar Blueprint - Phase 1

## Roadmap Rollup
- [x] Completed item — Ship Stripe yearly payment link routing for the pricing toggle
- [ ] CURRENT PRIORITY — Stand up an authenticated analytics dashboard with real conversion data
- [ ] Next item — Define the authentication and data pipeline needed to reopen analytics to customers

## Strategic Insights
- Directing yearly checkouts through dedicated Stripe payment links protects enterprise billing flows while unlocking higher ACV conversions immediately.
- Canonical asset delivery now flows through the `/nextjs-pricing` prefix while a compatibility rewrite catches legacy `/_next` requests, so we restore styling without compromising future multi-app separation.
- Keeping business-route rewrites separate from framework internals protects infrastructure scale and credibility as we evolve into the universal receipt protocol owner.
- Aligning Vercel asset delivery with the explicit Next.js asset prefix keeps the multi-app deployment resilient without entangling API and static layers.
- Re-establishing the Tailwind/PostCSS pipeline ensures the premium pricing experience ships with the intended visual polish across every deploy.

## Execution Notes
- Pricing experience at `certnode.io/pricing` now satisfies the professional site infrastructure objective with full styling and interactivity restored.
- Yearly billing toggle now routes Starter, Growth, and Business plans to the correct Stripe payment links, eliminating accidental monthly subscriptions.
- Removed the public analytics dashboard route (`/analytics`) and now surface contact@certnode.io and Support links while preserving analytics library architecture for future authenticated release.
- Checkout analytics events typed (`checkout_start`/`checkout_error`) so revenue instrumentation stays intact while passing production builds.
- Legacy `/_next` requests now rewrite to the prefixed path so cached clients recover immediately while new builds stay standards-aligned.
- Tailwind globals load through `app/globals.css`, keeping typography, gradients, and layout utilities consistent with our enterprise positioning.
- Checkout API bridge now targets the billing service directly, restoring Stripe redirects while keeping the Next.js experience seamless.
- Navigation component now mirrors the core site links, reinforcing unified developer journeys across static and Next.js surfaces.
- Mobile navigation interaction matches the static site experience with outside-click dismissal and overlay for consistent polish.
- Desktop navigation typography and spacing now match the static site, maintaining brand consistency across every route.
