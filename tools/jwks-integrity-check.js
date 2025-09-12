#!/usr/bin/env node

// tools/jwks-integrity-check.js
// Validates a JWKS file for basic integrity and policy compliance.
// Usage:
//   node tools/jwks-integrity-check.js --jwks path/to/jwks.json
// Exits 0 on success; non-zero on failure with reasons printed to stderr.

const fs = require('fs');
const path = require('path');

function b64uToBuf(str) {
  if (typeof str !== 'string') throw new Error('expected base64url string');
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
    if (a === '--jwks' || a === '-j') { out.jwks = argv[++i]; continue; }
    if (a === '--strict') { out.strict = true; continue; }
    if (a === '--help' || a === '-h') { out.help = true; }
  }
  return out;
}

function usage() {
  console.log('Usage: node tools/jwks-integrity-check.js --jwks <path> [--strict]');
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.jwks) { usage(); process.exit(args.help ? 0 : 2); }

  const errors = [];
  const warnings = [];

  let jwksRaw;
  try {
    jwksRaw = fs.readFileSync(path.resolve(args.jwks), 'utf8');
  } catch (e) {
    console.error('Failed to read JWKS file:', e.message);
    process.exit(2);
  }

  let jwks;
  try {
    jwks = JSON.parse(jwksRaw);
  } catch (e) {
    console.error('Invalid JSON:', e.message);
    process.exit(2);
  }

  if (!jwks || typeof jwks !== 'object' || !Array.isArray(jwks.keys)) {
    errors.push('JWKS must be an object with a keys array');
  } else if (jwks.keys.length === 0) {
    errors.push('JWKS keys array must not be empty');
  }

  const thumbprints = new Set();
  const kids = new Set();
  const details = [];

  if (Array.isArray(jwks.keys)) {
    for (let i = 0; i < jwks.keys.length; i++) {
      const k = jwks.keys[i];
      const ctx = `key[${i}]`;
      if (!k || typeof k !== 'object') { errors.push(`${ctx}: key must be an object`); continue; }
      if (k.kty !== 'EC') errors.push(`${ctx}: kty must be "EC"`);
      if (k.crv !== 'P-256') errors.push(`${ctx}: crv must be "P-256"`);
      if (!k.x || !k.y) errors.push(`${ctx}: missing x or y coordinate`);

      // base64url decode checks
      try {
        const xb = b64uToBuf(k.x);
        const yb = b64uToBuf(k.y);
        if (xb.length !== 32 || yb.length !== 32) errors.push(`${ctx}: x/y must decode to 32 bytes each`);
      } catch (e) {
        errors.push(`${ctx}: invalid base64url in x or y`);
      }

      // optional fields policy
      if (k.alg && k.alg !== 'ES256') warnings.push(`${ctx}: alg is not ES256 (value=${k.alg})`);
      if (k.use && k.use !== 'sig') warnings.push(`${ctx}: use should be "sig" if present (value=${k.use})`);

      let tp = null;
      try {
        tp = jwkThumbprint(k);
      } catch (e) {
        errors.push(`${ctx}: failed to compute thumbprint: ${e.message}`);
      }
      if (tp) {
        if (thumbprints.has(tp)) errors.push(`${ctx}: duplicate thumbprint: ${tp}`);
        thumbprints.add(tp);
      }

      if (k.kid) {
        if (kids.has(k.kid)) warnings.push(`${ctx}: duplicate kid: ${k.kid}`); // warn only; enforcement by thumbprint
        kids.add(k.kid);
      }

      details.push({ index: i, kid: k.kid || null, thumbprint: tp });
    }
  }

  if (errors.length) {
    console.error('[JWKS Integrity] FAILED');
    for (const e of errors) console.error(' -', e);
    if (warnings.length) {
      console.error('Warnings:');
      for (const w of warnings) console.error(' -', w);
    }
    process.exit(1);
  }

  console.log('[JWKS Integrity] OK');
  console.log('Keys:', details.length);
  console.log('Thumbprints:', details.map(d => d.thumbprint).join(','));
  if (warnings.length) {
    console.log('Warnings:');
    for (const w of warnings) console.log(' -', w);
  }
}

main().catch((e) => { console.error('Unexpected error:', e); process.exit(2); });

