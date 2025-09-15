const assert = require('assert');
const ts = require('../src/util/timestamp');

(async () => {
  // Stub mode (no TSA_URL): deterministic token
  delete process.env.TSA_URL;
  const tok1 = await ts.getTimestampToken('abc');
  const tok2 = await ts.getTimestampToken('abc');
  assert.strictEqual(tok1, tok2, 'stub token should be deterministic');

  // DER request builder sanity
  const digest = Buffer.alloc(32, 1); // 32 bytes
  const req = ts._internal.buildTsrRequest(digest);
  assert(req.length > 10, 'DER request should have length');
  assert.strictEqual(req[0], 0x30, 'DER starts with SEQUENCE');
  // basic check: contains sha256 OID bytes 2.16.840.1.101.3.4.2.1
  const oidBytes = Buffer.from([0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01]);
  assert(req.includes(oidBytes), 'should include SHA-256 OID');

  console.log('timestamp.test OK');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });

