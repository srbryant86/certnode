const http = require('http');
const assert = require('assert');
const { 
  parseAllowedOrigins, 
  isOriginAllowed, 
  setCorsHeaders, 
  handlePreflight,
  createCorsMiddleware 
} = require('../src/plugins/cors');

function mockRequest(method = 'GET', headers = {}) {
  return {
    method,
    headers,
    url: '/test',
    on: () => {},
    removeAllListeners: () => {}
  };
}

function mockResponse() {
  let statusCode, headers = {}, body = '';
  return {
    writeHead: (code, hdrs) => { statusCode = code; Object.assign(headers, hdrs || {}); },
    setHeader: (name, value) => { headers[name] = value; },
    end: (data) => { body = data; },
    getStatus: () => statusCode,
    getHeaders: () => headers,
    getBody: () => body
  };
}

(async () => {
  console.log('Testing CORS functionality...');

  // Test 1: parseAllowedOrigins
  const origins1 = parseAllowedOrigins('https://example.com,https://test.org');
  assert.deepStrictEqual(origins1, ['https://example.com', 'https://test.org']);
  
  const origins2 = parseAllowedOrigins(' https://a.com , https://b.com ');
  assert.deepStrictEqual(origins2, ['https://a.com', 'https://b.com']);
  
  const origins3 = parseAllowedOrigins('');
  assert.deepStrictEqual(origins3, []);
  
  const origins4 = parseAllowedOrigins(null);
  assert.deepStrictEqual(origins4, []);
  console.log('✓ parseAllowedOrigins works correctly');

  // Test 2: isOriginAllowed
  const allowedOrigins = ['https://example.com', 'https://test.org'];
  assert.strictEqual(isOriginAllowed('https://example.com', allowedOrigins), true);
  assert.strictEqual(isOriginAllowed('https://evil.com', allowedOrigins), false);
  assert.strictEqual(isOriginAllowed(null, allowedOrigins), false);
  assert.strictEqual(isOriginAllowed('https://example.com', []), false);
  console.log('✓ isOriginAllowed works correctly');

  // Test 3: setCorsHeaders
  const res1 = mockResponse();
  const allowed1 = setCorsHeaders(res1, 'https://example.com', allowedOrigins);
  assert.strictEqual(allowed1, true);
  assert.strictEqual(res1.getHeaders()['Access-Control-Allow-Origin'], 'https://example.com');
  assert.strictEqual(res1.getHeaders()['Access-Control-Allow-Methods'], 'GET, POST, OPTIONS');
  assert.strictEqual(res1.getHeaders()['Vary'], 'Origin');

  const res2 = mockResponse();
  const allowed2 = setCorsHeaders(res2, 'https://evil.com', allowedOrigins);
  assert.strictEqual(allowed2, false);
  assert.strictEqual(res2.getHeaders()['Access-Control-Allow-Origin'], undefined);
  console.log('✓ setCorsHeaders works correctly');

  // Test 4: handlePreflight - allowed origin
  const req3 = mockRequest('OPTIONS', { origin: 'https://example.com' });
  const res3 = mockResponse();
  handlePreflight(req3, res3, allowedOrigins);
  assert.strictEqual(res3.getStatus(), 204);
  assert.strictEqual(res3.getHeaders()['Access-Control-Allow-Origin'], 'https://example.com');
  console.log('✓ handlePreflight allows valid origins');

  // Test 5: handlePreflight - blocked origin
  const req4 = mockRequest('OPTIONS', { origin: 'https://evil.com' });
  const res4 = mockResponse();
  handlePreflight(req4, res4, allowedOrigins);
  assert.strictEqual(res4.getStatus(), 403);
  const body4 = JSON.parse(res4.getBody());
  assert.strictEqual(body4.error, 'origin_not_allowed');
  console.log('✓ handlePreflight blocks invalid origins');

  // Test 6: handlePreflight - no origin header
  const req5 = mockRequest('OPTIONS', {});
  const res5 = mockResponse();
  handlePreflight(req5, res5, allowedOrigins);
  assert.strictEqual(res5.getStatus(), 204);
  console.log('✓ handlePreflight allows requests without origin');

  // Test 7: createCorsMiddleware integration - empty allowlist
  const originalEnv = process.env.API_ALLOWED_ORIGINS;
  delete process.env.API_ALLOWED_ORIGINS;
  
  const corsMiddleware1 = createCorsMiddleware();
  const req6 = mockRequest('GET', { origin: 'https://example.com' });
  const res6 = mockResponse();
  const result1 = corsMiddleware1(req6, res6);
  
  assert.notStrictEqual(result1, null); // Should block
  assert.strictEqual(res6.getStatus(), 403);
  console.log('✓ Empty allowlist blocks all origins');

  // Test 8: createCorsMiddleware integration - with allowlist
  process.env.API_ALLOWED_ORIGINS = 'https://example.com,https://test.org';
  
  const corsMiddleware2 = createCorsMiddleware();
  const req7 = mockRequest('GET', { origin: 'https://example.com' });
  const res7 = mockResponse();
  const result2 = corsMiddleware2(req7, res7);
  
  assert.strictEqual(result2, null); // Should continue
  assert.strictEqual(res7.getHeaders()['Access-Control-Allow-Origin'], 'https://example.com');
  console.log('✓ Valid allowlist allows specified origins');

  // Test 9: createCorsMiddleware integration - blocked origin
  const req8 = mockRequest('GET', { origin: 'https://evil.com' });
  const res8 = mockResponse();
  const result3 = corsMiddleware2(req8, res8);
  
  assert.notStrictEqual(result3, null); // Should block
  assert.strictEqual(res8.getStatus(), 403);
  console.log('✓ Valid allowlist blocks unspecified origins');

  // Test 10: createCorsMiddleware integration - OPTIONS preflight
  const req9 = mockRequest('OPTIONS', { origin: 'https://example.com' });
  const res9 = mockResponse();
  const result4 = corsMiddleware2(req9, res9);
  
  assert.notStrictEqual(result4, null); // Should handle preflight
  assert.strictEqual(res9.getStatus(), 204);
  console.log('✓ OPTIONS preflight handled correctly');

  // Test 11: No origin header should continue
  const req10 = mockRequest('GET', {});
  const res10 = mockResponse();
  const result5 = corsMiddleware2(req10, res10);
  
  assert.strictEqual(result5, null); // Should continue
  console.log('✓ Requests without origin header continue');

  // Cleanup
  if (originalEnv !== undefined) {
    process.env.API_ALLOWED_ORIGINS = originalEnv;
  } else {
    delete process.env.API_ALLOWED_ORIGINS;
  }

  console.log('All CORS tests passed ✓');
})().catch(e => {
  console.error('CORS test failed:', e.message);
  process.exit(1);
});