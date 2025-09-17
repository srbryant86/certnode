// Package certnode provides receipt verification for CertNode tamper-evident digital records.
//
// This package supports ES256 (ECDSA P-256) and EdDSA (Ed25519) signature algorithms
// with zero external dependencies beyond the Go standard library and golang.org/x/crypto.
//
// Example usage:
//
//	receipt := &certnode.Receipt{
//		Protected: "eyJhbGciOiJFUzI1NiIsImtpZCI6InRlc3Qta2V5In0",
//		Payload:   map[string]interface{}{"document": "Hello, World!"},
//		Signature: "MEQCIAH8B3K2l1D0F9X7Zz8Q2P5M6N7R3S4T5U6V7W8X9Y0Z...",
//		Kid:       "test-key",
//	}
//
//	jwks := &certnode.JWKS{
//		Keys: []certnode.JWK{{
//			Kty: "EC",
//			Crv: "P-256",
//			X:   "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
//			Y:   "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
//			Kid: "test-key",
//		}},
//	}
//
//	result, err := certnode.VerifyReceipt(receipt, jwks)
//	if err != nil {
//		log.Fatal(err)
//	}
//
//	if result.OK {
//		fmt.Println("Receipt is valid!")
//	} else {
//		fmt.Printf("Receipt is invalid: %s\n", result.Reason)
//	}
package certnode

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"sort"
	"strings"

	"golang.org/x/crypto/ed25519"
)

// Receipt represents a CertNode receipt for verification.
type Receipt struct {
	Protected        string      `json:"protected"`
	Payload          interface{} `json:"payload"`
	Signature        string      `json:"signature"`
	Kid              string      `json:"kid"`
	PayloadJCSSHA256 string      `json:"payload_jcs_sha256,omitempty"`
	ReceiptID        string      `json:"receipt_id,omitempty"`
}

// JWK represents a JSON Web Key.
type JWK struct {
	Kty string `json:"kty"`
	Crv string `json:"crv,omitempty"`
	X   string `json:"x,omitempty"`
	Y   string `json:"y,omitempty"`
	Kid string `json:"kid,omitempty"`
	Alg string `json:"alg,omitempty"`
}

// JWKS represents a JSON Web Key Set.
type JWKS struct {
	Keys []JWK `json:"keys"`
}

// VerifyResult represents the result of receipt verification.
type VerifyResult struct {
	OK     bool   `json:"ok"`
	Reason string `json:"reason,omitempty"`
}

// Header represents the JWS protected header.
type Header struct {
	Alg string `json:"alg"`
	Kid string `json:"kid"`
}

