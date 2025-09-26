# CertNode Deployment Workflow

## Standard Deployment Process

The CertNode platform uses **automatic Vercel deployment** triggered by git pushes. Follow this workflow for all changes:

### 1. Make Changes Locally
- Edit files in your local development environment
- Test changes on local server (ports 3001, 3002, 3003)

### 2. Git Add and Commit
```bash
git add -A
git commit -m "descriptive commit message"
```

### 3. Git Push (Triggers Automatic Vercel Deployment)
```bash
git push
```
- This automatically triggers Vercel deployment
- No manual deployment commands needed
- Vercel watches the main branch for changes

### 4. Wait 1-2 Minutes for Deployment
- Vercel processes and deploys automatically
- Check Vercel dashboard for deployment status
- Changes will be live on production URL after completion

## Important Notes

- **Auto-deployment:** No manual `vercel` commands needed
- **Branch:** Deployments trigger from `main` branch pushes
- **Timing:** Allow 1-2 minutes for deployment completion
- **Verification:** Check production URL to confirm changes are live
- **Next.js assets:** Keep `/_next/*` paths unmanaged; the Vercel Next builder serves framework bundles automatically and manual rewrites will break CSS/JS delivery.

## Emergency Deployment Trigger

If auto-deployment doesn't trigger, force it with:
```bash
echo "# Deployment trigger $(date)" >> .vercel-trigger
git add .vercel-trigger
git commit -m "trigger: force deployment"
git push
```

## Configuration

Deployment is configured via:
- `vercel.json` - Deployment configuration
- `.vercel/` - Project settings
- Auto-deployment enabled on git push

---

**Last Updated:** 2025-09-24
**Process Verified:** ✅ Working with automatic git-triggered deployments
