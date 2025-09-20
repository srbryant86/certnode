const assert = require("assert");
const { Readable } = require("stream");
const { readJsonLimited, validateSignBody } = require("../src/plugins/validation");
const { signPayload } = require("../src/routes/sign");

function mkReq(json, headers = { "content-type": "application/json" }){
  const r = new Readable({ read(){} });
  r.push(typeof json === "string" ? json : JSON.stringify(json));
  r.push(null);
  r.headers = headers;
  r.socket = { remoteAddress: "127.0.0.1" };
  return r;
}

(async () => {
  const req1 = mkReq({ payload: { a: 1 }, headers: { tsr: false } });
  const body1 = await readJsonLimited(req1, { limitBytes: 1024 });
  const v1 = validateSignBody(body1);
  const out1 = await signPayload(v1.payload, v1.headers);
  assert.ok(out1.receipt_id);

  const req2 = mkReq({ not_payload: 1 });
  const body2 = await readJsonLimited(req2, { limitBytes: 1024 });
  assert.throws(() => validateSignBody(body2), /unknown_field|missing_payload/);

  const req3 = mkReq({ payload: 1, extra: true });
  const body3 = await readJsonLimited(req3, { limitBytes: 1024 });
  assert.throws(() => validateSignBody(body3), /unknown_field:extra/);

  const req4 = mkReq({ payload: "x", headers: { foo: "bar" } });
  const body4 = await readJsonLimited(req4, { limitBytes: 1024 });
  assert.throws(() => validateSignBody(body4), /unknown_header:foo/);

  const req5 = mkReq({ payload: "x", headers: { tsr: "yes" } });
  const body5 = await readJsonLimited(req5, { limitBytes: 1024 });
  assert.throws(() => validateSignBody(body5), /invalid_tsr/);

  const req6 = mkReq({ payload: { a:2 }, headers: { kid: "not valid !!!" } });
  const body6 = await readJsonLimited(req6, { limitBytes: 1024 });
  assert.throws(() => validateSignBody(body6), /invalid_kid/);

  const big = "x".repeat(300_000);
  const req7 = mkReq({ payload: big }, { "content-type": "application/json" });
  await assert.rejects(() => readJsonLimited(req7, { limitBytes: 10_000 }), /payload_too_large/);

  const req8 = mkReq({ payload: 1 }, { "content-type": "text/plain" });
  await assert.rejects(() => readJsonLimited(req8, {}), /unsupported_media_type/);

  const req9 = mkReq({ payload: "hello" });
  const body9 = await readJsonLimited(req9, { limitBytes: 1024 });
  const v9 = validateSignBody(body9);
  const out9 = await signPayload(v9.payload, v9.headers);
  assert.ok(out9.signature);

  console.log("validation.sign tests passed");
})().catch((e)=>{ console.error(e); process.exit(1); });

