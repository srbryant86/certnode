const assert = require("assert");
const { createRateLimiter } = require("../src/plugins/ratelimit");

(function test_bucket_blocks_on_limit(){
  let now = 1_000_000;
  const limiter = createRateLimiter({ max: 3, windowMs: 1000, now: () => now });
  const req = { headers: { "x-forwarded-for": "1.2.3.4" }, socket: { remoteAddress: "10.0.0.1" } };
  assert.strictEqual(limiter.take(req).ok, true);
  assert.strictEqual(limiter.take(req).ok, true);
  assert.strictEqual(limiter.take(req).ok, true);
  const res = limiter.take(req);
  assert.strictEqual(res.ok, false);
  assert.ok(res.retryAfterSec >= 1);
  now += 1001;
  assert.strictEqual(limiter.take(req).ok, true);
})();

(function test_isolated_keys(){
  let now = 2_000_000;
  const limiter = createRateLimiter({ max: 1, windowMs: 1000, now: () => now });
  const a = { headers: { "x-forwarded-for": "9.9.9.9" }, socket: { remoteAddress: "10.0.0.2" } };
  const b = { headers: { "x-forwarded-for": "8.8.8.8" }, socket: { remoteAddress: "10.0.0.3" } };
  assert.strictEqual(limiter.take(a).ok, true);
  const blockedA = limiter.take(a); assert.strictEqual(blockedA.ok, false);
  assert.strictEqual(limiter.take(b).ok, true);
})();

console.log("ratelimit tests passed");
