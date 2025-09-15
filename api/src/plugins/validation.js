/* File: api/src/plugins/validation.js
   Purpose: Defensive parsing + validation for /v1/sign (consolidated API)
   - Enforces application/json
   - Body size caps with warn/hard thresholds (config/env)
   - Strict top-level shape: { payload, headers?: { kid?: b64u, tsr?: boolean } }
   Exports: readJsonLimited(req, opts), validateSignBody(body), toPosInt
*/
const { cfg } = require('../config/env');
const { PAYLOAD_WARN_BYTES, PAYLOAD_HARD_BYTES } = cfg;

// Additional validation utilities (Content-Type + body size + schema)
const CT_JSON = /^application\/json\b/i;
function toPosInt(v, d){ const n=Number(v); return Number.isFinite(n) && n>0 ? Math.floor(n) : d; }
function b64uLike(s){ return typeof s==='string' && /^[A-Za-z0-9_-]{16,128}$/.test(s); }

async function readJsonLimited(req, opts = {}){
  const limitBytes = toPosInt(process.env.API_MAX_BODY_BYTES, toPosInt(opts.limitBytes, PAYLOAD_HARD_BYTES));
  const requireJson = opts.requireJson !== false;
  const ct = (req.headers && req.headers['content-type']) || '';
  if (requireJson && !CT_JSON.test(ct)){
    const e = new Error('unsupported_media_type'); e.statusCode = 415; throw e;
  }
  let size = 0; const chunks = [];
  for await (const chunk of req){
    size += Buffer.byteLength(chunk);
    if (size > limitBytes){ 
      const e = new Error('payload_too_large'); 
      e.statusCode = 413; 
      e.details = { limit_exceeded: true };
      throw e; 
    }
    chunks.push(chunk);
  }
  
  // Track payload size on request object
  req._payloadSize = size;
  
  // Check hard limit
  if (size > PAYLOAD_HARD_BYTES) {
    const e = new Error('payload_too_large');
    e.statusCode = 413;
    e.details = { limit_exceeded: true };
    throw e;
  }
  
  // Emit warning if over warn threshold
  if (size > PAYLOAD_WARN_BYTES) {
    console.warn(JSON.stringify({ 
      event: 'payload_size_warning', 
      size: size, 
      warn: PAYLOAD_WARN_BYTES, 
      request_id: req.id || null 
    }));
  }
  
  const raw = Buffer.concat(chunks).toString('utf8');
  try { return raw ? JSON.parse(raw) : {}; } catch { const e = new Error('invalid_json'); e.statusCode = 400; throw e; }
}

function validateSignBody(body){
  if (body === null || typeof body !== 'object' || Array.isArray(body)){ const e = new Error('invalid_body'); e.statusCode = 400; throw e; }
  const allowedTop = new Set(['payload','headers']);
  for (const k of Object.keys(body)){ if (!allowedTop.has(k)){ const e = new Error('unknown_field:'+k); e.statusCode = 400; throw e; } }
  if (!('payload' in body)){ const e = new Error('missing_payload'); e.statusCode = 400; throw e; }
  const p = body.payload; const pt = typeof p;
  if (!(pt==='string' || pt==='number' || pt==='boolean' || p===null || pt==='object')){ const e = new Error('invalid_payload_type'); e.statusCode = 400; throw e; }
  let outHeaders = {};
  if ('headers' in body){ const h = body.headers; if (h===null || typeof h!=='object' || Array.isArray(h)){ const e = new Error('invalid_headers'); e.statusCode = 400; throw e; }
    const allowedH = new Set(['kid','tsr','require_tsr']); for (const k of Object.keys(h)){ if (!allowedH.has(k)){ const e = new Error('unknown_header:'+k); e.statusCode = 400; throw e; } }
    if ('kid' in h){ if (!b64uLike(h.kid)){ const e = new Error('invalid_kid'); e.statusCode = 400; throw e; } outHeaders.kid = h.kid; }
    if ('tsr' in h){ if (typeof h.tsr !== 'boolean'){ const e = new Error('invalid_tsr'); e.statusCode = 400; throw e; } outHeaders.tsr = h.tsr; }
    if ('require_tsr' in h){ if (typeof h.require_tsr !== 'boolean'){ const e = new Error('invalid_require_tsr'); e.statusCode = 400; throw e; } outHeaders.require_tsr = h.require_tsr; }
  }
  return { payload: p, headers: outHeaders };
}

module.exports = { readJsonLimited, validateSignBody, toPosInt };
