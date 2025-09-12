//---------------------------------------------------------------------
// api/test/openapi.endpoint.test.js
// Unit tests for OpenAPI specification serving endpoint
const assert = require('assert');
const { handle, reloadSpec } = require('../src/routes/openapi');
const fs = require('fs');
const path = require('path');

// Mock request/response objects
function createMockReq(method = 'GET', pathname = '/openapi.json') {
  return { 
    method, 
    url: `http://localhost:3000${pathname}`,
    headers: { host: 'localhost:3000' } 
  };
}

function createMockRes() {
  let statusCode = 200;
  let headers = {};
  let body = '';
  
  return {
    writeHead: (code, hdrs) => {
      statusCode = code;
      if (hdrs) Object.assign(headers, hdrs);
    },
    end: (data) => { body = data; },
    statusCode: () => statusCode,
    headers: () => headers,
    body: () => body
  };
}

// Test: Basic OpenAPI spec serving
async function testBasicSpecServing() {
  console.log('Testing basic OpenAPI spec serving...');
  const req = createMockReq();
  const res = createMockRes();
  
  handle(req, res);
  
  const statusCode = res.statusCode();
  const responseBody = JSON.parse(res.body());
  const headers = res.headers();
  
  assert.strictEqual(statusCode, 200, 'Should return 200 for spec request');
  assert.strictEqual(headers['Content-Type'], 'application/json', 'Should have JSON content type');
  assert(typeof responseBody === 'object', 'Should return JSON object');
  assert.strictEqual(responseBody.openapi, '3.1.0', 'Should be OpenAPI 3.1.0 spec');
  assert(typeof responseBody.info === 'object', 'Should have info section');
  assert(typeof responseBody.paths === 'object', 'Should have paths section');
  
  console.log('✓ Basic spec serving test passed');
}

// Test: CORS headers
async function testCORSHeaders() {
  console.log('Testing CORS headers...');
  const req = createMockReq();
  const res = createMockRes();
  
  handle(req, res);
  
  const headers = res.headers();
  
  assert.strictEqual(headers['Access-Control-Allow-Origin'], '*', 'Should allow all origins');
  assert(headers['Access-Control-Allow-Methods'], 'Should have allowed methods');
  assert(headers['Access-Control-Allow-Headers'], 'Should have allowed headers');
  
  console.log('✓ CORS headers test passed');
}

// Test: OPTIONS preflight request
async function testOPTIONSPreflight() {
  console.log('Testing OPTIONS preflight request...');
  const req = createMockReq('OPTIONS');
  const res = createMockRes();
  
  handle(req, res);
  
  const statusCode = res.statusCode();
  const headers = res.headers();
  
  assert.strictEqual(statusCode, 200, 'Should return 200 for OPTIONS');
  assert(headers['Access-Control-Allow-Origin'], 'Should include CORS headers');
  
  console.log('✓ OPTIONS preflight test passed');
}

// Test: Method not allowed
async function testMethodNotAllowed() {
  console.log('Testing method not allowed...');
  const req = createMockReq('POST');
  const res = createMockRes();
  
  handle(req, res);
  
  const statusCode = res.statusCode();
  const responseBody = JSON.parse(res.body());
  
  assert.strictEqual(statusCode, 405, 'Should return 405 for unsupported methods');
  assert.strictEqual(responseBody.error, 'method_not_allowed', 'Should have correct error type');
  
  console.log('✓ Method not allowed test passed');
}

// Test: Cache headers
async function testCacheHeaders() {
  console.log('Testing cache headers...');
  const req = createMockReq();
  const res = createMockRes();
  
  handle(req, res);
  
  const headers = res.headers();
  
  assert(headers['Cache-Control'], 'Should have Cache-Control header');
  assert(headers['Cache-Control'].includes('public'), 'Should have public cache control');
  assert(headers['Cache-Control'].includes('max-age'), 'Should have max-age directive');
  
  console.log('✓ Cache headers test passed');
}

// Test: Both endpoint paths
async function testBothEndpointPaths() {
  console.log('Testing both endpoint paths...');
  
  // Test /openapi.json
  const req1 = createMockReq('GET', '/openapi.json');
  const res1 = createMockRes();
  handle(req1, res1);
  
  // Test /v1/openapi.json  
  const req2 = createMockReq('GET', '/v1/openapi.json');
  const res2 = createMockRes();
  handle(req2, res2);
  
  assert.strictEqual(res1.statusCode(), 200, '/openapi.json should work');
  assert.strictEqual(res2.statusCode(), 200, '/v1/openapi.json should work');
  
  const spec1 = JSON.parse(res1.body());
  const spec2 = JSON.parse(res2.body());
  
  assert.deepStrictEqual(spec1, spec2, 'Both endpoints should return same spec');
  
  console.log('✓ Both endpoint paths test passed');
}

// Test: Spec content validation
async function testSpecContentValidation() {
  console.log('Testing spec content validation...');
  const req = createMockReq();
  const res = createMockRes();
  
  handle(req, res);
  
  const responseBody = JSON.parse(res.body());
  
  // Validate key OpenAPI structure
  assert(responseBody.info.title, 'Should have API title');
  assert(responseBody.info.version, 'Should have API version');
  assert(responseBody.paths['/v1/sign'], 'Should have /v1/sign endpoint');
  assert(responseBody.paths['/health'] || responseBody.paths['/v1/health'], 'Should have health endpoint');
  
  // Check for required fields in sign endpoint
  const signPath = responseBody.paths['/v1/sign'];
  assert(signPath.post, 'Sign endpoint should have POST method');
  assert(signPath.post.requestBody, 'POST should have request body definition');
  assert(signPath.post.responses, 'POST should have response definitions');
  
  console.log('✓ Spec content validation test passed');
}

// Test: Spec reload functionality
async function testSpecReload() {
  console.log('Testing spec reload functionality...');
  
  const reloadedSpec = reloadSpec();
  
  if (reloadedSpec) {
    assert(typeof reloadedSpec === 'object', 'Reloaded spec should be an object');
    assert.strictEqual(reloadedSpec.openapi, '3.1.0', 'Reloaded spec should be valid OpenAPI 3.1.0');
    console.log('✓ Spec reload test passed');
  } else {
    console.log('⚠️  Spec reload returned null (spec file may not exist)');
  }
}

async function runAllTests() {
  try {
    await testBasicSpecServing();
    await testCORSHeaders();
    await testOPTIONSPreflight();
    await testMethodNotAllowed();
    await testCacheHeaders();
    await testBothEndpointPaths();
    await testSpecContentValidation();
    await testSpecReload();
    console.log('\nAll OpenAPI endpoint tests passed! ✅');
  } catch (error) {
    console.error('❌ OpenAPI endpoint test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runAllTests();
//---------------------------------------------------------------------