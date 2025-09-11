const http = require('http');
const assert = require('assert');
const { handle: jwksHandler } = require('../src/routes/jwks');

function mockRequest(method = 'GET', url = '/jwks') {
  return {
    method,
    url,
    headers: { host: 'localhost:3000' },
    on: () => {},
    removeAllListeners: () => {}
  };
}

function mockResponse() {
  let statusCode, headers = {}, body = '';
  return {
    writeHead: (code, hdrs) => { statusCode = code; Object.assign(headers, hdrs || {}); },
    end: (data) => { body = data; },
    getStatus: () => statusCode,
    getHeaders: () => headers,
    getBody: () => body
  };
}

// Helper to create a minimal test JWKS
function createTestJwks() {
  return {
    keys: [
      {
        kty: 'EC',
        crv: 'P-256',
        x: 'WKn-ZIGevcwGIyyrzFoZNBdaq9_TsqzGHwHitJBcBmY',
        y: 'y77As5vbZcmvxPZMNKhzJh0BEn7mPBw4L8_qJHW9xXI',
        kid: 'test-key-1'
      }
    ]
  };
}

(async () => {
  console.log('Testing JWKS route...');

  // Test 1: Production mode should return 404
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  
  const req1 = mockRequest('GET', '/jwks');
  const res1 = mockResponse();
  await jwksHandler(req1, res1);
  
  assert.strictEqual(res1.getStatus(), 404, 'Should return 404 in production');
  assert.strictEqual(res1.getHeaders()['Content-Type'], 'application/json');
  const body1 = JSON.parse(res1.getBody());
  assert.strictEqual(body1.error, 'not_available_in_production');
  console.log('✓ Production mode returns 404');

  // Test 2: Non-production mode with method not allowed
  process.env.NODE_ENV = 'development';
  
  const req2 = mockRequest('POST', '/jwks');
  const res2 = mockResponse();
  await jwksHandler(req2, res2);
  
  assert.strictEqual(res2.getStatus(), 405, 'Should return 405 for non-GET');
  const body2 = JSON.parse(res2.getBody());
  assert.strictEqual(body2.error, 'method_not_allowed');
  console.log('✓ POST method returns 405');

  // Test 3: Non-production mode with valid GET and JWKS_JSON env
  const testJwks = createTestJwks();
  process.env.JWKS_JSON = JSON.stringify(testJwks);
  
  const req3 = mockRequest('GET', '/jwks');
  const res3 = mockResponse();
  await jwksHandler(req3, res3);
  
  assert.strictEqual(res3.getStatus(), 200, 'Should return 200 with valid JWKS');
  assert.strictEqual(res3.getHeaders()['Content-Type'], 'application/json');
  assert.strictEqual(res3.getHeaders()['Cache-Control'], 'public, max-age=300');
  const body3 = JSON.parse(res3.getBody());
  assert.deepStrictEqual(body3, testJwks);
  console.log('✓ Development mode returns JWKS');

  // Test 4: Error handling when JWKS unavailable
  delete process.env.JWKS_JSON;
  delete process.env.JWKS_PATH;
  
  const req4 = mockRequest('GET', '/jwks');
  const res4 = mockResponse();
  await jwksHandler(req4, res4);
  
  assert.strictEqual(res4.getStatus(), 500, 'Should return 500 when JWKS unavailable');
  const body4 = JSON.parse(res4.getBody());
  assert.strictEqual(body4.error, 'jwks_unavailable');
  console.log('✓ Missing JWKS returns 500');

  // Test 5: Well-known path works too
  process.env.JWKS_JSON = JSON.stringify(testJwks);
  
  const req5 = mockRequest('GET', '/.well-known/jwks.json');
  const res5 = mockResponse();
  await jwksHandler(req5, res5);
  
  assert.strictEqual(res5.getStatus(), 200, 'Should work for well-known path');
  const body5 = JSON.parse(res5.getBody());
  assert.deepStrictEqual(body5, testJwks);
  console.log('✓ Well-known path works');

  // Cleanup
  process.env.NODE_ENV = originalEnv;
  delete process.env.JWKS_JSON;

  console.log('All JWKS route tests passed ✓');
})().catch(e => {
  console.error('JWKS route test failed:', e.message);
  process.exit(1);
});