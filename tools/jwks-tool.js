#!/usr/bin/env node

// Unified JWKS tooling wrapper
// Usage:
//   node tools/jwks-tool.js integrity --jwks path
//   node tools/jwks-tool.js rotate-validate --current path --next path
//   node tools/jwks-tool.js thumbprints --jwks path
//   node tools/jwks-tool.js diff --a path --b path

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function runScript(script, args) {
  const p = spawnSync(process.execPath, [path.join(__dirname, script), ...args], { stdio: 'inherit' });
  process.exitCode = p.status || 0;
}

function loadJson(pth) { return JSON.parse(fs.readFileSync(path.resolve(pth), 'utf8')); }
function canonicalJson(value){ if(value===null||typeof value==='number'||typeof value==='boolean')return JSON.stringify(value); if(typeof value==='string')return JSON.stringify(value); if(Array.isArray(value))return '['+value.map(canonicalJson).join(',')+']'; if(value&&typeof value==='object'){const keys=Object.keys(value).sort(); return '{'+keys.map(k=>JSON.stringify(k)+':'+canonicalJson(value[k])).join(',')+'}';} return JSON.stringify(value); }
function sha256(buf){ const crypto=require('crypto'); return crypto.createHash('sha256').update(buf).digest(); }
function b64u(buf){ return Buffer.from(buf).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,''); }

function thumbprints(jwksPath) {
  const jwks = loadJson(jwksPath);
  if (!jwks || !Array.isArray(jwks.keys)) throw new Error('invalid JWKS');
  const tps = [];
  for (const k of jwks.keys) {
    if (!k || k.kty !== 'EC' || k.crv !== 'P-256' || !k.x || !k.y) continue;
    const json = canonicalJson({ crv: k.crv, kty: k.kty, x: k.x, y: k.y });
    tps.push(b64u(sha256(Buffer.from(json, 'utf8'))));
  }
  console.log(tps.join('\n'));
}

function diff(aPath, bPath) {
  const A = new Set(thumbprintsCollect(aPath));
  const B = new Set(thumbprintsCollect(bPath));
  const onlyA = [...A].filter(x => !B.has(x));
  const onlyB = [...B].filter(x => !A.has(x));
  console.log('Only in A:', onlyA.join(','));
  console.log('Only in B:', onlyB.join(','));
}
function thumbprintsCollect(pth){ const out=[]; const jwks=loadJson(pth); for(const k of jwks.keys||[]){ if(k&&k.kty==='EC'&&k.crv==='P-256'&&k.x&&k.y){ const json=canonicalJson({crv:k.crv,kty:k.kty,x:k.x,y:k.y}); out.push(b64u(sha256(Buffer.from(json,'utf8')))); } } return out; }

const cmd = process.argv[2];
const args = process.argv.slice(3);

switch (cmd) {
  case 'integrity':
    runScript('jwks-integrity-check.js', args);
    break;
  case 'rotate-validate':
    runScript('jwks-rotate-validate.js', args);
    break;
  case 'thumbprints': {
    const i = args.indexOf('--jwks');
    if (i === -1) { console.error('missing --jwks'); process.exit(2); }
    thumbprints(args[i+1]);
    break;
  }
  case 'diff': {
    const ia = args.indexOf('--a'); const ib = args.indexOf('--b');
    if (ia === -1 || ib === -1) { console.error('missing --a/--b'); process.exit(2); }
    diff(args[ia+1], args[ib+1]);
    break;
  }
  default:
    console.error('Usage:\n  node tools/jwks-tool.js integrity --jwks path\n  node tools/jwks-tool.js rotate-validate --current path --next path\n  node tools/jwks-tool.js thumbprints --jwks path\n  node tools/jwks-tool.js diff --a path --b path');
    process.exit(2);
}

