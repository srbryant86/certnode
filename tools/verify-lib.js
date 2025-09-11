// Offline verifier library for CertNode receipts
const crypto = require('crypto');
const https = require('https');
const fs = require('fs');
const { canonicalize } = require('../api/src/util/jcs');
const { jwkThumbprint } = require('../api/src/util/kid');
const joseToDer = require('../api/src/util/joseToDer');

function b64uToBuf(str) {
  // Add padding if needed
  const padded = str + '='.repeat((4 - str.length % 4) % 4);
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function bufToB64u(buf) {
  return buf.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function loadJwks(source) {
  if (source.startsWith('https://') || source.startsWith('http://')) {
    return new Promise((resolve, reject) => {
      const module = source.startsWith('https://') ? https : require('http');
      const req = module.get(source, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(new Error(`Invalid JSON from ${source}: ${err.message}`));
          }
        });
      });
      req.on('error', err => reject(new Error(`Failed to fetch ${source}: ${err.message}`)));
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error(`Timeout fetching ${source}`));
      });
    });
  } else {
    const data = fs.readFileSync(source, 'utf8');
    return JSON.parse(data);
  }
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

function verifyReceiptWithJwks(receipt, jwks) {
  try {
    // Parse receipt
    if (typeof receipt === 'string') {
      receipt = JSON.parse(receipt);
    }
    
    // Validate receipt structure
    if (!receipt.protected || !receipt.signature || !receipt.payload || !receipt.kid) {
      throw new Error('Missing required receipt fields');
    }
    
    // Decode protected header
    const protectedBuf = b64uToBuf(receipt.protected);
    const header = JSON.parse(protectedBuf.toString('utf8'));
    
    // Validate header
    if (header.alg !== 'ES256') {
      throw new Error(`Unsupported algorithm: ${header.alg}`);
    }
    
    if (header.kid !== receipt.kid) {
      throw new Error('Kid mismatch between header and receipt');
    }
    
    // Find matching key in JWKS
    const key = jwks.keys.find(k => {
      try {
        return jwkThumbprint(k) === receipt.kid;
      } catch {
        return false;
      }
    });
    
    if (!key) {
      throw new Error(`Key not found in JWKS: ${receipt.kid}`);
    }
    
    // Validate JCS hash if present
    if (receipt.payload_jcs_sha256) {
      const jcsHash = crypto.createHash('sha256').update(canonicalize(receipt.payload)).digest();
      const expectedHash = b64uToBuf(receipt.payload_jcs_sha256);
      if (!jcsHash.equals(expectedHash)) {
        throw new Error('JCS hash mismatch');
      }
    }
    
    // Create signing input (protected + '.' + payload)
    const payloadB64u = bufToB64u(canonicalize(receipt.payload));
    const signingInput = receipt.protected + '.' + payloadB64u;
    
    // Verify signature
    const spki = spkiFromP256Jwk(key);
    const publicKey = crypto.createPublicKey({ key: spki, format: 'der', type: 'spki' });
    
    const signatureBuf = b64uToBuf(receipt.signature);
    const derSignature = joseToDer(signatureBuf);
    
    const verify = crypto.createVerify('SHA256');
    verify.update(signingInput, 'utf8');
    
    return verify.verify(publicKey, derSignature);
    
  } catch (error) {
    throw new Error(`Verification failed: ${error.message}`);
  }
}

module.exports = {
  loadJwks,
  verifyReceiptWithJwks,
  b64uToBuf,
  bufToB64u,
  spkiFromP256Jwk
};