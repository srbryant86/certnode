const { getCircuitState, getLastKmsError } = require('../aws/kms');

function handle(req, res) {
  if (req.method !== 'GET') {
    const headers = { 'Content-Type': 'application/json' };
    if (req && req.id) headers['X-Request-Id'] = req.id;
    const body = { error: 'method_not_allowed' };
    if (req && req.id) body.request_id = req.id;
    res.writeHead(405, headers);
    return res.end(JSON.stringify(body));
  }
  
  const uptime_s = Math.floor(process.uptime());
  const mode = process.env.KMS_MODE || 'local';
  const circuit = (typeof getCircuitState === 'function') ? getCircuitState() : { state: 'closed' };
  const last_kms_error = (typeof getLastKmsError === 'function') ? getLastKmsError() : null;
  const status = circuit.state === 'open' ? 'degraded' : 'ok';
  
  const body = { status, uptime_s, mode, circuit, last_kms_error };
  
  res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

module.exports = { handle };
