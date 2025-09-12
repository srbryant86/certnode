# JWKS Rotation and Integrity

This document describes how to validate JWKS integrity and perform safe key rotation.

## Integrity Check

Validate a JWKS file locally:

```
node tools/jwks-integrity-check.js --jwks path/to/jwks.json
```

Pass criteria:
- `kty: EC`, `crv: P-256`, valid base64url `x`/`y` decoding to 32 bytes
- No duplicate thumbprints (RFC 7638)
- Warnings printed for non‑ES256 `alg` or non‑sig `use`

## Rotation Validation

Ensure rotation keeps at least one overlapping key between the current and next JWKS:

```
node tools/jwks-rotate-validate.js --current path/current.json --next path/next.json
```

Pass criteria:
- Both JWKS pass integrity checks
- At least one overlapping thumbprint between current and next

## Optional JWKS Caching Helpers

To reduce fetches and handle basic freshness in clients:

- Node: `sdk/node/jwks-manager.js`
- Web: `sdk/web/jwks-manager.js`

Features:
- In‑memory cache with TTL
- Conditional fetch using ETag/Last‑Modified when provided
- Helper to compute current thumbprints

These helpers are optional and have no external dependencies.
