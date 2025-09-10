const assert = require("assert");
const { PassThrough } = require("stream");
const { readJsonBody, validateSignRequest } = require("../src/plugins/validation");

function expectCode(fn, code){
  try { fn(); assert.fail(`expected ${code}`); } catch(e){ assert.strictEqual(e.code, code); }
}

(async () => {
  // validateSignRequest shape tests
  expectCode(() => validateSignRequest(null), 'invalid_body');
  expectCode(() => validateSignRequest({}), 'missing_payload');
  expectCode(() => validateSignRequest({ payload: 123 }), 'invalid_payload_type');
  expectCode(() => validateSignRequest({ payload: {}, headers: "x" }), 'invalid_headers');
  expectCode(() => validateSignRequest({ payload: {}, headers: { tsr: "yes" } }), 'invalid_headers');
  expectCode(() => validateSignRequest({ payload: {}, headers: { kid: "not*ok" } }), 'invalid_headers');
  expectCode(() => validateSignRequest({ payload: {}, headers: { unknown: true } }), 'unknown_header_fields');
  expectCode(() => validateSignRequest({ payload: {}, extra: 1 }), 'unknown_fields');

  const ok1 = validateSignRequest({ payload: { a: 1 } });
  assert.ok(ok1 && ok1.payload && ok1.headers);

  const ok2 = validateSignRequest({ payload: "string", headers: { tsr: true } });
  assert.strictEqual(ok2.headers.tsr, true);

  // readJsonBody: invalid content-type
  const r1 = new PassThrough(); r1.headers = { "content-type": "text/plain" };
  const p1 = readJsonBody(r1).then(() => { throw new Error("should fail"); }, e => e);
  r1.end("x");
  const e1 = await p1; assert.strictEqual(e1.statusCode, 415); assert.strictEqual(e1.code, 'unsupported_media_type');

  // readJsonBody: oversize (tiny cap)
  const big = "A".repeat(2048);
  const r2 = new PassThrough(); r2.headers = { "content-type": "application/json" };
  const p2 = readJsonBody(r2, 64).then(() => { throw new Error("should fail"); }, e => e);
  r2.end(JSON.stringify({ payload: big }));
  const e2 = await p2; assert.strictEqual(e2.statusCode, 413); assert.strictEqual(e2.code, 'payload_too_large');

  // readJsonBody: bad JSON
  const r3 = new PassThrough(); r3.headers = { "content-type": "application/json" };
  const p3 = readJsonBody(r3).then(() => { throw new Error("should fail"); }, e => e);
  r3.end("{not json}");
  const e3 = await p3; assert.strictEqual(e3.statusCode, 400); assert.strictEqual(e3.code, 'invalid_json');

  // readJsonBody: ok path
  const r4 = new PassThrough(); r4.headers = { "content-type": "application/json" };
  const p4 = readJsonBody(r4);
  r4.end(JSON.stringify({ payload: { ok: true } }));
  const body = await p4; assert.strictEqual(body.payload.ok, true);

  console.log("validation tests passed");
})().catch(e => { console.error(e); process.exit(1); });
