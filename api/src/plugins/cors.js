function parseAllowedOrigins(envVar) {
  if (!envVar) return [];
  return envVar.split(',').map(origin => origin.trim()).filter(Boolean);
}

function isOriginAllowed(origin, allowedOrigins) {
  if (!origin) return false;
  if (allowedOrigins.length === 0) {
    // Strict default: allow localhost in development only
    if ((process.env.NODE_ENV || 'development') !== 'development') return false;
    return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(origin);
  }
  return allowedOrigins.includes(origin);
}

function setCorsHeaders(req, res, origin, allowedOrigins) {
  // Allow same-origin by default when no explicit allowlist is configured
  let sameOriginAllowed = false;
  if (origin && (!allowedOrigins || allowedOrigins.length === 0)) {
    try {
      const oHost = new URL(origin).host;
      const reqHost = String(req.headers.host || '').toLowerCase();
      sameOriginAllowed = oHost.toLowerCase() === reqHost && !!reqHost;
    } catch {}
  }

  const isAllowed = isOriginAllowed(origin, allowedOrigins) || sameOriginAllowed;
  
  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Allow browsers to read usage/rate-limit/diagnostic headers
  res.setHeader('Access-Control-Expose-Headers', 'X-RateLimit-Limit, X-RateLimit-Remaining, X-Usage-Limit, X-Usage-Used, X-Usage-Remaining, X-Request-Id, Retry-After');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.setHeader('Vary', 'Origin');
  
  return isAllowed;
}

function handlePreflight(req, res, allowedOrigins) {
  const origin = req.headers.origin;
  const isAllowed = setCorsHeaders(req, res, origin, allowedOrigins);
  
  if (!isAllowed && origin) {
    const { sendError } = require('../middleware/errorHandler');
    return sendError(res, req, 403, 'origin_not_allowed', 'Origin not allowed');
  }
  
  res.writeHead(204);
  res.end();
}

function applyCors(req, res, allowedOrigins) {
  const origin = req.headers.origin;
  
  if (req.method === 'OPTIONS') {
    return handlePreflight(req, res, allowedOrigins);
  }
  
  const isAllowed = setCorsHeaders(req, res, origin, allowedOrigins);
  
  if (origin && !isAllowed) {
    const { sendError } = require('../middleware/errorHandler');
    return sendError(res, req, 403, 'origin_not_allowed', 'Origin not allowed');
  }
  
  return null; // Continue processing
}

function createCorsMiddleware() {
  const allowedOrigins = parseAllowedOrigins(process.env.API_ALLOWED_ORIGINS);
  
  return function corsMiddleware(req, res) {
    return applyCors(req, res, allowedOrigins);
  };
}

module.exports = { 
  createCorsMiddleware, 
  parseAllowedOrigins, 
  isOriginAllowed, 
  setCorsHeaders, 
  handlePreflight 
};
