const assert = require('assert');
const http = require('http');
const { handle } = require('../src/routes/health');

(async () => {
  // Direct handler invocation
  const req = { method: 'GET' };
  let written = ''; const res = {
    writeHead: () => {},
    end: (d) => { written = String(d || ''); }
  };
  handle(req, res);
  const obj = JSON.parse(written);
  assert.ok(obj && obj.status);               // has status
  assert.ok(Number.isInteger(obj.uptime_s));  // uptime integer
  assert.ok(obj.circuit && obj.circuit.state);// circuit shape
  console.log('health.test OK');
})().catch(e => { console.error(e); process.exit(1); });