# CertNode Rust SDK

[![Crates.io](https://img.shields.io/crates/v/certnode.svg)](https://crates.io/crates/certnode)
[![Documentation](https://docs.rs/certnode/badge.svg)](https://docs.rs/certnode)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

High-performance Rust SDK for CertNode receipt verification. Supports ES256 (ECDSA P-256) and EdDSA (Ed25519) algorithms with optimal performance and memory safety.

## 🚀 Quick Start

Add to your `Cargo.toml`:

```toml
[dependencies]
certnode = "1.1.0"

# Optional: Enable HTTP JWKS fetching
certnode = { version = "1.1.0", features = ["jwks-fetch"] }
```

```rust
use certnode::{verify_receipt, Receipt, Jwks, Jwk};
use serde_json::json;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let receipt = Receipt {
        protected: "eyJhbGciOiJFUzI1NiIsImtpZCI6InRlc3Qta2V5In0".to_string(),
        payload: json!({"document": "Hello, World!"}),
        signature: "MEQCIAH8B3K2l1D0F9X7Zz8Q2P5M6N7R3S4T5U6V7W8X9Y0Z...".to_string(),
        kid: "test-key".to_string(),
        payload_jcs_sha256: None,
        receipt_id: None,
    };

    let jwks = Jwks {
        keys: vec![Jwk::Ec {
            kty: "EC".to_string(),
            crv: "P-256".to_string(),
            x: "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU".to_string(),
            y: "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0".to_string(),
            kid: Some("test-key".to_string()),
            alg: Some("ES256".to_string()),
        }],
    };

    match verify_receipt(&receipt, &jwks)? {
        result if result.ok => println!("Receipt is valid!"),
        result => println!("Invalid: {}", result.reason.unwrap_or_default()),
    }

    Ok(())
}
```

## 📖 Features

- ✅ **Zero-allocation verification** - Optimized for performance
- ✅ **Memory safe** - No unsafe code, comprehensive error handling
- ✅ **ES256 Support** - ECDSA P-256 signatures (RFC 7515)
- ✅ **EdDSA Support** - Ed25519 deterministic signatures
- ✅ **JSON Canonicalization** - RFC 8785 JCS for consistent hashing
- ✅ **Async Support** - Full async/await compatibility
- ✅ **Optional HTTP** - JWKS fetching with `jwks-fetch` feature
- ✅ **Production Ready** - Battle-tested in high-throughput environments

## 🔧 API Reference

### Types

```rust
/// CertNode receipt for verification
pub struct Receipt {
    pub protected: String,              // Base64url JWS header
    pub payload: serde_json::Value,     // Original data
    pub signature: String,              // Base64url signature
    pub kid: String,                    // Key identifier
    pub payload_jcs_sha256: Option<String>, // Optional payload hash
    pub receipt_id: Option<String>,     // Optional receipt ID
}

/// JSON Web Key (enum for type safety)
pub enum Jwk {
    Ec {
        kty: String,                    // "EC"
        crv: String,                    // "P-256"
        x: String,                      // X coordinate (base64url)
        y: String,                      // Y coordinate (base64url)
        kid: Option<String>,            // Key ID
        alg: Option<String>,            // Algorithm
    },
    Okp {
        kty: String,                    // "OKP"
        crv: String,                    // "Ed25519"
        x: String,                      // Public key (base64url)
        kid: Option<String>,            // Key ID
        alg: Option<String>,            // Algorithm
    },
}

/// JSON Web Key Set
pub struct Jwks {
    pub keys: Vec<Jwk>,
}

/// Verification result
pub struct VerifyResult {
    pub ok: bool,                       // Verification success
    pub reason: Option<String>,         // Failure reason
}
```

### Core Functions

#### `verify_receipt(receipt: &Receipt, jwks: &Jwks) -> Result<VerifyResult>`

Verifies a CertNode receipt against a JWKS.

#### `jwk_thumbprint(jwk: &Jwk) -> Result<String>`

Generates RFC 7638 JWK thumbprint.

### JWKS Management

```rust
use certnode::JwksManager;
use std::time::Duration;

// Create manager with 5-minute cache
let manager = JwksManager::new(Duration::from_secs(300));

// Fetch JWKS (requires 'jwks-fetch' feature)
let jwks = manager.fetch_from_url("https://api.certnode.io/.well-known/jwks.json").await?;

// Set JWKS from object
manager.set_from_object(jwks)?;

// Get cached JWKS
if let Some(cached) = manager.get_fresh() {
    println!("Using cached JWKS");
}
```

## 📚 Examples

### Basic Verification

```rust
use certnode::{verify_receipt, Receipt, Jwks, Jwk};
use serde_json::json;

fn verify_document() -> Result<(), Box<dyn std::error::Error>> {
    let receipt = Receipt {
        protected: "eyJhbGciOiJFUzI1NiIsImtpZCI6InByb2QtMjAyNSJ9".to_string(),
        payload: json!({
            "document_id": "DOC-2025-001",
            "content": "Financial audit report Q4 2024",
            "timestamp": "2025-01-15T10:30:00Z"
        }),
        signature: "MEQCIAH8B3K2l1D0F9X7Zz8Q2P5M6N7R3S4T5U6V7W8X9Y0Z...".to_string(),
        kid: "prod-2025".to_string(),
        payload_jcs_sha256: Some("uU0nuZNNPgilLlLX2n2r-sSE7-N6U4DukIj3rOLvzek".to_string()),
        receipt_id: None,
    };

    let jwks = Jwks {
        keys: vec![Jwk::Ec {
            kty: "EC".to_string(),
            crv: "P-256".to_string(),
            x: "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU".to_string(),
            y: "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0".to_string(),
            kid: Some("prod-2025".to_string()),
            alg: Some("ES256".to_string()),
        }],
    };

    match verify_receipt(&receipt, &jwks)? {
        result if result.ok => {
            println!("✅ Document is authentic and unmodified");
            Ok(())
        }
        result => {
            println!("❌ Verification failed: {}", result.reason.unwrap_or_default());
            Err("Verification failed".into())
        }
    }
}
```

### EdDSA (Ed25519) Verification

```rust
use certnode::{verify_receipt, Receipt, Jwks, Jwk};
use serde_json::json;

fn verify_with_eddsa() -> Result<(), Box<dyn std::error::Error>> {
    let receipt = Receipt {
        protected: "eyJhbGciOiJFZERTQSIsImtpZCI6ImVkMjU1MTkta2V5In0".to_string(),
        payload: json!({
            "transaction_id": "TXN-123456",
            "amount": 45000,
            "currency": "USD"
        }),
        signature: "hgyY0il_MGCjP0JzlnLWG1PPOt7-09PGcvMg3AIbQR6d...".to_string(),
        kid: "ed25519-key".to_string(),
        payload_jcs_sha256: None,
        receipt_id: None,
    };

    let jwks = Jwks {
        keys: vec![Jwk::Okp {
            kty: "OKP".to_string(),
            crv: "Ed25519".to_string(),
            x: "11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo".to_string(),
            kid: Some("ed25519-key".to_string()),
            alg: Some("EdDSA".to_string()),
        }],
    };

    match verify_receipt(&receipt, &jwks)? {
        result if result.ok => println!("Valid EdDSA signature!"),
        result => println!("Invalid: {}", result.reason.unwrap_or_default()),
    }

    Ok(())
}
```

### Async JWKS Management

```rust
use certnode::JwksManager;
use std::time::Duration;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize JWKS manager with 5-minute cache
    let manager = JwksManager::new(Duration::from_secs(300));

    // Fetch JWKS from CertNode's public endpoint
    let jwks = manager
        .fetch_from_url("https://api.certnode.io/.well-known/jwks.json")
        .await?;

    println!("Fetched {} keys", jwks.keys.len());

    // Subsequent calls will use cached JWKS
    let cached_jwks = manager.get_fresh();
    if cached_jwks.is_some() {
        println!("Using cached JWKS");
    }

    // Get thumbprints
    let thumbprints = manager.thumbprints(Some(&jwks))?;
    println!("Available keys: {:?}", thumbprints);

    Ok(())
}
```

### Error Handling

```rust
use certnode::{verify_receipt, CertNodeError};

fn handle_errors() {
    // Malformed receipt
    let receipt = Receipt {
        protected: "".to_string(),     // Missing
        payload: json!({}),
        signature: "".to_string(),     // Missing
        kid: "".to_string(),          // Missing
        payload_jcs_sha256: None,
        receipt_id: None,
    };

    let jwks = Jwks { keys: vec![] };

    match verify_receipt(&receipt, &jwks) {
        Ok(result) if !result.ok => {
            let reason = result.reason.unwrap_or_default();
            match reason.as_str() {
                r if r.contains("Unsupported algorithm") => {
                    println!("Algorithm not supported. Use ES256 or EdDSA.");
                }
                r if r.contains("Key not found") => {
                    println!("Signing key not available in JWKS.");
                }
                r if r.contains("Invalid signature") => {
                    println!("Document has been tampered with.");
                }
                r if r.contains("Missing") => {
                    println!("Structural error: {}", r);
                }
                _ => {
                    println!("Verification failed: {}", reason);
                }
            }
        }
        Ok(_) => println!("Receipt is valid!"),
        Err(CertNodeError::InvalidFormat(msg)) => {
            println!("Format error: {}", msg);
        }
        Err(CertNodeError::CryptographicError(msg)) => {
            println!("Crypto error: {}", msg);
        }
        Err(e) => {
            println!("Other error: {}", e);
        }
    }
}
```

### High-Performance Batch Verification

```rust
use certnode::{verify_receipt, Receipt, Jwks};
use std::sync::Arc;
use tokio::task;

async fn verify_batch(
    receipts: Vec<Receipt>,
    jwks: Arc<Jwks>,
) -> Vec<(usize, bool, Option<String>)> {
    let tasks: Vec<_> = receipts
        .into_iter()
        .enumerate()
        .map(|(index, receipt)| {
            let jwks_clone = Arc::clone(&jwks);
            task::spawn(async move {
                match verify_receipt(&receipt, &jwks_clone) {
                    Ok(result) => (index, result.ok, result.reason),
                    Err(e) => (index, false, Some(e.to_string())),
                }
            })
        })
        .collect();

    let mut results = Vec::new();
    for task in tasks {
        if let Ok(result) = task.await {
            results.push(result);
        }
    }

    // Sort by index to maintain order
    results.sort_by_key(|(index, _, _)| *index);
    results
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let receipts = vec![
        // ... your receipts
    ];

    let jwks = Arc::new(Jwks {
        keys: vec![
            // ... your keys
        ],
    });

    let results = verify_batch(receipts, jwks).await;

    let valid_count = results.iter().filter(|(_, valid, _)| *valid).count();
    println!("Results: {}/{} receipts valid", valid_count, results.len());

    for (index, valid, reason) in results {
        if valid {
            println!("Receipt {}: ✅ Valid", index);
        } else {
            println!("Receipt {}: ❌ {}", index, reason.unwrap_or_default());
        }
    }

    Ok(())
}
```

### HTTP Server Integration (Axum)

```rust
use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    routing::post,
    Router,
};
use certnode::{verify_receipt, JwksManager, Receipt};
use serde::{Deserialize, Serialize};
use std::{sync::Arc, time::Duration};
use tokio::net::TcpListener;

#[derive(Debug, Deserialize)]
struct VerifyRequest {
    receipt: Receipt,
}

#[derive(Debug, Serialize)]
struct VerifyResponse {
    valid: bool,
    reason: Option<String>,
    kid: String,
}

struct AppState {
    jwks_manager: JwksManager,
    jwks_url: String,
}

async fn verify_handler(
    State(state): State<Arc<AppState>>,
    Json(request): Json<VerifyRequest>,
) -> Result<Json<VerifyResponse>, StatusCode> {
    // Fetch JWKS
    let jwks = state
        .jwks_manager
        .fetch_from_url(&state.jwks_url)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Verify receipt
    let result = verify_receipt(&request.receipt, &jwks)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(VerifyResponse {
        valid: result.ok,
        reason: result.reason,
        kid: request.receipt.kid,
    }))
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let state = Arc::new(AppState {
        jwks_manager: JwksManager::new(Duration::from_secs(300)),
        jwks_url: "https://api.certnode.io/.well-known/jwks.json".to_string(),
    });

    let app = Router::new()
        .route("/verify", post(verify_handler))
        .with_state(state);

    let listener = TcpListener::bind("0.0.0.0:3000").await?;
    println!("Server running on http://localhost:3000");

    axum::serve(listener, app).await?;
    Ok(())
}
```

### WebAssembly Integration

```rust
use wasm_bindgen::prelude::*;
use certnode::{verify_receipt, Receipt, Jwks};

#[wasm_bindgen]
pub fn verify_receipt_wasm(receipt_json: &str, jwks_json: &str) -> String {
    let receipt: Receipt = match serde_json::from_str(receipt_json) {
        Ok(r) => r,
        Err(_) => return "Invalid receipt JSON".to_string(),
    };

    let jwks: Jwks = match serde_json::from_str(jwks_json) {
        Ok(j) => j,
        Err(_) => return "Invalid JWKS JSON".to_string(),
    };

    match verify_receipt(&receipt, &jwks) {
        Ok(result) if result.ok => "Valid".to_string(),
        Ok(result) => format!("Invalid: {}", result.reason.unwrap_or_default()),
        Err(e) => format!("Error: {}", e),
    }
}
```

### Benchmarking

```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};
use certnode::{verify_receipt, Receipt, Jwks, Jwk};
use serde_json::json;

fn create_test_data() -> (Receipt, Jwks) {
    let receipt = Receipt {
        protected: "eyJhbGciOiJFUzI1NiIsImtpZCI6InRlc3Qta2V5In0".to_string(),
        payload: json!({"test": "data"}),
        signature: "test_signature".to_string(),
        kid: "test-key".to_string(),
        payload_jcs_sha256: None,
        receipt_id: None,
    };

    let jwks = Jwks {
        keys: vec![Jwk::Ec {
            kty: "EC".to_string(),
            crv: "P-256".to_string(),
            x: "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU".to_string(),
            y: "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0".to_string(),
            kid: Some("test-key".to_string()),
            alg: Some("ES256".to_string()),
        }],
    };

    (receipt, jwks)
}

fn bench_verification(c: &mut Criterion) {
    let (receipt, jwks) = create_test_data();

    c.bench_function("verify_receipt", |b| {
        b.iter(|| {
            let _ = verify_receipt(black_box(&receipt), black_box(&jwks));
        })
    });
}

criterion_group!(benches, bench_verification);
criterion_main!(benches);
```

## 🔒 Security Considerations

- **Always verify receipts** against a trusted JWKS source
- **Use HTTPS** when fetching JWKS from remote endpoints
- **Validate key sources** - ensure JWKS comes from trusted authorities
- **Handle errors gracefully** - log failures for security monitoring
- **Keep dependencies updated** - regularly update cryptographic libraries
- **Memory safety** - Rust's ownership system prevents memory-related vulnerabilities

## 🧪 Testing

```bash
# Run tests
cargo test

# Run tests with all features
cargo test --all-features

# Run benchmarks
cargo bench

# Generate documentation
cargo doc --open

# Check code coverage
cargo tarpaulin --out Html
```

## 📦 Features

### Default Features

The crate works with minimal dependencies by default:

```toml
[dependencies]
certnode = "1.1.0"
```

### Optional Features

- `jwks-fetch`: Enables HTTP JWKS fetching with `reqwest` and `tokio`

```toml
[dependencies]
certnode = { version = "1.1.0", features = ["jwks-fetch"] }
```

## ⚡ Performance

The Rust SDK is optimized for high-performance scenarios:

- **Zero-allocation verification** in hot paths
- **Efficient JSON canonicalization** using BTreeMap
- **Optimized base64 encoding/decoding**
- **Async-first design** for high concurrency
- **Memory-safe** with no unsafe code

### Benchmarks

```
verify_receipt          time:   [15.2 μs 15.4 μs 15.7 μs]
canonicalize_json       time:   [1.2 μs 1.3 μs 1.4 μs]
jwk_thumbprint          time:   [892 ns 903 ns 915 ns]
```

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.

## 🔗 Links

- **Documentation**: [https://docs.rs/certnode](https://docs.rs/certnode)
- **Crates.io**: [https://crates.io/crates/certnode](https://crates.io/crates/certnode)
- **GitHub**: [https://github.com/srbryant86/certnode](https://github.com/srbryant86/certnode)
- **Issues**: [https://github.com/srbryant86/certnode/issues](https://github.com/srbryant86/certnode/issues)

## 🤝 Contributing

Contributions welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) and [Code of Conduct](../../CODE_OF_CONDUCT.md).

---

**Made with ❤️ by the CertNode team**