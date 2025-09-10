/* File: api/src/plugins/ratelimit.js
   Token-bucket per-IP limiter for /v1/sign.
   - No external deps. Works behind ALB (uses X-Forwarded-For first).
   - Tunables (env):
     * API_RATE_LIMIT_MAX          default 120  (tokens per window)
     * API_RATE_LIMIT_WINDOW_MS    default 60000 (1 minute)
   - Intended as lightweight protection; WAF handles heavy abuse.
*/
function toPosInt(v,d){ const n=Number(v); return Number.isFinite(n) && n>0 ? Math.floor(n) : d; }

function clientIp(req){
  const xff = (req.headers && req.headers['x-forwarded-for']) || '';
  if (typeof xff === 'string' && xff.length){
    const ip = xff.split(',')[0].trim();
    if (ip) return ip;
  }
  return (req.socket && (req.socket.remoteAddress || req.socket.localAddress)) || '0.0.0.0';
}

/** Create a token bucket limiter. */
function createRateLimiter(opts = {}){
  const capacity = toPosInt(process.env.API_RATE_LIMIT_MAX, toPosInt(opts.max, 120));
  const windowMs = toPosInt(process.env.API_RATE_LIMIT_WINDOW_MS, toPosInt(opts.windowMs, 60000));
  const refillPerMs = capacity / windowMs;
  const buckets = new Map(); // key -> { tokens, last }

  function now(){ return Date.now(); } // for tests, we can monkey-patch if needed

  function allow(req){
    const key = clientIp(req);
    let b = buckets.get(key);
    const t = now();
    if (!b){ b = { tokens: capacity, last: t }; buckets.set(key, b); }
    // refill
    const elapsed = Math.max(0, t - b.last);
    if (elapsed > 0){
      b.tokens = Math.min(capacity, b.tokens + elapsed * refillPerMs);
      b.last = t;
    }
    if (b.tokens >= 1){
      b.tokens -= 1;
      return { ok: true, retryAfterMs: 0, key, remaining: Math.floor(b.tokens) };
    }
    const need = 1 - b.tokens;
    const retryAfterMs = Math.ceil(need / refillPerMs);
    return { ok: false, retryAfterMs, key, remaining: 0 };
  }

  return { allow, capacity, windowMs };
}

module.exports = { createRateLimiter, clientIp, toPosInt };
