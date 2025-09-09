// RFC 7638 JWK thumbprint for P-256 EC keys
const { createHash } = require('crypto');

function b64u(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function jwkThumbprint(jwk) {
  if (!jwk || jwk.kty !== 'EC' || jwk.crv !== 'P-256' || !jwk.x || !jwk.y) {
    throw new Error('Only EC P-256 JWK supported for thumbprint');
  }
  const json = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y });
  return b64u(createHash('sha256').update(json, 'utf8').digest());
}

module.exports = { jwkThumbprint, b64u };

