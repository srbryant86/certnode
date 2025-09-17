//! EdDSA (Ed25519) verification example.

use certnode::{verify_receipt, Receipt, Jwks, Jwk};
use serde_json::json;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Example receipt data with EdDSA signature
    let receipt = Receipt {
        protected: "eyJhbGciOiJFZERTQSIsImtpZCI6ImVkMjU1MTkta2V5In0".to_string(), // {"alg":"EdDSA","kid":"ed25519-key"}
        payload: json!({
            "document": "EdDSA signed document",
            "algorithm": "Ed25519",
            "benefits": [
                "Deterministic signatures",
                "High performance",
                "Strong security"
            ]
        }),
        signature: "signature_would_be_here_in_base64url_format".to_string(),
        kid: "ed25519-key".to_string(),
        payload_jcs_sha256: None,
        receipt_id: None,
    };

    // Example JWKS with Ed25519 key
    let jwks = Jwks {
        keys: vec![
            Jwk::Okp {
                kty: "OKP".to_string(),
                crv: "Ed25519".to_string(),
                x: "11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo".to_string(),
                kid: Some("ed25519-key".to_string()),
                alg: Some("EdDSA".to_string()),
            }
        ],
    };

    println!("🔍 Verifying EdDSA receipt...");
    println!("Algorithm: EdDSA (Ed25519)");
    println!("Kid: {}", receipt.kid);
    println!("Payload: {}", serde_json::to_string_pretty(&receipt.payload)?);

    // Generate thumbprint for the key
    if let Ok(thumbprint) = certnode::jwk_thumbprint(&jwks.keys[0]) {
        println!("Key thumbprint: {}", thumbprint);
    }

    // Verify the receipt
    match verify_receipt(&receipt, &jwks) {
        Ok(result) => {
            if result.ok {
                println!("✅ EdDSA receipt verification PASSED");
                println!("The Ed25519 signature is valid!");
            } else {
                println!("❌ EdDSA receipt verification FAILED");
                if let Some(reason) = result.reason {
                    println!("Reason: {}", reason);
                }
                println!("\nNote: This example uses placeholder signature data,");
                println!("so verification failure is expected.");
            }
        }
        Err(e) => {
            println!("💥 Verification error: {}", e);
        }
    }

    println!("\n📋 EdDSA Key Properties:");
    println!("• Curve: Ed25519");
    println!("• Signature size: 64 bytes");
    println!("• Public key size: 32 bytes");
    println!("• Deterministic signatures (same input = same signature)");
    println!("• High performance verification");
    println!("• Resilient against side-channel attacks");

    Ok(())
}