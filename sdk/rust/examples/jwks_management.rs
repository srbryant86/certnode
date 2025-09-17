//! JWKS management and caching example.

use certnode::{JwksManager, Jwks, Jwk};
use std::time::Duration;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🔑 JWKS Management Example");
    println!("==========================");

    // Create a JWKS manager with 5-minute cache
    let manager = JwksManager::new(Duration::from_secs(300));

    // Example: Create a JWKS object manually
    let jwks = Jwks {
        keys: vec![
            Jwk::Ec {
                kty: "EC".to_string(),
                crv: "P-256".to_string(),
                x: "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU".to_string(),
                y: "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0".to_string(),
                kid: Some("test-ec-key".to_string()),
                alg: Some("ES256".to_string()),
            },
            Jwk::Okp {
                kty: "OKP".to_string(),
                crv: "Ed25519".to_string(),
                x: "11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo".to_string(),
                kid: Some("test-ed25519-key".to_string()),
                alg: Some("EdDSA".to_string()),
            }
        ],
    };

    // Set JWKS from object
    println!("📥 Setting JWKS from object...");
    manager.set_from_object(jwks.clone())?;
    println!("✅ JWKS cached successfully");
    println!("Cache fresh: {}", manager.has_fresh_cache());

    // Get fresh JWKS from cache
    if let Some(cached_jwks) = manager.get_fresh() {
        println!("\n📤 Retrieved JWKS from cache:");
        println!("Keys found: {}", cached_jwks.keys.len());

        // Get thumbprints
        match manager.thumbprints(Some(&cached_jwks)) {
            Ok(thumbprints) => {
                println!("\n🔍 Key thumbprints:");
                for (i, thumbprint) in thumbprints.iter().enumerate() {
                    println!("  {}: {}", i + 1, thumbprint);
                }
            }
            Err(e) => {
                println!("Error generating thumbprints: {}", e);
            }
        }
    }

    // Example: Try to fetch from a real URL (this will fail in testing)
    println!("\n🌐 Attempting to fetch JWKS from URL...");
    match manager.fetch_from_url("https://api.certnode.io/.well-known/jwks.json").await {
        Ok(fetched_jwks) => {
            println!("✅ Successfully fetched JWKS from URL");
            println!("Keys in remote JWKS: {}", fetched_jwks.keys.len());
        }
        Err(e) => {
            println!("⚠️  Failed to fetch from URL (expected in example): {}", e);
            println!("   This is normal - the URL may not be reachable in this environment.");
        }
    }

    // Demonstrate cache clearing
    println!("\n🧹 Clearing cache...");
    manager.clear_cache();
    println!("Cache fresh after clear: {}", manager.has_fresh_cache());

    // Show cache behavior
    println!("\n📊 Cache Statistics:");
    println!("• TTL: {} seconds", 300);
    println!("• Thread-safe: Yes");
    println!("• Automatic refresh: Yes (when TTL expires)");
    println!("• Custom HTTP client: Supported");

    println!("\n✨ JWKS Management Features:");
    println!("• Automatic caching with configurable TTL");
    println!("• Thread-safe concurrent access");
    println!("• HTTP/HTTPS JWKS fetching");
    println!("• Manual JWKS loading from objects");
    println!("• JWK thumbprint generation (RFC 7638)");
    println!("• Key validation (supports EC P-256 and OKP Ed25519)");

    Ok(())
}