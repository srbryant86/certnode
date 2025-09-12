//---------------------------------------------------------------------
// api/test/errorHandler.test.js
// Unit tests for error handling middleware
const assert = require('assert');
const { createErrorHandler, createErrorMiddleware, asyncHandler } = require('../src/middleware/errorHandler');

// Mock request/response objects
function createMockReq(method = 'GET', url = '/test') {
  return { method, url, headers: { host: 'localhost:3000' } };
}

function createMockRes() {
  let statusCode = 200;
  let headers = {};
  let body = '';
  let headersSent = false;
  
  return {
    writeHead: (code, hdrs) => {
      statusCode = code;
      if (hdrs) Object.assign(headers, hdrs);
    },
    end: (data) => { 
      body = data;
      headersSent = true;
    },
    get headersSent() { return headersSent },
    statusCode: () => statusCode,
    headers: () => headers,
    body: () => body
  };
}

// Test: Basic error handler structure
async function testBasicErrorHandling() {
  console.log('Testing basic error handling...');
  const errorHandler = createErrorHandler();
  const req = createMockReq();
  const res = createMockRes();
  
  const testError = new Error('Test error message');
  errorHandler(testError, req, res);
  
  const statusCode = res.statusCode();
  const responseBody = JSON.parse(res.body());
  
  assert.strictEqual(statusCode, 500, 'Should return 500 for generic errors');
  assert.strictEqual(responseBody.error, 'internal_error', 'Should have error type');
  assert(typeof responseBody.message === 'string', 'Should have error message');
  assert(typeof responseBody.timestamp === 'string', 'Should have timestamp');
  
  console.log('✓ Basic error handling test passed');
}

// Test: JSON parsing error handling
async function testJSONParsingError() {
  console.log('Testing JSON parsing error handling...');
  const errorHandler = createErrorHandler();
  const req = createMockReq('POST', '/v1/sign');
  const res = createMockRes();
  
  const syntaxError = new SyntaxError('Unexpected token } in JSON at position 10');
  errorHandler(syntaxError, req, res);
  
  const statusCode = res.statusCode();
  const responseBody = JSON.parse(res.body());
  
  assert.strictEqual(statusCode, 400, 'Should return 400 for JSON syntax errors');
  assert.strictEqual(responseBody.error, 'invalid_json', 'Should identify JSON syntax error');
  
  console.log('✓ JSON parsing error test passed');
}

// Test: Service unavailable error handling  
async function testServiceUnavailableError() {
  console.log('Testing service unavailable error handling...');
  const errorHandler = createErrorHandler();
  const req = createMockReq();
  const res = createMockRes();
  
  const connError = new Error('Connection refused');
  connError.code = 'ECONNREFUSED';
  errorHandler(connError, req, res);
  
  const statusCode = res.statusCode();
  const responseBody = JSON.parse(res.body());
  
  assert.strictEqual(statusCode, 503, 'Should return 503 for connection errors');
  assert.strictEqual(responseBody.error, 'service_unavailable', 'Should identify service unavailable');
  
  console.log('✓ Service unavailable error test passed');
}

// Test: Timeout error handling
async function testTimeoutError() {
  console.log('Testing timeout error handling...');
  const errorHandler = createErrorHandler();
  const req = createMockReq();
  const res = createMockRes();
  
  const timeoutError = new Error('Request timeout');
  timeoutError.code = 'TIMEOUT';
  errorHandler(timeoutError, req, res);
  
  const statusCode = res.statusCode();
  const responseBody = JSON.parse(res.body());
  
  assert.strictEqual(statusCode, 504, 'Should return 504 for timeout errors');
  assert.strictEqual(responseBody.error, 'timeout', 'Should identify timeout error');
  
  console.log('✓ Timeout error test passed');
}

// Test: Validation error handling
async function testValidationError() {
  console.log('Testing validation error handling...');
  const errorHandler = createErrorHandler();
  const req = createMockReq();
  const res = createMockRes();
  
  const validationError = new Error('Field is required');
  validationError.name = 'ValidationError';
  errorHandler(validationError, req, res);
  
  const statusCode = res.statusCode();
  const responseBody = JSON.parse(res.body());
  
  assert.strictEqual(statusCode, 400, 'Should return 400 for validation errors');
  assert.strictEqual(responseBody.error, 'validation_error', 'Should identify validation error');
  
  console.log('✓ Validation error test passed');
}

// Test: Error middleware integration
async function testErrorMiddleware() {
  console.log('Testing error middleware integration...');
  const errorMiddleware = createErrorMiddleware();
  const req = createMockReq();
  const res = createMockRes();
  
  let middlewareCalled = false;
  errorMiddleware(req, res, () => { middlewareCalled = true; });
  
  assert(middlewareCalled, 'Middleware should call next()');
  assert(typeof res.handleError === 'function', 'Should attach error handler to response');
  
  console.log('✓ Error middleware test passed');
}

// Test: Async handler wrapper
async function testAsyncHandler() {
  console.log('Testing async handler wrapper...');
  
  const asyncRoute = asyncHandler(async (req, res) => {
    throw new Error('Async error');
  });
  
  const req = createMockReq();
  const res = createMockRes();
  
  // This should catch the async error and handle it
  await asyncRoute(req, res);
  
  const statusCode = res.statusCode();
  const responseBody = JSON.parse(res.body());
  
  assert.strictEqual(statusCode, 500, 'Should handle async errors');
  assert.strictEqual(responseBody.error, 'internal_error', 'Should format error correctly');
  
  console.log('✓ Async handler test passed');
}

// Test: Headers already sent scenario
async function testHeadersAlreadySent() {
  console.log('Testing headers already sent scenario...');
  const errorHandler = createErrorHandler();
  const req = createMockReq();
  const res = createMockRes();
  
  // Simulate headers already sent
  res.end('Some response');
  
  const testError = new Error('Error after response');
  
  // Should not throw or crash
  try {
    errorHandler(testError, req, res);
    console.log('✓ Headers already sent test passed');
  } catch (error) {
    assert.fail('Should handle headers already sent gracefully');
  }
}

async function runAllTests() {
  try {
    await testBasicErrorHandling();
    await testJSONParsingError();
    await testServiceUnavailableError();
    await testTimeoutError();
    await testValidationError();
    await testErrorMiddleware();
    await testAsyncHandler();
    await testHeadersAlreadySent();
    console.log('\nAll error handler tests passed! ✅');
  } catch (error) {
    console.error('❌ Error handler test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runAllTests();
//---------------------------------------------------------------------