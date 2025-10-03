# CertNode Deployment Architecture

## Critical Deployment Info
- The production homepage and marketing routes (`/`, `/platform`, `/pricing`, `/support`) are served by the Next.js app in `nextjs-pricing/`.
- The root route is pinned via `vercel.json` `routes` to `/nextjs-pricing` so static `web/index.html` never supersedes the marketing app.
- Dashboard surfaces (`/dashboard`, `/login`, `/register`) are served by the Next.js app in `certnode-dashboard/`.
- Legacy static pages in `web/` remain available for specific trust and status URLs but should not be edited for homepage changes.
- `vercel.json` owns the routing glue; review rewrites before every deployment.

## Deployment Structure

```
certnode.io
|- /                    -> nextjs-pricing/app/page.tsx
|- /platform            -> nextjs-pricing/app/platform/page.tsx
|- /pricing             -> nextjs-pricing/app/pricing/page.tsx
|- /support             -> nextjs-pricing/app/support/page.tsx
|- /dashboard           -> certnode-dashboard/app/dashboard/page.tsx
|- /api/*               -> api/src/index.js
|- /trust, /verify, ... -> web/*.html (legacy static)
|- /_next/assets        -> routed via vercel.json
```

## Key Files to Update
- Marketing edits: `nextjs-pricing/app/**`
- Dashboard edits: `certnode-dashboard/app/**`
- API changes: `api/src/**`
- Routing: `vercel.json` (keeps `_next` assets pointed at the right app)

## Vercel Configuration
- Auto-deploys from `main`
- Multi-app rewrites defined in `vercel.json`
- `_next` requests rewrite to the correct app (`nextjs-pricing` by default, `certnode-dashboard` when the request path is prefixed)

## Deployment Checklist
- [ ] Review `vercel.json` rewrites after any routing change
- [ ] `npm --prefix nextjs-pricing run build`
- [ ] `npm --prefix certnode-dashboard run build`
- [ ] `npm --prefix api run lint`
- [ ] Confirm legacy `web/` pages still resolve (trust, status, verify)
- [ ] Update `BILLION_DOLLAR_BLUEPRINT.md` with deployment notes

## Troubleshooting
- **`Attempted import error` during Vercel build**: confirms a renamed helper stopped exporting from shared libs. Run `npm --prefix certnode-dashboard run build` locally and align the imports/exports (e.g., `normalizePlanTier`, `comparePlanTiers`) before retrying the deploy.
- **Homepage shows legacy static site**: ensure the `vercel.json` rewrites keep `/` pointing at `/nextjs-pricing` (host-aware rule stays last); redeploy after updating.
- **`basePath can not be used with builds` or missing Next lambdas**: the dashboard app now shims its `/certnode-dashboard` prefix via Next.js rewrites instead of `basePath`, and marketing health checks ride the legacy Node API. Pull latest `certnode-dashboard/next.config.mjs` and drop duplicate `app/api/health` routes before redeploying.
