# @certnode/sdk (Node)

Minimal, dependency-free Node.js SDK for verifying CertNode receipts (ES256 / P-256).

## Install

- Local project (once published): `npm install @certnode/sdk`
- From source (this repo): run `npm pack` inside `sdk/node` and install the generated tarball.

## Quick Start

```js
const { verifyReceipt, JWKSManager } = require('@certnode/sdk');

(async () => {
  // Optional: JWKS caching helper (fetch + TTL)
  const jwksMgr = new JWKSManager({ ttlMs: 300000 });
  const jwks = jwksMgr.setFromObject({
    keys: [
      // { kty: 'EC', crv: 'P-256', x: '...', y: '...', kid: '...' }
    ]
  });

  // Example receipt from CertNode /v1/sign
  const receipt = {
    protected: 'eyJhbGciOiJFUzI1NiIsImtpZCI6Ii...',
    payload: { hello: 'world', n: 42 },
    signature: 'MEYCIQ...',
    kid: '8sDq...thumbprint'
  };

  const result = await verifyReceipt({ receipt, jwks });
  console.log(result.ok ? 'Receipt valid' : `Receipt invalid: ${result.reason}`);
})();
```

## API

- `verifyReceipt({ receipt, jwks })` -> `{ ok: boolean, reason?: string }`
  - `receipt`: object or JSON string of the receipt returned by CertNode `/v1/sign`.
  - `jwks`: JSON Web Key Set with EC P-256 keys. The SDK matches by RFC7638 thumbprint or `kid` field.

## Notes

- Only ES256 (ECDSA P-256) is supported.
- Uses RFC8785 JCS canonicalization for payload hashing when `payload_jcs_sha256` is present.
- No dependencies; uses Node `crypto` only.
- Optional JWKS cache helper included as `JWKSManager` (TTL + ETag/Last-Modified)

## Obtaining JWKS

- Development: fetch from your running CertNode at `/jwks` or `/.well-known/jwks.json`.
- Production: use your managed JWKS location and rotate keys per your policy.

## Local Packaging

Inside `sdk/node`:

- `npm pack` — creates a tarball that will be published.
- `npm run publish:dry-run` — shows publish contents without publishing.

## License

MIT

