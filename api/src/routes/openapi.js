//---------------------------------------------------------------------
// api/src/routes/openapi.js
// OpenAPI 3.1 specification serving endpoint
const fs = require('fs');
const path = require('path');

// Cache the OpenAPI spec in memory
let cachedSpec = null;
let specLoadTime = null;

function loadOpenAPISpec() {
  const specPath = path.join(__dirname, '../../../web/openapi.json');
  
  try {
    const specContent = fs.readFileSync(specPath, 'utf8');
    const spec = JSON.parse(specContent);
    
    // Add runtime server information if available
    if (process.env.API_BASE_URL) {
      spec.servers = spec.servers || [];
      // Add runtime server to beginning of list
      spec.servers.unshift({
        url: process.env.API_BASE_URL,
        description: 'Runtime server'
      });
    }
    
    cachedSpec = spec;
    specLoadTime = Date.now();
    return spec;
    
  } catch (error) {
    console.error('Failed to load OpenAPI spec:', error.message);
    return null;
  }
}

// Initialize spec on module load
loadOpenAPISpec();

function handle(req, res) {
  try {
    // Check if we need to reload the spec (in development)
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const shouldReload = isDevelopment && (!specLoadTime || Date.now() - specLoadTime > 5000); // 5s cache in dev
    
    if (!cachedSpec || shouldReload) {
      loadOpenAPISpec();
    }
    
    if (!cachedSpec) {
      const headers = { 'Content-Type': 'application/json' };
      if (req && req.id) headers['X-Request-Id'] = req.id;
      const body = { error: 'spec_unavailable', message: 'OpenAPI specification could not be loaded' };
      if (req && req.id) body.request_id = req.id;
      res.writeHead(503, headers);
      return res.end(JSON.stringify(body));
    }
    
    // Add cache headers
    const maxAge = isDevelopment ? 300 : 3600; // 5 min dev, 1 hour prod
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${maxAge}`,
      'Access-Control-Allow-Origin': '*', // Allow CORS for spec access
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(200, headers);
      return res.end();
    }
    
    if (req.method !== 'GET') {
      const headers = { 'Content-Type': 'application/json' };
      if (req && req.id) headers['X-Request-Id'] = req.id;
      const body = { error: 'method_not_allowed', message: 'Only GET and OPTIONS methods are supported' };
      if (req && req.id) body.request_id = req.id;
      res.writeHead(405, headers);
      return res.end(JSON.stringify(body));
    }
    
    res.writeHead(200, headers);
    res.end(JSON.stringify(cachedSpec, null, 2));
    
  } catch (error) {
    console.error('Error serving OpenAPI spec:', error);
    const headers = { 'Content-Type': 'application/json' };
    if (req && req.id) headers['X-Request-Id'] = req.id;
    const body = { error: 'internal_error', message: 'Failed to serve OpenAPI specification' };
    if (req && req.id) body.request_id = req.id;
    res.writeHead(500, headers);
    res.end(JSON.stringify(body));
  }
}

// Reload spec manually (useful for testing)
function reloadSpec() {
  return loadOpenAPISpec();
}

module.exports = { handle, reloadSpec };
//---------------------------------------------------------------------
