const { randomBytes } = require('crypto');

function isSafe(id) {
  return typeof id === 'string' && /^[A-Za-z0-9._-]{6,64}$/.test(id);
}

function newId() {
  return `req_${Date.now().toString(36)}_${randomBytes(6).toString('hex')}`;
}

function attach(req, res) {
  let id = req.headers['x-request-id'] || req.headers['x-correlation-id'];
  
  if (!isSafe(id)) {
    id = newId();
  }
  
  req.id = id;
  if (res && res.setHeader) {
    res.setHeader('X-Request-Id', id);
  }
  
  return id;
}

module.exports = { isSafe, newId, attach };