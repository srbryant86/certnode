const crypto = require('crypto');

// In-memory user storage (for MVP - would use database in production)
const users = new Map();
const apiKeys = new Map();

function generateApiKey(prefix = 'ck') {
  const random = crypto.randomBytes(32).toString('hex');
  return `${prefix}_${random}`;
}

function generateUserId() {
  return crypto.randomBytes(16).toString('hex');
}

function handle(req, res) {
  const { method, url } = req;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    });
    return res.end();
  }

  // User registration
  if (method === 'POST' && url === '/api/users/register') {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const userData = JSON.parse(body);
        const { name, email, company, plan = 'developer' } = userData;

        if (!name || !email) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            error: 'Name and email are required'
          }));
        }

        // Check if user already exists
        if (users.has(email)) {
          res.writeHead(409, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            error: 'User already exists'
          }));
        }

        // Create user
        const userId = generateUserId();
        const apiKey = generateApiKey('ck');
        const user = {
          id: userId,
          name,
          email,
          company,
          plan,
          apiKey,
          createdAt: new Date().toISOString(),
          usage: 0,
          limits: {
            developer: 1000,
            professional: 50000,
            business: 2000000
          }[plan] || 1000
        };

        users.set(email, user);
        apiKeys.set(apiKey, user);

        res.writeHead(201, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({
          success: true,
          user: {
            id: userId,
            name,
            email,
            company,
            plan,
            apiKey,
            createdAt: user.createdAt
          },
          message: 'Account created successfully'
        }));

      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Invalid JSON data'
        }));
      }
    });
    return;
  }

  // Get user by API key
  if (method === 'GET' && url.startsWith('/api/users/me')) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        error: 'Authorization header required'
      }));
    }

    const apiKey = authHeader.split(' ')[1];
    const user = apiKeys.get(apiKey);

    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        error: 'Invalid API key'
      }));
    }

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company,
        plan: user.plan,
        createdAt: user.createdAt,
        usage: user.usage,
        limit: user.limits
      }
    }));
    return;
  }

  // Not found
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'User endpoint not found'
  }));
}

module.exports = { handle, users, apiKeys };