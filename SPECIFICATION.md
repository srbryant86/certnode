# CertNode Technical Specification

**Version:** 1.1
**Status:** Draft Standard
**Date:** January 2025
**Previous Version:** 1.0 (September 2025)

## Abstract

CertNode defines an open standard for cryptographically signed digital evidence using RFC-compliant technologies. This specification enables interoperable systems to generate tamper-evident receipts that provide mathematical proof of document integrity and authenticity.

## 1. Introduction

### 1.1 Purpose

This specification defines the CertNode standard for creating, distributing, and verifying cryptographic receipts for digital documents. The standard enables:

- **Interoperability**: Multiple implementations can produce and verify compatible receipts
- **Vendor Independence**: No dependency on specific service providers
- **Standards Compliance**: Built on established RFC specifications
- **Offline Verification**: Recipients can validate receipts without network access

### 1.2 Scope

This specification covers:
- Receipt format and structure
- Cryptographic signature requirements
- Key distribution mechanisms
- Verification procedures
- Implementation requirements

### 1.3 Terminology

- **Receipt**: A cryptographic proof of a document's integrity at a specific point in time
- **Payload**: The original document or data being signed
- **Protected Header**: JWS header containing cryptographic algorithm and key identifier
- **Signature**: ECDSA P-256 signature over the canonicalized payload
- **JWKS**: JSON Web Key Set containing public keys for verification

## 2. Technical Foundation

### 2.1 Core Standards

CertNode is built on the following established standards:

- **RFC 7515**: JSON Web Signature (JWS) - Signature format and structure
- **RFC 8785**: JSON Canonicalization Scheme (JCS) - Consistent JSON serialization
- **RFC 7517**: JSON Web Key (JWK) - Public key representation
- **RFC 7638**: JSON Web Key (JWK) Thumbprint - Key identification
- **FIPS 186-4**: Digital Signature Standard - ECDSA with P-256 curve

### 2.2 Cryptographic Requirements

**Supported Signature Algorithms**:
- **ES256**: ECDSA using P-256 and SHA-256 (REQUIRED for FIPS compliance)
- **EdDSA**: Ed25519 signature algorithm (RECOMMENDED for deterministic signatures)

**Hash Algorithm**: SHA-256
**Key Curves**:
- P-256 (secp256r1) for ES256
- Ed25519 for EdDSA
**Canonicalization**: RFC 8785 JSON Canonicalization Scheme (REQUIRED)

### 2.3 Deterministic Verification

**Canonicalization Requirements**:
- Implementations MUST canonicalize payloads with RFC 8785 prior to signing
- Verification MUST operate on the canonical form
- Canonicalization MUST be deterministic and reproducible across implementations

**Algorithm Determinism**:
- **ES256**: Produces non-deterministic signatures (acceptable for compatibility)
- **EdDSA**: Produces deterministic signatures (RECOMMENDED for reproducible verification)
- Verifiers MUST accept both when announced by `alg` field

## 3. Receipt Format

### 3.1 Structure

A CertNode receipt is a JSON object with the following required fields:

```json
{
  "protected": "eyJhbGciOiJFUzI1NiIsImtpZCI6InRodW1icHJpbnQifQ",
  "payload": { /* original document data */ },
  "signature": "MEQCIABC123...",
  "kid": "thumbprint_or_key_id"
}
```

### 3.2 Field Definitions

**protected** (string, required)
- Base64url-encoded JSON object containing JWS protected header
- Must include `alg` field with value `"ES256"` or `"EdDSA"`
- Must include `kid` field for key identification
- Must include `typ: "certnode+jws"` field (RECOMMENDED)
- Must NOT include unknown `crit` header parameters

**payload** (object, required)
- The original document or data being signed
- Must be a valid JSON object

**signature** (string, required)
- Base64url-encoded ECDSA signature in IEEE P1363 format (r||s)
- Signature over: `base64url(protected) + "." + base64url(canonical_payload)`

**kid** (string, required)
- Key identifier matching the key used for signing
- Should be RFC 7638 JWK thumbprint or custom key identifier

### 3.3 Optional Fields

**payload_jcs_sha256** (string, optional)
- Base64url-encoded SHA-256 hash of the JCS-canonicalized payload
- Enables verification of canonicalization correctness

**receipt_id** (string, optional)
- Base64url-encoded SHA-256 hash of the complete receipt
- Calculated as: `SHA256(protected + "." + payload_b64u + "." + signature)`

## 4. Signature Generation

### 4.1 Process

1. **Canonicalize Payload**: Apply RFC 8785 JCS to the payload object
2. **Encode Payload**: Base64url encode the canonicalized bytes
3. **Create Protected Header**: JSON object with `alg` and `kid`
4. **Encode Protected Header**: Base64url encode the header JSON
5. **Create Signing Input**: Concatenate `protected_b64u + "." + payload_b64u`
6. **Generate Signature**: ECDSA-SHA256 over the signing input bytes
7. **Encode Signature**: Convert DER signature to IEEE P1363 format, then base64url encode

