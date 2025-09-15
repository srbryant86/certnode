# 🚀 Deploy CertNode to Production

**One-command deployment to get CertNode live at certnode.io**

## Quick Deploy (2 minutes)

### Windows
```powershell
scripts\deploy-to-vercel.ps1 -Production
```

### Mac/Linux/WSL
```bash
chmod +x scripts/deploy-to-vercel.sh
scripts/deploy-to-vercel.sh --production
```

That's it! The script will:
1. ✅ Run all tests
2. ✅ Install Vercel CLI if needed
3. ✅ Deploy to Vercel
4. ✅ Give you next steps

## After Deployment

### 1. Add Your Domain (1 minute)
- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- Click your `certnode` project
- Settings > Domains > Add `certnode.io`

### 2. Update Cloudflare DNS (1 minute)
In your Cloudflare dashboard:
- Change A record: `certnode.io` → `cname.vercel-dns.com` (CNAME)
- Or follow the detailed guide: `scripts/cloudflare-dns-setup.md`

### 3. Set Environment Variables (Optional)
- Copy from `scripts/vercel-env-template.txt`
- Add in Vercel Settings > Environment Variables
- Redeploy: `vercel --prod`

## What You Get

✅ **Live at https://certnode.io**
- Home page with your messaging
- Receipt verification at `/verify.html`
- API documentation at `/openapi.html`
- Full API endpoints (`/v1/sign`, `/v1/verify`, etc.)

✅ **Production Features**
- Global CDN (Vercel + Cloudflare)
- Automatic HTTPS/SSL
- Serverless scaling
- Zero maintenance

✅ **Monitoring Ready**
- Prometheus metrics at `/metrics`
- Health checks at `/health`
- Request/error tracking built-in

## Cost Breakdown
- **Domain**: You already own it ✅
- **Vercel**: Free tier (generous limits)
- **Cloudflare**: Free tier ✅
- **AWS KMS** (optional): ~$1-2/month
- **Total**: $0-2/month

## Rollback Plan
If anything goes wrong:
```powershell
# Revert DNS in Cloudflare to your current A record
# Site is back online immediately
```

## Advanced Setup (Later)

### AWS KMS Integration
```bash
# In Vercel dashboard, add:
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_KMS_KEY_ID=your-kms-key

# Redeploy
vercel --prod
```

### Custom TSA (Timestamp Authority)
```bash
# Add to Vercel env vars:
TSA_URL=https://freetsa.org/tsr
```

## Support

**Deployment Issues:**
- Check `node tools/test-fast.js` passes locally
- Verify you're in the certnode root directory
- Look at Vercel function logs in dashboard

**DNS Issues:**
- DNS changes take 5-60 minutes to propagate
- Use `nslookup certnode.io` to verify
- See `scripts/cloudflare-dns-setup.md` for details

**SSL/Certificate Issues:**
- Both Cloudflare and Vercel handle SSL automatically
- No manual certificate management needed

---

**Ready to go live?** Run the deployment script above! 🎉