const { loadLocalJwks } = require('../util/jwks');

async function handle(req, res) {
  if (process.env.NODE_ENV === 'production') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'not_available_in_production' }));
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'method_not_allowed' }));
  }

  try {
    const jwks = loadLocalJwks();
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300'
    });
    res.end(JSON.stringify(jwks));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'jwks_unavailable' }));
  }
}

module.exports = { handle };