const assert = require("assert");
const http = require("http");
const { applyRateLimit } = require("../src/plugins/ratelimit");

function mockReq(path, ip = "1.2.3.4"){
  const req = new http.IncomingMessage();
  req.url = path;
  req.method = "POST";
  req.headers = { host: "localhost", "x-forwarded-for": ip };
  req.socket = { remoteAddress: ip };
  return req;
}
function mockRes(){
  const headers = {};
  return {
    statusCode: 200,
    setHeader: (k,v) => { headers[String(k).toLowerCase()] = v; },
    getHeader: (k) => headers[String(k).toLowerCase()],
    end: () => {},
    _h: headers
  };
}

(function run(){
  const path = "/v1/sign";
  const ip = "9.9.9.9";
  const res = mockRes();

  process.env.RATE_LIMIT_CAPACITY = "3";
  process.env.RATE_LIMIT_REFILL_PER_SEC = "0";
  process.env.RATE_LIMIT_COST_SIGN = "1";

  for (let i=0;i<3;i++){
    const out = applyRateLimit(mockReq(path, ip), res);
    assert.strictEqual(out.limited, false, "request should pass");
  }
  const lim = applyRateLimit(mockReq(path, ip), res);
  assert.strictEqual(lim.limited, true, "should rate-limit");
  assert.ok(lim.retry >= 1, "retry-after present");
  console.log("ratelimit test passed");
})();
