// CertNode API - Node.js Examples
// npm install node-fetch (or use built-in fetch in Node 18+)

const BASE_URL = 'https://api.certnode.io';
// For local development: const BASE_URL = 'http://localhost:8785';

// Example 1: Health Check
async function healthCheck() {
  console.log('=== Health Check ===');
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    console.log('✅ API Health:', data);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
}

// Example 2: Get JWKS (Public Keys)
async function getJWKS() {
  console.log('\n=== Get JWKS ===');
  try {
    const response = await fetch(`${BASE_URL}/.well-known/jwks.json`);
    const jwks = await response.json();
    console.log('✅ Public Keys:', JSON.stringify(jwks, null, 2));
    return jwks;
  } catch (error) {
    console.error('❌ JWKS fetch failed:', error.message);
  }
}

// Example 3: Sign a payload
async function signPayload() {
  console.log('\n=== Sign Payload ===');

  const payload = {
    docId: `example-${Date.now()}`,
    hash: 'sha256-XUFAKrxLKna5cZ2REBfFkg==',
    issuer: 'your-organization',
    issued_at: new Date().toISOString()
  };

  try {
    const response = await fetch(`${BASE_URL}/v1/sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ payload })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Signed Receipt:', JSON.stringify(result, null, 2));
    return result.receipt;
  } catch (error) {
    console.error('❌ Signing failed:', error.message);
  }
}

// Example 4: Verify with hosted samples
async function verifyWithSamples() {
  console.log('\n=== Verify with Hosted Samples ===');

  try {
    const response = await fetch(`${BASE_URL}/v1/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receipt_ref: 'https://certnode.vercel.app/samples/receipt.json',
        jwks_ref: 'https://certnode.vercel.app/samples/jwks.json'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Verification Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Example 5: Verify with inline data
async function verifyWithInlineData() {
  console.log('\n=== Verify with Inline Data ===');

  // Sample receipt (this would come from your sign operation)
  const receipt = {
    protected: "eyJhbGciOiJFUzI1NiIsImtpZCI6ImRlbW8tMjAyNS0wOS0xNiJ9",
    payload: "eyJkb2NJZCI6ImRlbW8tMTIzIiwiaGFzaCI6InNoYTI1Ni1LcGRSYkRWTGFJU00yOWoxU2lKcUNsV3lIdEU0NGdldGJGeTduQUNxV3VvPSIsImlzc3VlciI6ImNlcnRub2RlLnNhbXBsZSIsImlzc3VlZF9hdCI6IjIwMjUtMDktMTZUMDI6NDQ6MTMuNjQ3WiJ9",
    signature: "rIJxuZVSc7QVAy0yJL-s7BKEzlhb4GGyP36-TBSz88F34ij-yeWko2i4Z3MIRpJGQWRYpiboHj-kVQmPFNdSig",
    kid: "demo-2025-09-16"
  };

  // Sample JWKS
  const jwks = {
    keys: [{
      kty: "EC",
      crv: "P-256",
      x: "WKn-ZIGevcwGIyyrzFoZNBdaq9_TsqzGHwHitJBcBmXdHqVhNnp7ZGWs7pxZ_YBB",
      y: "Hc7ZUQGlM-crzCUchDG-wGPL7FBrBLi-PG3DWGWS4KnmQE7gV2nzJZT8O_Kv5ePG",
      kid: "demo-2025-09-16",
      alg: "ES256",
      use: "sig"
    }]
  };

  try {
    const response = await fetch(`${BASE_URL}/v1/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ receipt, jwks })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Verification Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Example 6: Download and verify
async function downloadAndVerify() {
  console.log('\n=== Download Samples and Verify ===');

  try {
    // Download samples
    const [receiptResponse, jwksResponse] = await Promise.all([
      fetch('https://certnode.vercel.app/samples/receipt.json'),
      fetch('https://certnode.vercel.app/samples/jwks.json')
    ]);

    const receipt = await receiptResponse.json();
    const jwks = await jwksResponse.json();

    console.log('📥 Downloaded receipt and JWKS');

    // Verify
    const response = await fetch(`${BASE_URL}/v1/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ receipt, jwks })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Verification Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('❌ Download and verify failed:', error.message);
  }
}

// Run all examples
async function runAllExamples() {
  console.log('🚀 CertNode API Examples\n');

  await healthCheck();
  await getJWKS();
  // await signPayload(); // Uncomment when API is available
  await verifyWithSamples();
  await verifyWithInlineData();
  await downloadAndVerify();

  console.log('\n✨ All examples completed!');
  console.log('📚 For more information: https://certnode.vercel.app/openapi');
}

// Export for use as module
module.exports = {
  healthCheck,
  getJWKS,
  signPayload,
  verifyWithSamples,
  verifyWithInlineData,
  downloadAndVerify,
  runAllExamples
};

// Run examples if called directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}