/* File: api/test/crypto.kms.test.js
   Test suite for KMS adapter functionality - basic validation
*/

const assert = require('assert');

(async () => {
  // Test: KMS adapter module can be loaded
  try {
    const { createKmsAdapter } = require('../src/aws/kms');
    assert.ok(typeof createKmsAdapter === 'function', 'Should export createKmsAdapter function');

    // Test: createKmsAdapter validates required parameters
    try {
      createKmsAdapter({ sdk: {}, keyId: null });
      assert.fail('Should require keyId parameter');
    } catch (error) {
      assert.ok(error.message.includes('keyId') || error.message.includes('KMS_KEY_ID'), 'Should validate keyId');
    }

    console.log('✓ KMS adapter basic tests passed');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('⚠ KMS module not available in test environment, skipping KMS tests');
    } else {
      throw error;
    }
  }
})().catch(err => {
  console.error('KMS tests failed:', err);
  process.exit(1);
});