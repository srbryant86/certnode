const http = require("http");
const { handle: signHandler } = require("./routes/sign");
const { handle: jwksHandler } = require("./routes/jwks");
const { handle: healthHandler } = require("./routes/health");
const { createRateLimiter, toPosInt } = require("./plugins/ratelimit");
const { createCorsMiddleware } = require("./plugins/cors");

const port = process.env.PORT || 3000;
const limiter = createRateLimiter({
  max:  toPosInt(process.env.API_RATE_LIMIT_MAX, 120),
  windowMs: toPosInt(process.env.API_RATE_LIMIT_WINDOW_MS, 60000)
});
const corsMiddleware = createCorsMiddleware();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Apply CORS middleware first
  const corsResult = corsMiddleware(req, res);
  if (corsResult !== null) {
    return; // CORS middleware handled the request (preflight or blocked)
  }

  // health
  if (req.method === "GET" && (url.pathname === "/health" || url.pathname === "/v1/health")) {
    return healthHandler(req, res);
  }

  // /v1/sign with rate limit
  if (req.method === "POST" && url.pathname === "/v1/sign") {
    const gate = limiter.allow(req);
    if (!gate.ok) {
      const retrySec = Math.ceil(gate.retryAfterMs/1000);
      res.writeHead(429, {
        "Content-Type": "application/json",
        "Retry-After": String(retrySec),
        "X-RateLimit-Limit": String(limiter.capacity),
        "X-RateLimit-Remaining": String(gate.remaining),
        "X-RateLimit-WindowMs": String(limiter.windowMs)
      });
      return res.end(JSON.stringify({ error: "rate_limited", retry_after_ms: gate.retryAfterMs }));
    }
    return signHandler(req, res);
  }

  // jwks (dev-only)
  if (req.method === "GET" && (url.pathname === "/jwks" || url.pathname === "/.well-known/jwks.json")) {
    return jwksHandler(req, res);
  }

  // 404
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "not_found" }));
});

server.listen(port, () => console.log("Server on", port));
