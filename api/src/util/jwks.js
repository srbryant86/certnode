/* File: api/src/util/jwks.js
   Load a JWKS for verification:
   - Prefer DI via function argument in verify (tests use this path).
   - Otherwise: env JWKS_JSON, env JWKS_PATH, or local web/.well-known/certnode-jwks.json.
   No network fetch here (keeps CI fully offline). */
const fs = require('fs');
const path = require('path');

function loadLocalJwks() {
  if (process.env.JWKS_JSON) {
    try { return JSON.parse(process.env.JWKS_JSON); } catch (e) { throw new Error('Invalid JWKS_JSON'); }
  }
  // Canonical static JWKS path (served by CDN / .well-known)
  const primary = process.env.JWKS_PATH || path.join(process.cwd(), '..', 'public', '.well-known', 'jwks.json');
  if (fs.existsSync(primary)) {
    return JSON.parse(fs.readFileSync(primary, 'utf8'));
  }
  // Back-compat fallback (legacy location)
  const legacy = path.join(process.cwd(), '..', 'web', '.well-known', 'certnode-jwks.json');
  if (fs.existsSync(legacy)) {
    return JSON.parse(fs.readFileSync(legacy, 'utf8'));
  }
  throw new Error('JWKS not found (set JWKS_JSON, JWKS_PATH, or provide DI jwks)');
}

function findKeyByKid(jwks, kid) {
  if (!jwks || !Array.isArray(jwks.keys)) throw new Error('Invalid JWKS');
  return jwks.keys.find(k => k.kty === 'EC' && k.crv === 'P-256' && (k.kid === kid || kid == null));
}

module.exports = { loadLocalJwks, findKeyByKid };
