const assert = require('assert');
const { Readable } = require('stream');
const { readJsonLimited, validateSignBody } = require('../src/plugins/validation');

function mkReq(obj, headers = { 'content-type': 'application/json' }) {
  const r = new Readable({ read(){} });
  const data = typeof obj === 'string' ? obj : JSON.stringify(obj);
  r.push(data);
  r.push(null);
  r.headers = headers;
  return r;
}

(async () => {
  // invalid JSON
  await assert.rejects(() => readJsonLimited(mkReq('{oops'), {}), /invalid_json/);

  // unsupported media type
  await assert.rejects(() => readJsonLimited(mkReq({ a:1 }, { 'content-type': 'text/plain' })), /unsupported_media_type/);

  // unknown top-level field
  assert.throws(() => validateSignBody({ payload: 1, extra_field: true }), /unknown_field:extra_field/);

  // array payload allowed
  const ok1 = validateSignBody({ payload: [1,2,3] });
  assert.deepStrictEqual(ok1.payload, [1,2,3]);

  // missing payload
  assert.throws(() => validateSignBody({}), /missing_payload/);

  // headers: unknown header
  assert.throws(() => validateSignBody({ payload: 'x', headers: { foo: 'bar' } }), /unknown_header:foo/);

  // headers: kid too short
  assert.throws(() => validateSignBody({ payload: 'x', headers: { kid: 'short' } }), /invalid_kid/);

  // headers: kid invalid characters
  assert.throws(() => validateSignBody({ payload: 'x', headers: { kid: 'abc+slash/' } }), /invalid_kid/);

  // headers: kid too long
  const longKid = 'a'.repeat(129);
  assert.throws(() => validateSignBody({ payload: 'x', headers: { kid: longKid } }), /invalid_kid/);

  // headers: tsr must be boolean
  assert.throws(() => validateSignBody({ payload: 'x', headers: { tsr: 'yes' } }), /invalid_tsr/);

  console.log('validation.fuzz tests passed');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });

