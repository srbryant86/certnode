/* File: api/src/plugins/validation.js
   Purpose: Defensive parsing + validation for /v1/sign
   - Enforces application/json
   - Body size cap (default 256 KiB via API_MAX_BODY_BYTES || process.env.SIGN_MAX_PAYLOAD_BYTES)
   - Top-level shape: { payload: <object|string>, headers?: { kid?: string(b64url), tsr?: boolean } }
   - Rejects unknown top-level fields and unknown header fields
   - Provides helpers: readJsonBody(req, max), validateSignRequest(obj)
*/
const { StringDecoder } = require("string_decoder");

const DEFAULT_MAX = parseInt(process.env.API_MAX_BODY_BYTES || process.env.SIGN_MAX_PAYLOAD_BYTES || "262144", 10); // 256 KiB

function isObject(v){ return v !== null && typeof v === "object" && !Array.isArray(v); }
function isB64u(str){ return typeof str === "string" && /^[A-Za-z0-9_-]+$/.test(str); }

function httpError(status, code, msg){
  const e = new Error(msg || code);
  e.statusCode = status;
  e.code = code;
  return e;
}

/** Read & parse JSON body with a hard byte cap (streams). */
function readJsonBody(req, maxBytes = DEFAULT_MAX){
  return new Promise((resolve, reject) => {
    if (!req || !req.on) return reject(httpError(500, "bad_request_stream", "Invalid request stream"));
    const ct = (req.headers && String(req.headers["content-type"] || "")).toLowerCase();
    if (!ct.startsWith("application/json")) {
      return reject(httpError(415, "unsupported_media_type", "Content-Type must be application/json"));
    }
    let bytes = 0;
    const dec = new StringDecoder("utf8");
    let buf = "";

    req.on("data", chunk => {
      bytes += chunk.length || 0;
      if (bytes > maxBytes) {
        return reject(httpError(413, "payload_too_large", "Payload exceeds limit"));
      }
      buf += dec.write(chunk);
    });
    req.on("end", () => {
      try {
        buf += dec.end();
        const obj = buf.length ? JSON.parse(buf) : {};
        resolve(obj);
      } catch {
        reject(httpError(400, "invalid_json", "Body is not valid JSON"));
      }
    });
    req.on("error", err => reject(httpError(400, "read_error", err.message || "read error")));
  });
}

/** Validate POST /v1/sign request shape, return normalized { payload, headers } */
function validateSignRequest(body){
  if (!isObject(body)) throw httpError(400, "invalid_body", "Expected JSON object body");
  const { payload, headers, ...rest } = body;
  if (Object.keys(rest).length) throw httpError(400, "unknown_fields", "Only {payload, headers} allowed");
  if (typeof payload === "undefined") throw httpError(400, "missing_payload", "payload is required");

  const payloadOk = isObject(payload) || typeof payload === "string";
  if (!payloadOk) throw httpError(400, "invalid_payload_type", "payload must be object or string");

  let hdrs = {};
  if (typeof headers !== "undefined") {
    if (!isObject(headers)) throw httpError(400, "invalid_headers", "headers must be an object");
    const { kid, tsr, ...hre } = headers;
    if (Object.keys(hre).length) throw httpError(400, "unknown_header_fields", "Only {kid, tsr} allowed in headers");
    if (typeof tsr !== "undefined" && typeof tsr !== "boolean") {
      throw httpError(400, "invalid_headers", "headers.tsr must be boolean");
    }
    if (typeof kid !== "undefined" && !isB64u(kid)) {
      throw httpError(400, "invalid_headers", "headers.kid must be base64url string");
    }
    hdrs = { ...(typeof kid === "string" ? { kid } : {}), ...(typeof tsr === "boolean" ? { tsr } : {}) };
  }
  return { payload, headers: hdrs };
}

module.exports = { readJsonBody, validateSignRequest, httpError, DEFAULT_MAX };


// ---- Strict schema + canonical size helpers (a9)
const { canonicalize } = require('../util/jcs');

function limits(){
  const bodyMax = toPosInt(process.env.API_MAX_BODY_BYTES, DEFAULT_MAX);
  const canonMax = toPosInt(process.env.API_MAX_CANONICAL_BYTES, 262144);
  return { bodyMax, canonMax };
}
function toPosInt(v, dflt){ const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.floor(n) : dflt; }
function isPlainObject(x){ return x !== null && typeof x === 'object' && !Array.isArray(x); }
function hasOnlyKeys(obj, allowed){ return Object.keys(obj).every(k => allowed.includes(k)); }
function bad(code, message){ const e = new Error(message || code); e.statusCode = code.endsWith('_too_large') ? 413 : 400; e.code = code; return e; }

function validateHeadersStrict(headers){
  if (headers === undefined) return {};
  if (!isPlainObject(headers)) throw bad('invalid_request', 'headers must be an object');
  const allowed = ['kid','tsr'];
  if (!hasOnlyKeys(headers, allowed)) throw bad('invalid_request', 'unknown header field');
  if (headers.kid !== undefined && typeof headers.kid !== 'string') throw bad('invalid_request', 'headers.kid must be a string');
  if (headers.tsr !== undefined && typeof headers.tsr !== 'boolean') throw bad('invalid_request', 'headers.tsr must be a boolean');
  return { kid: headers.kid, tsr: headers.tsr === true };
}

function validateParsed(body){
  if (!isPlainObject(body)) throw bad('invalid_request', 'body must be a JSON object');
  const allowed = ['payload','headers'];
  if (!hasOnlyKeys(body, allowed)) throw bad('invalid_request', 'unknown top-level field');
  if (!('payload' in body)) throw bad('missing_payload', 'payload is required');
  const { payload } = body;
  if (!(isPlainObject(payload) || typeof payload === 'string')) throw bad('invalid_request', 'payload must be an object or string');
  const headers = validateHeadersStrict(body.headers);
  return { payload, headers };
}

function enforceCanonicalSizeOrThrow(payload){
  const { canonMax } = limits();
  const jcsBytes = canonicalize(payload);
  if (jcsBytes.byteLength > canonMax) throw bad('payload_too_large', `canonicalized payload exceeds ${canonMax} bytes`);
  return jcsBytes;
}

module.exports.limits = limits;
module.exports.isPlainObject = isPlainObject;
module.exports.validateParsed = validateParsed;
module.exports.enforceCanonicalSizeOrThrow = enforceCanonicalSizeOrThrow;
module.exports.bad = bad;
