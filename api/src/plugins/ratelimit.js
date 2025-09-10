/* File: api/src/plugins/ratelimit.js
   Purpose: Lightweight per-IP token-bucket rate limiting for the API.
   Notes:
   - In-memory (per-instance) by design; WAF handles bulk abuse. This protects KMS from bursts.
   - Exempts GET /health and OPTIONS (preflight).
   - Config via env (with safe defaults).
*/
const buckets = new Map();

function nowSec(){ return Date.now() / 1000; }
function b64ip(s){ return String(s || "").trim(); }

function getConfig(){
  // Defaults: ~60 req/min burst, steady 1 rps refill
  const CAP = Number(process.env.RATE_LIMIT_CAPACITY || 60);     // max tokens
  const REF = Number(process.env.RATE_LIMIT_REFILL_PER_SEC || 1); // tokens/sec
  const COST = Number(process.env.RATE_LIMIT_COST || 1);          // tokens per request
  const WINDOW = Number(process.env.RATE_LIMIT_WINDOW_SEC || 60); // for headers
  return { CAP, REF, COST, WINDOW };
}

function bucketFor(key){
  const { CAP, REF } = getConfig();
  let b = buckets.get(key);
  if (!b){
    b = { tokens: CAP, updated: nowSec() };
    buckets.set(key, b);
  }
  const t = nowSec();
  const elapsed = Math.max(0, t - b.updated);
  b.tokens = Math.min(CAP, b.tokens + elapsed * REF);
  b.updated = t;
  return b;
}

function retryAfterSeconds(b, cost){
  const { CAP, REF } = getConfig();
  const need = Math.max(0, cost - b.tokens);
  if (need <= 0) return 0;
  return Math.ceil(need / REF);
}

function routeCost(pathname){
  if (pathname === "/v1/sign") return Number(process.env.RATE_LIMIT_COST_SIGN || 1);
  return Number(process.env.RATE_LIMIT_COST || 1);
}

function setHeader(res, k, v){ try{ res.setHeader(k, v); }catch(_){} }

function setRateHeaders(res, remaining, windowSec, resetSec){
  const { CAP } = getConfig();
  setHeader(res, "RateLimit-Limit", String(CAP));
  setHeader(res, "RateLimit-Remaining", String(Math.max(0, Math.floor(remaining))));
  setHeader(res, "RateLimit-Reset", String(resetSec));
}

function clientIp(req){
  const xf = (req.headers && req.headers["x-forwarded-for"]) || "";
  if (xf) return b64ip(String(xf).split(",")[0]);
  return b64ip((req.socket && req.socket.remoteAddress) || "0.0.0.0");
}

/** Returns { limited:boolean, retry:number } and sets headers if limited. */
function applyRateLimit(req, res){
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (req.method === "OPTIONS") return { limited:false, retry:0 };
  if (req.method === "GET" && (url.pathname === "/health" || url.pathname === "/v1/health")) return { limited:false, retry:0 };

  const key = clientIp(req) + "|" + url.pathname;
  const cost = routeCost(url.pathname);
  const b = bucketFor(key);

  if (b.tokens >= cost){
    b.tokens -= cost;
    const { WINDOW } = getConfig();
    setRateHeaders(res, b.tokens, WINDOW, Math.ceil(nowSec() % WINDOW));
    return { limited:false, retry:0 };
  }

  const retry = retryAfterSeconds(b, cost);
  setHeader(res, "Retry-After", String(retry));
  const { WINDOW } = getConfig();
  setRateHeaders(res, 0, WINDOW, retry);
  return { limited:true, retry };
}

function checkRate(req, res){
  const { limited, retry } = applyRateLimit(req, res);
  if (!limited) return false;
  res.statusCode = 429;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ error: "rate_limited", retry_after: retry }));
  return true;
}

module.exports = { checkRate, applyRateLimit };
