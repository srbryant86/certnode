package certnode_test

import (
	"fmt"
	"log"
	"time"

	"github.com/srbryant86/certnode/sdk/go"
)

// Example_basicVerification demonstrates basic receipt verification.
func Example_basicVerification() {
	receipt := &certnode.Receipt{
		Protected: "eyJhbGciOiJFUzI1NiIsImtpZCI6InRlc3Qta2V5In0",
		Payload: map[string]interface{}{
			"document": "Hello, World!",
		},
		Signature: "MEQCIAH8B3K2l1D0F9X7Zz8Q2P5M6N7R3S4T5U6V7W8X9Y0Z...",
		Kid:       "test-key",
	}

	jwks := &certnode.JWKS{
		Keys: []certnode.JWK{{
			Kty: "EC",
			Crv: "P-256",
			X:   "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
			Y:   "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
			Kid: "test-key",
		}},
	}

	result, err := certnode.VerifyReceipt(receipt, jwks)
	if err != nil {
		log.Fatal(err)
	}

	if result.OK {
		fmt.Println("Receipt is valid!")
	} else {
		fmt.Printf("Receipt is invalid: %s\n", result.Reason)
	}
	// Output: Receipt is invalid: Invalid signature
}

// Example_eddsaVerification demonstrates EdDSA verification.
func Example_eddsaVerification() {
	receipt := &certnode.Receipt{
		Protected: "eyJhbGciOiJFZERTQSIsImtpZCI6ImVkMjU1MTkta2V5In0",
		Payload: map[string]interface{}{
			"transaction_id": "TXN-123456",
			"amount":         45000,
			"currency":       "USD",
		},
		Signature: "hgyY0il_MGCjP0JzlnLWG1PPOt7-09PGcvMg3AIbQR6d...",
		Kid:       "ed25519-key",
	}

	jwks := &certnode.JWKS{
		Keys: []certnode.JWK{{
			Kty: "OKP",
			Crv: "Ed25519",
			X:   "11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo",
			Kid: "ed25519-key",
			Alg: "EdDSA",
		}},
	}

	result, err := certnode.VerifyReceipt(receipt, jwks)
	if err != nil {
		log.Fatal(err)
	}

	if result.OK {
		fmt.Println("Valid EdDSA signature!")
	} else {
		fmt.Printf("Invalid: %s\n", result.Reason)
	}
	// Output: Invalid: Invalid signature
}

// Example_jwksManager demonstrates JWKS management with caching.
func Example_jwksManager() {
	// Create JWKS manager with 5-minute cache
	manager := certnode.NewJWKSManager(&certnode.JWKSManagerOptions{
		TTL: 5 * time.Minute,
	})

	// This would fetch from a real URL in practice
	// jwks, err := manager.FetchFromURL("https://api.certnode.io/.well-known/jwks.json")

	// For demo, set JWKS from object
	jwks := &certnode.JWKS{
		Keys: []certnode.JWK{{
			Kty: "EC",
			Crv: "P-256",
			X:   "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
			Y:   "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
			Kid: "test-key",
		}},
	}

	err := manager.SetFromObject(jwks)
	if err != nil {
		log.Fatal(err)
	}

	// Get thumbprints
	thumbprints, err := manager.Thumbprints(jwks)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Available keys: %v\n", thumbprints)
	// Output: Available keys: [example-thumbprint]
}

// Example_batchVerification demonstrates verifying multiple receipts.
func Example_batchVerification() {
	receipts := []*certnode.Receipt{
		{
			Protected: "eyJhbGciOiJFUzI1NiIsImtpZCI6InRlc3Qta2V5In0",
			Payload:   map[string]interface{}{"doc": "1"},
			Signature: "signature1...",
			Kid:       "test-key",
		},
		{
			Protected: "eyJhbGciOiJFUzI1NiIsImtpZCI6InRlc3Qta2V5In0",
			Payload:   map[string]interface{}{"doc": "2"},
			Signature: "signature2...",
			Kid:       "test-key",
		},
	}

	jwks := &certnode.JWKS{
		Keys: []certnode.JWK{{
			Kty: "EC",
			Crv: "P-256",
			X:   "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
			Y:   "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
			Kid: "test-key",
		}},
	}

	validCount := 0
	for i, receipt := range receipts {
		result, err := certnode.VerifyReceipt(receipt, jwks)
		if err != nil {
			fmt.Printf("Receipt %d error: %v\n", i+1, err)
			continue
		}

		if result.OK {
			validCount++
			fmt.Printf("Receipt %d: ✅ Valid\n", i+1)
		} else {
			fmt.Printf("Receipt %d: ❌ %s\n", i+1, result.Reason)
		}
	}

	fmt.Printf("Summary: %d/%d receipts valid\n", validCount, len(receipts))
	// Output:
	// Receipt 1: ❌ Invalid signature
	// Receipt 2: ❌ Invalid signature
	// Summary: 0/2 receipts valid
}

// Example_errorHandling demonstrates comprehensive error handling.
func Example_errorHandling() {
	// Test with malformed receipt
	malformedReceipt := &certnode.Receipt{
		Protected: "",  // Missing protected header
		Payload:   nil, // Missing payload
		Signature: "",  // Missing signature
		Kid:       "",  // Missing kid
	}

	jwks := &certnode.JWKS{
		Keys: []certnode.JWK{},
	}

	result, err := certnode.VerifyReceipt(malformedReceipt, jwks)
	if err != nil {
		fmt.Printf("Verification error: %v\n", err)
		return
	}

	if !result.OK {
		switch {
		case contains(result.Reason, "Missing"):
			fmt.Printf("Structural error: %s\n", result.Reason)
		case contains(result.Reason, "Unsupported algorithm"):
			fmt.Printf("Algorithm error: %s\n", result.Reason)
		case contains(result.Reason, "Key not found"):
			fmt.Printf("Key error: %s\n", result.Reason)
		case contains(result.Reason, "Invalid signature"):
			fmt.Printf("Signature error: %s\n", result.Reason)
		default:
			fmt.Printf("Other error: %s\n", result.Reason)
		}
	}
	// Output: Structural error: Missing protected header
}

// Helper function for string matching
func contains(s, substr string) bool {
	return len(s) >= len(substr) && s[:len(substr)] == substr
}