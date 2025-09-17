const { verifyReceipt, JWKSManager } = require('@certnode/sdk');

// Example receipt verification
async function main() {
  console.log('🚀 CertNode Receipt Verification Example');

  // Example receipt (replace with your actual receipt)
  const receipt = {
    protected: "eyJhbGciOiJFUzI1NiIsImtpZCI6ImV4YW1wbGUta2V5In0",
    payload: {
      document_id: "DOC-12345",
      content: "Hello, CertNode!",
      timestamp: "2025-01-15T10:30:00Z"
    },
    signature: "MEQCIAH8B3K2l1D0F9X7Zz8Q2P5M6N7R3S4T5U6V7W8X9Y0Z...",
    kid: "example-key"
  };

  // Example JWKS (replace with your actual JWKS)
  const jwks = {
    keys: [{
      kty: "EC",
      crv: "P-256",
      x: "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
      y: "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
      kid: "example-key",
      alg: "ES256"
    }]
  };

  try {
    // Verify the receipt
    const result = await verifyReceipt({ receipt, jwks });

    if (result.ok) {
      console.log('✅ Receipt is valid!');
      console.log('📄 Verified payload:', receipt.payload);
    } else {
      console.log('❌ Receipt verification failed');
      console.log('📋 Reason:', result.reason);
    }

  } catch (error) {
    console.error('🚨 Error during verification:', error.message);
  }

  // Example with JWKS Manager (fetch from URL)
  console.log('\n🔄 Example with JWKS Manager:');

  try {
    const jwksManager = new JWKSManager();

    // Uncomment to fetch from a real endpoint:
    // const liveJwks = await jwksManager.fetchFromUrl('https://api.certnode.io/.well-known/jwks.json');
    // const liveResult = await verifyReceipt({ receipt, jwks: liveJwks });

    console.log('📚 Available thumbprints:', jwksManager.thumbprints(jwks));

  } catch (error) {
    console.log('ℹ️  JWKS fetch example (requires network): ', error.message);
  }
}

main().catch(console.error);