const assert = require('assert');
const { handle } = require('../src/routes/jwks');
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
  // Method not allowed
  const req1 = { method: 'POST', url: '/jwks', headers: {} };
  const res1 = mockRes();
  attach(req1, res1);
  await handle(req1, res1);
  const j1 = JSON.parse(res1.body || '{}');
  assert.strictEqual(res1.statusCode, 405);
  assert.strictEqual(j1.error, 'method_not_allowed');
  assert(res1._headers['X-Request-Id']);
  assert.strictEqual(j1.request_id, res1._headers['X-Request-Id']);

  // Production 404
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  const req2 = { method: 'GET', url: '/jwks', headers: {} };
  const res2 = mockRes();
  attach(req2, res2);
  await handle(req2, res2);
  const j2 = JSON.parse(res2.body || '{}');
  assert.strictEqual(res2.statusCode, 404);
  assert.strictEqual(j2.error, 'not_available_in_production');
  assert(res2._headers['X-Request-Id']);
  assert.strictEqual(j2.request_id, res2._headers['X-Request-Id']);
  process.env.NODE_ENV = prev;

  console.log('jwks.route.test OK');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });

