const http = require("http");
const { handle: signHandler } = require("./routes/sign");
const { handle: jwksHandler } = require("./routes/jwks");
const { handle: healthHandler } = require("./routes/health");
const { handle: openapiHandler } = require("./routes/openapi");
const { handle: metricsHandler } = require("./routes/metrics");
const { createCompositeRateLimiter, toPosInt } = require("./plugins/ratelimit");
const { createCorsMiddleware } = require("./plugins/cors");
const { setupGlobalErrorHandlers, createErrorMiddleware, asyncHandler } = require("./middleware/errorHandler");
const { securityHeaders } = require("./plugins/security");
const { attach } = require("./plugins/requestId");
const { emit } = require("./plugins/metrics");

const port = process.env.PORT || 3000;
const limiter = createCompositeRateLimiter({});
const corsMiddleware = createCorsMiddleware();
const errorMiddleware = createErrorMiddleware();

// Setup global error handlers
setupGlobalErrorHandlers();

const server = http.createServer(async (req, res) => {
  const t0 = Date.now();
  let pathname = null;
  // Attach request ID first
  attach(req, res);
  
  // Apply security headers first
  securityHeaders(req, res);
  
  // Apply error middleware first
  errorMiddleware(req, res);
  
  // Emit completion metric once per request
  res.once('finish', () => {
    try {
      const pathOut = pathname || (req.url || '');
      emit('request_completed', 1, { path: pathOut, method: req.method, status: res.statusCode || 0, ms: Date.now() - t0, request_id: req.id });
    } catch (_) {}
  });

  try {
  const url = new URL(req.url, `http://${req.headers.host}`);
  pathname = url.pathname;

  // Apply CORS middleware first
  const corsResult = corsMiddleware(req, res);
  if (corsResult !== null) {
    return; // CORS middleware handled the request (preflight or blocked)
  }

  // health (with /api prefix support for Vercel)
  if (req.method === "GET" && (url.pathname === "/health" || url.pathname === "/v1/health" || url.pathname === "/api/health" || url.pathname === "/api/v1/health")) {
    return healthHandler(req, res);
  }

  // healthz
  if (req.method === "GET" && (url.pathname === "/healthz" || url.pathname === "/api/healthz")) {
    return healthHandler(req, res);
  }

  // /v1/sign with rate limit
  if (req.method === "POST" && (url.pathname === "/v1/sign" || url.pathname === "/api/v1/sign")) {
    const gate = limiter.allow(req);
    if (!gate.ok) {
      const retrySec = Math.ceil(gate.retryAfterMs/1000);
      const headers = {
        "Content-Type": "application/json",
        "Retry-After": String(retrySec),
        "X-RateLimit-Limit": String(limiter.capacity),
        "X-RateLimit-Remaining": String(gate.remaining),
        "X-RateLimit-WindowMs": String(limiter.windowMs)
      };
      if (req && req.id) headers['X-Request-Id'] = req.id;
      res.writeHead(429, headers);
      emit('rate_limit_triggered', 1, { path: url.pathname, capacity: limiter.capacity, remaining: gate.remaining, request_id: req.id });
      const body = { error: "rate_limited", message: 'rate limited', retry_after_ms: gate.retryAfterMs, timestamp: new Date().toISOString() };
      if (req && req.id) body.request_id = req.id;
      return res.end(JSON.stringify(body));
    }
    emit('request_received', 1, { path: url.pathname, method: req.method, request_id: req.id });
    return signHandler(req, res);
  }

  // jwks (public)
  if (req.method === "GET" && (url.pathname === "/jwks" || url.pathname === "/.well-known/jwks.json" || url.pathname === "/api/jwks" || url.pathname === "/api/.well-known/jwks.json")) {
    return jwksHandler(req, res);
  }

  // key rotation log
  if (req.method === "GET" && url.pathname === "/trust/keys.jsonl") {
    const { handle: keysHandler } = require("./routes/keys");
    return keysHandler(req, res);
  }

  // openapi spec
  if ((req.method === "GET" || req.method === "OPTIONS") &&
      (url.pathname === "/openapi.json" || url.pathname === "/v1/openapi.json" || url.pathname === "/api/openapi.json" || url.pathname === "/api/v1/openapi.json")) {
    return openapiHandler(req, res);
  }

  // /metrics (Prometheus)
  if (req.method === "GET" && (url.pathname === "/metrics" || url.pathname === "/api/metrics")) {
    return metricsHandler(req, res);
  }

  // Analytics dashboard (internal use)
  if (req.method === "GET" && url.pathname === "/api/analytics") {
    const { getAnalyticsDashboard } = require("./plugins/customer-analytics");
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    };
    res.writeHead(200, headers);
    return res.end(JSON.stringify(getAnalyticsDashboard(), null, 2));
  }

  // Lead tracking endpoint
  if (req.method === "POST" && url.pathname === "/api/track-lead") {
    const { handle: leadsHandler } = require("./routes/leads");
    return leadsHandler(req, res);
  }

  // Billing endpoints
  if (url.pathname.startsWith("/api/") && (
    url.pathname === "/api/create-checkout" ||
    url.pathname === "/api/create-portal" ||
    url.pathname === "/api/pricing" ||
    url.pathname === "/api/account"
  )) {
    const { handle: billingHandler } = require("./routes/billing");
    return billingHandler(req, res);
  }

  // Stripe webhook (no CORS, raw body)
  if (req.method === "POST" && (url.pathname === "/stripe-webhook" || url.pathname === "/api/stripe/webhook")) {
    const { handle: billingHandler } = require("./routes/billing");
    return billingHandler(req, res);
  }

  // Static file serving
  if (req.method === "GET") {
    const fs = require('fs');
    const path = require('path');

    let filePath;
    if (url.pathname === "/") {
      filePath = path.join(process.cwd(), "web", "index.html");
    } else if (url.pathname === "/verify") {
      filePath = path.join(process.cwd(), "web", "verify.html");
    } else if (url.pathname === "/openapi") {
      filePath = path.join(process.cwd(), "public", "openapi.html");
    } else if (url.pathname === "/pricing") {
      filePath = path.join(process.cwd(), "web", "pricing.html");
    } else if (url.pathname === "/account") {
      filePath = path.join(process.cwd(), "web", "account.html");
    } else if (url.pathname === "/compliance-calculator") {
      filePath = path.join(process.cwd(), "web", "compliance-calculator.html");
    } else if (url.pathname === "/pitch") {
      filePath = path.join(process.cwd(), "web", "pitch.html");
    } else if (url.pathname === "/trust") {
      filePath = path.join(process.cwd(), "public", "trust", "index.html");
    } else if (url.pathname === "/status") {
      filePath = path.join(process.cwd(), "public", "status", "index.html");
    } else if (url.pathname === "/usage") {
      filePath = path.join(process.cwd(), "public", "usage", "index.html");
    } else if (url.pathname === "/test-vectors") {
      filePath = path.join(process.cwd(), "public", "test-vectors", "index.html");
    } else if (url.pathname.startsWith("/web/")) {
      const rel = url.pathname.replace(/^\/+/, '');
      filePath = path.join(process.cwd(), rel);
    } else if (url.pathname.startsWith("/assets/")) {
      filePath = path.join(process.cwd(), "web", "assets", path.basename(url.pathname));
    } else if (url.pathname.startsWith("/css/")) {
      filePath = path.join(process.cwd(), "web", "css", path.basename(url.pathname));
    } else if (url.pathname.startsWith("/js/")) {
      filePath = path.join(process.cwd(), "web", "js", path.basename(url.pathname));
    }

    if (filePath && fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      let contentType = "text/html";
      if (ext === ".js") contentType = "application/javascript";
      if (ext === ".css") contentType = "text/css";
      if (ext === ".json") contentType = "application/json";
      if (ext === ".png") contentType = "image/png";
      if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      if (ext === ".svg") contentType = "image/svg+xml";

      try {
        let content = fs.readFileSync(filePath);
        const headers = { "Content-Type": contentType };
        // Simple caching strategy for local/static serve
        const cacheMap = {
          ".css": "public, max-age=31536000, immutable",
          ".js":  "public, max-age=31536000, immutable",
          ".png": "public, max-age=31536000, immutable",
          ".jpg": "public, max-age=31536000, immutable",
          ".jpeg":"public, max-age=31536000, immutable",
          ".svg": "public, max-age=31536000, immutable",
          ".html":"public, max-age=3600"
        };
        if (cacheMap[ext]) headers['Cache-Control'] = cacheMap[ext];
        // Gzip compression for text assets when accepted
        const ae = String(req.headers['accept-encoding']||'');
        const isText = /^(text\/|application\/(javascript|json|xml))/.test(headers['Content-Type']);
        if (ae.includes('gzip') && isText) {
          const zlib = require('zlib');
          content = zlib.gzipSync(content);
          headers['Content-Encoding'] = 'gzip';
        }
        res.writeHead(200, headers);
        return res.end(content);
      } catch (e) {
        // Fall through to 404
      }
    }
  }

  // 404
  {
    const headers = { "Content-Type": "application/json" };
    if (req && req.id) headers['X-Request-Id'] = req.id;
    const body = { error: "not_found", message: 'route not found', timestamp: new Date().toISOString(), ...(req && req.id ? { request_id: req.id } : {}) };
    res.writeHead(404, headers);
    res.end(JSON.stringify(body));
  }
  emit('request_completed', 1, { path: url.pathname, method: req.method, status: 404, ms: Date.now() - t0, request_id: req.id });
  
  } catch (error) {
    // Use the error handler attached to response
    if (res.handleError) {
      res.handleError(error);
    } else {
      console.error('Unhandled server error:', error);
      if (!res.headersSent) {
        const headers = { "Content-Type": "application/json" };
        if (req && req.id) headers['X-Request-Id'] = req.id;
        const body = { error: 'internal_error', message: 'Internal server error', timestamp: new Date().toISOString(), ...(req && req.id ? { request_id: req.id } : {}) };
        res.writeHead(500, headers);
        res.end(JSON.stringify(body));
      }
    }
  }
});

server.listen(port, () => console.log("Server on", port));