### 4.2 Implementation Example

```javascript
// 1. Canonicalize payload using RFC 8785 JCS
const canonicalPayload = jcsStringify(payload);
const payloadBytes = new TextEncoder().encode(canonicalPayload);
const payloadB64u = base64urlEncode(payloadBytes);

// 2. Create and encode protected header
const header = { alg: "ES256", kid: keyId };
const headerB64u = base64urlEncode(JSON.stringify(header));

// 3. Create signing input
const signingInput = headerB64u + "." + payloadB64u;
const signingBytes = new TextEncoder().encode(signingInput);

// 4. Generate ECDSA signature
const signature = await crypto.subtle.sign(
  { name: "ECDSA", hash: "SHA-256" },
  privateKey,
  signingBytes
);

// 5. Convert to base64url
const signatureB64u = base64urlEncode(derToIeee(signature));
```

## 5. Key Management

### 5.1 JWKS Distribution

Public keys must be distributed in RFC 7517 JWKS format:

**ES256 (ECDSA P-256) Key**:
```json
{
  "keys": [{
    "kty": "EC",
    "crv": "P-256",
    "x": "base64url_encoded_x_coordinate",
    "y": "base64url_encoded_y_coordinate",
    "kid": "key_identifier",
    "use": "sig",
    "alg": "ES256"
  }]
}
```

**EdDSA (Ed25519) Key**:
```json
{
  "keys": [{
    "kty": "OKP",
    "crv": "Ed25519",
    "x": "base64url_encoded_public_key",
    "kid": "key_identifier",
    "use": "sig",
    "alg": "EdDSA"
  }]
}
```

### 5.2 Key Identification

Keys are identified using:
- RFC 7638 JWK thumbprint (recommended)
- Custom key identifier in `kid` field

### 5.3 Key Rotation

**Requirements**:
- Implementations MUST support multiple active keys simultaneously
- Historical keys MUST be maintained for verification of existing receipts
- Key rotation logs MUST be published and maintained
- Standard JWKS endpoints MUST be used (e.g., `/.well-known/jwks.json`)

**Rotation Process**:
1. Generate new key pair and assign unique `kid`
2. Add new public key to JWKS with current timestamp
3. Begin signing new receipts with new key
4. Maintain old keys for verification (minimum 90 days)
5. Log rotation event with timestamp and reason

**Rotation Log Format**:
```csv
date,kid,action,comment
2025-01-15T10:30:00Z,abc123,added,Regular key rotation
2025-01-14T09:00:00Z,xyz789,deprecated,Scheduled replacement
```

### 5.4 Algorithm Agility

**Current Algorithms**: ES256 (required), EdDSA (recommended)
**Deprecation Policy**: 12-month notice before algorithm deprecation
**Migration Strategy**: Dual-algorithm support during transition periods

**Future Considerations**:
- Post-quantum cryptographic algorithms under evaluation
- Algorithm deprecation process documented and communicated
- Backward compatibility maintained for minimum 24 months

## 6. Verification Process

### 6.1 Steps

1. **Parse Receipt**: Validate JSON structure and required fields
2. **Decode Protected Header**: Base64url decode and parse JSON
3. **Verify Algorithm**: Confirm `alg` is `"ES256"` or `"EdDSA"`
4. **Locate Public Key**: Find key in JWKS using `kid` field
5. **Reconstruct Signing Input**: `protected_b64u + "." + payload_b64u`
6. **Verify Signature**: Use appropriate algorithm (ECDSA-SHA256 or Ed25519)
7. **Verify Payload Hash**: If `payload_jcs_sha256` present, verify canonicalization
8. **Check Critical Parameters**: Reject if unknown `crit` parameters present

### 6.2 Implementation Example

```javascript
async function verifyReceipt(receipt, jwks) {
  // Parse and validate structure
  const { protected: protectedB64u, payload, signature, kid } = receipt;

  // Decode protected header
  const header = JSON.parse(base64urlDecode(protectedB64u));
  if (!["ES256", "EdDSA"].includes(header.alg)) {
    throw new Error(`Unsupported algorithm: ${header.alg}`);
  }

  // Find public key
  const publicKey = findKeyInJwks(jwks, header.kid || kid);

  // Canonicalize payload and create signing input
  const canonicalPayload = jcsStringify(payload);
  const payloadB64u = base64urlEncode(canonicalPayload);
  const signingInput = protectedB64u + "." + payloadB64u;

  // Verify signature
  const isValid = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    publicKey,
    base64urlDecode(signature),
    new TextEncoder().encode(signingInput)
  );

  return { ok: isValid };
}
```

## 7. Implementation Requirements

### 7.1 Mandatory Features

**Cryptographic Support**:
- ES256 (ECDSA P-256) signature generation/verification (REQUIRED)
- EdDSA (Ed25519) signature generation/verification (RECOMMENDED)
- RFC 8785 JSON canonicalization (REQUIRED)
- RFC 7517 JWKS parsing (REQUIRED)
- Base64url encoding/decoding (REQUIRED)

