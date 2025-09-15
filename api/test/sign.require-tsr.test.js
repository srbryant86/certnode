const assert = require('assert');
const { handle } = require('../src/routes/sign');
const { attach } = require('../src/plugins/requestId');
const ts = require('../src/util/timestamp');

function mkReq(body) {
  const req = { method: 'POST', headers: { host: 'localhost:3000' } };
  const payload = Buffer.from(JSON.stringify(body), 'utf8');
  req.on = (ev, cb) => {
    if (ev === 'data') cb(payload);
    if (ev === 'end') setImmediate(cb);
  };
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
  // Monkey patch timestamp to force failure
  const orig = ts.getTimestampToken;
  ts.getTimestampToken = async () => null;
  try {
    const req = mkReq({ payload: { a: 1 }, headers: { require_tsr: true } });
    const res = mkRes();
    attach(req, res);
    await handle(req, res);
    assert.strictEqual(res.statusCode, 503);
    const j = JSON.parse(res.body || '{}');
    assert.strictEqual(j.error, 'tsa_unavailable');
    assert(j.request_id);
  } finally {
    ts.getTimestampToken = orig;
  }

  // Success path with token present
  ts.getTimestampToken = async () => 'dG9rZW4';
  try {
    const req = mkReq({ payload: { a: 2 }, headers: { tsr: true, require_tsr: true } });
    const res = mkRes();
    attach(req, res);
    await handle(req, res);
    assert.strictEqual(res.statusCode, 200);
    const j = JSON.parse(res.body || '{}');
    assert(j.tsr, 'tsr should be present');
  } finally {
    ts.getTimestampToken = orig;
  }

  console.log('sign.require-tsr.test OK');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });

