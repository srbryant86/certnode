//---------------------------------------------------------------------
// web/js/verify.js
// Browser WebCrypto ES256 verification for CertNode receipts
(function (global) {
  'use strict';

  // Utility functions
  function isObject(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  }

  function stringifyCanonical(value) {
    if (value === null || typeof value === 'number' || typeof value === 'boolean') {
      return JSON.stringify(value);
    }
    if (typeof value === 'string') {
      return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
      const items = value.map((v) => stringifyCanonical(v));
      return '[' + items.join(',') + ']';
    }
    if (isObject(value)) {
      const keys = Object.keys(value).sort();
      const parts = [];
      for (const k of keys) {
        const v = value[k];
        if (typeof v === 'undefined') continue;
        parts.push(JSON.stringify(k) + ':' + stringifyCanonical(v));
      }
      return '{' + parts.join(',') + '}';
    }
    return JSON.stringify(value);
  }

  function canonicalize(value) {
    return new TextEncoder().encode(stringifyCanonical(value));
  }

  function bytesToB64u(bytes) {
    const uint8Array = new Uint8Array(bytes);
    const binaryString = String.fromCharCode(...uint8Array);
    return btoa(binaryString)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  function b64uToBytes(str) {
    const padded = str + '='.repeat((4 - str.length % 4) % 4);
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
    const binaryString = atob(base64);
    return new Uint8Array([...binaryString].map(char => char.charCodeAt(0)));
  }

  function jwkThumbprint(jwk) {
    if (!jwk || jwk.kty !== 'EC' || jwk.crv !== 'P-256' || !jwk.x || !jwk.y) {
      throw new Error('Only EC P-256 JWK supported for thumbprint');
    }
    const json = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y });
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(json))
      .then(hash => bytesToB64u(hash));
  }

  // Convert JOSE signature (64 bytes r||s) to DER for WebCrypto
  function joseToDer(joseSignature) {
    const r = joseSignature.slice(0, 32);
    const s = joseSignature.slice(32, 64);

    function trimLeadingZeros(arr) {
      let start = 0;
      while (start < arr.length - 1 && arr[start] === 0) start++;
      return arr.slice(start);
    }

    const rTrim = trimLeadingZeros(r);
    const sTrim = trimLeadingZeros(s);

    // Add 0x00 prefix if high bit is set (to keep positive)
    const rInt = (rTrim[0] & 0x80) ? new Uint8Array([0x00, ...rTrim]) : rTrim;
    const sInt = (sTrim[0] & 0x80) ? new Uint8Array([0x00, ...sTrim]) : sTrim;

    // Build DER: SEQUENCE { INTEGER r, INTEGER s }
    const rSeq = new Uint8Array([0x02, rInt.length, ...rInt]);
    const sSeq = new Uint8Array([0x02, sInt.length, ...sInt]);
    const totalLength = rSeq.length + sSeq.length;
    
    return new Uint8Array([0x30, totalLength, ...rSeq, ...sSeq]);
  }

  // Build SPKI from P-256 JWK for WebCrypto import
  function spkiFromP256Jwk(jwk) {
    if (!jwk || jwk.kty !== 'EC' || jwk.crv !== 'P-256' || !jwk.x || !jwk.y) {
      throw new Error('Invalid P-256 JWK');
    }
    
    const xBytes = b64uToBytes(jwk.x);
    const yBytes = b64uToBytes(jwk.y);
    
    if (xBytes.length !== 32 || yBytes.length !== 32) {
      throw new Error('Invalid coordinate length for P-256');
    }
    
    // SPKI prefix for P-256 uncompressed point
    const spkiPrefix = new Uint8Array([
      0x30, 0x59, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, 
      0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, 0x03, 0x42, 0x00, 0x04
    ]);
    
    return new Uint8Array([...spkiPrefix, ...xBytes, ...yBytes]);
  }

  /**
   * Verify a CertNode receipt using WebCrypto ES256
   * @param {Object} receipt - The receipt to verify
   * @param {Object} jwks - The JWKS containing public keys
   * @returns {Promise<Object>} { ok: boolean } or throws Error with reason
   */
  async function verifyReceipt(receipt, jwks) {
    // Parse receipt if string
    if (typeof receipt === 'string') {
      receipt = JSON.parse(receipt);
    }
    
    // Validate receipt structure
    if (!receipt.protected || !receipt.signature || !('payload' in receipt) || !receipt.kid) {
      throw new Error('missing_fields');
    }
    
    // Decode protected header
    let header;
    try {
      const protectedBytes = b64uToBytes(receipt.protected);
      header = JSON.parse(new TextDecoder().decode(protectedBytes));
    } catch {
      throw new Error('bad_protected');
    }
    
    // Validate header
    if (header.alg !== 'ES256') {
      throw new Error('unsupported_alg');
    }
    
    if (header.kid !== receipt.kid) {
      throw new Error('kid_mismatch');
    }
    
    // Find matching key in JWKS by RFC7638 thumbprint
    let key = null;
    for (const k of jwks.keys || []) {
      try {
        const thumbprint = await jwkThumbprint(k);
        if (thumbprint === receipt.kid) {
          key = k;
          break;
        }
      } catch {
        // Try matching by kid field as fallback
        if (k.kid === receipt.kid) {
          key = k;
          break;
        }
      }
    }
    
    if (!key) {
      throw new Error('kid_not_found');
    }
    
    // JCS canonicalize payload
    const jcsBytes = canonicalize(receipt.payload);
    const payloadB64u = bytesToB64u(jcsBytes);
    
    // Validate JCS hash if present
    if (receipt.payload_jcs_sha256) {
      const jcsHash = await crypto.subtle.digest('SHA-256', jcsBytes);
      const expectedHash = b64uToBytes(receipt.payload_jcs_sha256);
      const computedHash = new Uint8Array(jcsHash);
      
      if (computedHash.length !== expectedHash.length) {
        throw new Error('payload_hash_mismatch');
      }
      
      for (let i = 0; i < computedHash.length; i++) {
        if (computedHash[i] !== expectedHash[i]) {
          throw new Error('payload_hash_mismatch');
        }
      }
    }
    
    // Create signing input (protected + '.' + JCS(payload))
    const signingInput = receipt.protected + '.' + payloadB64u;
    const signingData = new TextEncoder().encode(signingInput);
    
    // Import public key from JWK
    const spki = spkiFromP256Jwk(key);
    const publicKey = await crypto.subtle.importKey(
      'spki',
      spki,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );
    
    // Convert JOSE signature for WebCrypto
    const joseSignature = b64uToBytes(receipt.signature);
    if (joseSignature.length !== 64) {
      throw new Error('signature_invalid');
    }
    
    // Try raw JOSE signature first (some WebCrypto implementations prefer this)
    let isValid = false;
    try {
      isValid = await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        publicKey,
        joseSignature,
        signingData
      );
    } catch {
      // If raw fails, try DER format
      const derSignature = joseToDer(joseSignature);
      isValid = await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        publicKey,
        derSignature,
        signingData
      );
    }
    
    if (!isValid) {
      throw new Error('signature_invalid');
    }
    
    // Optional receipt_id check if present
    if (receipt.receipt_id) {
      const fullReceipt = `${receipt.protected}.${payloadB64u}.${receipt.signature}`;
      const receiptBytes = new TextEncoder().encode(fullReceipt);
      const computedHash = await crypto.subtle.digest('SHA-256', receiptBytes);
      const computedId = bytesToB64u(computedHash);
      
      if (computedId !== receipt.receipt_id) {
        throw new Error('receipt_id_mismatch');
      }
    }
    
    return { ok: true };
  }

  // Expose for both browser and Node.js environments
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { verifyReceipt };
  } else {
    global.CertNode = global.CertNode || {};
    global.CertNode.verifyReceipt = verifyReceipt;
  }
  
})(typeof window !== 'undefined' ? window : globalThis);
//---------------------------------------------------------------------