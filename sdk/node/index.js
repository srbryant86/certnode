//---------------------------------------------------------------------
// sdk/node/index.js
// Node.js SDK for CertNode receipt verification (ES256 + EdDSA, zero dependencies)
const crypto = require('crypto');
const { JWKSManager } = require('./jwks-manager');

// Enhanced utilities (optional dependencies)
let enhancedFeatures = {};
try {
  const errors = require('./lib/errors');
  const performance = require('./lib/performance');
  const validation = require('./lib/validation');
  const circuitBreaker = require('./lib/circuit-breaker');
  const enhancedJwks = require('./lib/enhanced-jwks-manager');

  enhancedFeatures = {
    ...errors,
    ...performance,
    ...validation,
    ...circuitBreaker,
    EnhancedJWKSManager: enhancedJwks.EnhancedJWKSManager
  };
} catch (error) {
  // Enhanced features not available, continue with basic functionality
}

// Utility functions (copied from api/src/util/)
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
  return Buffer.from(stringifyCanonical(value), 'utf8');
}

function b64u(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function b64uToBuf(str) {
  const padded = str + '='.repeat((4 - str.length % 4) % 4);
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function jwkThumbprint(jwk) {
  if (jwk.kty === 'EC' && jwk.crv === 'P-256' && jwk.x && jwk.y) {
    const json = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y });
    return b64u(crypto.createHash('sha256').update(json, 'utf8').digest());
  } else if (jwk.kty === 'OKP' && jwk.crv === 'Ed25519' && jwk.x) {
    const json = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x });
    return b64u(crypto.createHash('sha256').update(json, 'utf8').digest());
  }
  throw new Error('Only EC P-256 and OKP Ed25519 JWK supported for thumbprint');
}

function joseToDer(jose) {
  if (!Buffer.isBuffer(jose)) jose = Buffer.from(jose, 'base64url');
  if (jose.length !== 64) throw new Error('JOSE signature must be 64 bytes for P-256');
  const r = jose.slice(0, 32);
  const s = jose.slice(32);

  function trimLeadingZeros(buf) {
    let i = 0;
    while (i < buf.length - 1 && buf[i] === 0x00) i++;
    return buf.slice(i);
  }

  const rTrim = trimLeadingZeros(r);
  const sTrim = trimLeadingZeros(s);

  const rInt = (rTrim[0] & 0x80) ? Buffer.concat([Buffer.from([0x00]), rTrim]) : rTrim;
  const sInt = (sTrim[0] & 0x80) ? Buffer.concat([Buffer.from([0x00]), sTrim]) : sTrim;

  const rSeq = Buffer.concat([Buffer.from([0x02, rInt.length]), rInt]);
  const sSeq = Buffer.concat([Buffer.from([0x02, sInt.length]), sInt]);
  const seq  = Buffer.concat([Buffer.from([0x30, rSeq.length + sSeq.length]), rSeq, sSeq]);
  return seq;
}

function spkiFromP256Jwk(jwk) {
  if (!jwk || jwk.kty !== 'EC' || jwk.crv !== 'P-256' || !jwk.x || !jwk.y) {
    throw new Error('Invalid P-256 JWK');
  }

  const xBuf = b64uToBuf(jwk.x);
  const yBuf = b64uToBuf(jwk.y);

  if (xBuf.length !== 32 || yBuf.length !== 32) {
    throw new Error('Invalid coordinate length for P-256');
  }

  // SPKI prefix for P-256 uncompressed point
  const spkiPrefix = Buffer.from([
    0x30, 0x59, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01,
    0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, 0x03, 0x42, 0x00, 0x04
  ]);

  return Buffer.concat([spkiPrefix, xBuf, yBuf]);
}

function spkiFromEd25519Jwk(jwk) {
  if (!jwk || jwk.kty !== 'OKP' || jwk.crv !== 'Ed25519' || !jwk.x) {
    throw new Error('Invalid Ed25519 JWK');
  }

  const publicKey = b64uToBuf(jwk.x);

  if (publicKey.length !== 32) {
    throw new Error('Invalid public key length for Ed25519');
  }

  // SPKI prefix for Ed25519
  const spkiPrefix = Buffer.from([
    0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00
  ]);

  return Buffer.concat([spkiPrefix, publicKey]);
}

/**
 * Enhanced receipt verification with detailed results
 * @param {Object} options - Verification options
 * @param {Object} options.receipt - The receipt to verify
 * @param {Object} options.jwks - The JWKS containing public keys
 * @param {boolean} options.enablePerformanceTracking - Enable performance metrics
 * @param {Object} options.validation - Additional validation options
 * @returns {Object} Enhanced verification result
 */
async function verifyReceipt(options) {
  // Handle both old and new API styles
  const { receipt, jwks } = options;

  // If enhanced features are available and performance tracking is enabled
  if (enhancedFeatures.PerformanceBenchmark && options.enablePerformanceTracking) {
    const session = enhancedFeatures.PerformanceBenchmark.start('Receipt Verification');

    try {
      session.checkpoint('Input validation');
      const result = await verifyReceiptCore({ receipt, jwks });
      session.checkpoint('Signature verification');

      const performance = session.finish();

      return {
        ...result,
        performance: {
          totalTimeMs: performance.totalTimeMs,
          breakdown: {
            keyLookupMs: performance.checkpoints[0]?.timeMs || 0,
            signatureVerificationMs: performance.checkpoints[1]?.timeMs || 0,
            payloadValidationMs: performance.totalTimeMs - (performance.checkpoints[1]?.timeMs || 0)
          }
        }
      };
    } catch (error) {
      const performance = session.finish();
      return {
        ok: false,
        reason: error.message,
        performance: {
          totalTimeMs: performance.totalTimeMs,
          breakdown: {
            keyLookupMs: 0,
            signatureVerificationMs: 0,
            payloadValidationMs: performance.totalTimeMs
          }
        }
      };
    }
  }

  // Fallback to core verification
  return await verifyReceiptCore({ receipt, jwks });
}

