// RFC3161 timestamp utility stub.
// In production, this should call a TSA and return a base64url DER token.
// For tests/CI, we keep it local and deterministic based on input hash.
const { createHash } = require('crypto');

function b64u(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

async function getTimestampToken(payload_jcs_sha256_b64u) {
  // Deterministic pseudo-token derived from the hash string (not a real TSA token)
  const der = createHash('sha256').update(String(payload_jcs_sha256_b64u), 'utf8').digest();
  return b64u(der);
}

module.exports = { getTimestampToken };

