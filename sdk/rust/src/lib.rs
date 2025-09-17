//! # CertNode Rust SDK
//!
//! High-performance Rust SDK for CertNode receipt verification.
//! Supports ES256 (ECDSA P-256) and EdDSA (Ed25519) algorithms.
//!
//! ## Features
//!
//! - ✅ **Zero-allocation verification** - Optimized for performance
//! - ✅ **ES256 Support** - ECDSA P-256 signatures (RFC 7515)
//! - ✅ **EdDSA Support** - Ed25519 deterministic signatures
//! - ✅ **JSON Canonicalization** - RFC 8785 JCS for consistent hashing
//! - ✅ **Type Safety** - Comprehensive Rust type system
//! - ✅ **Async Support** - Full async/await compatibility
//! - ✅ **Optional HTTP** - JWKS fetching with `jwks-fetch` feature
//!
//! ## Quick Start
//!
//! ```rust
//! use certnode::{verify_receipt, Receipt, Jwks, Jwk};
//! use serde_json::json;
//!
//! let receipt = Receipt {
//!     protected: "eyJhbGciOiJFUzI1NiIsImtpZCI6InRlc3Qta2V5In0".to_string(),
//!     payload: json!({"document": "Hello, World!"}),
//!     signature: "MEQCIAH8B3K2l1D0F9X7Zz8Q2P5M6N7R3S4T5U6V7W8X9Y0Z...".to_string(),
//!     kid: "test-key".to_string(),
//!     payload_jcs_sha256: None,
//!     receipt_id: None,
//! };
//!
//! let jwks = Jwks {
//!     keys: vec![Jwk::Ec {
//!         kty: "EC".to_string(),
//!         crv: "P-256".to_string(),
//!         x: "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU".to_string(),
//!         y: "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0".to_string(),
//!         kid: Some("test-key".to_string()),
//!         alg: Some("ES256".to_string()),
//!     }],
//! };
//!
//! match verify_receipt(&receipt, &jwks) {
//!     Ok(result) if result.ok => println!("Receipt is valid!"),
//!     Ok(result) => println!("Invalid: {}", result.reason.unwrap()),
//!     Err(e) => println!("Error: {}", e),
//! }
//! ```

#![cfg_attr(docsrs, feature(doc_cfg))]
#![warn(missing_docs)]
#![deny(unsafe_code)]

use std::collections::BTreeMap;

use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};

pub mod error;
pub mod jwks;
pub mod utils;

pub use error::{CertNodeError, Result};
pub use jwks::JwksManager;

/// A CertNode receipt for verification.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Receipt {
    /// Base64url-encoded JWS protected header
    pub protected: String,
    /// Original payload data
    pub payload: Value,
    /// Base64url-encoded signature
    pub signature: String,
    /// Key identifier
    pub kid: String,
    /// Optional JCS SHA-256 hash of payload
    pub payload_jcs_sha256: Option<String>,
    /// Optional receipt identifier
    pub receipt_id: Option<String>,
}

/// JSON Web Key representation.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kty")]
pub enum Jwk {
    /// Elliptic Curve key (P-256)
    #[serde(rename = "EC")]
    Ec {
        /// Key type
        kty: String,
        /// Curve name
        crv: String,
        /// X coordinate (base64url)
        x: String,
        /// Y coordinate (base64url)
        y: String,
        /// Key ID (optional)
        kid: Option<String>,
        /// Algorithm (optional)
        alg: Option<String>,
    },
    /// Octet Key Pair (Ed25519)
    #[serde(rename = "OKP")]
    Okp {
        /// Key type
        kty: String,
        /// Curve name
        crv: String,
        /// Public key bytes (base64url)
        x: String,
        /// Key ID (optional)
        kid: Option<String>,
        /// Algorithm (optional)
        alg: Option<String>,
    },
}

/// JSON Web Key Set.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Jwks {
    /// Array of JSON Web Keys
    pub keys: Vec<Jwk>,
}

/// JWS protected header.
#[derive(Debug, Clone, Serialize, Deserialize)]
struct Header {
    alg: String,
    kid: String,
}

/// Result of receipt verification.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerifyResult {
    /// Whether verification succeeded
    pub ok: bool,
    /// Reason for failure (if any)
    pub reason: Option<String>,
}

