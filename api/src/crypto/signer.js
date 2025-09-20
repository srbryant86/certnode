/* File: api/src/crypto/signer.js
   Single signing surface:
   - SIGNING_MODE=kms  => AWS KMS RAW ECDSA_SHA_256 via adapter (retries + breaker)
     KMS_KEY_ID required
   - else              => local in-memory P-256 for dev/tests
*/
const { generateKeyPairSync, createPublicKey, createSign } = require('crypto');
const { createKmsAdapter } = require('../aws/kms');
const derToJose = require('../util/derToJose');
const { jwkThumbprint, b64u } = require('../util/kid');

const mode = String(process.env.SIGNING_MODE || 'local').toLowerCase();
const kmsKeyId = process.env.KMS_KEY_ID;

let _ready = false;
let _pubJwk = null;
let _kid = null;
let _privLocal = null;
let _kmsAdapter = null;

async function initLocal() {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  _privLocal = privateKey;
  const jwk = publicKey.export({ format:'jwk' });
  _pubJwk = { kty:'EC', crv:'P-256', x:jwk.x, y:jwk.y };
  _kid = jwkThumbprint(_pubJwk);
  _ready = true;
}

async function initKms() {
  if (!kmsKeyId) throw new Error('KMS_KEY_ID not set but SIGNING_MODE=kms');
  const sdk = require('@aws-sdk/client-kms');
  _kmsAdapter = createKmsAdapter({ sdk, keyId: kmsKeyId });
  _pubJwk = await _kmsAdapter.getPublicJwk();
  _kid = _kmsAdapter.getKid();
  _ready = true;
}

async function ready(){
  if (_ready) return;
  if (mode === 'kms') { await initKms(); } else { await initLocal(); }
}
function getPublicJwk(){ if(!_ready) throw new Error('signer not ready'); return _pubJwk; }
function getKid(){ if(!_ready) throw new Error('signer not ready'); return _kid; }

async function signP1363(messageBuffer){
  if (!_ready) throw new Error('signer not ready');
  if (mode === 'kms') {
    return _kmsAdapter.signRaw(messageBuffer);
  } else {
    const der = createSign('SHA256').update(messageBuffer).sign({ key: _privLocal, dsaEncoding: 'der' });
    return derToJose(der);
  }
}

// Back-compat: signDetached(protectedB64, payloadB64) -> { signature, kid }
async function signDetached(protectedB64, payloadB64){
  const sigBuf = await signP1363(Buffer.from(`${protectedB64}.${payloadB64}`, 'utf8'));
  return { signature: b64u(sigBuf), kid: getKid() };
}

module.exports = { ready, getPublicJwk, getKid, signP1363, signDetached };

