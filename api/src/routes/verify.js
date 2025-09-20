/* File: api/src/routes/verify.js
   Dev-only HTTP route and pure verifier that checks a detached JWS using a JWKS.
   - ES256 only
   - JCS canonicalization must match the original sign input
   - No network inside verify(); JWKS is DI or loaded locally
*/
const { createVerify, createPublicKey, createHash } = require('crypto');
const { canonicalize } = require('../util/jcs');
const { loadLocalJwks, findKeyByKid } = require('../util/jwks');

function b64u(buf){ return Buffer.from(buf).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function b64uToBuf(s){ s = String(s||''); s = s.replace(/-/g,'+').replace(/_/g,'/'); while (s.length % 4) s += '='; return Buffer.from(s, 'base64'); }

function sha256(buf){ return createHash('sha256').update(buf).digest(); }

/** Verify a detached JWS produced by /v1/sign
 *  @param {object} args - { payload, protected: protectedB64, signature: sigB64 }
 *  @param {object} opts - { jwks?: {keys:[...] } } optional DI JWKS (tests)
 *  @returns { valid:boolean, reason?:string, kid?:string, payload_jcs_sha256?:string }
 */
function verifyDetached(args, opts = {}) {
  try {
    const { payload, protected: protectedB64, signature: sigB64 } = args || {};
    if (!protectedB64 || !sigB64 || typeof payload === 'undefined') return { valid:false, reason:'missing_fields' };

    const hdr = JSON.parse(Buffer.from(b64uToBuf(protectedB64)).toString('utf8'));
    if (hdr.alg !== 'ES256') return { valid:false, reason:'alg_not_es256' };
    const kid = hdr.kid;

    const jcsBytes = canonicalize(payload);
    const payloadB64 = b64u(jcsBytes);
    const signingInput = Buffer.from(`${protectedB64}.${payloadB64}`, 'utf8');

    const jwks = opts.jwks || loadLocalJwks();
    const jwk = findKeyByKid(jwks, kid);
    if (!jwk) return { valid:false, reason:'kid_not_found' };

    const keyObj = createPublicKey({ key: { kty:'EC', crv:'P-256', x:jwk.x, y:jwk.y }, format:'jwk' });
    const ok = createVerify('SHA256')
      .update(signingInput)
      .verify({ key: keyObj, dsaEncoding: 'ieee-p1363' }, b64uToBuf(sigB64));
    return ok
      ? { valid:true, kid, payload_jcs_sha256: b64u(sha256(jcsBytes)) }
      : { valid:false, reason:'signature_mismatch', kid };
  } catch (e) {
    return { valid:false, reason: e && e.message ? String(e.message) : 'error' };
  }
}

// Dev-only HTTP handler (NODE_ENV !== 'production')
async function handle(req, res) {
  const withReqId = (headers = {}) => ({
    ...headers,
    ...(req && req.id ? { 'X-Request-Id': req.id } : {})
  });
  const withBodyReqId = (obj) => (req && req.id ? { ...obj, request_id: req.id } : obj);
  const { sendError } = require('../middleware/errorHandler');

  if (process.env.NODE_ENV === 'production') {
    return sendError(res, req, 404, 'not_found', 'endpoint not available in production');
  }
  if (req.method !== 'POST') {
    return sendError(res, req, 405, 'method_not_allowed', 'Only POST is allowed');
  }
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    try {
      const { payload, receipt } = JSON.parse(body||'{}');
      const out = verifyDetached({ payload, protected: (receipt||{}).protected, signature: (receipt||{}).signature });
      const headers = withReqId({ 'Content-Type':'application/json' });
      res.writeHead(200, headers);
      res.end(JSON.stringify(out));
    } catch (e) {
      return sendError(res, req, 400, 'invalid_json', 'Invalid JSON in request body');
    }
  });
}

module.exports = { verifyDetached, handle };
