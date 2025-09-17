# CertNode SDK Test Vectors

This directory contains standardized test vectors for ensuring compatibility across all CertNode SDK implementations (Python, Go, Rust, etc.).

## Purpose

Test vectors provide:
- **Cross-language compatibility** - Ensure all SDKs produce identical results
- **Regression testing** - Detect breaking changes in implementations
- **Reference implementation** - Standard test cases for new SDK implementations
- **Debugging support** - Known good/bad cases for troubleshooting

## Structure

```
test-vectors/
├── README.md                    # This file
├── valid/                       # Valid receipts that should pass verification
│   ├── es256-basic.json         # Basic ES256 receipt
│   ├── es256-with-jcs.json      # ES256 with JCS hash
│   ├── es256-with-receipt-id.json # ES256 with receipt ID
│   ├── eddsa-basic.json         # Basic EdDSA receipt
│   ├── eddsa-with-jcs.json      # EdDSA with JCS hash
│   └── eddsa-with-receipt-id.json # EdDSA with receipt ID
├── invalid/                     # Invalid receipts that should fail verification
│   ├── bad-signature.json       # Invalid signature
│   ├── wrong-kid.json           # Non-existent key ID
│   ├── tampered-payload.json    # Modified payload
│   ├── invalid-algorithm.json   # Unsupported algorithm
│   └── malformed-header.json    # Invalid header format
├── jwks/                        # Test JWKS files
│   ├── ec-keys.json            # EC P-256 keys
│   ├── ed25519-keys.json       # Ed25519 keys
│   └── mixed-keys.json         # Both EC and Ed25519 keys
└── tools/                       # Test vector generation and validation tools
    ├── generate.py             # Generate test vectors
    ├── validate.py             # Validate across SDKs
    └── schemas/                # JSON schemas for validation
        ├── receipt.schema.json
        └── jwks.schema.json
```

## Usage

### Running Compatibility Tests

Each SDK should implement tests that:

1. Load test vectors from this directory
2. Verify all valid receipts pass verification
3. Verify all invalid receipts fail verification with expected reasons
4. Compare results across implementations

### Example Test Implementation

```python
# Python example
import json
import os
from certnode import verify_receipt

def test_cross_compatibility():
    # Load valid test vectors
    valid_dir = "sdk/test-vectors/valid"
    for filename in os.listdir(valid_dir):
        with open(os.path.join(valid_dir, filename)) as f:
            test_case = json.load(f)

        result = verify_receipt(test_case["receipt"], test_case["jwks"])
        assert result.ok, f"Valid test case failed: {filename}"

    # Load invalid test vectors
    invalid_dir = "sdk/test-vectors/invalid"
    for filename in os.listdir(invalid_dir):
        with open(os.path.join(invalid_dir, filename)) as f:
            test_case = json.load(f)

        result = verify_receipt(test_case["receipt"], test_case["jwks"])
        assert not result.ok, f"Invalid test case passed: {filename}"
        assert result.reason == test_case["expected_reason"]
```

## Test Vector Format

Each test vector is a JSON file with this structure:

```json
{
  "description": "Human-readable description",
  "receipt": {
    "protected": "base64url_encoded_header",
    "payload": {},
    "signature": "base64url_encoded_signature",
    "kid": "key_identifier",
    "payload_jcs_sha256": "optional_jcs_hash",
    "receipt_id": "optional_receipt_id"
  },
  "jwks": {
    "keys": [...]
  },
  "expected_result": {
    "valid": true,
    "reason": null
  },
  "metadata": {
    "algorithm": "ES256 | EdDSA",
    "features": ["basic", "jcs", "receipt_id"],
    "created": "2024-01-15T10:00:00Z",
    "notes": "Additional context"
  }
}
```

## Adding New Test Vectors

1. Create the test case JSON file
2. Validate with the schema: `jsonschema -i new_test.json schemas/receipt.schema.json`
3. Test across all SDK implementations
4. Document any special requirements or edge cases

## Continuous Integration

Test vectors should be run in CI/CD for all SDK implementations to ensure:
- No regressions in existing functionality
- New features work consistently across languages
- Performance characteristics remain stable

## Security Considerations

- Test vectors may contain realistic key material - treat as public data only
- Do not include production keys or sensitive data
- Generated signatures are valid but use test-only key pairs
- Always regenerate vectors when updating cryptographic libraries