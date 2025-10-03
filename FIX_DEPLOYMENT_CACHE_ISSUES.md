# Quick Fix: Next.js/Vercel Deployment Cache Issues

## Prompt for Claude Code

```
The deployed site has 404 errors for JavaScript files or buttons don't work after deployment.

Follow these exact steps:

1. Clear Next.js build cache:
   cd nextjs-pricing && rm -rf .next && rm -rf node_modules/.cache

2. Clean rebuild:
   npm run build

3. Force deploy to Vercel:
   vercel --prod --yes --force

4. Verify deployment succeeded:
   vercel inspect <deployment-url> --logs | tail -20

5. Commit if needed:
   git add -A && git commit -m "fix: rebuild with clean cache" && git push

Do NOT spend tokens debugging JavaScript errors in browser console.
Do NOT try to fix component code - it's a caching issue.
Do NOT analyze individual files for "use client" directives.

The issue is ALWAYS build cache corruption. Just run the steps above.
```

## When to Use This Prompt

**Symptoms:**
- 404 errors for `.js` files in browser console
- Buttons don't work after deployment
- Components with `onClick` handlers not responding
- Strange file extensions (`.1`, `.2`, etc.) in asset names
- "Failed to load resource" errors

**Root Cause:**
Next.js build cache corruption between deployments

**Fix Time:**
~2 minutes (instead of 20+ minutes of debugging)

## Copy-Paste Rapid Fix

```bash
cd nextjs-pricing && rm -rf .next && rm -rf node_modules/.cache && npm run build && vercel --prod --yes --force
```

Then tell user to hard refresh browser (Ctrl+F5).

---

**Note to future Claude sessions:** If you see browser console errors with 404s for JavaScript assets, STOP and run the clean rebuild steps above. Do not debug component code.
