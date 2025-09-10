const http = require("http");
const { handle: signHandler } = require("./routes/sign");
const { createRateLimiter } = require("./plugins/ratelimit");

const port = process.env.PORT || 3000;
function toPosInt(v, d){ const n=Number(v); return Number.isFinite(n)&&n>0?Math.floor(n):d; }
const limiter = createRateLimiter({
  max: toPosInt(process.env.API_RATE_MAX, 120),
  windowMs: toPosInt(process.env.API_RATE_WINDOW_MS, 60_000)
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Health
  if (req.method === "GET" && (url.pathname === "/health" || url.pathname === "/v1/health")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true }));
  }

  // Sign with rate limit
  if (req.method === "POST" && url.pathname === "/v1/sign") {
    const hit = limiter.take(req);
    if (!hit.ok) {
      res.writeHead(429, {
        "Content-Type": "application/json",
        "Retry-After": String(hit.retryAfterSec || 1)
      });
      return res.end(JSON.stringify({ error: "rate_limited" }));
    }
    return signHandler(req, res);
  }

  // 404
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "not_found" }));
});

server.listen(port, () => console.log("Server on", port));
