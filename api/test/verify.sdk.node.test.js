//---------------------------------------------------------------------
// api/test/verify.sdk.node.test.js
// Unit tests for the minimal CertNode Node SDK
const assert = require('assert');
const { createHash, createSign, generateKeyPairSync, sign: oneShotSign } = require('crypto');
const derToJose = require('../src/util/derToJose');
const { verifyReceipt } = require('../../sdk/node/index');

function b64u(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function publicJwkFromKey(publicKey) {
  const spki = publicKey.export({ type: 'spki', format: 'der' });
  const uncompressed = spki.slice(-65); // 0x04 || X32 || Y32
  const x = uncompressed.slice(1, 33);
  const y = uncompressed.slice(33, 65);
  return { kty: 'EC', crv: 'P-256', x: b64u(x), y: b64u(y) };
}

function publicEdJwkFromKey(publicKey) {
  // Export SPKI and take last 32 bytes as Ed25519 public key
  const spki = publicKey.export({ type: 'spki', format: 'der' });
  const pub = spki.slice(-32);
  return { kty: 'OKP', crv: 'Ed25519', x: b64u(pub) };
}

function createTestReceipt(privateKey, publicKey, payload, options = {}) {
  const jwk = publicJwkFromKey(publicKey);
  // Use RFC7638 thumbprint for kid
  const json = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y });
  const kid = b64u(createHash('sha256').update(json, 'utf8').digest());
  
  // Canonicalize payload
  const jcsBytes = Buffer.from(JSON.stringify(payload, Object.keys(payload).sort()), 'utf8');
  const payloadB64 = b64u(jcsBytes);
  
  // Create protected header
  const protectedHeader = { alg: 'ES256', kid };
  const protB64 = b64u(Buffer.from(JSON.stringify(protectedHeader), 'utf8'));
  
  // Sign
  const signingInput = Buffer.from(`${protB64}.${payloadB64}`, 'utf8');
  const derSig = createSign('SHA256').update(signingInput).sign({ key: privateKey, dsaEncoding: 'der' });
  const sigB64 = b64u(derToJose(derSig));
  
  const receipt = { 
    protected: protB64, 
    signature: sigB64, 
    payload, 
    kid 
  };
  
  // Add optional fields
  if (options.includeJcsHash) {
    receipt.payload_jcs_sha256 = b64u(createHash('sha256').update(jcsBytes).digest());
  }
  
  if (options.includeReceiptId) {
    const fullReceipt = `${protB64}.${payloadB64}.${sigB64}`;
    receipt.receipt_id = b64u(createHash('sha256').update(Buffer.from(fullReceipt, 'utf8')).digest());
  }
  
  return { receipt, jwk, kid };
}

// Test: Happy path - basic verification
async function testBasicVerification() {
  console.log('Testing basic verification...');
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const payload = { hello: 'world', n: 42 };
  
  const { receipt, jwk } = createTestReceipt(privateKey, publicKey, payload);
  const jwks = { keys: [jwk] };
  
  const result = await verifyReceipt({ receipt, jwks });
  assert.strictEqual(result.ok, true, `Expected success, got: ${JSON.stringify(result)}`);
  console.log('✓ Basic verification passed');
}

// Test: With JCS hash validation
async function testJcsHash() {
  console.log('Testing with JCS hash...');
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const payload = { hello: 'world', n: 42 };
  
  const { receipt, jwk } = createTestReceipt(privateKey, publicKey, payload, { includeJcsHash: true });
  const jwks = { keys: [jwk] };
  
  const result = await verifyReceipt({ receipt, jwks });
  assert.strictEqual(result.ok, true, `Expected success, got: ${JSON.stringify(result)}`);
  console.log('✓ JCS hash validation passed');
}

