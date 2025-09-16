#!/bin/bash
# CertNode API - Curl Examples
# Copy and paste these commands to test the API

# Set base URL (change for local development)
BASE_URL="https://api.certnode.io"
# For local development, use: BASE_URL="http://localhost:8785"

echo "=== CertNode API Examples ==="
echo

# 1. Health Check
echo "1. Health Check:"
echo "curl -X GET $BASE_URL/health"
echo
curl -X GET $BASE_URL/health
echo
echo

# 2. Get JWKS (Public Keys)
echo "2. Get JWKS (Public Keys):"
echo "curl -X GET $BASE_URL/.well-known/jwks.json"
echo
curl -X GET $BASE_URL/.well-known/jwks.json
echo
echo

# 3. Sign a payload
echo "3. Sign a payload:"
cat << 'EOF'
curl -X POST $BASE_URL/v1/sign \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "docId": "example-doc-123",
      "hash": "sha256-XUFAKrxLKna5cZ2REBfFkg==",
      "issuer": "your-organization",
      "issued_at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
    }
  }'
EOF
echo
echo

# 4. Verify with hosted samples
echo "4. Verify with hosted samples:"
cat << 'EOF'
curl -X POST $BASE_URL/v1/verify \
  -H "Content-Type: application/json" \
  -d '{
    "receipt_ref": "https://certnode.vercel.app/samples/receipt.json",
    "jwks_ref": "https://certnode.vercel.app/samples/jwks.json"
  }'
EOF
echo
echo

# 5. Verify with inline data (using sample files)
echo "5. Verify with inline data (using sample files):"
cat << 'EOF'
curl -X POST $BASE_URL/v1/verify \
  -H "Content-Type: application/json" \
  -d '{
    "receipt": {
      "protected": "eyJhbGciOiJFUzI1NiIsImtpZCI6ImRlbW8tMjAyNS0wOS0xNiJ9",
      "payload": "eyJkb2NJZCI6ImRlbW8tMTIzIiwiaGFzaCI6InNoYTI1Ni1LcGRSYkRWTGFJU00yOWoxU2lKcUNsV3lIdEU0NGdldGJGeTduQUNxV3VvPSIsImlzc3VlciI6ImNlcnRub2RlLnNhbXBsZSIsImlzc3VlZF9hdCI6IjIwMjUtMDktMTZUMDI6NDQ6MTMuNjQ3WiJ9",
      "signature": "rIJxuZVSc7QVAy0yJL-s7BKEzlhb4GGyP36-TBSz88F34ij-yeWko2i4Z3MIRpJGQWRYpiboHj-kVQmPFNdSig",
      "kid": "demo-2025-09-16"
    },
    "jwks": {
      "keys": [
        {
          "kty": "EC",
          "crv": "P-256",
          "x": "WKn-ZIGevcwGIyyrzFoZNBdaq9_TsqzGHwHitJBcBmXdHqVhNnp7ZGWs7pxZ_YBB",
          "y": "Hc7ZUQGlM-crzCUchDG-wGPL7FBrBLi-PG3DWGWS4KnmQE7gV2nzJZT8O_Kv5ePG",
          "kid": "demo-2025-09-16",
          "alg": "ES256",
          "use": "sig"
        }
      ]
    }
  }'
EOF
echo
echo

# 6. Combined download and verify
echo "6. Download samples and verify:"
cat << 'EOF'
# Download samples
RECEIPT=$(curl -s https://certnode.vercel.app/samples/receipt.json)
JWKS=$(curl -s https://certnode.vercel.app/samples/jwks.json)

# Verify
curl -X POST $BASE_URL/v1/verify \
  -H "Content-Type: application/json" \
  -d "{\"receipt\": $RECEIPT, \"jwks\": $JWKS}"
EOF
echo

echo "=== End Examples ==="
echo "For more information, visit: https://certnode.vercel.app/openapi"