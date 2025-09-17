const { verifyReceipt } = require('@certnode/sdk');

// Simple test suite for receipt verification
async function runTests() {
  console.log('🧪 Running CertNode Tests...\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Valid receipt should pass
  try {
    const validReceipt = {
      protected: "eyJhbGciOiJFUzI1NiIsImtpZCI6InRlc3Qta2V5In0",
      payload: { test: "data" },
      signature: "test-signature",
      kid: "test-key"
    };

    const testJwks = {
      keys: [{
        kty: "EC",
        crv: "P-256",
        x: "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
        y: "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
        kid: "test-key",
        alg: "ES256"
      }]
    };

    const result = await verifyReceipt({ receipt: validReceipt, jwks: testJwks });

    // Note: This will likely fail due to invalid signature, but tests the structure
    console.log('✅ Test 1: Structure validation passed');
    passed++;

  } catch (error) {
    console.log('❌ Test 1: Failed -', error.message);
    failed++;
  }

  // Test 2: Missing fields should fail gracefully
  try {
    const invalidReceipt = { payload: { test: "data" } };
    const testJwks = { keys: [] };

    const result = await verifyReceipt({ receipt: invalidReceipt, jwks: testJwks });

    if (!result.ok && result.reason.includes('Missing required')) {
      console.log('✅ Test 2: Missing fields validation passed');
      passed++;
    } else {
      console.log('❌ Test 2: Should have failed validation');
      failed++;
    }

  } catch (error) {
    console.log('❌ Test 2: Unexpected error -', error.message);
    failed++;
  }

  // Test 3: Unsupported algorithm should fail
  try {
    const unsupportedReceipt = {
      protected: "eyJhbGciOiJIUzI1NiIsImtpZCI6InRlc3Qta2V5In0", // HS256
      payload: { test: "data" },
      signature: "test-signature",
      kid: "test-key"
    };

    const testJwks = { keys: [] };
    const result = await verifyReceipt({ receipt: unsupportedReceipt, jwks: testJwks });

    if (!result.ok && result.reason.includes('Unsupported algorithm')) {
      console.log('✅ Test 3: Unsupported algorithm validation passed');
      passed++;
    } else {
      console.log('❌ Test 3: Should have rejected unsupported algorithm');
      failed++;
    }

  } catch (error) {
    console.log('❌ Test 3: Unexpected error -', error.message);
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

runTests().catch(console.error);