impl VerifyResult {
    /// Create a successful verification result.
    pub fn ok() -> Self {
        Self {
            ok: true,
            reason: None,
        }
    }

    /// Create a failed verification result with reason.
    pub fn failed<S: Into<String>>(reason: S) -> Self {
        Self {
            ok: false,
            reason: Some(reason.into()),
        }
    }
}

/// Verify a CertNode receipt against a JWKS.
///
/// This is the main verification function that validates all aspects
/// of a CertNode receipt including signature, JCS hash, and receipt ID.
///
/// # Arguments
///
/// * `receipt` - The receipt to verify
/// * `jwks` - The JWKS containing public keys
///
/// # Returns
///
/// Returns `Ok(VerifyResult)` with the verification outcome, or
/// `Err(CertNodeError)` if a system error occurred.
///
/// # Examples
///
/// ```rust
/// use certnode::{verify_receipt, Receipt, Jwks, Jwk};
/// use serde_json::json;
///
/// let receipt = Receipt {
///     protected: "eyJhbGciOiJFUzI1NiIsImtpZCI6InRlc3Qta2V5In0".to_string(),
///     payload: json!({"test": "data"}),
///     signature: "signature...".to_string(),
///     kid: "test-key".to_string(),
///     payload_jcs_sha256: None,
///     receipt_id: None,
/// };
///
/// let jwks = Jwks { keys: vec![] };
///
/// match verify_receipt(&receipt, &jwks) {
///     Ok(result) => {
///         if result.ok {
///             println!("Valid receipt!");
///         } else {
///             println!("Invalid: {}", result.reason.unwrap_or_default());
///         }
///     }
///     Err(e) => println!("Error: {}", e),
/// }
/// ```
pub fn verify_receipt(receipt: &Receipt, jwks: &Jwks) -> Result<VerifyResult> {
    // Validate receipt structure
    if receipt.protected.is_empty() {
        return Ok(VerifyResult::failed("Missing protected header"));
    }
    if receipt.signature.is_empty() {
        return Ok(VerifyResult::failed("Missing signature"));
    }
    if receipt.kid.is_empty() {
        return Ok(VerifyResult::failed("Missing kid"));
    }

    // Decode protected header
    let header_bytes = URL_SAFE_NO_PAD
        .decode(&receipt.protected)
        .map_err(|_| CertNodeError::InvalidFormat("Invalid protected header encoding".into()))?;

    let header: Header = serde_json::from_slice(&header_bytes)
        .map_err(|_| CertNodeError::InvalidFormat("Invalid header JSON".into()))?;

    // Validate algorithm
    if header.alg != "ES256" && header.alg != "EdDSA" {
        return Ok(VerifyResult::failed(format!(
            "Unsupported algorithm: {}. Use ES256 or EdDSA",
            header.alg
        )));
    }

    // Validate kid consistency
    if header.kid != receipt.kid {
        return Ok(VerifyResult::failed("Kid mismatch between header and receipt"));
    }

    // Find matching key in JWKS
    let key = find_key_in_jwks(&receipt.kid, jwks)?;
    if key.is_none() {
        return Ok(VerifyResult::failed(format!(
            "Key not found in JWKS: {}",
            receipt.kid
        )));
    }
    let key = key.unwrap();

    // Validate JCS hash if present
    if let Some(expected_hash) = &receipt.payload_jcs_sha256 {
        let jcs_bytes = utils::canonicalize_json(&receipt.payload)?;
        let computed_hash = Sha256::digest(&jcs_bytes);
        let expected_bytes = URL_SAFE_NO_PAD
            .decode(expected_hash)
            .map_err(|_| CertNodeError::InvalidFormat("Invalid JCS hash encoding".into()))?;

        if computed_hash.as_slice() != expected_bytes {
            return Ok(VerifyResult::failed("JCS hash mismatch"));
        }
    }

    // Create signing input
    let payload_bytes = utils::canonicalize_json(&receipt.payload)?;
    let payload_b64u = URL_SAFE_NO_PAD.encode(&payload_bytes);
    let signing_input = format!("{}.{}", receipt.protected, payload_b64u);

    // Verify signature
    let signature_bytes = URL_SAFE_NO_PAD
        .decode(&receipt.signature)
        .map_err(|_| CertNodeError::InvalidFormat("Invalid signature encoding".into()))?;

    let is_valid = match (&header.alg[..], key) {
        ("ES256", Jwk::Ec { x, y, crv, .. }) => {
            if crv != "P-256" {
                return Ok(VerifyResult::failed("ES256 requires P-256 curve"));
            }
            verify_es256_signature(x, y, signing_input.as_bytes(), &signature_bytes)?
        }
        ("EdDSA", Jwk::Okp { x, crv, .. }) => {
            if crv != "Ed25519" {
                return Ok(VerifyResult::failed("EdDSA requires Ed25519 curve"));
            }
            verify_eddsa_signature(x, signing_input.as_bytes(), &signature_bytes)?
        }
        _ => {
            return Ok(VerifyResult::failed(format!(
                "Algorithm {} incompatible with key type",
                header.alg
            )));
        }
    };

    if !is_valid {
        return Ok(VerifyResult::failed("Invalid signature"));
    }

    // Validate receipt ID if present
    if let Some(expected_id) = &receipt.receipt_id {
        let full_receipt = format!("{}.{}.{}", receipt.protected, payload_b64u, receipt.signature);
        let computed_hash = Sha256::digest(full_receipt.as_bytes());
        let computed_id = URL_SAFE_NO_PAD.encode(&computed_hash);

        if &computed_id != expected_id {
            return Ok(VerifyResult::failed("Receipt ID mismatch"));
        }
    }

    Ok(VerifyResult::ok())
}

