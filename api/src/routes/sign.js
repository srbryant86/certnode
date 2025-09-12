const { createHash } = require('crypto');
const signer = require('../crypto/signer');

const { canonicalize } = require('../util/jcs');
const { b64u } = require('../util/kid');
const timestamp = require('../util/timestamp');
const { readJsonLimited, validateSignBody, toPosInt } = require('../plugins/validation');

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
  if (req.method !== "POST"){
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "method_not_allowed" }));
  }
  require('../plugins/metrics').emit('sign_start');
  try {
    const raw = await readJsonLimited(req, { limitBytes: toPosInt(process.env.API_MAX_BODY_BYTES, 262144) });
    const { payload, headers } = validateSignBody(raw);
    const out = await signPayload(payload, headers);

    // Add payload size headers on success
    const responseHeaders = { "Content-Type": "application/json" };
    if (req._payloadSize !== undefined) {
      responseHeaders['X-Payload-Size'] = String(req._payloadSize);
      responseHeaders['X-Payload-Limit'] = String(require('../config/env').cfg.PAYLOAD_HARD_BYTES);
    }

    res.writeHead(200, responseHeaders);
    res.end(JSON.stringify(out));
    require('../plugins/metrics').emit('sign_success');
  } catch (e) {
    if (typeof res.handleError === 'function') {
      return res.handleError(e);
    }
    const code = e.statusCode || 500;
    const headers = { "Content-Type": "application/json" };
    if (req && req.id) headers['X-Request-Id'] = req.id;
    res.writeHead(code, headers);
    res.end(JSON.stringify({ error: e.code || 'error', message: e.message || 'error' }));
  }
}

module.exports = { signPayload, handle };




