# Cloudflare DNS Setup for CertNode + Vercel

This guide shows you how to configure your Cloudflare DNS to work with your Vercel deployment.

## Current Cloudflare Setup (from your screenshot)
- ✅ A record: `certnode.io` → `66.241.124.23` (Proxied)
- ✅ AAAA record: `certnode.io` → `2a09:8280:1::9` (Proxied)
- ✅ CNAME: `www` → `certnode.fly.dev` (Proxied)

## Required Changes After Vercel Deployment

### Step 1: Deploy to Vercel First
Run the deployment script:
```powershell
# Windows
scripts\deploy-to-vercel.ps1 -Production

# Or Unix/Mac/WSL
scripts/deploy-to-vercel.sh --production
```

### Step 2: Get Your Vercel URLs
After deployment, you'll get URLs like:
- Preview: `https://certnode-abc123.vercel.app`
- Production: `https://certnode-xyz789.vercel.app`

### Step 3: Update Cloudflare DNS

**Option A: Point to Vercel (Recommended)**
1. In Cloudflare DNS, change the A record:
   - Type: `CNAME`
   - Name: `@` (or `certnode.io`)
   - Target: `cname.vercel-dns.com`
   - Proxy: ✅ Proxied (keep Cloudflare CDN benefits)

2. Update the www CNAME:
   - Type: `CNAME`
   - Name: `www`
   - Target: `cname.vercel-dns.com`
   - Proxy: ✅ Proxied

**Option B: Keep Current Setup (Alternative)**
- Keep your current A/AAAA records
- Add API subdomain: `api.certnode.io` → `cname.vercel-dns.com`
- Use reverse proxy from your current server

### Step 4: Add Domain in Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your `certnode` project
3. Go to **Settings > Domains**
4. Add domains:
   - `certnode.io`
   - `www.certnode.io`
5. Vercel will verify DNS automatically

### Step 5: Verify SSL/HTTPS
Both Cloudflare and Vercel provide SSL:
- Cloudflare: Handles SSL termination (your current setup)
- Vercel: Automatic Let's Encrypt certificates
- Result: End-to-end encryption ✅

## DNS Propagation
- Changes take 5-60 minutes globally
- Test with: `nslookup certnode.io` and `curl https://certnode.io/health`

## Troubleshooting

**"Domain not configured" error:**
- Wait for DNS propagation (up to 1 hour)
- Verify CNAME points to `cname.vercel-dns.com`
- Check Vercel dashboard shows domain as "Active"

**502/503 errors:**
- Check Vercel function logs in dashboard
- Verify environment variables are set
- Run local tests: `node tools/test-fast.js`

**SSL certificate errors:**
- Cloudflare SSL mode should be "Full" or "Full (strict)"
- Vercel handles certificates automatically
- Both services play nicely together

## Cost Implications
- **Cloudflare**: Free plan sufficient (DNS + CDN)
- **Vercel**: Free tier covers initial usage
- **Total added cost**: $0/month initially

## Rollback Plan
If anything breaks, revert the A record to:
- Type: `A`
- Name: `@`
- Value: `66.241.124.23`
- Proxy: ✅ Proxied

Your site will be back to the previous state immediately.