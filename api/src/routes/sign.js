const { createHash } = require('crypto');
const signer = require('../crypto/signer');

const { canonicalize } = require('../util/jcs');
const { b64u } = require('../util/kid');
const timestamp = require('../util/timestamp');

function sha256(buf) { return createHash('sha256').update(buf).digest(); }

async function signPayload(payload, headers = {}) {
  if (headers.alg && headers.alg !== 'ES256') {
    const err = new Error('Unsupported alg'); err.statusCode = 400; throw err;
  }
  await signer.ready();
  const jcsBytes = canonicalize(payload);
  const payloadB64 = b64u(jcsBytes);
  const payload_jcs_sha256 = b64u(sha256(jcsBytes));

  const kid = headers.kid || signer.getKid();
  const protectedHeader = { alg: 'ES256', kid };
  const protectedB64 = b64u(Buffer.from(JSON.stringify(protectedHeader), 'utf8'));

  const { signature } = await signer.signDetached(protectedB64, payloadB64);

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
