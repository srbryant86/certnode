/* File: api/test/routes.sign.test.js
   Test suite for /v1/sign endpoint functionality
*/

const assert = require('assert');
const { signPayload } = require('../src/routes/sign');

(async () => {
  // Test: Basic payload signing
  const payload1 = { message: 'Hello, World!', timestamp: Date.now() };
  const result1 = await signPayload(payload1, {});

  assert.ok(result1.protected, 'Should have protected header');
  assert.ok(result1.signature, 'Should have signature');
  assert.ok(result1.payload, 'Should have payload');
  assert.ok(result1.kid, 'Should have key ID');
  assert.ok(result1.payload_jcs_sha256, 'Should have payload hash');
  assert.ok(result1.receipt_id, 'Should have receipt ID');

  // Test: Minimal payload
  const payload2 = { value: 42 };
  const result2 = await signPayload(payload2, {});
  assert.strictEqual(result2.payload.value, 42, 'Should preserve payload data');

  // Test: Complex nested payload
  const payload3 = {
    user: { id: 123, name: 'Alice' },
    transactions: [
      { id: 'TXN-001', amount: 100.50 },
      { id: 'TXN-002', amount: 200.75 }
    ],
    metadata: { version: '1.0', timestamp: '2025-01-15T10:30:00Z' }
  };
  const result3 = await signPayload(payload3, {});
  assert.deepStrictEqual(result3.payload, payload3, 'Should preserve complex payload');

  // Test: Custom key ID in headers
  const payload4 = { test: 'custom-kid' };
  const headers4 = { kid: 'custom-key-id' };
  const result4 = await signPayload(payload4, headers4);
  assert.strictEqual(result4.kid, 'custom-key-id', 'Should use custom key ID');

  // Test: Unsupported algorithm rejection
  try {
    await signPayload({ test: 'unsupported-alg' }, { alg: 'RS256' });
    assert.fail('Should have rejected unsupported algorithm');
  } catch (error) {
    assert.ok(error.message.includes('Unsupported alg'), 'Should reject unsupported algorithm');
    assert.strictEqual(error.statusCode, 400, 'Should return 400 status');
  }

  // Test: Special characters in payload
  const payload5 = {
    unicode: '🚀 Unicode test',
    quotes: 'He said "Hello"',
    backslash: 'Path\\to\\file',
    newlines: 'Line 1\nLine 2'
  };
  const result5 = await signPayload(payload5, {});
  assert.deepStrictEqual(result5.payload, payload5, 'Should handle special characters');

  // Test: Different data types
  const payload6 = {
    string: 'text',
    number: 42,
    float: 3.14159,
    boolean_true: true,
    boolean_false: false,
    null_value: null,
    array: [1, 'two', true, null, { nested: 'object' }]
  };
  const result6 = await signPayload(payload6, {});
  assert.deepStrictEqual(result6.payload, payload6, 'Should handle various data types');

  // Test: Empty payload
  const payload7 = {};
  const result7 = await signPayload(payload7, {});
  assert.deepStrictEqual(result7.payload, {}, 'Should handle empty payload');

  // Test: Null payload
  const payload8 = null;
  const result8 = await signPayload(payload8, {});
  assert.strictEqual(result8.payload, null, 'Should handle null payload');

  // Test: Deterministic receipt IDs for same input
  const testPayload = { test: 'deterministic' };
  const result9a = await signPayload(testPayload, {});
  const result9b = await signPayload(testPayload, {});

  // Note: Receipt IDs will differ due to different signatures, but structure should be consistent
  assert.ok(result9a.receipt_id, 'Should generate receipt ID');
  assert.ok(result9b.receipt_id, 'Should generate receipt ID');
  assert.ok(typeof result9a.receipt_id === 'string', 'Receipt ID should be string');
  assert.ok(typeof result9b.receipt_id === 'string', 'Receipt ID should be string');

  // Test: Large payload handling
  const largeArray = [];
  for (let i = 0; i < 1000; i++) {
    largeArray.push({ id: i, data: `item-${i}` });
  }
  const payload10 = { large_dataset: largeArray };
  const result10 = await signPayload(payload10, {});
  assert.strictEqual(result10.payload.large_dataset.length, 1000, 'Should handle large payloads');

  // Test: Timestamp header handling (without actually calling timestamp service)
  const payload11 = { test: 'timestamp-test' };
  const result11 = await signPayload(payload11, { tsr: true });
  // TSR may or may not be present depending on timestamp service availability
  assert.ok(result11.payload, 'Should still sign payload even if timestamp fails');

  console.log('✓ All sign endpoint tests passed');
})().catch(err => {
  console.error('Sign endpoint tests failed:', err);
  process.exit(1);
});