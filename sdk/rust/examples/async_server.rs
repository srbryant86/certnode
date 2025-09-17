//! Async server example using CertNode verification.

use certnode::{verify_receipt, Receipt, JwksManager};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;
use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncReadExt, AsyncWriteExt};

#[derive(Deserialize)]
struct VerifyRequest {
    receipt: Receipt,
    jwks_url: Option<String>,
}

#[derive(Serialize)]
struct VerifyResponse {
    valid: bool,
    reason: Option<String>,
    processing_time_ms: u64,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
}

struct VerificationServer {
    jwks_manager: Arc<JwksManager>,
}

impl VerificationServer {
    fn new() -> Self {
        Self {
            jwks_manager: Arc::new(JwksManager::new(Duration::from_secs(300))),
        }
    }

    async fn handle_client(&self, mut stream: TcpStream) -> Result<(), Box<dyn std::error::Error>> {
        let mut buffer = vec![0; 4096];
        let n = stream.read(&mut buffer).await?;

        if n == 0 {
            return Ok(());
        }

        let request_str = String::from_utf8_lossy(&buffer[..n]);

        // Simple HTTP parsing (in production, use a proper HTTP library)
        if let Some(body_start) = request_str.find("\r\n\r\n") {
            let body = &request_str[body_start + 4..];
            let response = self.process_verification(body).await;

            let http_response = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\n\r\n{}",
                response.len(),
                response
            );

            stream.write_all(http_response.as_bytes()).await?;
        }

        Ok(())
    }

    async fn process_verification(&self, body: &str) -> String {
        let start_time = std::time::Instant::now();

        let request: VerifyRequest = match serde_json::from_str(body) {
            Ok(req) => req,
            Err(e) => {
                let error_response = ErrorResponse {
                    error: format!("Invalid request format: {}", e),
                };
                return serde_json::to_string(&error_response).unwrap_or_default();
            }
        };

        // Get JWKS (from cache or fetch)
        let jwks = if let Some(jwks_url) = request.jwks_url {
            match self.jwks_manager.fetch_from_url(&jwks_url).await {
                Ok(jwks) => jwks,
                Err(e) => {
                    let error_response = ErrorResponse {
                        error: format!("Failed to fetch JWKS: {}", e),
                    };
                    return serde_json::to_string(&error_response).unwrap_or_default();
                }
            }
        } else {
            // Use cached JWKS or return error
            match self.jwks_manager.get_fresh() {
                Some(jwks) => jwks,
                None => {
                    let error_response = ErrorResponse {
                        error: "No JWKS available. Provide jwks_url or ensure JWKS is cached.".to_string(),
                    };
                    return serde_json::to_string(&error_response).unwrap_or_default();
                }
            }
        };

        // Verify receipt
        let result = match verify_receipt(&request.receipt, &jwks) {
            Ok(result) => result,
            Err(e) => {
                let error_response = ErrorResponse {
                    error: format!("Verification error: {}", e),
                };
                return serde_json::to_string(&error_response).unwrap_or_default();
            }
        };

        let processing_time = start_time.elapsed();

        let response = VerifyResponse {
            valid: result.ok,
            reason: result.reason,
            processing_time_ms: processing_time.as_millis() as u64,
        };

        serde_json::to_string(&response).unwrap_or_default()
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🚀 CertNode Async Verification Server");
    println!("=====================================");

    let server = Arc::new(VerificationServer::new());
    let listener = TcpListener::bind("127.0.0.1:8080").await?;

    println!("🌐 Server listening on http://127.0.0.1:8080");
    println!("\n📋 API Endpoints:");
    println!("POST / - Verify receipt");
    println!("\nRequest format:");
    println!(r#"{{
  "receipt": {{
    "protected": "base64url_header",
    "payload": {{"document": "data"}},
    "signature": "base64url_signature",
    "kid": "key_id",
    "payload_jcs_sha256": "optional_hash",
    "receipt_id": "optional_id"
  }},
  "jwks_url": "https://example.com/.well-known/jwks.json"
}}"#);

    println!("\n🔧 Server Features:");
    println!("• Async request handling");
    println!("• JWKS caching (5 minute TTL)");
    println!("• Concurrent verification");
    println!("• Processing time metrics");
    println!("• Error handling and reporting");

    loop {
        let (stream, addr) = listener.accept().await?;
        let server_clone = Arc::clone(&server);

        println!("📨 New connection from: {}", addr);

        // Handle each connection concurrently
        tokio::spawn(async move {
            if let Err(e) = server_clone.handle_client(stream).await {
                eprintln!("❌ Error handling client {}: {}", addr, e);
            }
        });
    }
}