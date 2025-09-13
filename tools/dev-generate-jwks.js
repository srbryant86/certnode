#!/usr/bin/env node

// Dev utility: generate a P-256 keypair and output a JWKS (public only)
// Usage:
//   node tools/dev-generate-jwks.js --out jwks.json

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function b64u(buf) { return Buffer.from(buf).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,''); }
function canonicalJson(value){ if(value===null||typeof value==='number'||typeof value==='boolean')return JSON.stringify(value); if(typeof value==='string')return JSON.stringify(value); if(Array.isArray(value))return '['+value.map(canonicalJson).join(',')+']'; if(value&&typeof value==='object'){const keys=Object.keys(value).sort(); return '{'+keys.map(k=>JSON.stringify(k)+':'+canonicalJson(value[k])).join(',')+'}';} return JSON.stringify(value); }
function sha256(buf){ return crypto.createHash('sha256').update(buf).digest(); }

function parseArgs(argv){ const out={}; for(let i=2;i<argv.length;i++){ const a=argv[i]; if(a==='--out'||a==='-o'){ out.out=argv[++i]; continue; } } return out; }

(async () => {
  const args = parseArgs(process.argv);
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });

  // Export JWK
  const jwk = publicKey.export({ format: 'jwk' });
  if (jwk.kty !== 'EC' || jwk.crv !== 'P-256') throw new Error('unexpected key type');

  // Compute RFC7638 thumbprint as kid
  const json = canonicalJson({ crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y });
  const kid = b64u(sha256(Buffer.from(json, 'utf8')));

  const jwks = { keys: [{ kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, kid }] };
  const outPath = path.resolve(args.out || 'jwks.dev.json');
  fs.writeFileSync(outPath, JSON.stringify(jwks, null, 2), 'utf8');
  console.log('Wrote', outPath);
})().catch(e => { console.error(e); process.exit(1); });

