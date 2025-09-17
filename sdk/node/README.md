# @certnode/sdk

[![npm version](https://badge.fury.io/js/%40certnode%2Fsdk.svg)](https://badge.fury.io/js/%40certnode%2Fsdk)
[![Node.js CI](https://github.com/srbryant86/certnode/workflows/Node.js%20CI/badge.svg)](https://github.com/srbryant86/certnode/actions)

Node.js SDK for CertNode receipt verification with **zero dependencies**. Supports both ES256 (ECDSA P-256) and EdDSA (Ed25519) algorithms for cryptographic verification of tamper-evident digital records.

## 🚀 Quick Start

```bash
npm install @certnode/sdk
```

```javascript
const { verifyReceipt, JWKSManager } = require('@certnode/sdk');

// Verify a CertNode receipt
const result = await verifyReceipt({
  receipt: {
    protected: "eyJhbGciOiJFUzI1NiIsImtpZCI6InRlc3Qta2V5In0",
    payload: { document: "Hello, World!" },
    signature: "MEQCIAH8B3K2l1D0F9X7Zz8Q2P5M6N7R3S4T5U6V7W8X9Y0Z...",
    kid: "test-key"
  },
  jwks: {
    keys: [{
      kty: "EC",
      crv: "P-256",
      x: "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
      y: "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
      kid: "test-key"
    }]
  }
});

console.log(result.ok ? 'Valid!' : `Invalid: ${result.reason}`);
```

## 📖 Features

- ✅ **Zero Dependencies** - Pure Node.js crypto implementation
- ✅ **ES256 Support** - ECDSA P-256 signatures (RFC 7515)
- ✅ **EdDSA Support** - Ed25519 deterministic signatures
- ✅ **JSON Canonicalization** - RFC 8785 JCS for consistent hashing
- ✅ **TypeScript Definitions** - Full type safety included
- ✅ **JWKS Management** - Automatic key fetching and caching
- ✅ **Production Ready** - Used in enterprise environments

## 🔧 API Reference

### `verifyReceipt(options)`

Verifies a CertNode receipt against a JWKS.

**Parameters:**
- `options.receipt` (Object) - The receipt to verify
- `options.jwks` (Object) - JWKS containing public keys

**Returns:** `Promise<{ok: boolean, reason?: string}>`

### Receipt Format

```typescript
interface Receipt {
  protected: string;          // Base64url JWS header
  payload: any;              // Original data
  signature: string;         // Base64url signature
  kid: string;              // Key identifier
  payload_jcs_sha256?: string; // Optional payload hash
  receipt_id?: string;       // Optional receipt ID
}
```

### JWKS Format

**ES256 (ECDSA P-256) Key:**
```json
{
  "keys": [{
    "kty": "EC",
    "crv": "P-256",
    "x": "base64url-encoded-x-coordinate",
    "y": "base64url-encoded-y-coordinate",
    "kid": "key-identifier",
    "alg": "ES256"
  }]
}
```

**EdDSA (Ed25519) Key:**
```json
{
  "keys": [{
    "kty": "OKP",
    "crv": "Ed25519",
    "x": "base64url-encoded-public-key",
    "kid": "key-identifier",
    "alg": "EdDSA"
  }]
}
```

## 📚 Examples

### Basic Verification

```javascript
const { verifyReceipt } = require('@certnode/sdk');

async function verifyDocument() {
  const receipt = {
    protected: "eyJhbGciOiJFUzI1NiIsImtpZCI6InByb2QtMjAyNSJ9",
    payload: {
      document_id: "DOC-2025-001",
      content: "Financial audit report Q4 2024",
      timestamp: "2025-01-15T10:30:00Z"
    },
    signature: "MEQCIAH8B3K2l1D0F9X7Zz8Q2P5M6N7R3S4T5U6V7W8X9Y0Z...",
    kid: "prod-2025",
    payload_jcs_sha256: "uU0nuZNNPgilLlLX2n2r-sSE7-N6U4DukIj3rOLvzek"
  };

  const jwks = {
    keys: [{
      kty: "EC",
      crv: "P-256",
      x: "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
      y: "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
      kid: "prod-2025",
      alg: "ES256"
    }]
  };

  try {
    const result = await verifyReceipt({ receipt, jwks });

    if (result.ok) {
      console.log('✅ Document is authentic and unmodified');
    } else {
      console.log(`❌ Verification failed: ${result.reason}`);
    }
  } catch (error) {
    console.error('Verification error:', error.message);
  }
}

verifyDocument();
```

### Using EdDSA (Deterministic Signatures)

```javascript
const { verifyReceipt } = require('@certnode/sdk');

async function verifyWithEdDSA() {
  const receipt = {
    protected: "eyJhbGciOiJFZERTQSIsImtpZCI6ImVkMjU1MTkta2V5In0",
    payload: {
      transaction_id: "TXN-123456",
      amount: 45000,
      currency: "USD"
    },
    signature: "hgyY0il_MGCjP0JzlnLWG1PPOt7-09PGcvMg3AIbQR6dWbhij...",
    kid: "ed25519-key"
  };

  const jwks = {
    keys: [{
      kty: "OKP",
      crv: "Ed25519",
      x: "11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo",
      kid: "ed25519-key",
      alg: "EdDSA"
    }]
  };

  const result = await verifyReceipt({ receipt, jwks });
  console.log(result.ok ? 'Valid EdDSA signature!' : `Invalid: ${result.reason}`);
}

verifyWithEdDSA();
```

### JWKS Management with Auto-Fetching

```javascript
const { verifyReceipt, JWKSManager } = require('@certnode/sdk');

async function verifyWithJWKSManager() {
  // Initialize JWKS manager with 5-minute cache
  const jwksManager = new JWKSManager({ ttlMs: 5 * 60 * 1000 });

  // Fetch JWKS from CertNode's public endpoint
  const jwks = await jwksManager.fetchFromUrl('https://api.certnode.io/.well-known/jwks.json');

  const receipt = {
    protected: "eyJhbGciOiJFUzI1NiIsImtpZCI6ImNlcnQtMjAyNS0wMS0xNSJ9",
    payload: { message: "Hello from CertNode!" },
    signature: "MEQCIAH8B3K2l1D0F9X7Zz8Q2P5M6N7R3S4T5U6V7W8X9Y0Z...",
    kid: "cert-2025-01-15"
  };

  const result = await verifyReceipt({ receipt, jwks });

  if (result.ok) {
    console.log('✅ Receipt verified against live JWKS');
  } else {
    console.log(`❌ ${result.reason}`);
  }

  // Check available key thumbprints
  const thumbprints = jwksManager.thumbprints(jwks);
  console.log('Available keys:', thumbprints);
}

verifyWithJWKSManager();
```

### Error Handling

```javascript
const { verifyReceipt } = require('@certnode/sdk');

async function handleErrors() {
  const receipt = { /* malformed receipt */ };
  const jwks = { keys: [] };

  try {
    const result = await verifyReceipt({ receipt, jwks });

    if (!result.ok) {
      // Handle specific error cases
      switch (true) {
        case result.reason.includes('Unsupported algorithm'):
          console.log('Algorithm not supported. Use ES256 or EdDSA.');
          break;
        case result.reason.includes('Key not found'):
          console.log('Signing key not available in JWKS.');
          break;
        case result.reason.includes('Invalid signature'):
          console.log('Document has been tampered with.');
          break;
        default:
          console.log(`Verification failed: ${result.reason}`);
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

handleErrors();
```

### Batch Verification

```javascript
const { verifyReceipt } = require('@certnode/sdk');

async function verifyBatch(receipts, jwks) {
  const results = await Promise.all(
    receipts.map(async (receipt, index) => {
      const result = await verifyReceipt({ receipt, jwks });
      return {
        index,
        receiptId: receipt.kid,
        valid: result.ok,
        reason: result.reason
      };
    })
  );

  const validCount = results.filter(r => r.valid).length;
  console.log(`${validCount}/${results.length} receipts verified successfully`);

  // Log failures
  results.filter(r => !r.valid).forEach(r => {
    console.log(`Receipt ${r.index} (${r.receiptId}): ${r.reason}`);
  });

  return results;
}

// Usage
const receipts = [/* array of receipts */];
const jwks = {/* your JWKS */};
verifyBatch(receipts, jwks);
```

## 🔒 Security Considerations

- **Always verify receipts** against a trusted JWKS source
- **Use HTTPS** when fetching JWKS from remote endpoints
- **Validate key sources** - ensure JWKS comes from trusted authorities
- **Handle errors gracefully** - log failures for security monitoring
- **Keep dependencies updated** - though this package has zero dependencies

## 🏗️ Integration Examples

### Express.js Middleware

```javascript
const { verifyReceipt, JWKSManager } = require('@certnode/sdk');

const jwksManager = new JWKSManager();

function certNodeVerification(jwksUrl) {
  return async (req, res, next) => {
    try {
      const receipt = req.body.receipt;
      if (!receipt) {
        return res.status(400).json({ error: 'Receipt required' });
      }

      const jwks = await jwksManager.fetchFromUrl(jwksUrl);
      const result = await verifyReceipt({ receipt, jwks });

      if (result.ok) {
        req.verifiedPayload = receipt.payload;
        next();
      } else {
        res.status(401).json({ error: 'Invalid receipt', reason: result.reason });
      }
    } catch (error) {
      res.status(500).json({ error: 'Verification failed', details: error.message });
    }
  };
}

// Usage
app.post('/api/submit',
  certNodeVerification('https://api.certnode.io/.well-known/jwks.json'),
  (req, res) => {
    // req.verifiedPayload contains the verified data
    res.json({ status: 'success', data: req.verifiedPayload });
  }
);
```

### TypeScript Usage

```typescript
import { verifyReceipt, Receipt, JWKS, VerifyResult } from '@certnode/sdk';

interface DocumentReceipt extends Receipt {
  payload: {
    document_id: string;
    content: string;
    timestamp: string;
  };
}

async function verifyDocument(
  receipt: DocumentReceipt,
  jwks: JWKS
): Promise<VerifyResult> {
  return await verifyReceipt({ receipt, jwks });
}
```

## 📝 License

MIT License - see [LICENSE](../../LICENSE) for details.

## 🔗 Links

- **Documentation**: [https://certnode.io/docs](https://certnode.io/docs)
- **API Reference**: [https://certnode.io/openapi](https://certnode.io/openapi)
- **GitHub**: [https://github.com/srbryant86/certnode](https://github.com/srbryant86/certnode)
- **Issues**: [https://github.com/srbryant86/certnode/issues](https://github.com/srbryant86/certnode/issues)

## 🤝 Contributing

Contributions welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) and [Code of Conduct](../../CODE_OF_CONDUCT.md).

---

**Made with ❤️ by the CertNode team**