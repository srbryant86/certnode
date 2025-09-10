/* File: api/src/plugins/validation.js
   Purpose: Defensive parsing + validation for /v1/sign
   - Enforces application/json
   - Body size cap (default 256 KiB via SIGN_MAX_PAYLOAD_BYTES)
   - Top-level shape: { payload: <object|string>, headers?: { kid?: string(b64url), tsr?: boolean } }
   - Rejects unknown top-level fields and unknown header fields
   - Provides helpers: readJsonBody(req, max), validateSignRequest(obj)
*/
const { StringDecoder } = require("string_decoder");

const DEFAULT_MAX = parseInt(process.env.SIGN_MAX_PAYLOAD_BYTES || "262144", 10); // 256 KiB

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
