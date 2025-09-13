const { loadLocalJwks } = require('../util/jwks');

async function handle(req, res) {
  if (process.env.NODE_ENV === 'production') {
    const body = { error: 'not_available_in_production' };
    if (req && req.id) body.request_id = req.id;
    res.writeHead(404, { 'Content-Type': 'application/json', ...(req?.id ? { 'X-Request-Id': req.id } : {}) });
    return res.end(JSON.stringify(body));
  }

  if (req.method !== 'GET') {
    const body = { error: 'method_not_allowed' };
    if (req && req.id) body.request_id = req.id;
    res.writeHead(405, { 'Content-Type': 'application/json', ...(req?.id ? { 'X-Request-Id': req.id } : {}) });
    return res.end(JSON.stringify(body));
  }

  try {
    const jwks = loadLocalJwks();
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300'
    });
    res.end(JSON.stringify(jwks));
  } catch (e) {
    const body = { error: 'jwks_unavailable' };
    if (req && req.id) body.request_id = req.id;
    res.writeHead(500, { 'Content-Type': 'application/json', ...(req?.id ? { 'X-Request-Id': req.id } : {}) });
    res.end(JSON.stringify(body));
  }
}

module.exports = { handle };
