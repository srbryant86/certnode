/* File: api/src/crypto/signer.js
   - KMS mode (KMS_KEY_ID present): RAW ECDSA P-256 via AWS KMS
   - Local fallback: ephemeral P-256 keypair (dev/CI)
*/
const { createPublicKey, createSign, generateKeyPairSync } = require('crypto');
const { KMSClient, GetPublicKeyCommand, SignCommand } = (function tryAws() {
  try { return require('@aws-sdk/client-kms'); } catch { return {}; }
})();
const derToJose = require('../util/derToJose');
const { jwkThumbprint, b64u } = require('../util/kid');

const KMS_KEY_ID = process.env.KMS_KEY_ID || process.env.AWS_KMS_KEY_ID || null;
const AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';

let mode = 'local';
let cachedJwk = null, cachedKid = null, kms = null;
let local = null;

async function ready() {
  if (cachedJwk) return;
  if (KMS_KEY_ID && KMSClient && GetPublicKeyCommand && SignCommand) {
    try {
      kms = new KMSClient({ region: AWS_REGION });
      const out = await kms.send(new GetPublicKeyCommand({ KeyId: KMS_KEY_ID }));
      if (!out || !out.PublicKey) throw new Error('KMS GetPublicKey returned no data');
      const spkiDer = Buffer.from(out.PublicKey);
      const keyObj = createPublicKey({ key: spkiDer, format: 'der', type: 'spki' });
      const jwk = keyObj.export({ format: 'jwk' });
      if (jwk.kty !== 'EC' || jwk.crv !== 'P-256') throw new Error('KMS key must be EC P-256');
      cachedJwk = { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y };
      cachedKid = jwkThumbprint(cachedJwk);
      mode = 'kms';
      return;
    } catch {
      mode = 'local';
    }
  }
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const jwk = publicKey.export({ format: 'jwk' });
  cachedJwk = { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y };
  cachedKid = jwkThumbprint(cachedJwk);
  local = { privateKey };
}

function getPublicJwk(){ if(!cachedJwk) throw new Error('signer not ready'); return cachedJwk; }
function getKid(){ if(!cachedKid) throw new Error('signer not ready'); return cachedKid; }

async function signDetached(protectedB64, payloadB64){
  if (!cachedKid) await ready();
  const signingInput = Buffer.from(`${protectedB64}.${payloadB64}`, 'utf8');
  if (mode === 'kms') {
    const res = await kms.send(new SignCommand({
      KeyId: KMS_KEY_ID, Message: signingInput, MessageType: 'RAW', SigningAlgorithm: 'ECDSA_SHA_256'
    }));
    const jose = derToJose(Buffer.from(res.Signature));
    return { signature: b64u(jose), kid: getKid() };
  }
  const der = createSign('SHA256').update(signingInput).sign({ key: local.privateKey, dsaEncoding: 'der' });
  const jose = derToJose(der);
  return { signature: b64u(jose), kid: getKid() };
}

module.exports = { ready, signDetached, getPublicJwk, getKid };
