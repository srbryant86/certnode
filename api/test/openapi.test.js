const fs = require('fs');
const path = require('path');
const assert = require('assert');

(async () => {
  console.log('Testing OpenAPI specification...');

  // Read and parse the OpenAPI spec
  const specPath = path.join(__dirname, '..', '..', 'web', 'openapi.json');
  
  if (!fs.existsSync(specPath)) {
    throw new Error('OpenAPI spec file not found at: ' + specPath);
  }

  const specContent = fs.readFileSync(specPath, 'utf8');
  let spec;
  
  try {
    spec = JSON.parse(specContent);
  } catch (e) {
    throw new Error('Invalid JSON in OpenAPI spec: ' + e.message);
  }

  // Test 1: Verify OpenAPI version is 3.1.x
  assert.ok(spec.openapi, 'OpenAPI version field missing');
  assert.ok(typeof spec.openapi === 'string', 'OpenAPI version must be string');
  assert.ok(spec.openapi.startsWith('3.1'), `Expected OpenAPI 3.1.x, got ${spec.openapi}`);
  console.log('✓ OpenAPI version is 3.1.x');

  // Test 2: Verify basic structure
  assert.ok(spec.info, 'Info section missing');
  assert.ok(spec.info.title, 'Title missing');
  assert.ok(spec.info.version, 'Version missing');
  assert.ok(spec.paths, 'Paths section missing');
  console.log('✓ Basic OpenAPI structure present');

  // Test 3: Verify required paths exist
  assert.ok(spec.paths['/health'], '/health path missing');
  assert.ok(spec.paths['/health'].get, '/health GET method missing');
  console.log('✓ /health GET path documented');

  assert.ok(spec.paths['/v1/sign'], '/v1/sign path missing');
  assert.ok(spec.paths['/v1/sign'].post, '/v1/sign POST method missing');
  console.log('✓ /v1/sign POST path documented');

  // Test 4: Verify /health response structure
  const healthGet = spec.paths['/health'].get;
  assert.ok(healthGet.responses, '/health responses missing');
  assert.ok(healthGet.responses['200'], '/health 200 response missing');
  assert.ok(healthGet.responses['200'].content, '/health response content missing');
  assert.ok(healthGet.responses['200'].content['application/json'], '/health JSON content missing');
  
  const healthSchema = healthGet.responses['200'].content['application/json'].schema;
  assert.ok(healthSchema.properties.ok, '/health response missing "ok" property');
  assert.ok(healthSchema.required.includes('ok'), '/health response "ok" not marked as required');
  console.log('✓ /health response schema valid');

  // Test 5: Verify /v1/sign response structure  
  const signPost = spec.paths['/v1/sign'].post;
  assert.ok(signPost.responses, '/v1/sign responses missing');
  assert.ok(signPost.responses['200'], '/v1/sign 200 response missing');
  assert.ok(signPost.responses['200'].content, '/v1/sign response content missing');
  assert.ok(signPost.responses['200'].content['application/json'], '/v1/sign JSON content missing');
  
  const signSchema = signPost.responses['200'].content['application/json'].schema;
  const requiredFields = ['protected', 'signature', 'payload', 'kid', 'payload_jcs_sha256', 'receipt_id'];
  
  for (const field of requiredFields) {
    assert.ok(signSchema.properties[field], `/v1/sign response missing "${field}" property`);
    assert.ok(signSchema.required.includes(field), `/v1/sign response "${field}" not marked as required`);
  }
  console.log('✓ /v1/sign response schema contains all required fields');

  // Test 6: Verify request body structure
  assert.ok(signPost.requestBody, '/v1/sign requestBody missing');
  assert.ok(signPost.requestBody.content, '/v1/sign requestBody content missing');
  assert.ok(signPost.requestBody.content['application/json'], '/v1/sign JSON requestBody missing');
  
  const requestSchema = signPost.requestBody.content['application/json'].schema;
  assert.ok(requestSchema.properties.payload, '/v1/sign request missing "payload" property');
  assert.ok(requestSchema.required.includes('payload'), '/v1/sign request "payload" not marked as required');
  console.log('✓ /v1/sign request schema valid');

  // Test 7: Verify components schemas exist
  assert.ok(spec.components, 'Components section missing');
  assert.ok(spec.components.schemas, 'Components schemas missing');
  assert.ok(spec.components.schemas.JwkThumbprint, 'JwkThumbprint schema missing');
  assert.ok(spec.components.schemas.Base64Url, 'Base64Url schema missing');
  console.log('✓ Reusable schemas documented');

  // Test 8: Verify error responses
  assert.ok(signPost.responses['400'], '/v1/sign 400 response missing');
  assert.ok(signPost.responses['429'], '/v1/sign 429 response missing');
  assert.ok(signPost.responses['500'], '/v1/sign 500 response missing');
  console.log('✓ Error responses documented');

  // Test 9: Verify examples exist
  const requestExamples = signPost.requestBody.content['application/json'].examples;
  const responseExamples = signPost.responses['200'].content['application/json'].examples;
  assert.ok(requestExamples && Object.keys(requestExamples).length > 0, 'Request examples missing');
  assert.ok(responseExamples && Object.keys(responseExamples).length > 0, 'Response examples missing');
  console.log('✓ Request and response examples present');

  // Test 10: Verify servers configuration
  assert.ok(spec.servers, 'Servers configuration missing');
  assert.ok(Array.isArray(spec.servers), 'Servers must be array');
  assert.ok(spec.servers.length >= 2, 'Should have production and development servers');
  
  const prodServer = spec.servers.find(s => s.url.includes('api.certnode.io'));
  const devServer = spec.servers.find(s => s.url.includes('localhost'));
  assert.ok(prodServer, 'Production server missing');
  assert.ok(devServer, 'Development server missing');
  console.log('✓ Server configurations present');

  console.log('All OpenAPI specification tests passed ✓');
})().catch(e => {
  console.error('OpenAPI test failed:', e.message);
  process.exit(1);
});