const { getPrometheusMetrics } = require('../plugins/metrics');

function handle(req, res) {
  if (req.method !== 'GET') {
    const headers = { 'Content-Type': 'application/json' };
    if (req && req.id) headers['X-Request-Id'] = req.id;
    const body = { error: 'method_not_allowed' };
    if (req && req.id) body.request_id = req.id;
    res.writeHead(405, headers);
    return res.end(JSON.stringify(body));
  }
  const body = getPrometheusMetrics();
  res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

module.exports = { handle };
