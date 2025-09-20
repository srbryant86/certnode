const assert = require("assert");
const { Readable } = require("stream");
const { createRateLimiter } = require("../src/plugins/ratelimit");

function mkReq(ip="1.2.3.4"){
  const r = new Readable({ read(){} });
  r.push(null);
  r.headers = { "x-forwarded-for": ip };
  r.socket = { remoteAddress: ip };
  return r;
}

(async () => {
  const max = 10, windowMs = 1000; // 10 req / 1s
  const limiter = createRateLimiter({ max, windowMs });

  for (let i=0;i<max;i++){
    const gate = limiter.allow(mkReq());
    assert.ok(gate.ok, "should allow within capacity");
  }
  const denied = limiter.allow(mkReq());
  assert.ok(!denied.ok, "should deny after capacity");
  assert.ok(denied.retryAfterMs > 0, "retryAfterMs should be positive");

  const other = limiter.allow(mkReq("5.6.7.8"));
  assert.ok(other.ok, "separate bucket per IP");

  await new Promise(r => setTimeout(r, windowMs + 20));
  const again = limiter.allow(mkReq());
  assert.ok(again.ok, "refilled should allow");
  console.log("ratelimit tests passed");
})().catch((e)=>{ console.error(e); process.exit(1); });