// Test: With receipt ID validation
async function testReceiptId() {
  console.log('Testing with receipt ID...');
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const payload = { hello: 'world', n: 42 };
  
  const { receipt, jwk } = createTestReceipt(privateKey, publicKey, payload, { includeReceiptId: true });
  const jwks = { keys: [jwk] };
  
  const result = await verifyReceipt({ receipt, jwks });
  assert.strictEqual(result.ok, true, `Expected success, got: ${JSON.stringify(result)}`);
  console.log('✓ Receipt ID validation passed');
}

// Test: Full validation (JCS hash + receipt ID)
async function testFullValidation() {
  console.log('Testing full validation...');
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const payload = { hello: 'world', n: 42 };
  
  const { receipt, jwk } = createTestReceipt(privateKey, publicKey, payload, { 
    includeJcsHash: true, 
    includeReceiptId: true 
  });
  const jwks = { keys: [jwk] };
  
  const result = await verifyReceipt({ receipt, jwks });
  assert.strictEqual(result.ok, true, `Expected success, got: ${JSON.stringify(result)}`);
  console.log('✓ Full validation passed');
}

// Test: Mutated payload should fail
async function testMutatedPayload() {
  console.log('Testing mutated payload detection...');
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const payload = { hello: 'world', n: 42 };
  
  const { receipt, jwk } = createTestReceipt(privateKey, publicKey, payload);
  const jwks = { keys: [jwk] };
  
  // Mutate the payload
  receipt.payload.n = 43;
  
  const result = await verifyReceipt({ receipt, jwks });
  assert.strictEqual(result.ok, false, 'Mutated payload should fail verification');
  assert(result.reason.includes('signature'), `Expected signature error, got: ${result.reason}`);
  console.log('✓ Mutated payload detection passed');
}

// Test: Invalid JCS hash should fail
async function testInvalidJcsHash() {
  console.log('Testing invalid JCS hash detection...');
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const payload = { hello: 'world', n: 42 };
  
  const { receipt, jwk } = createTestReceipt(privateKey, publicKey, payload, { includeJcsHash: true });
  const jwks = { keys: [jwk] };
  
  // Corrupt the JCS hash
  receipt.payload_jcs_sha256 = 'invalid_hash_value';
  
  const result = await verifyReceipt({ receipt, jwks });
  assert.strictEqual(result.ok, false, 'Invalid JCS hash should fail verification');
  assert(result.reason.includes('JCS hash'), `Expected JCS hash error, got: ${result.reason}`);
  console.log('✓ Invalid JCS hash detection passed');
}

// Test: Invalid receipt ID should fail
async function testInvalidReceiptId() {
  console.log('Testing invalid receipt ID detection...');
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const payload = { hello: 'world', n: 42 };
  
  const { receipt, jwk } = createTestReceipt(privateKey, publicKey, payload, { includeReceiptId: true });
  const jwks = { keys: [jwk] };
  
  // Corrupt the receipt ID
  receipt.receipt_id = 'invalid_receipt_id';
  
  const result = await verifyReceipt({ receipt, jwks });
  assert.strictEqual(result.ok, false, 'Invalid receipt ID should fail verification');
  assert(result.reason.includes('Receipt ID'), `Expected receipt ID error, got: ${result.reason}`);
  console.log('✓ Invalid receipt ID detection passed');
}

// Test: Missing key should fail
async function testMissingKey() {
  console.log('Testing missing key detection...');
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const { privateKey: otherPrivate, publicKey: otherPublic } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  
  const payload = { hello: 'world', n: 42 };
  const { receipt } = createTestReceipt(privateKey, publicKey, payload);
  const { jwk: otherJwk } = createTestReceipt(otherPrivate, otherPublic, payload);
  
  // JWKS contains wrong key
  const jwks = { keys: [otherJwk] };
  
  const result = await verifyReceipt({ receipt, jwks });
  assert.strictEqual(result.ok, false, 'Missing key should fail verification');
  assert(result.reason.includes('Key not found'), `Expected key not found error, got: ${result.reason}`);
  console.log('✓ Missing key detection passed');
}

