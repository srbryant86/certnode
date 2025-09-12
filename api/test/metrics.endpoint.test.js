const http = require('http');
const { getPrometheusMetrics, emit } = require('../src/plugins/metrics');
const { handle: metricsHandler } = require('../src/routes/metrics');

(async () => {
  // Simulate a completed request
  emit('request_completed', 1, { path: '/v1/sign', method: 'POST', status: 200, ms: 42 });

  // Invoke the metrics handler with a mock server
  const req = new http.IncomingMessage();
  req.method = 'GET';
  const res = new http.ServerResponse(req);

  let body = '';
  res.write = (chunk) => { body += chunk; return true; };
  res.end = (chunk) => { if (chunk) body += chunk; finished(); };

  function finished() {
    try {
      if (!body.includes('certnode_requests_total')) throw new Error('missing requests_total');
      if (!body.includes('certnode_request_duration_ms')) throw new Error('missing duration histogram');
      console.log('metrics.endpoint.test OK');
      process.exit(0);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }

  metricsHandler(req, res);
})();

