/* File: api/src/plugins/ratelimit.js
   Simple token-bucket per client (by X-Forwarded-For first IP, then socket.remoteAddress).
   Defaults: max=120 requests / 60s window; env overrides:
     - API_RATE_MAX (int)
     - API_RATE_WINDOW_MS (int, default 60000)
*/
function toPosInt(v, dflt){ const n=Number(v); return Number.isFinite(n)&&n>0?Math.floor(n):dflt; }

function defaultKey(req){
  const xf = req.headers && req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length){
    const first = xf.split(',')[0].trim();
    if (first) return first;
  }
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

/** Create a limiter.
 * opts: { max, windowMs, now?, keyFn? }
 * take(req) -> { ok:true, remaining, resetAt } | { ok:false, retryAfterSec, resetAt }
 */
function createRateLimiter(opts = {}){
  const max = toPosInt(process.env.API_RATE_MAX, toPosInt(opts.max, 120));
  const windowMs = toPosInt(process.env.API_RATE_WINDOW_MS, toPosInt(opts.windowMs, 60000));
  const nowFn = typeof opts.now === 'function' ? opts.now : () => Date.now();
  const keyFn = typeof opts.keyFn === 'function' ? opts.keyFn : defaultKey;
  const buckets = new Map();

  function take(req){
    const key = keyFn(req) || 'anon';
    const now = nowFn();
    let b = buckets.get(key);
    if (!b || now - b.start >= windowMs){
      b = { start: now, count: 1 };
      buckets.set(key, b);
      return { ok:true, remaining: max-1, resetAt: b.start + windowMs };
    }
    if (b.count < max){
      b.count += 1;
      return { ok:true, remaining: max - b.count, resetAt: b.start + windowMs };
    }
    const retryAfterMs = b.start + windowMs - now;
    return { ok:false, retryAfterSec: Math.max(1, Math.ceil(retryAfterMs/1000)), resetAt: b.start + windowMs };
  }

  return { take, _debug:{ buckets } };
}

module.exports = { createRateLimiter };
