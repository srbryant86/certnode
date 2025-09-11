function parseAllowedOrigins(envVar) {
  if (!envVar) return [];
  return envVar.split(',').map(origin => origin.trim()).filter(Boolean);
}

function isOriginAllowed(origin, allowedOrigins) {
  if (!origin) return false;
  if (allowedOrigins.length === 0) return false;
  return allowedOrigins.includes(origin);
}

function setCorsHeaders(res, origin, allowedOrigins) {
  const isAllowed = isOriginAllowed(origin, allowedOrigins);
  
  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.setHeader('Vary', 'Origin');
  
  return isAllowed;
}

function handlePreflight(req, res, allowedOrigins) {
  const origin = req.headers.origin;
  const isAllowed = setCorsHeaders(res, origin, allowedOrigins);
  
  if (!isAllowed && origin) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'origin_not_allowed' }));
  }
  
  res.writeHead(204);
  res.end();
}

function applyCors(req, res, allowedOrigins) {
  const origin = req.headers.origin;
  
  if (req.method === 'OPTIONS') {
    return handlePreflight(req, res, allowedOrigins);
  }
  
  const isAllowed = setCorsHeaders(res, origin, allowedOrigins);
  
  if (origin && !isAllowed) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'origin_not_allowed' }));
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