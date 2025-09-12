//---------------------------------------------------------------------
// sdk/web/index.js
// Browser SDK for CertNode receipt verification (ES modules)
// Uses WebCrypto API for cryptographic operations

// Utility functions for JCS canonicalization
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

// Base64url utilities
function b64u(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const binaryString = String.fromCharCode(...bytes);
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

// JWK thumbprint (RFC 7638)
async function jwkThumbprint(jwk) {
  if (!jwk || jwk.kty !== 'EC' || jwk.crv !== 'P-256' || !jwk.x || !jwk.y) {
    throw new Error('Only EC P-256 JWK supported for thumbprint');
  }
  const json = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y });
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(json));
  return b64u(hash);
}

// Convert JWK to WebCrypto key
async function jwkToCryptoKey(jwk) {
  if (!jwk || jwk.kty !== 'EC' || jwk.crv !== 'P-256' || !jwk.x || !jwk.y) {
    throw new Error('Invalid P-256 JWK');
  }
  
  return await crypto.subtle.importKey(
    'jwk',
    { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify']
  );
}

// Convert JOSE signature to WebCrypto format (they're the same for P-256)
function joseToWebCrypto(joseSignature) {
  return b64uToBytes(joseSignature);
}

/**
 * Verify a CertNode receipt using a JWKS object
 * @param {Object} options - Verification options
 * @param {Object} options.receipt - The receipt to verify
 * @param {Object} options.jwks - The JWKS containing public keys
 * @returns {Promise<Object>} { ok: boolean, reason?: string }
 */
export async function verifyReceipt({ receipt, jwks }) {
  try {
    // Parse receipt if string
    if (typeof receipt === 'string') {
      receipt = JSON.parse(receipt);
    }
    
    // Validate receipt structure
    if (!receipt.protected || !receipt.signature || !('payload' in receipt) || !receipt.kid) {
      return { ok: false, reason: 'Missing required receipt fields' };
    }
    
    // Decode protected header
    const protectedBytes = b64uToBytes(receipt.protected);
    const header = JSON.parse(new TextDecoder().decode(protectedBytes));
    
    // Validate header
    if (header.alg !== 'ES256') {
      return { ok: false, reason: `Unsupported algorithm: ${header.alg}` };
    }
    
    if (header.kid !== receipt.kid) {
      return { ok: false, reason: 'Kid mismatch between header and receipt' };
    }
    
    // Find matching key in JWKS by RFC7638 thumbprint or kid field
    let key = null;
    for (const k of jwks.keys) {
      try {
        const thumbprint = await jwkThumbprint(k);
        if (thumbprint === receipt.kid) {
          key = k;
          break;
        }
      } catch {
        // Try matching by kid field
        if (k.kid === receipt.kid) {
          key = k;
          break;
        }
      }
    }
    
    if (!key) {
      return { ok: false, reason: `Key not found in JWKS: ${receipt.kid}` };
    }
    
    // Validate JCS hash if present
    if (receipt.payload_jcs_sha256) {
      const jcsBytes = canonicalize(receipt.payload);
      const jcsHash = await crypto.subtle.digest('SHA-256', jcsBytes);
      const expectedHash = b64uToBytes(receipt.payload_jcs_sha256);
      
      const computedHashBytes = new Uint8Array(jcsHash);
      if (computedHashBytes.length !== expectedHash.length) {
        return { ok: false, reason: 'JCS hash length mismatch' };
      }
      
      for (let i = 0; i < computedHashBytes.length; i++) {
        if (computedHashBytes[i] !== expectedHash[i]) {
          return { ok: false, reason: 'JCS hash mismatch' };
        }
      }
    }
    
    // Create signing input (protected + '.' + JCS(payload))
    const payloadB64u = b64u(canonicalize(receipt.payload));
    const signingInput = receipt.protected + '.' + payloadB64u;
    
    // Verify signature using WebCrypto
    const cryptoKey = await jwkToCryptoKey(key);
    const signature = joseToWebCrypto(receipt.signature);
    const signingData = new TextEncoder().encode(signingInput);
    
    const isValid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      cryptoKey,
      signature,
      signingData
    );
    
    if (!isValid) {
      return { ok: false, reason: 'Invalid signature' };
    }
    
    // Optional receipt_id check if present
    if (receipt.receipt_id) {
      const fullReceipt = `${receipt.protected}.${payloadB64u}.${receipt.signature}`;
      const receiptBytes = new TextEncoder().encode(fullReceipt);
      const computedHash = await crypto.subtle.digest('SHA-256', receiptBytes);
      const computedId = b64u(computedHash);
      
      if (computedId !== receipt.receipt_id) {
        return { ok: false, reason: 'Receipt ID mismatch' };
      }
    }
    
    return { ok: true };
    
  } catch (error) {
    return { ok: false, reason: `Verification failed: ${error.message}` };
  }
}

// For backwards compatibility, also create a global namespace version
if (typeof window !== 'undefined') {
  window.CertNode = window.CertNode || {};
  window.CertNode.verifyReceipt = verifyReceipt;
}

export default { verifyReceipt };
//---------------------------------------------------------------------