const assert = require('assert');
const { createError, ERROR_CATEGORIES, handleError } = require('../src/plugins/errors');
const { attach } = require('../src/plugins/requestId');

console.log('Testing request ID handling...');

// Test 1: Incoming X-Request-Id header
console.log('Test 1: Incoming X-Request-Id header');

const mockReq1 = {
  headers: { 'x-request-id': 'abc_123' },
  method: 'POST',
  url: '/test'
};

let capturedHeaders1 = {};
let capturedBody1 = '';
let capturedStatus1 = 0;

const mockRes1 = {
  headersSent: false,
  setHeader: (key, value) => {
    capturedHeaders1[key] = value;
  },
  writeHead: (status, headers) => {
    capturedStatus1 = status;
    Object.assign(capturedHeaders1, headers);
  },
  end: (body) => {
    capturedBody1 = body;
  }
};

// Attach request ID
attach(mockReq1, mockRes1);

// Create error and handle it
const error1 = createError(ERROR_CATEGORIES.CLIENT_ERROR, 'Boom');
handleError(error1, mockReq1, mockRes1);

// Parse response body
const responseBody1 = JSON.parse(capturedBody1);

// Assertions
assert.strictEqual(mockReq1.id, 'abc_123', 'Request should have attached ID from header');
assert.strictEqual(capturedHeaders1['X-Request-Id'], 'abc_123', 'Response header should include request ID');
assert.strictEqual(responseBody1.request_id, 'abc_123', 'Response body should include request_id');
assert.strictEqual(capturedStatus1, 400, 'Client error should return 400 status');

console.log('✓ Test 1 passed: Incoming X-Request-Id handled correctly');

// Test 2: No incoming header, generate new ID
console.log('Test 2: No incoming header, generate new ID');

const mockReq2 = {
  headers: {},
  method: 'GET',
  url: '/test'
};

let capturedHeaders2 = {};
let capturedBody2 = '';
let capturedStatus2 = 0;

const mockRes2 = {
  headersSent: false,
  setHeader: (key, value) => {
    capturedHeaders2[key] = value;
  },
  writeHead: (status, headers) => {
    capturedStatus2 = status;
    Object.assign(capturedHeaders2, headers);
  },
  end: (body) => {
    capturedBody2 = body;
  }
};

// Attach request ID (should generate new one)
attach(mockReq2, mockRes2);

// Create error and handle it
const error2 = createError(ERROR_CATEGORIES.CLIENT_ERROR, 'Test error');
handleError(error2, mockReq2, mockRes2);

// Parse response body
const responseBody2 = JSON.parse(capturedBody2);

// Assertions
assert(mockReq2.id, 'Request should have generated ID');
assert(mockReq2.id.startsWith('req_'), 'Generated ID should start with req_');
assert.strictEqual(capturedHeaders2['X-Request-Id'], mockReq2.id, 'Response header should match generated ID');
assert.strictEqual(responseBody2.request_id, mockReq2.id, 'Response body should match generated ID');
assert(mockReq2.id.length >= 20, 'Generated ID should be reasonably long');

console.log('✓ Test 2 passed: Generated request ID handled correctly');

// Test 3: Unsafe incoming header, should generate new ID
console.log('Test 3: Unsafe incoming header, generate new ID');

const mockReq3 = {
  headers: { 'x-request-id': 'bad header with spaces!' },
  method: 'POST',
  url: '/test'
};

let capturedHeaders3 = {};
const mockRes3 = {
  headersSent: false,
  setHeader: (key, value) => {
    capturedHeaders3[key] = value;
  }
};

attach(mockReq3, mockRes3);

assert(mockReq3.id !== 'bad header with spaces!', 'Unsafe header should be rejected');
assert(mockReq3.id.startsWith('req_'), 'Should generate safe ID when incoming ID is unsafe');
assert.strictEqual(capturedHeaders3['X-Request-Id'], mockReq3.id, 'Response header should match safe generated ID');

console.log('✓ Test 3 passed: Unsafe header rejected, new ID generated');

console.log('All request-id tests passed!');