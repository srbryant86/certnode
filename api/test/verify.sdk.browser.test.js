const assert = require('assert');
const { generateKeyPairSync, createSign } = require('crypto');

// Use Node.js WebCrypto to simulate browser environment
global.crypto = require('node:crypto').webcrypto;
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.atob = (str) => Buffer.from(str, 'base64').toString('binary');
global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');

// Import browser verification function
const { verifyReceipt } = require('../../web/js/verify.js');

async function test() {
  // Generate P-256 keypair for signing (Node.js crypto)
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  
  // Export public key as JWK
  const jwk = publicKey.export({ format: 'jwk' });
  const cleanJwk = { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y };
  
  // Compute RFC 7638 thumbprint as kid
  const thumbprintJson = JSON.stringify({ crv: cleanJwk.crv, kty: cleanJwk.kty, x: cleanJwk.x, y: cleanJwk.y });
  const kidHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(thumbprintJson));
  const kid = Buffer.from(kidHash).toString('base64url');
  
  // Create test payload
  const payload = { hello: 'world', n: 42 };
  
  // JCS canonicalization (matching api/src/util/jcs.js logic)
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
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
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
  
  const jcsBytes = Buffer.from(stringifyCanonical(payload), 'utf8');
  const payloadB64u = jcsBytes.toString('base64url');
  const payload_jcs_sha256 = require('crypto').createHash('sha256').update(jcsBytes).digest().toString('base64url');
  
  // Create protected header
  const protectedHeader = { alg: 'ES256', kid };
  const protectedB64u = Buffer.from(JSON.stringify(protectedHeader), 'utf8').toString('base64url');
  
  // Sign with Node.js crypto (DER format first, then convert to JOSE)
  const signingInput = `${protectedB64u}.${payloadB64u}`;
  const derSignature = createSign('SHA256').update(signingInput, 'utf8').sign({ key: privateKey, dsaEncoding: 'der' });
  
  // Convert DER to JOSE format (r||s 32 bytes each)
  function derToJose(der) {
    let offset = 0;
    if (der[offset++] !== 0x30) throw new Error('Invalid DER: expected sequence');
    const seqLen = der[offset++];
    if (der[offset++] !== 0x02) throw new Error('Invalid DER: expected integer (r)');
    let rLen = der[offset++];
    let r = der.slice(offset, offset + rLen);
    offset += rLen;
    if (der[offset++] !== 0x02) throw new Error('Invalid DER: expected integer (s)');
    let sLen = der[offset++];
    let s = der.slice(offset, offset + sLen);
    // Strip leading zero if present
    if (r[0] === 0x00 && r.length > 32) r = r.slice(1);
    if (s[0] === 0x00 && s.length > 32) s = s.slice(1);
    // Left pad to 32 bytes
    const rPad = Buffer.concat([Buffer.alloc(Math.max(0, 32 - r.length), 0), r]);
    const sPad = Buffer.concat([Buffer.alloc(Math.max(0, 32 - s.length), 0), s]);
    return Buffer.concat([rPad, sPad]);
  }
  
  const joseSignature = derToJose(derSignature);
  const signatureB64u = joseSignature.toString('base64url');
  
  // Create receipt ID
  const receiptString = `${protectedB64u}.${payloadB64u}.${signatureB64u}`;
  const receipt_id = require('crypto').createHash('sha256').update(receiptString, 'utf8').digest().toString('base64url');
  
  // Build complete receipt
  const receipt = {
    protected: protectedB64u,
    signature: signatureB64u,
    payload,
    kid,
    payload_jcs_sha256,
    receipt_id
  };
  
  // Create JWKS
  const jwks = { keys: [cleanJwk] };
  
  console.log('Testing valid receipt...');
  
  // Test 1: Valid receipt should pass
  try {
    const result = await verifyReceipt(receipt, jwks);
    assert.strictEqual(result.ok, true, 'Valid receipt should verify successfully');
    console.log('✓ Valid receipt verification passed');
  } catch (error) {
    console.error('✗ Valid receipt verification failed:', error.message);
    throw error;
  }
  
  console.log('Testing tampered payload...');
  
  // Test 2: Tampered payload should fail
  const tamperedReceipt = { 
    ...receipt, 
    payload: { ...payload, n: payload.n + 1 } 
  };
  
  try {
    const result = await verifyReceipt(tamperedReceipt, jwks);
    throw new Error('Expected tampered receipt to fail verification');
  } catch (error) {
    const expectedErrors = ['payload_hash_mismatch', 'signature_invalid'];
    const hasExpectedError = expectedErrors.some(expected => error.message.includes(expected));
    assert(hasExpectedError, `Expected error to include one of ${expectedErrors.join('|')}, got: ${error.message}`);
    console.log('✓ Tampered payload correctly rejected:', error.message);
  }
  
  console.log('verify.sdk.browser test passed');
}

test().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});