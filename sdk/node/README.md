# @certnode/sdk (Node)

Open source Node.js implementation of the CertNode standard for cryptographic digital evidence verification (RFC 7515 JWS with ECDSA P-256).

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

  // Example CertNode-compliant receipt
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
  - `receipt`: CertNode-compliant receipt object or JSON string with JWS signature.
  - `jwks`: JSON Web Key Set with EC P-256 keys. Matches by RFC 7638 thumbprint or `kid` field.

## Notes

- Only ES256 (ECDSA P-256) is supported.
- Uses RFC8785 JCS canonicalization for payload hashing when `payload_jcs_sha256` is present.
- No dependencies; uses Node `crypto` only.
- Optional JWKS cache helper included as `JWKSManager` (TTL + ETag/Last-Modified)

## Obtaining JWKS

- **Reference Implementation**: `https://api.certnode.io/.well-known/jwks.json`
- **Your Implementation**: Host JWKS at your own endpoint following the standard
- **Multiple Implementations**: Support any CertNode-compliant signing service

## Local Packaging

Inside `sdk/node`:

- `npm pack` — creates a tarball that will be published.
- `npm run publish:dry-run` — shows publish contents without publishing.

## License

MIT