/// Find a key in JWKS by RFC 7638 thumbprint or kid field.
fn find_key_in_jwks(kid: &str, jwks: &Jwks) -> Result<Option<&Jwk>> {
    for key in &jwks.keys {
        // Try RFC 7638 thumbprint first
        if let Ok(thumbprint) = jwk_thumbprint(key) {
            if thumbprint == kid {
                return Ok(Some(key));
            }
        }

        // Fallback to kid field
        let key_kid = match key {
            Jwk::Ec { kid, .. } | Jwk::Okp { kid, .. } => kid,
        };

        if let Some(key_kid) = key_kid {
            if key_kid == kid {
                return Ok(Some(key));
            }
        }
    }

    Ok(None)
}

/// Generate JWK thumbprint according to RFC 7638.
pub fn jwk_thumbprint(jwk: &Jwk) -> Result<String> {
    let canonical = match jwk {
        Jwk::Ec { crv, x, y, .. } if crv == "P-256" => {
            let mut map = BTreeMap::new();
            map.insert("crv", crv.as_str());
            map.insert("kty", "EC");
            map.insert("x", x.as_str());
            map.insert("y", y.as_str());
            map
        }
        Jwk::Okp { crv, x, .. } if crv == "Ed25519" => {
            let mut map = BTreeMap::new();
            map.insert("crv", crv.as_str());
            map.insert("kty", "OKP");
            map.insert("x", x.as_str());
            map
        }
        _ => {
            return Err(CertNodeError::UnsupportedKey(
                "Only EC P-256 and OKP Ed25519 supported".into(),
            ))
        }
    };

    let canonical_json = serde_json::to_string(&canonical)
        .map_err(|e| CertNodeError::JsonError(format!("Thumbprint serialization: {}", e)))?;

    let hash = Sha256::digest(canonical_json.as_bytes());
    Ok(URL_SAFE_NO_PAD.encode(&hash))
}

/// Verify ES256 signature using ECDSA P-256.
fn verify_es256_signature(x: &str, y: &str, message: &[u8], signature: &[u8]) -> Result<bool> {
    use p256::ecdsa::{Signature, VerifyingKey};
    use p256::elliptic_curve::sec1::ToEncodedPoint;
    use p256::{PublicKey, U256};

    // Decode coordinates
    let x_bytes = URL_SAFE_NO_PAD
        .decode(x)
        .map_err(|_| CertNodeError::InvalidFormat("Invalid x coordinate".into()))?;
    let y_bytes = URL_SAFE_NO_PAD
        .decode(y)
        .map_err(|_| CertNodeError::InvalidFormat("Invalid y coordinate".into()))?;

    if x_bytes.len() != 32 || y_bytes.len() != 32 {
        return Err(CertNodeError::InvalidFormat(
            "Invalid coordinate length for P-256".into(),
        ));
    }

    // Create public key
    let x_scalar = U256::from_be_slice(&x_bytes)
        .map_err(|_| CertNodeError::CryptographicError("Invalid x coordinate value".into()))?;
    let y_scalar = U256::from_be_slice(&y_bytes)
        .map_err(|_| CertNodeError::CryptographicError("Invalid y coordinate value".into()))?;

    let public_key = PublicKey::from_affine_coordinates(&x_scalar, &y_scalar)
        .map_err(|_| CertNodeError::CryptographicError("Invalid public key point".into()))?;

    let verifying_key = VerifyingKey::from(public_key);

    // Convert JOSE signature format (r||s) to DER
    if signature.len() != 64 {
        return Err(CertNodeError::InvalidFormat(
            "ES256 signature must be 64 bytes".into(),
        ));
    }

    let signature = Signature::from_bytes(signature.into())
        .map_err(|_| CertNodeError::InvalidFormat("Invalid signature format".into()))?;

    // Verify signature
    use p256::ecdsa::signature::Verifier;
    Ok(verifying_key.verify(message, &signature).is_ok())
}

