// JWKS manifest helpers: stable hash, manifest object, sign/verify
const { createHash, createSign, createVerify, createPublicKey, generateKeyPairSync } = require('crypto');
const { canonicalize } = require('./jcs');
const derToJose = require('./derToJose');
const joseToDer = require('./joseToDer');
const { b64u } = require('./kid');

function sha256(buf) { return createHash('sha256').update(buf).digest(); }

// Hash JWKS with JCS so whitespace/key-order dont matter
function hashJwks(jwksObj) {
  const bytes = canonicalize(jwksObj);
  return b64u(sha256(bytes));
}

// Manifest is minimal and pin-able
function makeManifest({ versionId, jwks, createdAt }) {
  if (!versionId || typeof versionId !== 'string') throw new Error('versionId required');
  const sha = hashJwks(jwks);
  const created = createdAt || new Date().toISOString();
  return { versionId, sha256: sha, createdAt: created };
}

// Inject signer to keep CI networkless. signFn(bytes) -> JOSE b64url signature
async function signManifest(manifest, signFn) {
  const bytes = Buffer.from(JSON.stringify(manifest), 'utf8');
  const sigB64u = await Promise.resolve(signFn(bytes));
  if (typeof sigB64u !== 'string' || !/^[A-Za-z0-9_-]+$/.test(sigB64u)) {
    throw new Error('signFn must return base64url JOSE signature');
  }
  return { manifest, sig: sigB64u };
}

// Verify with a public JWK (EC P-256). Returns true/false.
function verifyManifest(manifest, sigB64u, jwkPublic) {
  if (!jwkPublic || jwkPublic.kty !== 'EC' || jwkPublic.crv !== 'P-256') return false;
  let pub;
  try { pub = createPublicKey({ key: jwkPublic, format: 'jwk' }); } catch { return false; }
  const derSig = joseToDer(Buffer.from(sigB64u, 'base64url'));
  const bytes = Buffer.from(JSON.stringify(manifest), 'utf8');
  const v = createVerify('SHA256').update(bytes);
  return v.verify(pub, derSig);
}

// Local dev signer (not used in prod): generates ephemeral P-256 keypair
function makeLocalSigner() {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const publicJwk = publicKey.export({ format: 'jwk' });
  const signFn = (bytes) => {
    const der = createSign('SHA256').update(bytes).sign({ key: privateKey, dsaEncoding: 'der' });
    return Buffer.from(derToJose(der)).toString('base64url');
  };
  return { signFn, publicJwk };
}

module.exports = { hashJwks, makeManifest, signManifest, verifyManifest, makeLocalSigner };

