//---------------------------------------------------------------------
// api/src/routes/health.js
// Enhanced health endpoint with dependency checks
const { createSigner } = require('../crypto/signer');

async function checkKMS() {
  try {
    // Quick KMS connectivity check - try to get public key
    const signer = createSigner();
    if (signer.type === 'kms') {
      // Test KMS connectivity without signing
      const publicKey = await signer.getPublicKey();
      return { ok: true, type: 'kms', hasPublicKey: !!publicKey };
    }
    return { ok: true, type: 'local', mode: 'development' };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function handle(req, res) {
  const startTime = Date.now();
  
  try {
    // Basic health check
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      node: process.version,
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    };

    // Check KMS dependency
    const kmsCheck = await checkKMS();
    health.dependencies = {
      kms: kmsCheck
    };

    // Overall health status
    const allDepsOk = kmsCheck.ok;
    if (!allDepsOk) {
      health.status = 'degraded';
      res.writeHead(503, { 'Content-Type': 'application/json' });
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
    }

    health.responseTime = Date.now() - startTime;
    res.end(JSON.stringify(health, null, 2));

  } catch (error) {
    const errorHealth = {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      responseTime: Date.now() - startTime
    };
    
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(errorHealth, null, 2));
  }
}

module.exports = { handle };
//---------------------------------------------------------------------