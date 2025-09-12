#!/usr/bin/env node

// tools/jwks-rotate-validate.js
// Validates rotation from CURRENT JWKS to NEXT JWKS.
// Ensures both JWKS are valid and have at least one overlapping key (thumbprint).
// Usage:
//   node tools/jwks-rotate-validate.js --current path/current.json --next path/next.json
// Exits 0 on success; non-zero on failure.

const fs = require('fs');
const path = require('path');

function b64uToBuf(str) {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function canonicalJson(value) {
  if (value === null || typeof value === 'number' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return '{' + keys.map(k => (JSON.stringify(k) + ':' + canonicalJson(value[k]))).join(',') + '}';
  }
  return JSON.stringify(value);
}

function sha256(buf) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(buf).digest();
}

function b64u(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function jwkThumbprint(jwk) {
  if (!jwk || jwk.kty !== 'EC' || jwk.crv !== 'P-256' || !jwk.x || !jwk.y) {
    throw new Error('Only EC P-256 JWK supported for thumbprint');
  }
  const json = canonicalJson({ crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y });
  return b64u(sha256(Buffer.from(json, 'utf8')));
}

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--current' || a === '-c') { out.current = argv[++i]; continue; }
    if (a === '--next' || a === '-n') { out.next = argv[++i]; continue; }
    if (a === '--help' || a === '-h') { out.help = true; }
  }
  return out;
}

function usage() {
  console.log('Usage: node tools/jwks-rotate-validate.js --current <path> --next <path>');
}

function loadJson(pth) {
  return JSON.parse(fs.readFileSync(path.resolve(pth), 'utf8'));
}

function validateJwks(jwks, label) {
  const errors = [];
  if (!jwks || typeof jwks !== 'object' || !Array.isArray(jwks.keys)) {
    errors.push(`${label}: JWKS must be an object with a keys array`);
  } else if (jwks.keys.length === 0) {
    errors.push(`${label}: JWKS keys array must not be empty`);
  }
  if (Array.isArray(jwks.keys)) {
    for (let i = 0; i < jwks.keys.length; i++) {
      const k = jwks.keys[i];
      const ctx = `${label}.keys[${i}]`;
      if (!k || typeof k !== 'object') { errors.push(`${ctx}: key must be an object`); continue; }
      if (k.kty !== 'EC') errors.push(`${ctx}: kty must be "EC"`);
      if (k.crv !== 'P-256') errors.push(`${ctx}: crv must be "P-256"`);
      if (!k.x || !k.y) errors.push(`${ctx}: missing x or y coordinate`);
      try {
        const xb = b64uToBuf(k.x); const yb = b64uToBuf(k.y);
        if (xb.length !== 32 || yb.length !== 32) errors.push(`${ctx}: x/y must decode to 32 bytes each`);
      } catch { errors.push(`${ctx}: invalid base64url in x or y`); }
    }
  }
  return errors;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.current || !args.next) { usage(); process.exit(args.help ? 0 : 2); }

  let current, next;
  try { current = loadJson(args.current); } catch (e) { console.error('Failed to read current JWKS:', e.message); process.exit(2); }
  try { next = loadJson(args.next); } catch (e) { console.error('Failed to read next JWKS:', e.message); process.exit(2); }

  const errs = [
    ...validateJwks(current, 'current'),
    ...validateJwks(next, 'next')
  ];
  if (errs.length) {
    console.error('[JWKS Rotation] FAILED');
    for (const e of errs) console.error(' -', e);
    process.exit(1);
  }

  // Compute thumbprints
  const setA = new Set();
  const setB = new Set();
  try { for (const k of current.keys) setA.add(jwkThumbprint(k)); } catch (e) { console.error('current: thumbprint error:', e.message); process.exit(1); }
  try { for (const k of next.keys) setB.add(jwkThumbprint(k)); } catch (e) { console.error('next: thumbprint error:', e.message); process.exit(1); }

  // Overlap check
  let overlap = 0; for (const tp of setA) if (setB.has(tp)) overlap++;
  if (overlap === 0) {
    console.error('[JWKS Rotation] FAILED: no overlapping keys between current and next JWKS.');
    console.error('Recommendation: deploy next with at least one existing key to ensure continuity.');
    process.exit(1);
  }

  // Basic sanity: next must not be empty
  if (setB.size === 0) {
    console.error('[JWKS Rotation] FAILED: next JWKS is empty.');
    process.exit(1);
  }

  console.log('[JWKS Rotation] OK');
  console.log('Current keys:', setA.size);
  console.log('Next keys:', setB.size);
  console.log('Overlap:', overlap);
}

main().catch((e) => { console.error('Unexpected error:', e); process.exit(2); });