// Test: Malformed receipt should fail
async function testMalformedReceipt() {
  console.log('Testing malformed receipt detection...');
  const jwks = { keys: [] };
  
  const malformedReceipts = [
    {},
    { protected: 'test' },
    { protected: 'test', signature: 'test' },
    { protected: 'test', signature: 'test', payload: {} },
    { signature: 'test', payload: {}, kid: 'test' }
  ];
  
  for (const receipt of malformedReceipts) {
    const result = await verifyReceipt({ receipt, jwks });
    assert.strictEqual(result.ok, false, 'Malformed receipt should fail verification');
    assert(result.reason.includes('Missing required'), `Expected missing fields error, got: ${result.reason}`);
  }
  console.log('✓ Malformed receipt detection passed');
}

// Test: Invalid algorithm should fail
async function testInvalidAlgorithm() {
  console.log('Testing invalid algorithm detection...');
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const payload = { hello: 'world', n: 42 };
  
  const { receipt, jwk } = createTestReceipt(privateKey, publicKey, payload);
  const jwks = { keys: [jwk] };
  
  // Corrupt the protected header to use wrong algorithm
  const wrongHeader = { alg: 'RS256', kid: receipt.kid };
  receipt.protected = b64u(Buffer.from(JSON.stringify(wrongHeader), 'utf8'));
  
  const result = await verifyReceipt({ receipt, jwks });
  assert.strictEqual(result.ok, false, 'Invalid algorithm should fail verification');
  assert(result.reason.includes('Unsupported algorithm'), `Expected algorithm error, got: ${result.reason}`);
  console.log('✓ Invalid algorithm detection passed');
}

// --- EdDSA (Ed25519) tests ---
async function testEdDSABasicVerification() {
  console.log('Testing EdDSA basic verification...');
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const payload = { hello: 'world', n: 7 };

  // Build JWK and kid (RFC7638 thumbprint)
  const jwk = publicEdJwkFromKey(publicKey);
  const kidJson = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x });
  const kid = b64u(createHash('sha256').update(kidJson, 'utf8').digest());

  const prot = { alg: 'EdDSA', kid };
  const protB64 = b64u(Buffer.from(JSON.stringify(prot), 'utf8'));
  const jcs = Buffer.from(JSON.stringify(payload, Object.keys(payload).sort()), 'utf8');
  const payloadB64 = b64u(jcs);
  const signingInput = Buffer.from(`${protB64}.${payloadB64}`, 'utf8');

  const sig = oneShotSign(null, signingInput, privateKey); // raw Ed25519
  const sigB64 = b64u(sig);

  const receipt = { protected: protB64, signature: sigB64, payload, kid };
  const jwks = { keys: [jwk] };

  const result = await verifyReceipt({ receipt, jwks });
  assert.strictEqual(result.ok, true, `Expected success, got: ${JSON.stringify(result)}`);
  console.log('✓ EdDSA basic verification passed');
}

async function testEdDSAMutatedPayload() {
  console.log('Testing EdDSA mutated payload detection...');
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const payload = { hello: 'world', n: 7 };
  const jwk = publicEdJwkFromKey(publicKey);
  const kidJson = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x });
  const kid = b64u(createHash('sha256').update(kidJson, 'utf8').digest());

  const protB64 = b64u(Buffer.from(JSON.stringify({ alg: 'EdDSA', kid }), 'utf8'));
  const jcs = Buffer.from(JSON.stringify(payload, Object.keys(payload).sort()), 'utf8');
  const payloadB64 = b64u(jcs);
  const signingInput = Buffer.from(`${protB64}.${payloadB64}`, 'utf8');
  const sigB64 = b64u(oneShotSign(null, signingInput, privateKey));

  const receipt = { protected: protB64, signature: sigB64, payload, kid };
  receipt.payload.n = 8; // mutate
  const jwks = { keys: [jwk] };

  const result = await verifyReceipt({ receipt, jwks });
  assert.strictEqual(result.ok, false, 'Mutated payload should fail verification');
  console.log('✓ EdDSA mutated payload detection passed');
}

