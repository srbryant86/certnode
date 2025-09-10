const assert = require("assert");
const { validateParsed, enforceCanonicalSizeOrThrow } = require("../src/plugins/validation");

(function test_validate_ok(){
  const parsed = { payload: { a: 1 }, headers: { tsr: true, kid: "abc" } };
  const out = validateParsed(parsed);
  assert.strictEqual(out.payload.a, 1);
  assert.strictEqual(out.headers.tsr, true);
  assert.strictEqual(out.headers.kid, "abc");
})();

(function test_missing_payload(){
  try { validateParsed({}); throw new Error("expected throw"); }
  catch(e){ assert.strictEqual(e.code, "missing_payload"); }
})();

(function test_unknown_top_level(){
  try { validateParsed({ payload:{}, extra:1 }); throw new Error("expected throw"); }
  catch(e){ assert.strictEqual(e.code, "invalid_request"); }
})();

(function test_header_types(){
  try { validateParsed({ payload:{}, headers:{ tsr: "yes" } }); throw new Error("expected throw"); }
  catch(e){ assert.strictEqual(e.code, "invalid_request"); }
})();

(function test_canonical_size(){
  process.env.API_MAX_CANONICAL_BYTES = "32";
  try {
    enforceCanonicalSizeOrThrow({ big: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" });
    throw new Error("expected throw");
  } catch(e){
    assert.strictEqual(e.code, "payload_too_large");
  } finally {
    delete process.env.API_MAX_CANONICAL_BYTES;
  }
})();

console.log("validation.sign tests passed");
