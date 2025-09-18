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

  const now = typeof opts.now === 'function' ? opts.now : () => Date.now();

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

  function take(req){
    const r = allow(req);
    return Object.assign({ retryAfterSec: Math.ceil((r.retryAfterMs || 0)/1000) }, r);
  }

  return { allow, take, capacity, windowMs };
}

module.exports = { createRateLimiter, clientIp, toPosInt };

/* Composite rate limiter (IP + API key + global)
   Lightweight in-memory token buckets for each dimension.
   API key is taken from Authorization: Bearer <token>.
*/
function getApiKey(req){
  const h = req && req.headers && req.headers['authorization'];
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(String(h));
  return m ? m[1] : null;
}

function createCompositeRateLimiter(opts = {}){
  const cfg = {
    ip: { max: toPosInt(process.env.RL_IP_MAX, 120), windowMs: toPosInt(process.env.RL_IP_WINDOW_MS, 60000) },
    key:{ max: toPosInt(process.env.RL_KEY_MAX, 1000), windowMs: toPosInt(process.env.RL_KEY_WINDOW_MS, 60000) },
    global:{ max: toPosInt(process.env.RL_GLOBAL_MAX, 10000), windowMs: toPosInt(process.env.RL_GLOBAL_WINDOW_MS, 60000) }
  };

  const ipLimiter = createRateLimiter({ max: cfg.ip.max, windowMs: cfg.ip.windowMs });
  const keyBuckets = createRateLimiter({ max: cfg.key.max, windowMs: cfg.key.windowMs });
  const globalLimiter = createRateLimiter({ max: cfg.global.max, windowMs: cfg.global.windowMs });

  function allow(req){
    const results = [];
    const ipRes = ipLimiter.allow(req); results.push({ dim:'ip', ...ipRes });
    const key = getApiKey(req) || 'anon';
    // emulate per-key bucket: use separate limiter instance keyed by API key -> for simplicity reuse token map key as IP
    // We’ll hack by temporarily overriding clientIp
    const saved = req.headers['x-forwarded-for'];
    if (key && key !== 'anon') req.headers['x-forwarded-for'] = key;
    const keyRes = keyBuckets.allow(req); results.push({ dim:'key', ...keyRes });
    if (saved !== undefined) req.headers['x-forwarded-for'] = saved; else delete req.headers['x-forwarded-for'];
    const globRes = globalLimiter.allow({ headers: { 'x-forwarded-for':'__global__' }, socket:{} });
    results.push({ dim:'global', ...globRes });

    // choose most restrictive
    const denied = results.find(r => !r.ok);
    if (denied) return { ok:false, retryAfterMs: denied.retryAfterMs, remaining: 0, dim: denied.dim, capacity: getCapacity(denied.dim) };
    const remaining = Math.min(...results.map(r => r.remaining));
    return { ok:true, retryAfterMs:0, remaining, dim:'all', capacity: Math.min(cfg.ip.max, cfg.key.max, cfg.global.max) };
  }

  function getCapacity(dim){
    if (dim==='ip') return cfg.ip.max;
    if (dim==='key') return cfg.key.max;
    if (dim==='global') return cfg.global.max;
    return Math.min(cfg.ip.max, cfg.key.max, cfg.global.max);
  }

  return { allow, capacity: Math.min(cfg.ip.max, cfg.key.max, cfg.global.max), windowMs: cfg.ip.windowMs };
}

module.exports.createCompositeRateLimiter = createCompositeRateLimiter;