**Operational Requirements**:
- Rate limiting with HTTP 429 responses
- Proper error code reporting (see Section 7.3)
- JWKS caching with appropriate TTL (minimum 300 seconds)
- Key rotation support with historical key maintenance

### 7.2 Optional Features

- Payload hash verification (`payload_jcs_sha256`)
- Receipt ID calculation and verification
- JWKS caching and TTL management
- Key rotation support

### 7.3 Error Handling

Implementations must handle and report errors consistently using the following structure:

```json
{
  "error": {
    "code": "error_code",
    "message": "Human-readable error description",
    "request_id": "unique_request_identifier",
    "hint": "Optional suggestion for resolution"
  }
}
```

**Required Error Codes**:
- `invalid_json`: Malformed JSON structure
- `unsupported_algorithm`: Algorithm not supported (not ES256 or EdDSA)
- `missing_key`: Key identifier not found in JWKS
- `invalid_signature`: Signature verification failed
- `canonicalization_error`: JCS canonicalization failed
- `missing_required_field`: Required field absent in receipt
- `invalid_header`: Protected header malformed or invalid
- `rate_limit_exceeded`: Request rate limit exceeded (HTTP 429)
- `key_expired`: Signing key has expired
- `malformed_receipt`: Receipt structure invalid

**HTTP Status Codes**:
- `400`: Bad Request (client error in receipt format)
- `401`: Unauthorized (invalid or missing authentication)
- `404`: Not Found (key or resource not found)
- `422`: Unprocessable Entity (valid JSON, invalid semantics)
- `429`: Too Many Requests (rate limiting)
- `500`: Internal Server Error (server-side processing error)

### 7.4 Rate Limiting

**Requirements**:
- Implementations SHOULD implement rate limiting to prevent abuse
- Rate limit responses MUST use HTTP 429 status code
- Rate limit headers SHOULD be included in responses

**Recommended Headers**:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
Retry-After: 60
```

**Rate Limit Structure**:
- **Signing operations**: 100 requests per minute per API key
- **Verification operations**: 1000 requests per minute per IP
- **JWKS retrieval**: 10 requests per minute per IP (with caching encouraged)

## 8. Security Considerations

### 8.1 Key Security

- Private keys must be stored securely (HSM recommended)
- Key rotation should be performed regularly
- Historical keys must be maintained for verification

### 8.2 Implementation Security

- Validate all inputs before processing
- Use constant-time operations for cryptographic functions
- Implement proper error handling without information leakage
- Follow secure coding practices for key management

### 8.3 Operational Security

- Monitor for key compromise
- Implement proper access controls
- Maintain audit logs for key usage
- Plan for incident response procedures

## 9. Interoperability

### 9.1 Multiple Implementations

The CertNode standard enables multiple compatible implementations:
- Reference implementation at `api.certnode.io`
- Custom implementations following this specification
- Different programming languages and platforms

### 9.2 Cross-Platform Verification

Receipts generated by any compliant implementation can be verified by any other compliant implementation, ensuring true interoperability.

## 10. Examples

### 10.1 Complete Receipt Example

```json
{
  "protected": "eyJhbGciOiJFUzI1NiIsImtpZCI6IjhzRHFWdVlqeU5tIn0",
  "payload": {
    "document_id": "DOC-2025-001",
    "content": "This is the document content",
    "timestamp": "2025-01-15T10:30:00Z"
  },
  "signature": "MEQCIAH8B3K2l1D0F9X7Zz8Q2P5M6N7R3S4T5U6V7W8X9Y0ZAiBCK3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z8A9B0C1D2E3F4",
  "kid": "8sDqVuYjyNm",
  "payload_jcs_sha256": "uU0nuZNNPgilLlLX2n2r-sSE7-N6U4DukIj3rOLvzek",
  "receipt_id": "q1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6j7k8l9z0x1c2v3b4n5m6"
}
```

### 10.2 Corresponding JWKS

```json
{
  "keys": [{
    "kty": "EC",
    "crv": "P-256",
    "x": "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
    "y": "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
    "kid": "8sDqVuYjyNm",
    "use": "sig"
  }]
}
```

## 11. References

- RFC 7515: JSON Web Signature (JWS)
- RFC 8785: JSON Canonicalization Scheme (JCS)
- RFC 7517: JSON Web Key (JWK)
- RFC 7638: JSON Web Key (JWK) Thumbprint
- FIPS 186-4: Digital Signature Standard

## 12. Implementation Status

### 12.1 Reference Implementation

Available at: `https://github.com/srbryant86/certnode`

### 12.2 SDKs

- **Node.js**: `@certnode/sdk`
- **Browser**: `@certnode/sdk-web`
- **Go**: Available in repository
- **Python**: Available in repository

### 12.3 Validation

Use the protocol validator at: `https://certnode.io/validator`

---

**Document Status**: Draft Standard
**Last Updated**: September 2025
**Next Review**: March 2026