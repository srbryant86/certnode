const http = require('http');
const assert = require('assert');

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  console.log('Testing CORS integration with server...');

  // Start server for testing
  const { execSync } = require('child_process');
  let serverProcess;
  
  try {
    // Kill any existing processes
    try { execSync('taskkill /F /IM node.exe'); } catch {}
    
    // Start server with CORS allowlist
    const { spawn } = require('child_process');
    serverProcess = spawn('node', ['src/index.js'], {
      env: { 
        ...process.env, 
        PORT: '3003',
        API_ALLOWED_ORIGINS: 'https://example.com,https://test.org',
        NODE_ENV: 'development',
        JWKS_JSON: '{"keys":[]}'
      },
      detached: false
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const baseOptions = {
      hostname: 'localhost',
      port: 3003,
      timeout: 5000
    };

    // Test 1: Health endpoint with allowed origin
    const health1 = await makeRequest({
      ...baseOptions,
      path: '/health',
      method: 'GET',
      headers: { 'Origin': 'https://example.com' }
    });
    
    assert.strictEqual(health1.statusCode, 200);
    assert.strictEqual(health1.headers['access-control-allow-origin'], 'https://example.com');
    console.log('✓ Health endpoint allows valid origin');

    // Test 2: Health endpoint with blocked origin
    const health2 = await makeRequest({
      ...baseOptions,
      path: '/health',
      method: 'GET',
      headers: { 'Origin': 'https://evil.com' }
    });
    
    assert.strictEqual(health2.statusCode, 403);
    const body2 = JSON.parse(health2.body);
    assert.strictEqual(body2.error, 'origin_not_allowed');
    console.log('✓ Health endpoint blocks invalid origin');

    // Test 3: OPTIONS preflight
    const preflight = await makeRequest({
      ...baseOptions,
      path: '/health',
      method: 'OPTIONS',
      headers: { 'Origin': 'https://example.com' }
    });
    
    assert.strictEqual(preflight.statusCode, 204);
    assert.strictEqual(preflight.headers['access-control-allow-origin'], 'https://example.com');
    assert.strictEqual(preflight.headers['access-control-allow-methods'], 'GET, POST, OPTIONS');
    console.log('✓ OPTIONS preflight works');

    // Test 4: Request without origin continues
    const noOrigin = await makeRequest({
      ...baseOptions,
      path: '/health',
      method: 'GET'
    });
    
    assert.strictEqual(noOrigin.statusCode, 200);
    console.log('✓ Requests without origin work');

    console.log('All CORS integration tests passed ✓');
    
  } catch (error) {
    console.error('CORS integration test failed:', error.message);
    process.exit(1);
  } finally {
    // Cleanup
    if (serverProcess) {
      serverProcess.kill();
    }
    try { execSync('taskkill /F /IM node.exe'); } catch {}
  }
})();