/**
 * Core receipt verification logic (backward compatible)
 * @param {Object} options - Verification options
 * @param {Object} options.receipt - The receipt to verify
 * @param {Object} options.jwks - The JWKS containing public keys
 * @returns {Object} { ok: boolean, reason?: string }
 */
async function verifyReceiptCore({ receipt, jwks }) {
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
    const protectedBuf = b64uToBuf(receipt.protected);
    const header = JSON.parse(protectedBuf.toString('utf8'));
    
    // Validate algorithm
    if (!['ES256', 'EdDSA'].includes(header.alg)) {
      return { ok: false, reason: `Unsupported algorithm: ${header.alg}. Use ES256 or EdDSA.` };
    }
    
    if (header.kid !== receipt.kid) {
      return { ok: false, reason: 'Kid mismatch between header and receipt' };
    }
    
    // Find matching key in JWKS by RFC7638 thumbprint or kid field
    let key = null;
    for (const k of jwks.keys) {
      try {
        if (jwkThumbprint(k) === receipt.kid) {
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
      const jcsHash = crypto.createHash('sha256').update(canonicalize(receipt.payload)).digest();
      const expectedHash = b64uToBuf(receipt.payload_jcs_sha256);
      if (!jcsHash.equals(expectedHash)) {
        return { ok: false, reason: 'JCS hash mismatch' };
      }
    }
    
    // Create signing input (protected + '.' + JCS(payload))
    const payloadB64u = b64u(canonicalize(receipt.payload));
    const signingInput = receipt.protected + '.' + payloadB64u;
    
    // Verify signature based on algorithm
    let isValid = false;
    const signatureBuf = b64uToBuf(receipt.signature);

    if (header.alg === 'ES256') {
      // ES256 verification with P-256
      if (key.kty !== 'EC' || key.crv !== 'P-256') {
        return { ok: false, reason: 'ES256 requires EC P-256 key' };
      }

      const spki = spkiFromP256Jwk(key);
      const publicKey = crypto.createPublicKey({ key: spki, format: 'der', type: 'spki' });
      const derSignature = joseToDer(signatureBuf);

      const verify = crypto.createVerify('SHA256');
      verify.update(signingInput, 'utf8');
      isValid = verify.verify(publicKey, derSignature);

    } else if (header.alg === 'EdDSA') {
      // EdDSA verification with Ed25519
      if (key.kty !== 'OKP' || key.crv !== 'Ed25519') {
        return { ok: false, reason: 'EdDSA requires OKP Ed25519 key' };
      }

      const spki = spkiFromEd25519Jwk(key);
      const publicKey = crypto.createPublicKey({ key: spki, format: 'der', type: 'spki' });

      // For Ed25519, use one-shot verify with explicit algorithm (Node 20+)
      isValid = crypto.verify('ed25519', Buffer.from(signingInput, 'utf8'), publicKey, signatureBuf);
    }
    
    if (!isValid) {
      return { ok: false, reason: 'Invalid signature' };
    }
    
    // Optional receipt_id check if present
    if (receipt.receipt_id) {
      const fullReceipt = `${receipt.protected}.${payloadB64u}.${receipt.signature}`;
      const computedId = b64u(crypto.createHash('sha256').update(fullReceipt, 'utf8').digest());
      if (computedId !== receipt.receipt_id) {
        return { ok: false, reason: 'Receipt ID mismatch' };
      }
    }
    
    return { ok: true };
    
  } catch (error) {
    return { ok: false, reason: `Verification failed: ${error.message}` };
  }
}

/**
 * Batch verify multiple receipts efficiently
 * @param {Array} receipts - Array of receipts to verify
 * @param {Object} jwks - JWKS containing verification keys
 * @param {Object} options - Batch verification options
 * @returns {Promise<Array>} Array of verification results
 */
async function verifyReceiptBatch(receipts, jwks, options = {}) {
  if (!enhancedFeatures.ErrorAggregator) {
    // Fallback to sequential verification without enhanced error handling
    const results = [];
    for (const receipt of receipts) {
      try {
        const result = await verifyReceiptCore({ receipt, jwks });
        results.push(result);
      } catch (error) {
        results.push({ ok: false, reason: error.message });
      }
    }
    return results;
  }

  const aggregator = new enhancedFeatures.ErrorAggregator();
  const results = [];

  // Use Promise.allSettled for concurrent verification
  const promises = receipts.map(async (receipt, index) => {
    try {
      const result = await verifyReceipt({ receipt, jwks, ...options });
      aggregator.addSuccess();
      return { index, result };
    } catch (error) {
      aggregator.addError(error, index);
      return { index, result: { ok: false, reason: error.message } };
    }
  });

  const settled = await Promise.allSettled(promises);

  // Reconstruct results in original order
  settled.forEach((outcome, index) => {
    if (outcome.status === 'fulfilled') {
      results[outcome.value.index] = outcome.value.result;
    } else {
      results[index] = { ok: false, reason: outcome.reason.message };
    }
  });

  return results;
}

// Create exports object
const moduleExports = {
  // Core functions (always available)
  verifyReceipt,
  verifyReceiptBatch,
  JWKSManager,

  // Enhanced features (available if loaded)
  ...enhancedFeatures
};

// Legacy compatibility
moduleExports.verifyReceiptCore = verifyReceiptCore;

module.exports = moduleExports;
//---------------------------------------------------------------------
