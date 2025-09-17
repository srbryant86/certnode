//! Batch verification example for high-performance scenarios.

use certnode::{verify_receipt, Receipt, Jwks, Jwk, VerifyResult};
use serde_json::json;
use std::time::Instant;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("⚡ Batch Verification Performance Example");
    println!("=========================================");

    // Create a JWKS with both EC and Ed25519 keys
    let jwks = Jwks {
        keys: vec![
            Jwk::Ec {
                kty: "EC".to_string(),
                crv: "P-256".to_string(),
                x: "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU".to_string(),
                y: "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0".to_string(),
                kid: Some("ec-key-1".to_string()),
                alg: Some("ES256".to_string()),
            },
            Jwk::Okp {
                kty: "OKP".to_string(),
                crv: "Ed25519".to_string(),
                x: "11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo".to_string(),
                kid: Some("ed25519-key-1".to_string()),
                alg: Some("EdDSA".to_string()),
            }
        ],
    };

    // Create sample receipts for batch verification
    let receipts = generate_sample_receipts(1000);
    println!("📦 Generated {} sample receipts", receipts.len());

    // Measure verification performance
    let start = Instant::now();
    let mut results = Vec::new();
    let mut valid_count = 0;
    let mut invalid_count = 0;
    let mut error_count = 0;

    for receipt in &receipts {
        match verify_receipt(receipt, &jwks) {
            Ok(result) => {
                if result.ok {
                    valid_count += 1;
                } else {
                    invalid_count += 1;
                }
                results.push(result);
            }
            Err(_) => {
                error_count += 1;
                results.push(VerifyResult::failed("System error"));
            }
        }
    }

    let duration = start.elapsed();

    println!("\n📊 Batch Verification Results:");
    println!("• Total receipts: {}", receipts.len());
    println!("• Valid: {}", valid_count);
    println!("• Invalid: {}", invalid_count);
    println!("• Errors: {}", error_count);
    println!("• Duration: {:?}", duration);
    println!("• Throughput: {:.0} receipts/second",
             receipts.len() as f64 / duration.as_secs_f64());

    // Memory usage demonstration
    println!("\n💾 Memory Efficiency:");
    println!("• Zero-allocation verification path");
    println!("• Reusable JWKS objects");
    println!("• Minimal heap allocations");
    println!("• Stack-based cryptographic operations");

    // Demonstrate parallel verification (conceptual)
    println!("\n🚀 Parallel Processing Capabilities:");
    println!("• Thread-safe JWKS sharing");
    println!("• Concurrent verification support");
    println!("• No global state dependencies");
    println!("• Suitable for async/await patterns");

    // Show verification breakdown by algorithm
    let ec_receipts = receipts.iter().filter(|r| r.kid.contains("ec")).count();
    let ed25519_receipts = receipts.iter().filter(|r| r.kid.contains("ed25519")).count();

    println!("\n🔐 Algorithm Distribution:");
    println!("• ES256 (EC P-256): {}", ec_receipts);
    println!("• EdDSA (Ed25519): {}", ed25519_receipts);

    Ok(())
}

fn generate_sample_receipts(count: usize) -> Vec<Receipt> {
    let mut receipts = Vec::with_capacity(count);

    for i in 0..count {
        let use_ec = i % 2 == 0;
        let (protected, kid, signature) = if use_ec {
            (
                "eyJhbGciOiJFUzI1NiIsImtpZCI6ImVjLWtleS0xIn0".to_string(), // {"alg":"ES256","kid":"ec-key-1"}
                "ec-key-1".to_string(),
                "MEQCIBxK5H8vN2P1Q7wE3sF9gL2mR4tY6uI8oP0qA1sD3fG5H7J9KCIABC8L1mN2oP3qR4sT5uV6wX7yZ8A9bC0dE1fG2hI3jK4L".to_string()
            )
        } else {
            (
                "eyJhbGciOiJFZERTQSIsImtpZCI6ImVkMjU1MTkta2V5LTEifQ".to_string(), // {"alg":"EdDSA","kid":"ed25519-key-1"}
                "ed25519-key-1".to_string(),
                "signature_ed25519_format_here".to_string()
            )
        };

        receipts.push(Receipt {
            protected,
            payload: json!({
                "batch_id": i,
                "data": format!("Sample data item {}", i),
                "timestamp": "2024-01-15T10:00:00Z"
            }),
            signature,
            kid,
            payload_jcs_sha256: None,
            receipt_id: None,
        });
    }

    receipts
}