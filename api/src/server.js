const http = require("http");
const { handle: signHandler } = require("./routes/sign");
const { handle: jwksHandler } = require("./routes/jwks");
const { handle: healthHandler } = require("./routes/health");
const { handle: openapiHandler } = require("./routes/openapi");
const { handle: metricsHandler } = require("./routes/metrics");
const { createRateLimiter, toPosInt } = require("./plugins/ratelimit");
const { createCorsMiddleware } = require("./plugins/cors");
const { setupGlobalErrorHandlers, createErrorMiddleware, asyncHandler } = require("./middleware/errorHandler");
const { securityHeaders } = require("./plugins/security");
const { attach } = require("./plugins/requestId");
const { emit } = require("./plugins/metrics");

const port = process.env.PORT || 3000;
const limiter = createRateLimiter({
  max:  toPosInt(process.env.API_RATE_LIMIT_MAX, 120),
  windowMs: toPosInt(process.env.API_RATE_LIMIT_WINDOW_MS, 60000)
});
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

  // health
  if (req.method === "GET" && (url.pathname === "/health" || url.pathname === "/v1/health")) {
    return healthHandler(req, res);
  }

  // healthz
  if (req.method === "GET" && url.pathname === "/healthz") {
    return healthHandler(req, res);
  }

  // /v1/sign with rate limit
  if (req.method === "POST" && url.pathname === "/v1/sign") {
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
      const body = { error: "rate_limited", retry_after_ms: gate.retryAfterMs };
      if (req && req.id) body.request_id = req.id;
      return res.end(JSON.stringify(body));
    }
    emit('request_received', 1, { path: url.pathname, method: req.method, request_id: req.id });
    return signHandler(req, res);
  }

  // jwks (dev-only)
  if (req.method === "GET" && (url.pathname === "/jwks" || url.pathname === "/.well-known/jwks.json")) {
    return jwksHandler(req, res);
  }

  // openapi spec
  if ((req.method === "GET" || req.method === "OPTIONS") && 
      (url.pathname === "/openapi.json" || url.pathname === "/v1/openapi.json")) {
    return openapiHandler(req, res);
  }

  // /metrics (Prometheus)
  if (req.method === "GET" && url.pathname === "/metrics") {
    return metricsHandler(req, res);
  }

  // 404
  {
    const headers = { "Content-Type": "application/json" };
    if (req && req.id) headers['X-Request-Id'] = req.id;
    const body = { error: "not_found" };
    if (req && req.id) body.request_id = req.id;
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
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "internal_error" }));
      }
    }
  }
});

server.listen(port, () => console.log("Server on", port));
