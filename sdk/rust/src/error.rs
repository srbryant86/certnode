//! Error types for CertNode SDK.

use thiserror::Error;

/// Main error type for CertNode operations.
#[derive(Error, Debug)]
pub enum CertNodeError {
    /// Invalid data format error
    #[error("Invalid format: {0}")]
    InvalidFormat(String),

    /// JSON processing error
    #[error("JSON error: {0}")]
    JsonError(String),

    /// Cryptographic operation error
    #[error("Cryptographic error: {0}")]
    CryptographicError(String),

    /// Unsupported key type error
    #[error("Unsupported key: {0}")]
    UnsupportedKey(String),

    /// HTTP/Network error (only with jwks-fetch feature)
    #[cfg(feature = "jwks-fetch")]
    #[error("Network error: {0}")]
    NetworkError(String),

    /// Generic error for other cases
    #[error("CertNode error: {0}")]
    Other(String),
}

#[cfg(feature = "jwks-fetch")]
impl From<reqwest::Error> for CertNodeError {
    fn from(err: reqwest::Error) -> Self {
        CertNodeError::NetworkError(err.to_string())
    }
}

impl From<serde_json::Error> for CertNodeError {
    fn from(err: serde_json::Error) -> Self {
        CertNodeError::JsonError(err.to_string())
    }
}

/// Result type alias for CertNode operations.
pub type Result<T> = std::result::Result<T, CertNodeError>;