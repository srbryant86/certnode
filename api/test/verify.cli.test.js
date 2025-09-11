const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');
const { execFileSync } = require('child_process');
const { generateKeyPairSync, createSign } = require('crypto');
const { canonicalize } = require('../src/util/jcs');
const joseToDer = require('../src/util/joseToDer');
const { jwkThumbprint, b64u } = require('../src/util/kid');

// Helper to create temp files
function createTempFile(content, suffix = '.json') {
  const tempDir = os.tmpdir();
  const fileName = `certnode-test-${Date.now()}-${Math.random().toString(36).slice(2)}${suffix}`;
  const filePath = path.join(tempDir, fileName);
  fs.writeFileSync(filePath, content);
  return filePath;
}

// Helper to clean up temp files
function cleanup(files) {
  files.forEach(file => {
    try { fs.unlinkSync(file); } catch {}
  });
}

(async () => {
  const tempFiles = [];

  try {
    // 1. Generate a test keypair
    const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const jwk = publicKey.export({ format: 'jwk' });
    const pubJwk = { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y };
    const kid = jwkThumbprint(pubJwk);

    // 2. Create a JWKS
    const jwks = {
      keys: [
        { ...pubJwk, kid, use: 'sig', alg: 'ES256' }
      ]
    };
    const jwksFile = createTempFile(JSON.stringify(jwks, null, 2));
    tempFiles.push(jwksFile);

    // 3. Create a valid receipt
    const payload = { test: true, timestamp: Date.now() };
    const protectedHeader = { alg: 'ES256', kid };
    const protectedB64 = b64u(Buffer.from(JSON.stringify(protectedHeader)));
    const payloadB64 = b64u(canonicalize(payload));
    
    // Sign the message
    const signingInput = `${protectedB64}.${payloadB64}`;
    const derSignature = createSign('SHA256')
      .update(Buffer.from(signingInput, 'utf8'))
      .sign({ key: privateKey, dsaEncoding: 'der' });
    
    // Convert DER to JOSE format (r||s 64 bytes)
    function derToJose(derBuf) {
      let offset = 0;
      if (derBuf[offset++] !== 0x30) throw new Error('Invalid DER sequence');
      
      const seqLen = derBuf[offset++];
      if (derBuf[offset++] !== 0x02) throw new Error('Invalid DER integer (r)');
      
      const rLen = derBuf[offset++];
      let r = derBuf.slice(offset, offset + rLen);
      offset += rLen;
      
      if (derBuf[offset++] !== 0x02) throw new Error('Invalid DER integer (s)');
      
      const sLen = derBuf[offset++];
      let s = derBuf.slice(offset, offset + sLen);
      
      // Remove leading zeros
      while (r.length > 1 && r[0] === 0x00) r = r.slice(1);
      while (s.length > 1 && s[0] === 0x00) s = s.slice(1);
      
      // Pad to 32 bytes
      const rPadded = Buffer.alloc(32);
      if (r.length <= 32) r.copy(rPadded, 32 - r.length);
      else throw new Error('r value too large');
      
      const sPadded = Buffer.alloc(32);
      if (s.length <= 32) s.copy(sPadded, 32 - s.length);
      else throw new Error('s value too large');
      
      return Buffer.concat([rPadded, sPadded]);
    }
    
    const joseSignature = derToJose(derSignature);

    const validReceipt = {
      protected: protectedB64,
      signature: b64u(joseSignature),
      payload,
      kid,
      receipt_id: 'test-receipt'
    };
    const validReceiptFile = createTempFile(JSON.stringify(validReceipt, null, 2));
    tempFiles.push(validReceiptFile);

    // 4. Create an invalid receipt (tampered payload)
    const invalidReceipt = { ...validReceipt, payload: { test: false, timestamp: Date.now() } };
    const invalidReceiptFile = createTempFile(JSON.stringify(invalidReceipt, null, 2));
    tempFiles.push(invalidReceiptFile);

    // 5. Test valid receipt - should PASS (exit 0)
    try {
      const result = execFileSync(process.execPath, [
        path.join(__dirname, '../../tools/verify-receipt.js'),
        '--receipt', validReceiptFile,
        '--jwks', jwksFile
      ], { encoding: 'utf8' });
      assert.strictEqual(result.trim(), 'PASS');
    } catch (e) {
      throw new Error(`Valid receipt test failed: exit code ${e.status}, stdout: ${e.stdout}, stderr: ${e.stderr}`);
    }

    // 6. Test invalid receipt - should FAIL (exit 2)
    try {
      execFileSync(process.execPath, [
        path.join(__dirname, '../../tools/verify-receipt.js'),
        '--receipt', invalidReceiptFile,
        '--jwks', jwksFile
      ], { encoding: 'utf8' });
      throw new Error('Invalid receipt test should have failed but passed');
    } catch (e) {
      assert.strictEqual(e.status, 2);
      assert.ok(e.stdout.startsWith('FAIL:'));
    }

    // 7. Test missing arguments - should error (exit 1)
    try {
      execFileSync(process.execPath, [
        path.join(__dirname, '../../tools/verify-receipt.js')
      ], { encoding: 'utf8' });
      throw new Error('Missing args test should have failed but passed');
    } catch (e) {
      assert.strictEqual(e.status, 1);
    }

    console.log('verify.cli tests passed');

  } catch (e) {
    console.error(`verify.cli test failed: ${e.message}`);
    process.exit(1);
  } finally {
    cleanup(tempFiles);
  }
})();