#!/usr/bin/env node

// Example: call /v1/sign and print the receipt
// Usage:
//   node examples/node-sign.js --payload '{"hello":"world","n":42}' [--url http://127.0.0.1:3000]

const http = require('http');

function parseArgs(argv) {
  const out = { url: 'http://127.0.0.1:3000' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--payload' || a === '-p') { out.payload = argv[++i]; continue; }
    if (a === '--url' || a === '-u') { out.url = argv[++i]; continue; }
  }
  return out;
}

function postJson(baseUrl, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const data = Buffer.from(JSON.stringify(body), 'utf8');
    const options = {
      method: 'POST',
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
    };
    const req = http.request(options, (res) => {
      let buf = '';
      res.on('data', (c) => buf += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(buf || '{}') }); }
        catch { resolve({ status: res.statusCode, text: buf }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  const args = parseArgs(process.argv);
  if (!args.payload) {
    console.error('Missing --payload');
    process.exit(2);
  }
  let payload;
  try { payload = JSON.parse(args.payload); } catch (e) { console.error('Invalid JSON payload'); process.exit(2); }

  const res = await postJson(args.url, '/v1/sign', { payload });
  if (res.status === 200) {
    console.log(JSON.stringify(res.json, null, 2));
    process.exit(0);
  } else {
    console.error('HTTP', res.status, res.json || res.text);
    process.exit(1);
  }
})().catch(e => { console.error(e); process.exit(1); });

