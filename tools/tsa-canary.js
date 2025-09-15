#!/usr/bin/env node

// Simple TSA canary using the app's RFC3161 utility
// Usage: node tools/tsa-canary.js [--url https://tsa.example.com/tsp] [--digest <b64url_sha256>]

const { performance } = require('perf_hooks');
const ts = require('../api/src/util/timestamp');

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url') { out.url = argv[++i]; continue; }
    if (a === '--digest') { out.digest = argv[++i]; continue; }
  }
  return out;
}

function toB64u(buf){
  return Buffer.from(buf).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

(async () => {
  const args = parseArgs(process.argv);
  if (args.url) process.env.TSA_URL = args.url;
  const url = process.env.TSA_URL;
  if (!url) {
    console.error('Set TSA_URL or pass --url');
    process.exit(2);
  }

  // Use provided digest or a canary digest for the string 'certnode-canary'
  let digest = args.digest;
  if (!digest) {
    const crypto = require('crypto');
    const d = crypto.createHash('sha256').update('certnode-canary','utf8').digest();
    digest = toB64u(d);
  }

  const t0 = performance.now();
  const tok = await ts.getTimestampToken(digest);
  const ms = (performance.now() - t0).toFixed(2);
  if (tok && typeof tok === 'string') {
    console.log(`TSA OK ${ms}ms`);
    process.exit(0);
  } else {
    console.error(`TSA FAIL ${ms}ms`);
    process.exit(1);
  }
})().catch((e) => { console.error('TSA error:', e.message || e); process.exit(1); });