async function testEdDSAWithJcsHashAndReceiptId() {
  console.log('Testing EdDSA with JCS hash + receipt ID...');
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const payload = { hello: 'world', n: 7 };
  const jwk = publicEdJwkFromKey(publicKey);
  const kidJson = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x });
  const kid = b64u(createHash('sha256').update(kidJson, 'utf8').digest());

  const protB64 = b64u(Buffer.from(JSON.stringify({ alg: 'EdDSA', kid }), 'utf8'));
  const jcs = Buffer.from(JSON.stringify(payload, Object.keys(payload).sort()), 'utf8');
  const payloadB64 = b64u(jcs);
  const signingInput = Buffer.from(`${protB64}.${payloadB64}`, 'utf8');
  const sigB64 = b64u(oneShotSign(null, signingInput, privateKey));
  const jcsHashB64 = b64u(createHash('sha256').update(jcs).digest());

  const fullReceipt = `${protB64}.${payloadB64}.${sigB64}`;
  const receiptId = b64u(createHash('sha256').update(Buffer.from(fullReceipt, 'utf8')).digest());

  const receipt = { protected: protB64, signature: sigB64, payload, kid, payload_jcs_sha256: jcsHashB64, receipt_id: receiptId };
  const jwks = { keys: [jwk] };

  const result = await verifyReceipt({ receipt, jwks });
  assert.strictEqual(result.ok, true, `Expected success, got: ${JSON.stringify(result)}`);
  console.log('✓ EdDSA JCS+receipt_id passed');
}

// Test: Kid mismatch should fail
async function testKidMismatch() {
  console.log('Testing kid mismatch detection...');
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const payload = { hello: 'world', n: 42 };
  
  const { receipt, jwk } = createTestReceipt(privateKey, publicKey, payload);
  const jwks = { keys: [jwk] };
  
  // Corrupt the protected header with wrong kid
  const wrongHeader = { alg: 'ES256', kid: 'wrong_kid' };
  receipt.protected = b64u(Buffer.from(JSON.stringify(wrongHeader), 'utf8'));
  
  const result = await verifyReceipt({ receipt, jwks });
  assert.strictEqual(result.ok, false, 'Kid mismatch should fail verification');
  assert(result.reason.includes('Kid mismatch'), `Expected kid mismatch error, got: ${result.reason}`);
  console.log('✓ Kid mismatch detection passed');
}

// Test: Multiple keys in JWKS - should find correct one
async function testMultipleKeys() {
  console.log('Testing multiple keys in JWKS...');
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const { privateKey: other1, publicKey: otherPub1 } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const { privateKey: other2, publicKey: otherPub2 } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  
  const payload = { hello: 'world', n: 42 };
  const { receipt, jwk } = createTestReceipt(privateKey, publicKey, payload);
  const { jwk: otherJwk1 } = createTestReceipt(other1, otherPub1, payload);
  const { jwk: otherJwk2 } = createTestReceipt(other2, otherPub2, payload);
  
  // JWKS with multiple keys, correct one in the middle
  const jwks = { keys: [otherJwk1, jwk, otherJwk2] };
  
  const result = await verifyReceipt({ receipt, jwks });
  assert.strictEqual(result.ok, true, `Expected success with multiple keys, got: ${JSON.stringify(result)}`);
  console.log('✓ Multiple keys in JWKS passed');
}

async function runAllTests() {
  try {
    await testBasicVerification();
    await testJcsHash();
    await testReceiptId();
    await testFullValidation();
    await testMutatedPayload();
    await testInvalidJcsHash();
    await testInvalidReceiptId();
    await testMissingKey();
    await testMalformedReceipt();
    await testInvalidAlgorithm();
    await testKidMismatch();
        await testEdDSABasicVerification();
    await testEdDSAMutatedPayload();
    await testEdDSAWithJcsHashAndReceiptId();
    console.log('\nAll SDK Node tests passed! ✅');
  } catch (error) {
    console.error('❌ SDK test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runAllTests();
//---------------------------------------------------------------------
