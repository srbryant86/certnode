# Tasks — CertNode (Application Layer)

You are operating **only** on the application layer. Do not change infra/secrets.

## Completed (from git)
- a01 — completed (see git history)
- a02 — completed (see git history)
- a03 — completed (see git history)
- a04 — completed (see git history)
- a05 — completed (see git history)
- a06 — completed (see git history)
- a07 — completed (see git history)
- a08 — completed (see git history)
- a09 — completed (see git history)
- a10 — completed (see git history)
- a11 — completed (see git history)
- a12 — completed (see git history)
- a13 — completed (see git history)
- a14 — completed (see git history)
- a15 — completed (see git history)
- a16 — completed (see git history)
- a17 — completed (see git history)
- a18 — completed (see git history)
- a19 — completed (see git history)
- a20 — completed (see git history)
- a21 — completed (see git history)
- a23 — completed (see git history)
- a25 — completed (see git history)
- a26 — completed (see git history)
- a30 — completed (see git history)
- a31 — completed (see git history)
- a32 — completed (see git history)
- a34 — completed (see git history)
 - s18 — Node SDK publish finalized (v1.0.7 live on npm)

## Next (define scope + acceptance clearly, then implement only that task)
- d26 — Docs sync (AGENTS/STATUS)
  - Scope: Update AGENTS “Next Steps” to reflect SDK releases; refresh STATUS checklist to current state.
  - Acceptance: `node tools/check-docs-updated.js` passes; CI green.

## Backlog (candidates; pick and spec one at a time)
- aXX — SDK packaging & npm publish (node+browser, types, README, size checks, CI dry-run)
- aXX — JWKS static publishing hardening (S3+CloudFront OAC, versioned keys, cache headers, rotation doc)
- aXX — Web receipt viewer polish (drag/drop, copy/paste receipt, error reason mapping)
- aXX — Malformed/fuzz test corpus for receipt/JOSE/JCS edge cases

> Keep commit subjects as `feat(aNN): ...` for auditability.
