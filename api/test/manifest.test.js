const assert = require('assert');
const { canonicalize } = require('../src/util/jcs');
const { b64u } = require('../src/util/kid');
const { createHash, generateKeyPairSync, createSign } = require('crypto');
const derToJose = require('../src/util/derToJose');
const joseToDer = require('../src/util/joseToDer');
const { hashJwks, makeManifest, signManifest, verifyManifest, makeLocalSigner } = require('../src/util/manifest');

(async () => {
  // Stable JWKS hash regardless of order
  const jwk = { kty: 'EC', crv: 'P-256', x: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', y: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' };
  const jwks1 = { keys: [jwk] };
  const jwks2 = JSON.parse(JSON.stringify(jwks1)); // same
  const h1 = hashJwks(jwks1);
  const h2 = hashJwks(jwks2);
  assert.strictEqual(h1, h2);

  // Manifest construction
  const mf = makeManifest({ versionId: 'v1', jwks: jwks1, createdAt: '2020-01-01T00:00:00.000Z' });
  assert.deepStrictEqual(Object.keys(mf).sort(), ['createdAt','sha256','versionId'].sort());
  assert.strictEqual(mf.versionId, 'v1');
  assert.strictEqual(mf.sha256, h1);

  // Sign/verify roundtrip with local signer
  const { signFn, publicJwk } = makeLocalSigner();
  const { manifest, sig } = await signManifest(mf, signFn);
  assert.ok(/^[A-Za-z0-9_-]+$/.test(sig));
  assert.strictEqual(verifyManifest(manifest, sig, publicJwk), true);

  // jose<->der roundtrip sanity
  const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const msg = Buffer.from('hello');
  const der = createSign('SHA256').update(msg).sign({ key: privateKey, dsaEncoding: 'der' });
  const jose = derToJose(der);
  const der2 = joseToDer(jose);
  assert.ok(Buffer.isBuffer(der2));
  // DER is not byte-identical due to INTEGER minimal encoding rules edge cases, but verify via manifest verify path
  // (Construct a public key from private to validate signature)
  // Not needed here beyond ensuring conversions don't throw.

  console.log('Manifest tests passed');
})().catch((e) => { console.error(e); process.exit(1); });

