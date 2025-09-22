/* File: api/test/jcs.test.js
   Test suite for JSON Canonicalization Scheme (RFC 8785)
*/

const assert = require('assert');
const { canonicalize, stringifyCanonical } = require('../src/util/jcs');
const crypto = require('crypto');

(async () => {
  // Test: Basic canonicalization with sorted keys
  const input1 = { b: 2, a: 1, c: 3 };
  const result1 = stringifyCanonical(input1);
  const expected1 = '{"a":1,"b":2,"c":3}';
  assert.strictEqual(result1, expected1, 'Should sort object keys');

  // Test: Nested objects
  const input2 = {
    outer: { z: 'last', a: 'first' },
    array: [3, 1, 2]
  };
  const result2 = stringifyCanonical(input2);
  const expected2 = '{"array":[3,1,2],"outer":{"a":"first","z":"last"}}';
  assert.strictEqual(result2, expected2, 'Should sort nested object keys');

  // Test: Array order preservation
  const input3 = {
    numbers: [5, 2, 8, 1],
    metadata: { created: '2025-01-15', id: 'test' }
  };
  const result3 = stringifyCanonical(input3);
  assert.ok(result3.includes('[5,2,8,1]'), 'Should preserve array order');
  assert.ok(result3.includes('{"created":"2025-01-15","id":"test"}'), 'Should sort object keys in array');

  // Test: Different data types
  const input4 = {
    string: 'text',
    number: 42,
    boolean: true,
    null_value: null,
    array: [1, 'two', true, null]
  };
  const result4 = stringifyCanonical(input4);
  assert.ok(result4.includes('"boolean":true'), 'Should handle boolean');
  assert.ok(result4.includes('"null_value":null'), 'Should handle null');
  assert.ok(result4.includes('"number":42'), 'Should handle number');

  // Test: Empty values
  const input5 = {
    empty_string: '',
    empty_object: {},
    empty_array: []
  };
  const result5 = stringifyCanonical(input5);
  const expected5 = '{"empty_array":[],"empty_object":{},"empty_string":""}';
  assert.strictEqual(result5, expected5, 'Should handle empty values');

  // Test: Buffer output from canonicalize
  const input6 = { test: 'buffer' };
  const result6 = canonicalize(input6);
  assert.ok(Buffer.isBuffer(result6), 'canonicalize should return Buffer');
  assert.strictEqual(result6.toString('utf8'), '{"test":"buffer"}', 'Buffer should contain correct JSON');

  // Test: Consistent output
  const input7 = { b: 2, a: 1 };
  const result7a = canonicalize(input7);
  const result7b = canonicalize(input7);
  assert.ok(result7a.equals(result7b), 'Should produce consistent output');

  // Test: String escaping
  const input8 = {
    quote: 'He said "Hello"',
    backslash: 'Path\\to\\file',
    newline: 'Line 1\nLine 2'
  };
  const result8 = stringifyCanonical(input8);
  assert.ok(result8.includes('\\"Hello\\"'), 'Should escape quotes');
  assert.ok(result8.includes('\\\\to\\\\'), 'Should escape backslashes');
  assert.ok(result8.includes('\\n'), 'Should escape newlines');

  // Test: Number normalization
  const input9 = {
    integer: 42,
    float: 42.0,
    scientific: 4.2e1
  };
  const result9 = stringifyCanonical(input9);
  // All should normalize to 42
  assert.ok(result9.includes('"integer":42'), 'Should handle integer');
  assert.ok(result9.includes('"float":42'), 'Should normalize 42.0 to 42');
  assert.ok(result9.includes('"scientific":42'), 'Should normalize 4.2e1 to 42');

  // Test: Complex real-world payload
  const receiptPayload = {
    timestamp: '2025-01-15T10:30:00Z',
    document_id: 'DOC-2025-001',
    metadata: {
      version: '1.0',
      author: 'John Doe'
    },
    data: {
      transactions: [
        { id: 'TXN-001', amount: 1000.50 },
        { id: 'TXN-002', amount: 2500.75 }
      ]
    }
  };
  const receiptResult = stringifyCanonical(receiptPayload);
  assert.ok(receiptResult.startsWith('{"data":'), 'Should sort top-level keys');
  assert.ok(receiptResult.includes('"metadata":{"author":"John Doe","version":"1.0"}'), 'Should sort nested keys');

  console.log('✓ All JCS canonicalization tests passed');
})().catch(err => {
  console.error('JCS tests failed:', err);
  process.exit(1);
});