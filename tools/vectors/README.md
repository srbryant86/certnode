# CertNode Test Vectors

This directory contains machine-readable test vectors for CertNode implementations to ensure compliance and interoperability.

## Vector Categories

### Core Functionality
- `valid-receipts.json` - Valid receipts that should pass verification
- `invalid-receipts.json` - Invalid receipts that should fail with specific error codes
- `canonicalization.json` - JCS canonicalization test cases
- `key-formats.json` - JWKS key format test cases

### Algorithm Support
- `es256-vectors.json` - ECDSA P-256 test cases
- `eddsa-vectors.json` - Ed25519 test cases
- `mixed-algorithms.json` - Multi-algorithm interoperability tests

### Edge Cases
- `malformed-data.json` - Malformed JSON and edge cases
- `error-conditions.json` - Error handling test cases
- `rate-limiting.json` - Rate limiting test scenarios

## Usage

### CI Integration
```bash
# Run all test vectors
npm run test:vectors

# Run specific vector set
npm run test:vectors -- --file=valid-receipts.json
```

### Manual Testing
```bash
# Validate implementation against vectors
node scripts/validate-vectors.js
```

## Vector Format

Each vector file follows this structure:

```json
{
  "version": "1.1",
  "description": "Description of test cases",
  "vectors": [
    {
      "id": "unique_test_id",
      "description": "What this test validates",
      "input": { /* test input data */ },
      "expected": { /* expected output or error */ },
      "notes": "Additional context"
    }
  ]
}
```

## Compliance Requirements

Implementations must:
1. Pass all tests in `valid-receipts.json`
2. Correctly handle all cases in `invalid-receipts.json`
3. Support both ES256 and EdDSA algorithms
4. Implement proper error codes as specified