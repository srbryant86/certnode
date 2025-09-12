//---------------------------------------------------------------------
// api/test/sdk.node.test.js
const assert = require('assert');
const { createHash, createSign, generateKeyPairSync } = require('crypto');
const { canonicalize } = require('../src/util/jcs');
const { jwkThumbprint } = require('../src/util/kid');
const derToJose = require('../src/util/derToJose');
const { verifyReceipt } = require('../../sdk/node/index');

function b64u(buf){ return Buffer.from(buf).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function publicJwkFromKey(publicKey) {
  const spki = publicKey.export({ type: 'spki', format: 'der' });
  const uncompressed = spki.slice(-65); // 0x04 || X32 || Y32
  const x = uncompressed.slice(1, 33);
  const y = uncompressed.slice(33, 65);
  return { kty: 'EC', crv: 'P-256', x: b64u(x), y: b64u(y) };
}

// Happy path
async function testHappyPath() {
  console.log('Testing happy path...');
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const jwk = publicJwkFromKey(publicKey);
  const kid = jwkThumbprint(jwk);

  const payload = { hello: 'world', n: 42 };
  const jcsBytes = canonicalize(payload);
  const payloadB64 = b64u(jcsBytes);
  const protB64 = b64u(Buffer.from(JSON.stringify({ alg: 'ES256', kid }), 'utf8'));
  const signingInput = Buffer.from(`${protB64}.${payloadB64}`, 'utf8');
  const derSig = createSign('SHA256').update(signingInput).sign({ key: privateKey, dsaEncoding: 'der' });
  const sigB64 = b64u(derToJose(derSig));
  const receipt_id = b64u(createHash('sha256').update(Buffer.from(`${protB64}.${payloadB64}.${sigB64}`, 'utf8')).digest());
  const payload_jcs_sha256 = b64u(createHash('sha256').update(jcsBytes).digest());

  const receipt = { protected: protB64, signature: sigB64, payload, kid, payload_jcs_sha256, receipt_id };
  const jwks = { keys: [jwk] };

  const ok = await verifyReceipt({ receipt, jwks });
  assert.strictEqual(ok.ok, true, `expected ok:true got ${JSON.stringify(ok)}`);
  console.log('✓ Happy path test passed');
}

// Negative: mutated payload must fail
async function testMutatedPayload() {
  console.log('Testing mutated payload detection...');
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const jwk = publicJwkFromKey(publicKey);
  const kid = jwkThumbprint(jwk);

  const payload = { hello: 'world', n: 42 };
  const jcsBytes = canonicalize(payload);
  const payloadB64 = b64u(jcsBytes);
  const protB64 = b64u(Buffer.from(JSON.stringify({ alg: 'ES256', kid }), 'utf8'));
  const signingInput = Buffer.from(`${protB64}.${payloadB64}`, 'utf8');
  const derSig = createSign('SHA256').update(signingInput).sign({ key: privateKey, dsaEncoding: 'der' });
  const sigB64 = b64u(derToJose(derSig));

  const receipt = { protected: protB64, signature: sigB64, payload: { hello: 'world', n: 43 }, kid };
  const jwks = { keys: [jwk] };

  const res = await verifyReceipt({ receipt, jwks });
  assert.strictEqual(res.ok, false, 'mutated payload should fail');
  console.log('✓ Mutated payload test passed');
}

async function runAllTests() {
  try {
    await testHappyPath();
    await testMutatedPayload();
    console.log('sdk.node tests passed');
  } catch (error) {
    console.error('❌ SDK test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runAllTests();
//---------------------------------------------------------------------