// VerifyReceipt verifies a CertNode receipt against a JWKS.
func VerifyReceipt(receipt *Receipt, jwks *JWKS) (*VerifyResult, error) {
	if receipt == nil {
		return &VerifyResult{OK: false, Reason: "Receipt is nil"}, nil
	}

	if jwks == nil {
		return &VerifyResult{OK: false, Reason: "JWKS is nil"}, nil
	}

	// Validate receipt structure
	if receipt.Protected == "" {
		return &VerifyResult{OK: false, Reason: "Missing protected header"}, nil
	}
	if receipt.Signature == "" {
		return &VerifyResult{OK: false, Reason: "Missing signature"}, nil
	}
	if receipt.Payload == nil {
		return &VerifyResult{OK: false, Reason: "Missing payload"}, nil
	}
	if receipt.Kid == "" {
		return &VerifyResult{OK: false, Reason: "Missing kid"}, nil
	}

	// Decode protected header
	headerBytes, err := base64URLDecode(receipt.Protected)
	if err != nil {
		return &VerifyResult{OK: false, Reason: fmt.Sprintf("Invalid protected header: %v", err)}, nil
	}

	var header Header
	if err := json.Unmarshal(headerBytes, &header); err != nil {
		return &VerifyResult{OK: false, Reason: fmt.Sprintf("Invalid header JSON: %v", err)}, nil
	}

	// Validate algorithm
	if header.Alg != "ES256" && header.Alg != "EdDSA" {
		return &VerifyResult{OK: false, Reason: fmt.Sprintf("Unsupported algorithm: %s. Use ES256 or EdDSA", header.Alg)}, nil
	}

	// Validate kid consistency
	if header.Kid != receipt.Kid {
		return &VerifyResult{OK: false, Reason: "Kid mismatch between header and receipt"}, nil
	}

	// Find matching key in JWKS
	var key *JWK
	for i := range jwks.Keys {
		k := &jwks.Keys[i]

		// Try matching by RFC7638 thumbprint
		if thumbprint, err := JWKThumbprint(k); err == nil && thumbprint == receipt.Kid {
			key = k
			break
		}

		// Try matching by kid field
		if k.Kid == receipt.Kid {
			key = k
			break
		}
	}

	if key == nil {
		return &VerifyResult{OK: false, Reason: fmt.Sprintf("Key not found in JWKS: %s", receipt.Kid)}, nil
	}

	// Validate JCS hash if present
	if receipt.PayloadJCSSHA256 != "" {
		jcsBytes, err := CanonicalizeJSON(receipt.Payload)
		if err != nil {
			return &VerifyResult{OK: false, Reason: fmt.Sprintf("JCS canonicalization failed: %v", err)}, nil
		}

		jcsHash := sha256.Sum256(jcsBytes)
		expectedHash, err := base64URLDecode(receipt.PayloadJCSSHA256)
		if err != nil {
			return &VerifyResult{OK: false, Reason: fmt.Sprintf("Invalid JCS hash format: %v", err)}, nil
		}

		if !bytesEqual(jcsHash[:], expectedHash) {
			return &VerifyResult{OK: false, Reason: "JCS hash mismatch"}, nil
		}
	}

	// Create signing input (protected + '.' + JCS(payload))
	payloadBytes, err := CanonicalizeJSON(receipt.Payload)
	if err != nil {
		return &VerifyResult{OK: false, Reason: fmt.Sprintf("Payload canonicalization failed: %v", err)}, nil
	}

	payloadB64u := base64URLEncode(payloadBytes)
	signingInput := receipt.Protected + "." + payloadB64u
	signingData := []byte(signingInput)

	// Verify signature based on algorithm
	signatureBytes, err := base64URLDecode(receipt.Signature)
	if err != nil {
		return &VerifyResult{OK: false, Reason: fmt.Sprintf("Invalid signature format: %v", err)}, nil
	}

	var isValid bool
	switch header.Alg {
	case "ES256":
		isValid, err = verifyES256(key, signingData, signatureBytes)
	case "EdDSA":
		isValid, err = verifyEdDSA(key, signingData, signatureBytes)
	default:
		return &VerifyResult{OK: false, Reason: fmt.Sprintf("Unsupported algorithm: %s", header.Alg)}, nil
	}

	if err != nil {
		return &VerifyResult{OK: false, Reason: fmt.Sprintf("Signature verification failed: %v", err)}, nil
	}

	if !isValid {
		return &VerifyResult{OK: false, Reason: "Invalid signature"}, nil
	}

	// Optional receipt_id check if present
	if receipt.ReceiptID != "" {
		fullReceipt := receipt.Protected + "." + payloadB64u + "." + receipt.Signature
		receiptHash := sha256.Sum256([]byte(fullReceipt))
		computedID := base64URLEncode(receiptHash[:])

		if computedID != receipt.ReceiptID {
			return &VerifyResult{OK: false, Reason: "Receipt ID mismatch"}, nil
		}
	}

	return &VerifyResult{OK: true}, nil
}

// verifyES256 verifies an ES256 signature using ECDSA P-256.
func verifyES256(jwk *JWK, signingData, signatureBytes []byte) (bool, error) {
	if jwk.Kty != "EC" || jwk.Crv != "P-256" {
		return false, errors.New("ES256 requires EC P-256 key")
	}

	if jwk.X == "" || jwk.Y == "" {
		return false, errors.New("Invalid P-256 JWK: missing x or y coordinate")
	}

	// Convert JWK to public key
	xBytes, err := base64URLDecode(jwk.X)
	if err != nil {
		return false, fmt.Errorf("invalid x coordinate: %v", err)
	}

	yBytes, err := base64URLDecode(jwk.Y)
	if err != nil {
		return false, fmt.Errorf("invalid y coordinate: %v", err)
	}

	if len(xBytes) != 32 || len(yBytes) != 32 {
		return false, errors.New("invalid coordinate length for P-256")
	}

	// Create public key
	publicKey := &ecdsa.PublicKey{
		Curve: elliptic.P256(),
		X:     new(big.Int).SetBytes(xBytes),
		Y:     new(big.Int).SetBytes(yBytes),
	}

	// Verify the key is on the curve
	if !publicKey.Curve.IsOnCurve(publicKey.X, publicKey.Y) {
		return false, errors.New("public key point is not on curve")
	}

	// Convert JOSE signature to (r, s) format
	if len(signatureBytes) != 64 {
		return false, errors.New("ES256 signature must be 64 bytes")
	}

	r := new(big.Int).SetBytes(signatureBytes[:32])
	s := new(big.Int).SetBytes(signatureBytes[32:])

	// Hash the signing data
	hash := sha256.Sum256(signingData)

	// Verify signature
	return ecdsa.Verify(publicKey, hash[:], r, s), nil
}

