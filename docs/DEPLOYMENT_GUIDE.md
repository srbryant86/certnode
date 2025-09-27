# CertNode Deployment Architecture

## ⚠️ CRITICAL DEPLOYMENT INFO

The homepage is served from **`/web/index.html`** NOT from the Next.js app!

### Deployment Structure

```
certnode.io serves from:
├── / → /web/index.html (HOMEPAGE - edit this file!)
├── /dashboard → certnode-dashboard/ (Next.js app)
├── /api → api/ (Node.js API)
├── /pricing → nextjs-pricing/ (Next.js pricing)
└── /public → public/ (Static files)
```

### Key Files to Update

**Homepage Changes:** Edit `/web/index.html`
**Dashboard:** Edit `/certnode-dashboard/app/`
**API:** Edit `/api/src/`

### Vercel Configuration

- Auto-deploys from main branch
- Configuration in `/vercel.json`
- Rewrites handle routing between services

### Weekly Deployments

**Week 1-3 Complete:**
- ✅ Backend APIs deployed
- ✅ Dashboard integration deployed
- ✅ Homepage updates deployed (web/index.html)
- ✅ Content authenticity platform operational