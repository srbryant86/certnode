const assert = require('assert');
const http = require('http');
const { handle } = require('../src/routes/health');

(async () => {
  // Direct handler invocation
  const req = { method: 'GET' };
  let written = '';
  let statusCode = 200;
  const res = {
    writeHead: (code) => { statusCode = code; },
    end: (d) => { written = String(d || ''); }
  };

  // Wait for async handle to complete with timeout
  await Promise.race([
    handle(req, res),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Health test timeout')), 5000))
  ]);

  const obj = JSON.parse(written);
  assert.ok(obj && obj.status);                      // has status
  assert.ok(Number.isInteger(obj.uptime_s));         // uptime integer
  assert.ok(obj.dependencies);                       // has dependencies
  assert.ok(obj.dependencies.kms);                   // has KMS dependency
  assert.ok(obj.dependencies.memory);                // has memory check
  assert.ok(obj.dependencies.event_loop);            // has event loop check
  assert.ok(obj.timestamp);                          // has timestamp
  assert.ok(obj.node_version);                       // has Node version
  assert.ok(statusCode === 200 || statusCode === 503); // valid status code

  console.log('✓ Health endpoint tests passed');
})().catch(e => { console.error(e); process.exit(1); });