const assert = require('assert');
const { handle: signHandle } = require('../src/routes/sign');
const { attach } = require('../src/plugins/requestId');

function mockRes() {
  const res = { headersSent: false };
  res._headers = {};
  res.setHeader = (k, v) => { res._headers[k] = v; };
  res.writeHead = (code, hdrs) => { res.statusCode = code; Object.assign(res._headers, hdrs || {}); };
  res.end = (data) => { res.body = String(data || ''); };
  return res;
}

(async () => {
  // method not allowed -> 405 method_not_allowed and X-Request-Id populated
  const req = { method: 'GET', url: '/v1/sign', headers: {} };
  const res = mockRes();
  attach(req, res);
  await signHandle(req, res);
  const j = JSON.parse(res.body || '{}');
  assert.strictEqual(res.statusCode, 405);
  assert.strictEqual(j.error, 'method_not_allowed');
  assert(res._headers['X-Request-Id']);
  console.log('error.model.test OK');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
