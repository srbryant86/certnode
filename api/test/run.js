const http = require('http');
const assert = require('assert');
const { signPayload } = require('../src/routes/sign');
const { canonicalize } = require('../src/util/jcs');
const { b64u } = require('../src/util/kid');
const { createHash } = require('crypto');

(async () => {
  // Unit: signPayload returns required fields
  const payload = { a: 1, b: "x" };
  const out = await signPayload(payload, {});
  assert.ok(out.protected && out.signature && out.payload && out.kid && out.payload_jcs_sha256 && out.receipt_id);

  // Verify payload_jcs_sha256 matches
  const jcs = canonicalize(payload);
  const h = createHash('sha256').update(jcs).digest();
  assert.strictEqual(out.payload_jcs_sha256, b64u(h));

  // Verify receipt recompute
  const protectedB64 = out.protected;
  const payloadB64 = b64u(jcs);
  const ridLocal = b64u(createHash('sha256').update(Buffer.from(`${protectedB64}.${payloadB64}.${out.signature}`, 'utf8')).digest());
  assert.strictEqual(out.receipt_id, ridLocal);

  // tsr flag triggers optional field (timestamp util may be stubbed; here ignore if undefined)
  const out2 = await signPayload(payload, { tsr: true });
  if (out2.tsr !== undefined) {
    assert.ok(typeof out2.tsr === 'string' && /^[A-Za-z0-9_-]+$/.test(out2.tsr));
  }

  console.log('All tests passed');
})().catch((e) => { console.error(e); process.exit(1); });


const { verifyDetached } = require("../src/routes/verify");
const signer = require("../src/crypto/signer");
const { jwkThumbprint } = require("../src/util/kid");

(async () => {
  await signer.ready();
  const pub = signer.getPublicJwk();
  const kid = jwkThumbprint(pub);
  const jwks = { keys: [{ kty:'EC', crv:'P-256', x:pub.x, y:pub.y, kid }] };

  const payload = { demo: true, n: 7 };
  const signed = await require("../src/routes/sign").signPayload(payload, {});

  const ok1 = verifyDetached({ payload, protected: signed.protected, signature: signed.signature }, { jwks });
  require("assert").strictEqual(ok1.valid, true, "verify should be valid");
  require("assert").ok(ok1.payload_jcs_sha256 && typeof ok1.payload_jcs_sha256 === "string");

  const bad = { demo: true, n: 8 };
  const ok2 = verifyDetached({ payload: bad, protected: signed.protected, signature: signed.signature }, { jwks });
  require("assert").strictEqual(ok2.valid, false, "tampered payload must fail verify");

  console.log("a3 verify tests passed");
})();
