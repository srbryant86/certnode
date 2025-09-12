//---------------------------------------------------------------------
// api/test/health.test.js
// Unit tests for health endpoint
const assert = require('assert');
const { handle } = require('../src/routes/health');

// Mock request/response objects
function createMockReq() {
  return { url: '/health', method: 'GET', headers: {} };
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

// Test: Basic health check structure
async function testBasicHealthStructure() {
  console.log('Testing basic health check structure...');
  const req = createMockReq();
  const res = createMockRes();
  
  await handle(req, res);
  
  const responseBody = JSON.parse(res.body());
  const statusCode = res.statusCode();
  
  // Should return 200 or 503 (depending on KMS availability)
  assert(statusCode === 200 || statusCode === 503, `Expected 200 or 503, got ${statusCode}`);
  
  // Required fields
  assert(typeof responseBody.status === 'string', 'Health response should have status');
  assert(typeof responseBody.timestamp === 'string', 'Health response should have timestamp');
  assert(typeof responseBody.uptime === 'number', 'Health response should have uptime');
  assert(typeof responseBody.memory === 'object', 'Health response should have memory info');
  assert(typeof responseBody.responseTime === 'number', 'Health response should have responseTime');
  assert(typeof responseBody.dependencies === 'object', 'Health response should have dependencies');
  assert(typeof responseBody.dependencies.kms === 'object', 'Health should check KMS dependency');
  
  console.log('✓ Basic health structure test passed');
}

// Test: Memory info structure
async function testMemoryInfo() {
  console.log('Testing memory info structure...');
  const req = createMockReq();
  const res = createMockRes();
  
  await handle(req, res);
  
  const responseBody = JSON.parse(res.body());
  const memory = responseBody.memory;
  
  assert(typeof memory.used === 'number', 'Memory used should be a number');
  assert(typeof memory.total === 'number', 'Memory total should be a number');
  assert(memory.used >= 0, 'Memory used should be non-negative');
  assert(memory.total >= memory.used, 'Total memory should be >= used memory');
  
  console.log('✓ Memory info test passed');
}

// Test: Response time measurement
async function testResponseTime() {
  console.log('Testing response time measurement...');
  const req = createMockReq();
  const res = createMockRes();
  
  const start = Date.now();
  await handle(req, res);
  const elapsed = Date.now() - start;
  
  const responseBody = JSON.parse(res.body());
  
  assert(typeof responseBody.responseTime === 'number', 'Response time should be a number');
  assert(responseBody.responseTime >= 0, 'Response time should be non-negative');
  assert(responseBody.responseTime <= elapsed + 10, 'Response time should be reasonable'); // +10ms tolerance
  
  console.log('✓ Response time test passed');
}

// Test: KMS dependency check
async function testKMSDependencyCheck() {
  console.log('Testing KMS dependency check...');
  const req = createMockReq();
  const res = createMockRes();
  
  await handle(req, res);
  
  const responseBody = JSON.parse(res.body());
  const kmsCheck = responseBody.dependencies.kms;
  
  assert(typeof kmsCheck.ok === 'boolean', 'KMS check should have ok boolean');
  
  if (kmsCheck.ok) {
    assert(typeof kmsCheck.type === 'string', 'KMS check should have type when ok');
  } else {
    assert(typeof kmsCheck.error === 'string', 'KMS check should have error when not ok');
  }
  
  console.log('✓ KMS dependency check test passed');
}

// Test: Status determination
async function testStatusDetermination() {
  console.log('Testing status determination logic...');
  const req = createMockReq();
  const res = createMockRes();
  
  await handle(req, res);
  
  const responseBody = JSON.parse(res.body());
  const statusCode = res.statusCode();
  
  if (responseBody.status === 'ok') {
    assert(statusCode === 200, 'OK status should return 200');
    assert(responseBody.dependencies.kms.ok === true, 'OK status requires all dependencies OK');
  } else if (responseBody.status === 'degraded') {
    assert(statusCode === 503, 'Degraded status should return 503');
    assert(responseBody.dependencies.kms.ok === false, 'Degraded status indicates failed dependencies');
  }
  
  console.log('✓ Status determination test passed');
}

async function runAllTests() {
  try {
    await testBasicHealthStructure();
    await testMemoryInfo();
    await testResponseTime();
    await testKMSDependencyCheck();
    await testStatusDetermination();
    console.log('\nAll health endpoint tests passed! ✅');
  } catch (error) {
    console.error('❌ Health test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runAllTests();
//---------------------------------------------------------------------