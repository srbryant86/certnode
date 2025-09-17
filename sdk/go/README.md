# CertNode Go SDK

[![Go Reference](https://pkg.go.dev/badge/github.com/srbryant86/certnode/sdk/go.svg)](https://pkg.go.dev/github.com/srbryant86/certnode/sdk/go)
[![Go Report Card](https://goreportcard.com/badge/github.com/srbryant86/certnode/sdk/go)](https://goreportcard.com/report/github.com/srbryant86/certnode/sdk/go)

Go SDK for CertNode receipt verification. Supports ES256 (ECDSA P-256) and EdDSA (Ed25519) algorithms with minimal dependencies.

## 🚀 Quick Start

```bash
go get github.com/srbryant86/certnode/sdk/go
```

```go
package main

import (
    "fmt"
    "log"

    "github.com/srbryant86/certnode/sdk/go"
)

func main() {
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
}
```

## 📖 Features

- ✅ **Minimal Dependencies** - Only requires `golang.org/x/crypto`
- ✅ **ES256 Support** - ECDSA P-256 signatures (RFC 7515)
- ✅ **EdDSA Support** - Ed25519 deterministic signatures
- ✅ **JSON Canonicalization** - RFC 8785 JCS for consistent hashing
- ✅ **Type Safety** - Full Go type safety and documentation
- ✅ **JWKS Management** - Automatic key fetching and caching
- ✅ **Concurrent Safe** - Thread-safe JWKS caching
- ✅ **Production Ready** - Used in enterprise environments

## 🔧 API Reference

### Types

```go
// Receipt represents a CertNode receipt for verification
type Receipt struct {
    Protected        string      `json:"protected"`
    Payload          interface{} `json:"payload"`
    Signature        string      `json:"signature"`
    Kid              string      `json:"kid"`
    PayloadJCSSHA256 string      `json:"payload_jcs_sha256,omitempty"`
    ReceiptID        string      `json:"receipt_id,omitempty"`
}

// JWK represents a JSON Web Key
type JWK struct {
    Kty string `json:"kty"`
    Crv string `json:"crv,omitempty"`
    X   string `json:"x,omitempty"`
    Y   string `json:"y,omitempty"`
    Kid string `json:"kid,omitempty"`
    Alg string `json:"alg,omitempty"`
}

// JWKS represents a JSON Web Key Set
type JWKS struct {
    Keys []JWK `json:"keys"`
}

// VerifyResult represents the result of receipt verification
type VerifyResult struct {
    OK     bool   `json:"ok"`
    Reason string `json:"reason,omitempty"`
}
```

### Functions

#### `VerifyReceipt(receipt *Receipt, jwks *JWKS) (*VerifyResult, error)`

Verifies a CertNode receipt against a JWKS.

**Parameters:**
- `receipt`: The receipt to verify
- `jwks`: JWKS containing public keys

**Returns:** `*VerifyResult` and `error`

#### `JWKThumbprint(jwk *JWK) (string, error)`

Generates RFC 7638 JWK thumbprint.

#### `CanonicalizeJSON(obj interface{}) ([]byte, error)`

Canonicalizes JSON according to RFC 8785.

### JWKS Management

```go
type JWKSManager struct {
    // ... (internal fields)
}

type JWKSManagerOptions struct {
    TTL     time.Duration
    Client  *http.Client
    Fetcher func(url string) (*JWKS, error)
}

func NewJWKSManager(opts *JWKSManagerOptions) *JWKSManager
func (m *JWKSManager) FetchFromURL(url string) (*JWKS, error)
func (m *JWKSManager) SetFromObject(jwks *JWKS) error
func (m *JWKSManager) GetFresh() *JWKS
func (m *JWKSManager) Thumbprints(jwks *JWKS) ([]string, error)
```

## 📚 Examples

### Basic Verification

```go
package main

import (
    "fmt"
    "log"

    "github.com/srbryant86/certnode/sdk/go"
)

func main() {
    receipt := &certnode.Receipt{
        Protected: "eyJhbGciOiJFUzI1NiIsImtpZCI6InByb2QtMjAyNSJ9",
        Payload: map[string]interface{}{
            "document_id": "DOC-2025-001",
            "content":     "Financial audit report Q4 2024",
            "timestamp":   "2025-01-15T10:30:00Z",
        },
        Signature:        "MEQCIAH8B3K2l1D0F9X7Zz8Q2P5M6N7R3S4T5U6V7W8X9Y0Z...",
        Kid:              "prod-2025",
        PayloadJCSSHA256: "uU0nuZNNPgilLlLX2n2r-sSE7-N6U4DukIj3rOLvzek",
    }

    jwks := &certnode.JWKS{
        Keys: []certnode.JWK{{
            Kty: "EC",
            Crv: "P-256",
            X:   "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
            Y:   "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
            Kid: "prod-2025",
            Alg: "ES256",
        }},
    }

    result, err := certnode.VerifyReceipt(receipt, jwks)
    if err != nil {
        log.Fatalf("Verification error: %v", err)
    }

    if result.OK {
        fmt.Println("✅ Document is authentic and unmodified")
    } else {
        fmt.Printf("❌ Verification failed: %s\n", result.Reason)
    }
}
```

### EdDSA (Ed25519) Verification

```go
package main

import (
    "fmt"
    "log"

    "github.com/srbryant86/certnode/sdk/go"
)

func verifyWithEdDSA() {
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
        log.Fatalf("EdDSA verification error: %v", err)
    }

    if result.OK {
        fmt.Println("Valid EdDSA signature!")
    } else {
        fmt.Printf("Invalid: %s\n", result.Reason)
    }
}
```

### JWKS Management with Caching

```go
package main

import (
    "fmt"
    "log"
    "time"

    "github.com/srbryant86/certnode/sdk/go"
)

func verifyWithJWKSManager() {
    // Initialize JWKS manager with 5-minute cache
    manager := certnode.NewJWKSManager(&certnode.JWKSManagerOptions{
        TTL: 5 * time.Minute,
    })

    // Fetch JWKS from CertNode's public endpoint
    jwks, err := manager.FetchFromURL("https://api.certnode.io/.well-known/jwks.json")
    if err != nil {
        log.Fatalf("Failed to fetch JWKS: %v", err)
    }

    receipt := &certnode.Receipt{
        Protected: "eyJhbGciOiJFUzI1NiIsImtpZCI6ImNlcnQtMjAyNS0wMS0xNSJ9",
        Payload: map[string]interface{}{
            "message": "Hello from CertNode!",
        },
        Signature: "MEQCIAH8B3K2l1D0F9X7Zz8Q2P5M6N7R3S4T5U6V7W8X9Y0Z...",
        Kid:       "cert-2025-01-15",
    }

    result, err := certnode.VerifyReceipt(receipt, jwks)
    if err != nil {
        log.Fatalf("Verification error: %v", err)
    }

    if result.OK {
        fmt.Println("✅ Receipt verified against live JWKS")
    } else {
        fmt.Printf("❌ %s\n", result.Reason)
    }

    // Check available key thumbprints
    thumbprints, err := manager.Thumbprints(jwks)
    if err != nil {
        log.Printf("Error getting thumbprints: %v", err)
    } else {
        fmt.Printf("Available keys: %v\n", thumbprints)
    }
}
```

### Error Handling

```go
package main

import (
    "fmt"
    "strings"

    "github.com/srbryant86/certnode/sdk/go"
)

func handleVerificationErrors() {
    // Malformed receipt
    receipt := &certnode.Receipt{
        Protected: "",  // Missing
        Payload:   nil, // Missing
        Signature: "",  // Missing
        Kid:       "",  // Missing
    }

    jwks := &certnode.JWKS{
        Keys: []certnode.JWK{},
    }

    result, err := certnode.VerifyReceipt(receipt, jwks)
    if err != nil {
        fmt.Printf("Verification error: %v\n", err)
        return
    }

    if !result.OK {
        // Handle specific error cases
        switch {
        case strings.Contains(result.Reason, "Unsupported algorithm"):
            fmt.Println("Algorithm not supported. Use ES256 or EdDSA.")
        case strings.Contains(result.Reason, "Key not found"):
            fmt.Println("Signing key not available in JWKS.")
        case strings.Contains(result.Reason, "Invalid signature"):
            fmt.Println("Document has been tampered with.")
        case strings.Contains(result.Reason, "Missing"):
            fmt.Printf("Structural error: %s\n", result.Reason)
        default:
            fmt.Printf("Verification failed: %s\n", result.Reason)
        }
    }
}
```

### Batch Verification

```go
package main

import (
    "fmt"
    "sync"

    "github.com/srbryant86/certnode/sdk/go"
)

type BatchResult struct {
    Index   int
    Receipt *certnode.Receipt
    Result  *certnode.VerifyResult
    Error   error
}

func verifyBatch(receipts []*certnode.Receipt, jwks *certnode.JWKS, workers int) []BatchResult {
    jobs := make(chan int, len(receipts))
    results := make([]BatchResult, len(receipts))

    var wg sync.WaitGroup

    // Worker function
    worker := func() {
        defer wg.Done()
        for index := range jobs {
            result, err := certnode.VerifyReceipt(receipts[index], jwks)
            results[index] = BatchResult{
                Index:   index,
                Receipt: receipts[index],
                Result:  result,
                Error:   err,
            }
        }
    }

    // Start workers
    for i := 0; i < workers; i++ {
        wg.Add(1)
        go worker()
    }

    // Send jobs
    for i := range receipts {
        jobs <- i
    }
    close(jobs)

    // Wait for completion
    wg.Wait()

    return results
}

func main() {
    receipts := []*certnode.Receipt{
        // ... your receipts
    }

    jwks := &certnode.JWKS{
        // ... your JWKS
    }

    results := verifyBatch(receipts, jwks, 4) // 4 workers

    validCount := 0
    for _, result := range results {
        if result.Error != nil {
            fmt.Printf("Receipt %d error: %v\n", result.Index, result.Error)
            continue
        }

        if result.Result.OK {
            validCount++
            fmt.Printf("Receipt %d: ✅ Valid\n", result.Index)
        } else {
            fmt.Printf("Receipt %d: ❌ %s\n", result.Index, result.Result.Reason)
        }
    }

    fmt.Printf("Summary: %d/%d receipts valid\n", validCount, len(receipts))
}
```

### HTTP Server Integration

```go
package main

import (
    "encoding/json"
    "log"
    "net/http"
    "time"

    "github.com/srbryant86/certnode/sdk/go"
)

type Server struct {
    jwksManager *certnode.JWKSManager
    jwksURL     string
}

func NewServer(jwksURL string) *Server {
    return &Server{
        jwksManager: certnode.NewJWKSManager(&certnode.JWKSManagerOptions{
            TTL: 5 * time.Minute,
        }),
        jwksURL: jwksURL,
    }
}

func (s *Server) verifyHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    var request struct {
        Receipt *certnode.Receipt `json:"receipt"`
    }

    if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }

    if request.Receipt == nil {
        http.Error(w, "Receipt is required", http.StatusBadRequest)
        return
    }

    // Fetch JWKS
    jwks, err := s.jwksManager.FetchFromURL(s.jwksURL)
    if err != nil {
        log.Printf("JWKS fetch error: %v", err)
        http.Error(w, "Failed to fetch verification keys", http.StatusInternalServerError)
        return
    }

    // Verify receipt
    result, err := certnode.VerifyReceipt(request.Receipt, jwks)
    if err != nil {
        log.Printf("Verification error: %v", err)
        http.Error(w, "Verification failed", http.StatusInternalServerError)
        return
    }

    // Return result
    w.Header().Set("Content-Type", "application/json")
    if result.OK {
        w.WriteHeader(http.StatusOK)
    } else {
        w.WriteHeader(http.StatusBadRequest)
    }

    json.NewEncoder(w).Encode(map[string]interface{}{
        "valid":  result.OK,
        "reason": result.Reason,
        "kid":    request.Receipt.Kid,
    })
}

func main() {
    server := NewServer("https://api.certnode.io/.well-known/jwks.json")

    http.HandleFunc("/verify", server.verifyHandler)
    http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
    })

    log.Println("Server starting on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

### gRPC Service Integration

```go
// Proto definition would be in separate .proto file:
// service CertNodeService {
//     rpc VerifyReceipt(VerifyRequest) returns (VerifyResponse);
// }

package main

import (
    "context"
    "log"
    "net"
    "time"

    "google.golang.org/grpc"
    "github.com/srbryant86/certnode/sdk/go"
    // Import your generated protobuf code
)

type certNodeService struct {
    jwksManager *certnode.JWKSManager
    jwksURL     string
}

func NewCertNodeService(jwksURL string) *certNodeService {
    return &certNodeService{
        jwksManager: certnode.NewJWKSManager(&certnode.JWKSManagerOptions{
            TTL: 5 * time.Minute,
        }),
        jwksURL: jwksURL,
    }
}

func (s *certNodeService) VerifyReceipt(ctx context.Context, req *VerifyRequest) (*VerifyResponse, error) {
    // Convert protobuf to Go struct
    receipt := &certnode.Receipt{
        Protected: req.Receipt.Protected,
        Payload:   convertPayload(req.Receipt.Payload), // Helper function
        Signature: req.Receipt.Signature,
        Kid:       req.Receipt.Kid,
    }

    // Fetch JWKS
    jwks, err := s.jwksManager.FetchFromURL(s.jwksURL)
    if err != nil {
        return &VerifyResponse{
            Valid:  false,
            Reason: "Failed to fetch verification keys",
        }, nil
    }

    // Verify
    result, err := certnode.VerifyReceipt(receipt, jwks)
    if err != nil {
        return &VerifyResponse{
            Valid:  false,
            Reason: err.Error(),
        }, nil
    }

    return &VerifyResponse{
        Valid:  result.OK,
        Reason: result.Reason,
        Kid:    receipt.Kid,
    }, nil
}

func main() {
    lis, err := net.Listen("tcp", ":50051")
    if err != nil {
        log.Fatalf("Failed to listen: %v", err)
    }

    s := grpc.NewServer()
    service := NewCertNodeService("https://api.certnode.io/.well-known/jwks.json")

    // RegisterCertNodeServiceServer(s, service)

    log.Println("gRPC server starting on :50051")
    if err := s.Serve(lis); err != nil {
        log.Fatalf("Failed to serve: %v", err)
    }
}
```

### CLI Tool

```go
package main

import (
    "encoding/json"
    "flag"
    "fmt"
    "io"
    "log"
    "os"

    "github.com/srbryant86/certnode/sdk/go"
)

func main() {
    var (
        receiptFile = flag.String("receipt", "", "Receipt file (JSON)")
        jwksURL     = flag.String("jwks", "", "JWKS URL or file")
        verbose     = flag.Bool("verbose", false, "Verbose output")
    )
    flag.Parse()

    if *receiptFile == "" || *jwksURL == "" {
        fmt.Fprintf(os.Stderr, "Usage: %s -receipt <file> -jwks <url|file>\n", os.Args[0])
        os.Exit(1)
    }

    // Load receipt
    receiptData, err := os.ReadFile(*receiptFile)
    if err != nil {
        log.Fatalf("Failed to read receipt file: %v", err)
    }

    var receipt certnode.Receipt
    if err := json.Unmarshal(receiptData, &receipt); err != nil {
        log.Fatalf("Failed to parse receipt JSON: %v", err)
    }

    // Load JWKS
    var jwks *certnode.JWKS
    if isURL(*jwksURL) {
        jwks, err = certnode.FetchJWKS(*jwksURL)
        if err != nil {
            log.Fatalf("Failed to fetch JWKS: %v", err)
        }
        if *verbose {
            fmt.Printf("Fetched JWKS from: %s\n", *jwksURL)
        }
    } else {
        jwksData, err := os.ReadFile(*jwksURL)
        if err != nil {
            log.Fatalf("Failed to read JWKS file: %v", err)
        }
        if err := json.Unmarshal(jwksData, &jwks); err != nil {
            log.Fatalf("Failed to parse JWKS JSON: %v", err)
        }
        if *verbose {
            fmt.Printf("Loaded JWKS from: %s\n", *jwksURL)
        }
    }

    if *verbose {
        fmt.Printf("Verifying receipt with kid: %s\n", receipt.Kid)
        fmt.Printf("JWKS contains %d key(s)\n", len(jwks.Keys))
    }

    // Verify
    result, err := certnode.VerifyReceipt(&receipt, jwks)
    if err != nil {
        log.Fatalf("Verification error: %v", err)
    }

    if result.OK {
        fmt.Println("✅ Receipt verification: VALID")
        if *verbose {
            fmt.Printf("Kid: %s\n", receipt.Kid)
            if receipt.ReceiptID != "" {
                fmt.Printf("Receipt ID: %s\n", receipt.ReceiptID)
            }
        }
        os.Exit(0)
    } else {
        fmt.Println("❌ Receipt verification: INVALID")
        fmt.Printf("Reason: %s\n", result.Reason)
        os.Exit(1)
    }
}

func isURL(s string) bool {
    return len(s) > 4 && (s[:4] == "http" || s[:5] == "https")
}
```

## 🔒 Security Considerations

- **Always verify receipts** against a trusted JWKS source
- **Use HTTPS** when fetching JWKS from remote endpoints
- **Validate key sources** - ensure JWKS comes from trusted authorities
- **Handle errors gracefully** - log failures for security monitoring
- **Keep dependencies updated** - regularly update `golang.org/x/crypto`

## 🧪 Testing

```bash
# Run tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run benchmarks
go test -bench=. ./...

# Generate coverage report
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

## 📦 Installation & Usage

```bash
# Add to your project
go get github.com/srbryant86/certnode/sdk/go

# Import in your code
import "github.com/srbryant86/certnode/sdk/go"
```

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.

## 🔗 Links

- **Documentation**: [https://pkg.go.dev/github.com/srbryant86/certnode/sdk/go](https://pkg.go.dev/github.com/srbryant86/certnode/sdk/go)
- **Go Report**: [https://goreportcard.com/report/github.com/srbryant86/certnode/sdk/go](https://goreportcard.com/report/github.com/srbryant86/certnode/sdk/go)
- **GitHub**: [https://github.com/srbryant86/certnode](https://github.com/srbryant86/certnode)
- **Issues**: [https://github.com/srbryant86/certnode/issues](https://github.com/srbryant86/certnode/issues)

## 🤝 Contributing

Contributions welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) and [Code of Conduct](../../CODE_OF_CONDUCT.md).

---

**Made with ❤️ by the CertNode team**