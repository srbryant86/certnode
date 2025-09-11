//---------------------------------------------------------------------
// web/js/verify-helper.js
// Minimal helper for browsers: quick shape checks + payload hash re-check.
// NOTE: Does NOT perform ECDSA verification. For full offline verification,
// use the Node SDK or the CLI from tools/verify-receipt.js.
(function (global) {
  function b64u(buf) {
    const s = btoa(String.fromCharCode(...new Uint8Array(buf)));
    return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
  async function sha256Bytes(bytes) {
    const h = await crypto.subtle.digest('SHA-256', bytes);
    return new Uint8Array(h);
  }
  function canonicalizeShallow(obj) {
    // Placeholder: a stable, shallow key sort. Not full RFC 8785.
    // Good enough for a "quick check" helper; server/SDK does the real JCS.
    const keys = Object.keys(obj).sort();
    const out = {};
    for (const k of keys) out[k] = obj[k];
    return new TextEncoder().encode(JSON.stringify(out));
  }

  async function quickCheck(receipt) {
    if (!receipt || typeof receipt !== 'object') return { ok: false, reason: 'bad_receipt' };
    if (!receipt.protected || !receipt.signature || !('payload' in receipt) || !receipt.kid) {
      return { ok: false, reason: 'missing_fields' };
    }
    if (receipt.payload_jcs_sha256) {
      const bytes = canonicalizeShallow(receipt.payload);
      const h = await sha256Bytes(bytes);
      const hB64u = b64u(h);
      if (hB64u !== receipt.payload_jcs_sha256) return { ok: false, reason: 'payload_hash_mismatch' };
    }
    return { ok: true };
  }

  global.CertNode = global.CertNode || {};
  global.CertNode.quickCheck = quickCheck;
})(typeof window !== 'undefined' ? window : (globalThis || {}));
//---------------------------------------------------------------------