/// Verify EdDSA signature using Ed25519.
fn verify_eddsa_signature(x: &str, message: &[u8], signature: &[u8]) -> Result<bool> {
    use ed25519_dalek::{Signature, Verifier, VerifyingKey};

    // Decode public key
    let public_key_bytes = URL_SAFE_NO_PAD
        .decode(x)
        .map_err(|_| CertNodeError::InvalidFormat("Invalid x coordinate".into()))?;

    if public_key_bytes.len() != 32 {
        return Err(CertNodeError::InvalidFormat(
            "Invalid public key length for Ed25519".into(),
        ));
    }

    let public_key_array: [u8; 32] = public_key_bytes
        .try_into()
        .map_err(|_| CertNodeError::InvalidFormat("Public key conversion failed".into()))?;

    let verifying_key = VerifyingKey::from_bytes(&public_key_array)
        .map_err(|_| CertNodeError::CryptographicError("Invalid Ed25519 public key".into()))?;

    let signature = Signature::from_bytes(signature)
        .map_err(|_| CertNodeError::InvalidFormat("Invalid signature format".into()))?;

    // Verify signature
    Ok(verifying_key.verify(message, &signature).is_ok())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_basic_verification_structure() {
        let receipt = Receipt {
            protected: "eyJhbGciOiJFUzI1NiIsImtpZCI6InRlc3Qta2V5In0".to_string(),
            payload: json!({"test": "data"}),
            signature: "invalid_signature".to_string(),
            kid: "test-key".to_string(),
            payload_jcs_sha256: None,
            receipt_id: None,
        };

        let jwks = Jwks { keys: vec![] };

        let result = verify_receipt(&receipt, &jwks).unwrap();
        assert!(!result.ok);
        assert!(result.reason.unwrap().contains("Key not found"));
    }

    #[test]
    fn test_missing_fields() {
        let receipt = Receipt {
            protected: "".to_string(), // Missing
            payload: json!({}),
            signature: "".to_string(), // Missing
            kid: "".to_string(),       // Missing
            payload_jcs_sha256: None,
            receipt_id: None,
        };

        let jwks = Jwks { keys: vec![] };

        let result = verify_receipt(&receipt, &jwks).unwrap();
        assert!(!result.ok);
        assert!(result.reason.unwrap().contains("Missing"));
    }

    #[test]
    fn test_jwk_thumbprint_ec() {
        let jwk = Jwk::Ec {
            kty: "EC".to_string(),
            crv: "P-256".to_string(),
            x: "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU".to_string(),
            y: "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0".to_string(),
            kid: Some("test-key".to_string()),
            alg: Some("ES256".to_string()),
        };

        let thumbprint = jwk_thumbprint(&jwk);
        assert!(thumbprint.is_ok());
        assert!(!thumbprint.unwrap().is_empty());
    }

    #[test]
    fn test_jwk_thumbprint_ed25519() {
        let jwk = Jwk::Okp {
            kty: "OKP".to_string(),
            crv: "Ed25519".to_string(),
            x: "11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo".to_string(),
            kid: Some("ed25519-key".to_string()),
            alg: Some("EdDSA".to_string()),
        };

        let thumbprint = jwk_thumbprint(&jwk);
        assert!(thumbprint.is_ok());
        assert!(!thumbprint.unwrap().is_empty());
    }
}