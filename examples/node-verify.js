#!/usr/bin/env node

// Example: verify a receipt with the Node SDK
// Usage:
//   node examples/node-verify.js --receipt examples/receipt.example.json --jwks examples/jwks.example.json

const fs = require('fs');
const path = require('path');

let SDK;
try { SDK = require('@certnode/sdk'); } catch (_) { SDK = require('../sdk/node'); }
const { verifyReceipt, JWKSManager } = SDK;

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--receipt' || a === '-r') { out.receipt = argv[++i]; continue; }
    if (a === '--jwks' || a === '-j') { out.jwks = argv[++i]; continue; }
  }
  return out;
}

(async () => {
  const args = parseArgs(process.argv);
  const receiptPath = args.receipt || path.join(__dirname, 'receipt.example.json');
  const jwksPath = args.jwks || path.join(__dirname, 'jwks.example.json');

  const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
  const jwks = JSON.parse(fs.readFileSync(jwksPath, 'utf8'));

  const mgr = new JWKSManager({ ttlMs: 300000 });
  mgr.setFromObject(jwks);

  const result = await verifyReceipt({ receipt, jwks: mgr.getFresh() || jwks });
  if (result.ok) {
    console.log('OK: receipt verified');
    process.exit(0);
  } else {
    console.error('FAIL:', result.reason);
    process.exit(1);
  }
})().catch((e) => { console.error(e); process.exit(1); });