// verifyEdDSA verifies an EdDSA signature using Ed25519.
func verifyEdDSA(jwk *JWK, signingData, signatureBytes []byte) (bool, error) {
	if jwk.Kty != "OKP" || jwk.Crv != "Ed25519" {
		return false, errors.New("EdDSA requires OKP Ed25519 key")
	}

	if jwk.X == "" {
		return false, errors.New("Invalid Ed25519 JWK: missing x coordinate")
	}

	// Convert JWK to public key
	publicKeyBytes, err := base64URLDecode(jwk.X)
	if err != nil {
		return false, fmt.Errorf("invalid x coordinate: %v", err)
	}

	if len(publicKeyBytes) != ed25519.PublicKeySize {
		return false, fmt.Errorf("invalid public key length for Ed25519: expected %d, got %d", ed25519.PublicKeySize, len(publicKeyBytes))
	}

	publicKey := ed25519.PublicKey(publicKeyBytes)

	// Verify signature (Ed25519 uses raw signature format)
	return ed25519.Verify(publicKey, signingData, signatureBytes), nil
}

// JWKThumbprint generates a JWK thumbprint according to RFC 7638.
func JWKThumbprint(jwk *JWK) (string, error) {
	var canonical map[string]interface{}

	if jwk.Kty == "EC" && jwk.Crv == "P-256" && jwk.X != "" && jwk.Y != "" {
		canonical = map[string]interface{}{
			"crv": jwk.Crv,
			"kty": jwk.Kty,
			"x":   jwk.X,
			"y":   jwk.Y,
		}
	} else if jwk.Kty == "OKP" && jwk.Crv == "Ed25519" && jwk.X != "" {
		canonical = map[string]interface{}{
			"crv": jwk.Crv,
			"kty": jwk.Kty,
			"x":   jwk.X,
		}
	} else {
		return "", errors.New("only EC P-256 and OKP Ed25519 JWK supported for thumbprint")
	}

	// Create canonical JSON
	canonicalJSON, err := json.Marshal(canonical)
	if err != nil {
		return "", fmt.Errorf("failed to marshal canonical JWK: %v", err)
	}

	// Hash and encode
	hash := sha256.Sum256(canonicalJSON)
	return base64URLEncode(hash[:]), nil
}

// CanonicalizeJSON canonicalizes JSON according to RFC 8785 (JCS).
func CanonicalizeJSON(obj interface{}) ([]byte, error) {
	canonical, err := stringifyCanonical(obj)
	if err != nil {
		return nil, err
	}
	return []byte(canonical), nil
}

// stringifyCanonical converts a value to canonical JSON string.
func stringifyCanonical(value interface{}) (string, error) {
	switch v := value.(type) {
	case nil:
		return "null", nil
	case bool:
		if v {
			return "true", nil
		}
		return "false", nil
	case float64, int, int32, int64:
		// Use standard JSON marshaling for numbers
		b, err := json.Marshal(v)
		if err != nil {
			return "", err
		}
		return string(b), nil
	case string:
		b, err := json.Marshal(v)
		if err != nil {
			return "", err
		}
		return string(b), nil
	case []interface{}:
		var items []string
		for _, item := range v {
			itemStr, err := stringifyCanonical(item)
			if err != nil {
				return "", err
			}
			items = append(items, itemStr)
		}
		return "[" + strings.Join(items, ",") + "]", nil
	case map[string]interface{}:
		// Sort keys
		keys := make([]string, 0, len(v))
		for k := range v {
			keys = append(keys, k)
		}
		sort.Strings(keys)

		var parts []string
		for _, k := range keys {
			val := v[k]
			if val == nil {
				continue // Skip null values at object level
			}

			keyStr, err := json.Marshal(k)
			if err != nil {
				return "", err
			}

			valStr, err := stringifyCanonical(val)
			if err != nil {
				return "", err
			}

			parts = append(parts, string(keyStr)+":"+valStr)
		}
		return "{" + strings.Join(parts, ",") + "}", nil
	default:
		// Fallback to regular JSON for other types
		b, err := json.Marshal(v)
		if err != nil {
			return "", err
		}
		return string(b), nil
	}
}

// base64URLEncode encodes data using base64url encoding.
func base64URLEncode(data []byte) string {
	return base64.URLEncoding.WithPadding(base64.NoPadding).EncodeToString(data)
}

// base64URLDecode decodes base64url encoded data.
func base64URLDecode(data string) ([]byte, error) {
	return base64.URLEncoding.WithPadding(base64.NoPadding).DecodeString(data)
}

// bytesEqual compares two byte slices for equality.
func bytesEqual(a, b []byte) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}