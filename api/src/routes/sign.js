const { createHash, createSign, generateKeyPairSync } = require('crypto');
const derToJose = require('../util/derToJose');
const { canonicalize } = require('../util/jcs');
const { jwkThumbprint, b64u } = require('../util/kid');
const timestamp = require('../util/timestamp');

let signerKeyPair;
function getKeyPair() {
  if (signerKeyPair) return signerKeyPair;
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  signerKeyPair = { privateKey, publicKey };
  return signerKeyPair;
}

function publicJwk() {
  const { publicKey } = getKeyPair();
  const spki = publicKey.export({ type: 'spki', format: 'der' });
  const uncompressed = spki.slice(-65);
  const x = uncompressed.slice(1, 33);
  const y = uncompressed.slice(33, 65);
  return { kty: 'EC', crv: 'P-256', x: b64u(x), y: b64u(y) };
}

function sha256(buf) { return createHash('sha256').update(buf).digest(); }

async function signPayload(payload, headers = {}) {
  if (headers.alg && headers.alg !== 'ES256') {
    const err = new Error('Unsupported alg'); err.statusCode = 400; throw err;
  }
  const jcsBytes = canonicalize(payload);
  const payloadB64 = b64u(jcsBytes);
  const payload_jcs_sha256 = b64u(sha256(jcsBytes));

  const jwk = publicJwk();
  const kid = headers.kid || jwkThumbprint(jwk);
  const protectedHeader = { alg: 'ES256', kid };
  const protectedB64 = b64u(Buffer.from(JSON.stringify(protectedHeader), 'utf8'));
  const signingInput = Buffer.from(protectedB64 + '.' + payloadB64, 'utf8');

  const { privateKey } = getKeyPair();
  const derSig = createSign('SHA256').update(signingInput).sign({ key: privateKey, dsaEncoding: 'der' });
  const joseSig = derToJose(derSig);
  const signature = b64u(joseSig);

  const receipt_id = b64u(sha256(Buffer.from(protectedB64 + '.' + payloadB64 + '.' + signature, 'utf8')));

  let tsr;
  if (headers.tsr === true) {
    try {
      const token = await timestamp.getTimestampToken(payload_jcs_sha256);
      if (token) tsr = token;
    } catch (_) {}
  }

  return { protected: protectedB64, signature, payload, kid, payload_jcs_sha256, receipt_id, ...(tsr ? { tsr } : {}) };
}

async function handle(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'method_not_allowed' }));
  }
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', async () => {
    try {
      const parsed = JSON.parse(body || '{}');
      const { payload, headers } = parsed;
      if (typeof payload === 'undefined') { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'missing_payload' })); }
      const out = await signPayload(payload, headers || {});
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(out));
    } catch (e) {
      const code = e.statusCode || 500;
      res.writeHead(code, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message || 'error' }));
    }
  });
}

module.exports = { signPayload, handle };

