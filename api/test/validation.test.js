const assert = require("assert");
const { PassThrough } = require("stream");
const { readJsonLimited, validateSignBody } = require("../src/plugins/validation");

(async () => {
  // validateSignBody shape tests
  const expectMsg = (fn, msg) => {
    let threw = false;
    try { fn(); } catch (e) { threw = true; assert.strictEqual(e.message, msg); }
    if (!threw) assert.fail(`expected throw: ${msg}`);
  };
  expectMsg(() => validateSignBody(null), 'invalid_body');
  expectMsg(() => validateSignBody({}), 'missing_payload');
  const okNum = validateSignBody({ payload: 123 });
  assert.strictEqual(okNum.payload, 123);
  expectMsg(() => validateSignBody({ payload: {}, headers: "x" }), 'invalid_headers');
  expectMsg(() => validateSignBody({ payload: {}, headers: { tsr: "yes" } }), 'invalid_tsr');
  expectMsg(() => validateSignBody({ payload: {}, headers: { kid: "not*ok" } }), 'invalid_kid');
  expectMsg(() => validateSignBody({ payload: {}, headers: { unknown: true } }), 'unknown_header:unknown');
  expectMsg(() => validateSignBody({ payload: {}, extra: 1 }), 'unknown_field:extra');

  const ok1 = validateSignBody({ payload: { a: 1 } });
  assert.ok(ok1 && ok1.payload && ok1.headers);

  const ok2 = validateSignBody({ payload: "string", headers: { tsr: true } });
  assert.strictEqual(ok2.headers.tsr, true);

  // readJsonLimited: invalid content-type
  const r1 = new PassThrough(); r1.headers = { "content-type": "text/plain" };
  const p1 = readJsonLimited(r1).then(() => { throw new Error("should fail"); }, e => e);
  r1.end("x");
  const e1 = await p1; assert.strictEqual(e1.statusCode, 415); assert.strictEqual(e1.message, 'unsupported_media_type');

  // readJsonLimited: oversize (tiny cap)
  const big = "A".repeat(2048);
  const r2 = new PassThrough(); r2.headers = { "content-type": "application/json" };
  const p2 = readJsonLimited(r2, { limitBytes: 64 }).then(() => { throw new Error("should fail"); }, e => e);
  r2.end(JSON.stringify({ payload: big }));
  const e2 = await p2; assert.strictEqual(e2.statusCode, 413); assert.strictEqual(e2.message, 'payload_too_large');

  // readJsonLimited: bad JSON
  const r3 = new PassThrough(); r3.headers = { "content-type": "application/json" };
  const p3 = readJsonLimited(r3).then(() => { throw new Error("should fail"); }, e => e);
  r3.end("{not json}");
  const e3 = await p3; assert.strictEqual(e3.statusCode, 400); assert.strictEqual(e3.message, 'invalid_json');

  // readJsonLimited: ok path
  const r4 = new PassThrough(); r4.headers = { "content-type": "application/json" };
  const p4 = readJsonLimited(r4);
  r4.end(JSON.stringify({ payload: { ok: true } }));
  const body = await p4; assert.strictEqual(body.payload.ok, true);

  console.log("validation tests passed");
})().catch(e => { console.error(e); process.exit(1); });
