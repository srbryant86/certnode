const { loadLocalJwks } = require('../util/jwks');
const { sendError } = require('../middleware/errorHandler');

async function handle(req, res) {

  if (req.method !== 'GET') return sendError(res, req, 405, 'method_not_allowed', 'Only GET is allowed');

  try {
    const jwks = loadLocalJwks();
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300'
    });
    res.end(JSON.stringify(jwks));
  } catch (e) {
    return sendError(res, req, 500, 'jwks_unavailable', 'JWKS not available');
  }
}

module.exports = { handle };
