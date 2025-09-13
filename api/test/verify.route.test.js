const assert = require('assert');
const { handle } = require('../src/routes/verify');
const { attach } = require('../src/plugins/requestId');

function mkReq(method = 'POST', body = null, prod = false) {
  const req = { method, headers: { host: 'localhost:3000' } };
  if (body !== null) {
    const chunks = [Buffer.from(body, 'utf8')];
    req._chunks = chunks;
    req.on = (ev, cb) => {
      if (ev === 'data') { for (const c of chunks) cb(c); }
      if (ev === 'end') { setImmediate(cb); }
    };
  } else {
    req.on = (ev, cb) => { if (ev === 'end') setImmediate(cb); };
  }
  if (prod) process.env.NODE_ENV = 'production'; else process.env.NODE_ENV = 'development';
  return req;
}

function mkRes() {
  const res = { _headers: {}, headersSent: false };
  res.setHeader = (k, v) => { res._headers[k] = v; };
  res.writeHead = (code, headers) => { res.statusCode = code; Object.assign(res._headers, headers || {}); return res; };
  res.end = (data) => { res.body = String(data || ''); res.headersSent = true; return res; };
  return res;
}

(async () => {
  // 405 method not allowed (dev)
  {
    const req = mkReq('GET', null, false);
    const res = mkRes();
    attach(req, res);
    await handle(req, res);
    const j = JSON.parse(res.body);
    assert.strictEqual(res.statusCode, 405);
    assert.strictEqual(j.error, 'method_not_allowed');
    assert.ok(j.request_id);
    assert.strictEqual(res._headers['X-Request-Id'], j.request_id);
  }

  // 400 invalid json (dev)
  {
    const req = mkReq('POST', '{not json', false);
    const res = mkRes();
    attach(req, res);
    await handle(req, res);
    const j = JSON.parse(res.body);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(j.error, 'invalid_json');
    assert.ok(j.request_id);
  }

  // 404 not found (prod)
  {
    const req = mkReq('POST', '{}', true);
    const res = mkRes();
    attach(req, res);
    await handle(req, res);
    const j = JSON.parse(res.body);
    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(j.error, 'not_found');
    assert.ok(j.request_id);
  }

  console.log('verify.route.test OK');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });

