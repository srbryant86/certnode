# Sample Data for CertNode API Testing

This directory contains sample cryptographic receipts and JWKS for testing the verification functionality.

## Files

- `receipt.json` - Sample cryptographic receipt using ES256 detached JWS
- `payload.json` - Original payload data that was signed
- `jwks.json` - JSON Web Key Set containing the public key for verification
- `README.md` - This documentation

## Usage

### Web Interface
Visit `/verify` and click "Load Sample" to automatically populate both fields and test verification.

### API Testing
Use these samples with the `/v1/verify` endpoint:

```bash
curl -X POST https://api.certnode.io/v1/verify \
  -H "Content-Type: application/json" \
  -d '{
    "receipt_ref": "https://certnode.vercel.app/samples/receipt.json",
    "jwks_ref": "https://certnode.vercel.app/samples/jwks.json"
  }'
```

Or download and use directly:
```bash
curl -X POST https://api.certnode.io/v1/verify \
  -H "Content-Type: application/json" \
  -d '{
    "receipt": '$(curl -s https://certnode.vercel.app/samples/receipt.json)',
    "jwks": '$(curl -s https://certnode.vercel.app/samples/jwks.json)'
  }'
```

### Manual Verification
The samples use standard cryptographic formats:
- **Algorithm**: ES256 (ECDSA P-256 with SHA-256)
- **Format**: RFC 7515 JSON Web Signature (detached)
- **Canonicalization**: RFC 8785 JSON Canonicalization Scheme

## Key Information
- **Key ID**: demo-2025-09-16
- **Purpose**: Demonstration and testing only
- **Validity**: Keys are rotated regularly for security

⚠️ **Note**: These are demo keys for testing purposes only. Production receipts use different key material with proper rotation policies.