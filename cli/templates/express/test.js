const http = require('http');

// Simple API testing without external dependencies
async function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            body: res.headers['content-type']?.includes('application/json') ?
              JSON.parse(body) : body
          };
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing {{projectName}} API...\n');

  const baseOptions = {
    hostname: 'localhost',
    port: 3000,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  let passed = 0;
  let failed = 0;

  // Test 1: Health check
  try {
    const response = await makeRequest({
      ...baseOptions,
      path: '/health',
      method: 'GET'
    });

    if (response.status === 200 && response.body.status === 'healthy') {
      console.log('✅ Test 1: Health check passed');
      passed++;
    } else {
      console.log('❌ Test 1: Health check failed');
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 1: Health check error -', error.message);
    failed++;
  }

  // Test 2: API info endpoint
  try {
    const response = await makeRequest({
      ...baseOptions,
      path: '/',
      method: 'GET'
    });

    if (response.status === 200 && response.body.name) {
      console.log('✅ Test 2: API info endpoint passed');
      passed++;
    } else {
      console.log('❌ Test 2: API info endpoint failed');
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 2: API info error -', error.message);
    failed++;
  }

  // Test 3: Submit without receipt should fail
  try {
    const response = await makeRequest({
      ...baseOptions,
      path: '/api/submit',
      method: 'POST'
    }, {
      data: "test data"
    });

    if (response.status === 400 && response.body.error === 'Receipt required') {
      console.log('✅ Test 3: Missing receipt validation passed');
      passed++;
    } else {
      console.log('❌ Test 3: Missing receipt validation failed');
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 3: Missing receipt test error -', error.message);
    failed++;
  }

  // Test 4: Manual verification with invalid receipt
  try {
    const invalidReceipt = {
      payload: { test: "data" }
      // Missing required fields
    };

    const response = await makeRequest({
      ...baseOptions,
      path: '/api/verify',
      method: 'POST'
    }, {
      receipt: invalidReceipt,
      jwksUrl: 'https://api.certnode.io/.well-known/jwks.json'
    });

    if (response.status === 200 && response.body.valid === false) {
      console.log('✅ Test 4: Invalid receipt validation passed');
      passed++;
    } else {
      console.log('❌ Test 4: Invalid receipt validation failed');
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 4: Invalid receipt test error -', error.message);
    failed++;
  }

  // Test 5: 404 handling
  try {
    const response = await makeRequest({
      ...baseOptions,
      path: '/nonexistent',
      method: 'GET'
    });

    if (response.status === 404) {
      console.log('✅ Test 5: 404 handling passed');
      passed++;
    } else {
      console.log('❌ Test 5: 404 handling failed');
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 5: 404 test error -', error.message);
    failed++;
  }

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('🚨 Some tests failed');
    process.exit(1);
  }
}

// Check if server is running
console.log('🔍 Checking if server is running on http://localhost:3000...');

const healthCheck = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET',
  timeout: 2000
}, (res) => {
  if (res.statusCode === 200) {
    console.log('✅ Server is running\n');
    runTests().catch(console.error);
  } else {
    console.error('❌ Server health check failed');
    process.exit(1);
  }
});

healthCheck.on('error', (error) => {
  console.error('❌ Server is not running. Please start it first with: npm start');
  console.error('Error:', error.message);
  process.exit(1);
});

healthCheck.on('timeout', () => {
  console.error('❌ Server health check timed out');
  process.exit(1);
});

healthCheck.end();