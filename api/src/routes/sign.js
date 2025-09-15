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
  if (headers.tsr === true || headers.require_tsr === true) {
    try {
      const token = await timestamp.getTimestampToken(payload_jcs_sha256);
      if (token) tsr = token;
      if (!token && headers.require_tsr === true) {
        const err = new Error('timestamp authority unavailable');
        err.statusCode = 503; err.code = 'tsa_unavailable';
        throw err;
      }
    } catch (e) {
      if (headers.require_tsr === true) {
        const err = new Error('timestamp authority unavailable');
        err.statusCode = 503; err.code = 'tsa_unavailable';
        throw err;
      }
    }
  }

  return { protected: protectedB64, signature, payload, kid, payload_jcs_sha256, receipt_id, ...(tsr ? { tsr } : {}) };
}

async function handle(req, res) {
  if (req.method !== "POST"){
    const headers = { "Content-Type": "application/json" };
    if (req && req.id) headers['X-Request-Id'] = req.id;
    const body = { error: "method_not_allowed" };
    if (req && req.id) body.request_id = req.id;
    res.writeHead(405, headers);
    return res.end(JSON.stringify(body));
  }

  // Enforce usage limits for free tier
  const { enforceUsageLimits } = require('../plugins/usage-limits');
  const limitResult = enforceUsageLimits(req, res);

  // If limit exceeded, response is already sent
  if (!limitResult.allowed) {
    return;
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

    // Track customer analytics for monetization insights
    require('../plugins/customer-analytics').trackApiRequest(req, res, 'sign', raw);

    // Emit revenue tracking event for successful sign
    require('../plugins/metrics').emit('revenue_event', 1, {
      type: 'sign',
      value: 0.001, // $0.001 per sign for pricing intelligence
      receipt_id: out.receipt_id,
      ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || '127.0.0.1',
      usage_status: limitResult.status
    });
  } catch (e) {
    // Special-case TSA strict requirement to ensure standardized error body
    if (e && (e.code === 'tsa_unavailable' || (e.statusCode === 503 && String(e.message||'').toLowerCase().includes('timestamp authority')))) {
      const headers = { "Content-Type": "application/json" };
      if (req && req.id) headers['X-Request-Id'] = req.id;
      res.writeHead(503, headers);
      const body = { error: 'tsa_unavailable', message: e.message || 'timestamp authority unavailable' };
      if (req && req.id) body.request_id = req.id;
      return res.end(JSON.stringify(body));
    }
    if (typeof res.handleError === 'function') {
      return res.handleError(e);
    }
    const code = e.statusCode || 500;
    const headers = { "Content-Type": "application/json" };
    if (req && req.id) headers['X-Request-Id'] = req.id;
    res.writeHead(code, headers);
    const body = { error: e.code || 'error', message: e.message || 'error' };
    if (req && req.id) body.request_id = req.id;
    res.end(JSON.stringify(body));
  }
}

module.exports = { signPayload, handle };

