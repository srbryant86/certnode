# @certnode/sdk-web (Browser)

ESM browser SDK for verifying CertNode receipts using WebCrypto (ES256 / P‑256).

## Install

- Via npm (recommended): `npm install @certnode/sdk-web`
- Via CDN (after publish):
  - ESM: `<script type="module"> import { verifyReceipt } from 'https://cdn.jsdelivr.net/npm/@certnode/sdk-web/+esm'; </script>`
  - UMD/global (compat): use `web/js/verify.js` from this repo and reference `window.CertNode.verifyReceipt`.

## Usage (ESM)

```html
<script type="module">
  import { verifyReceipt } from '@certnode/sdk-web';
  // Or: import CertNode from '@certnode/sdk-web';

  const jwks = { keys: [ /* { kty:'EC', crv:'P-256', x:'...', y:'...', kid:'...' } */ ] };
  const receipt = { /* protected, payload, signature, kid, ... */ };

  const result = await verifyReceipt({ receipt, jwks });
  console.log(result.ok ? 'valid' : `invalid: ${result.reason}`);
</script>
```

## Notes

- Only ES256 (ECDSA P‑256) is supported.
- Uses RFC8785 JCS for canonicalization when `payload_jcs_sha256` is present.
- No dependencies; requires a browser with WebCrypto support.

## Types

- Type definitions included via `index.d.ts`.

## License

MIT

