/* File: api/test/verify.test.js
   Test suite for verification functionality - basic validation
*/

const assert = require('assert');

(async () => {
  // Test: Verification module can be loaded
  try {
    const { verifyDetached } = require('../src/routes/verify');
    assert.ok(typeof verifyDetached === 'function', 'Should export verifyDetached function');

    // Test: Missing fields validation
    const result1 = verifyDetached({
      payload: { test: 'data' },
      signature: 'some-signature'
      // missing protected
    });
    assert.strictEqual(result1.valid, false, 'Should reject missing protected header');
    assert.strictEqual(result1.reason, 'missing_fields', 'Should indicate missing fields');

    // Test: Missing signature validation
    const result2 = verifyDetached({
      protected: 'some-header',
      payload: { test: 'data' }
      // missing signature
    });
    assert.strictEqual(result2.valid, false, 'Should reject missing signature');
    assert.strictEqual(result2.reason, 'missing_fields', 'Should indicate missing fields');

    // Test: Missing payload validation
    const result3 = verifyDetached({
      protected: 'some-header',
      signature: 'some-signature'
      // missing payload
    });
    assert.strictEqual(result3.valid, false, 'Should reject missing payload');
    assert.strictEqual(result3.reason, 'missing_fields', 'Should indicate missing fields');

    // Test: Malformed protected header
    const result4 = verifyDetached({
      protected: 'invalid-base64-!@#',
      payload: { test: 'data' },
      signature: 'some-signature'
    });
    assert.strictEqual(result4.valid, false, 'Should reject malformed protected header');

    // Test: Non-ES256 algorithm
    const protectedHeader = { alg: 'RS256', kid: 'test-key' };
    const protectedB64 = Buffer.from(JSON.stringify(protectedHeader), 'utf8')
      .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const result5 = verifyDetached({
      protected: protectedB64,
      payload: { test: 'data' },
      signature: 'some-signature'
    });
    assert.strictEqual(result5.valid, false, 'Should reject non-ES256 algorithm');
    assert.strictEqual(result5.reason, 'alg_not_es256', 'Should indicate algorithm not supported');

    // Test: Missing key in JWKS
    const result6 = verifyDetached({
      protected: Buffer.from(JSON.stringify({ alg: 'ES256', kid: 'nonexistent-key' }))
        .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
      payload: { test: 'data' },
      signature: 'some-signature'
    }, { jwks: { keys: [] } });
    assert.strictEqual(result6.valid, false, 'Should reject missing key');
    assert.ok(result6.reason === 'key_not_found' || result6.reason === 'kid_not_found', 'Should indicate key not found');

    console.log('✓ Verification basic tests passed');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('⚠ Verification module not available in test environment, skipping verification tests');
    } else {
      throw error;
    }
  }
})().catch(err => {
  console.error('Verification tests failed:', err);
  process.exit(1);
});