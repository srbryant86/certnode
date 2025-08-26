# Deployment Guide (Fly.io + Cloudflare)

1. Merge to `main` (push triggers Deploy workflow).
2. Run **Provision Domain Certificates** (manual). Copy DNS:
   - Apex: CNAME certnode.fly.dev (flattened) or A to Fly IP
   - WWW:  CNAME certnode.fly.dev
   - Proxy: **DNS only** until verified
3. In Cloudflare, add records above.
4. Run **Verify Domain Setup**.
5. Flip both records to **Proxied** (orange cloud).

### Scale (fly.toml)
Increase RAM/CPU by editing the `[[vm]]` block and pushing:
```toml
[[vm]]
  cpu_kind = "shared"
  cpus = 2
  memory_mb = 2048