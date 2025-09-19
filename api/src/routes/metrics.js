const { getPrometheusMetrics } = require('../plugins/metrics');
const { sendError } = require('../middleware/errorHandler');

function handle(req, res) {
  if (req.method !== 'GET') return sendError(res, req, 405, 'method_not_allowed', 'Only GET is allowed');
  const body = getPrometheusMetrics();
  res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

module.exports = { handle };
