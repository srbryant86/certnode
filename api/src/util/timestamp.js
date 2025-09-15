// RFC3161 Timestamp utility.
// - In production, optionally calls a TSA and returns a base64url DER token.
// - By default (no TSA_URL), returns a deterministic stub based on input hash (stable in CI/tests).
//
// Environment:
//   TSA_URL             - e.g. https://tsa.example.com/tsp
//   TSA_TIMEOUT_MS      - request timeout (default 3000)
//   TSA_RETRIES         - retry attempts on failure (default 1)
//   TSA_CA_PEM          - optional PEM string for custom CA (inline)
//   TSA_CERT_IGNORE     - '1' to ignore TLS errors (dev only)

const { createHash } = require('crypto');
let emitMetric = null;
try { emitMetric = require('../plugins/metrics').emit; } catch (_) { emitMetric = () => {}; }
const https = require('https');
const { URL } = require('url');

function b64u(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

// Minimal ASN.1 DER helpers for TimeStampReq
function derLen(n){
  if (n < 0x80) return Buffer.from([n]);
  const bytes = [];
  while (n > 0){ bytes.unshift(n & 0xff); n >>= 8; }
  return Buffer.from([0x80 | bytes.length, ...bytes]);
}
function derSeq(content){
  const c = Buffer.isBuffer(content) ? content : Buffer.concat(content);
  return Buffer.concat([Buffer.from([0x30]), derLen(c.length), c]);
}
function derInt(n){
  // only small positive integers used (version 1)
  if (n >= 0 && n <= 127) return Buffer.from([0x02, 0x01, n]);
  const bytes = [];
  let v = n >>> 0;
  while (v > 0){ bytes.unshift(v & 0xff); v >>>= 8; }
  if (bytes[0] & 0x80) bytes.unshift(0x00); // ensure positive
  return Buffer.concat([Buffer.from([0x02]), derLen(bytes.length), Buffer.from(bytes)]);
}
function derBool(v){ return Buffer.from([0x01, 0x01, v ? 0xff : 0x00]); }
function derNull(){ return Buffer.from([0x05, 0x00]); }
function derOid(oid){
  // oid as string "1.2.840.113549.1.1.5" → bytes
  const parts = oid.split('.').map(x => parseInt(x,10));
  const first = 40*parts[0] + parts[1];
  const rest = parts.slice(2).map(encodeBase128);
  const body = Buffer.from([first, ...rest.flat()]);
  return Buffer.concat([Buffer.from([0x06]), derLen(body.length), body]);
}
function encodeBase128(n){
  const out = [];
  do { out.unshift(n & 0x7f); n >>= 7; } while (n > 0);
  for (let i=0;i<out.length-1;i++) out[i] |= 0x80;
  return out;
}
function derOctetString(buf){
  const b = Buffer.from(buf);
  return Buffer.concat([Buffer.from([0x04]), derLen(b.length), b]);
}

// Build minimal RFC3161 TimeStampReq for SHA-256 and provided digest bytes
function buildTsrRequest(digestBytes){
  // AlgorithmIdentifier for SHA-256: 2.16.840.1.101.3.4.2.1 with NULL params
  const algId = derSeq(Buffer.concat([derOid('2.16.840.1.101.3.4.2.1'), derNull()]));
  const messageImprint = derSeq(Buffer.concat([algId, derOctetString(digestBytes)]));
  const version = derInt(1);
  // certReq true, request TSA certs in response
  const certReq = derBool(true);
  const tsReq = derSeq(Buffer.concat([version, messageImprint, certReq]));
  return tsReq;
}

function toB64(buf){ return Buffer.from(buf).toString('base64'); }

function requestTsa(urlStr, body, { timeoutMs = 3000, caPem = null, insecure = false }){
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const opts = {
      method: 'POST',
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + (u.search || ''),
      headers: {
        'Content-Type': 'application/timestamp-query',
        'Accept': 'application/timestamp-reply',
        'Content-Length': body.length
      },
      timeout: timeoutMs,
      rejectUnauthorized: !insecure
    };
    if (caPem) opts.ca = caPem;
    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (res.statusCode >= 200 && res.statusCode < 300) return resolve(buf);
        const err = new Error(`TSA HTTP ${res.statusCode}`);
        err.statusCode = res.statusCode;
        return reject(err);
      });
    });
    req.on('timeout', () => { req.destroy(new Error('TSA_TIMEOUT')); });
    req.on('error', (e) => reject(e));
    req.write(body);
    req.end();
  });
}

async function getTimestampToken(payload_jcs_sha256_b64u){
  const url = process.env.TSA_URL;
  const timeoutMs = Number(process.env.TSA_TIMEOUT_MS || '3000');
  const retries = Math.max(0, Number(process.env.TSA_RETRIES || '1'));
  const caPem = process.env.TSA_CA_PEM || null;
  const insecure = process.env.TSA_CERT_IGNORE === '1';

  // Decode base64url digest
  const padded = payload_jcs_sha256_b64u + '='.repeat((4 - payload_jcs_sha256_b64u.length % 4) % 4);
  const digest = Buffer.from(padded.replace(/-/g,'+').replace(/_/g,'/'), 'base64');

  if (!url) {
    // Deterministic stub token (stable across envs/tests)
    const der = createHash('sha256').update(String(payload_jcs_sha256_b64u), 'utf8').digest();
    return b64u(der);
  }

  const body = buildTsrRequest(digest);
  let attempt = 0; let lastErr;
  while (attempt <= retries){
    try {
      const t0 = Date.now();
      const resBuf = await requestTsa(url, body, { timeoutMs, caPem, insecure });
      const ms = Date.now() - t0;
      try { emitMetric && emitMetric('tsa_request_success', 1, { ms }); } catch (_) {}
      // Return base64url of DER response (pass-through)
      return b64u(resBuf);
    } catch (e) {
      lastErr = e;
      attempt++;
      try { emitMetric && emitMetric('tsa_request_error', 1, { code: e.code || 'error', status: e.statusCode || 0 }); } catch (_) {}
      // small backoff
      await new Promise(r => setTimeout(r, Math.min(200 * attempt, 1000)));
    }
  }
  // On failure, return null to allow caller to omit tsr
  return null;
}

module.exports = { getTimestampToken, _internal: { buildTsrRequest, derSeq, derInt, derBool, derNull, derOid, derOctetString } };
