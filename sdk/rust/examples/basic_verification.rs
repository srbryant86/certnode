//! Basic receipt verification example.

use certnode::{verify_receipt, Receipt, Jwks, Jwk};
use serde_json::json;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Example receipt data
    let receipt = Receipt {
        protected: "eyJhbGciOiJFUzI1NiIsImtpZCI6InRlc3Qta2V5In0".to_string(),
        payload: json!({
            "document": "Hello, CertNode!",
            "timestamp": "2024-01-15T10:00:00Z",
            "metadata": {
                "source": "example",
                "version": "1.0"
            }
        }),
        signature: "MEQCIBxK5H8vN2P1Q7wE3sF9gL2mR4tY6uI8oP0qA1sD3fG5H7J9KCIABC8L1mN2oP3qR4sT5uV6wX7yZ8A9bC0dE1fG2hI3jK4L".to_string(),
        kid: "test-key".to_string(),
        payload_jcs_sha256: Some("ABCDEF1234567890".to_string()),
        receipt_id: Some("receipt-12345".to_string()),
    };

    // Example JWKS with ES256 key
    let jwks = Jwks {
        keys: vec![
            Jwk::Ec {
                kty: "EC".to_string(),
                crv: "P-256".to_string(),
                x: "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU".to_string(),
                y: "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0".to_string(),
                kid: Some("test-key".to_string()),
                alg: Some("ES256".to_string()),
            }
        ],
    };

    println!("🔍 Verifying CertNode receipt...");
    println!("Kid: {}", receipt.kid);
    println!("Payload: {}", serde_json::to_string_pretty(&receipt.payload)?);

    // Verify the receipt
    match verify_receipt(&receipt, &jwks) {
        Ok(result) => {
            if result.ok {
                println!("✅ Receipt verification PASSED");
                println!("The receipt is cryptographically valid and tamper-evident.");
            } else {
                println!("❌ Receipt verification FAILED");
                if let Some(reason) = result.reason {
                    println!("Reason: {}", reason);
                }
            }
        }
        Err(e) => {
            println!("💥 Verification error: {}", e);
            return Err(e.into());
        }
    }

    println!("\n🔑 Key information:");
    for (i, key) in jwks.keys.iter().enumerate() {
        match certnode::jwk_thumbprint(key) {
            Ok(thumbprint) => {
                println!("Key {}: {}", i + 1, thumbprint);
                match key {
                    Jwk::Ec { kid, alg, crv, .. } => {
                        println!("  Type: EC ({})", crv);
                        if let Some(kid) = kid {
                            println!("  Kid: {}", kid);
                        }
                        if let Some(alg) = alg {
                            println!("  Algorithm: {}", alg);
                        }
                    }
                    Jwk::Okp { kid, alg, crv, .. } => {
                        println!("  Type: OKP ({})", crv);
                        if let Some(kid) = kid {
                            println!("  Kid: {}", kid);
                        }
                        if let Some(alg) = alg {
                            println!("  Algorithm: {}", alg);
                        }
                    }
                }
            }
            Err(e) => {
                println!("Error generating thumbprint for key {}: {}", i + 1, e);
            }
        }
    }

    Ok(())
}