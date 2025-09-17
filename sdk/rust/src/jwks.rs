//! JWKS management for CertNode SDK.

use crate::{CertNodeError, Jwk, Jwks, Result};
use std::sync::{Arc, RwLock};
use std::time::{Duration, Instant};

/// JWKS manager with caching and async support.
///
/// Provides automatic JWKS fetching and caching with configurable TTL.
/// Thread-safe and optimized for high-performance scenarios.
///
/// # Examples
///
/// ```rust,no_run
/// use certnode::JwksManager;
/// use std::time::Duration;
///
/// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
/// let manager = JwksManager::new(Duration::from_secs(300)); // 5 minute cache
///
/// let jwks = manager.fetch_from_url("https://api.certnode.io/.well-known/jwks.json").await?;
/// println!("Fetched {} keys", jwks.keys.len());
/// # Ok(())
/// # }
/// ```
#[derive(Debug)]
pub struct JwksManager {
    ttl: Duration,
    cache: Arc<RwLock<Option<CachedJwks>>>,
    #[cfg(feature = "jwks-fetch")]
    client: reqwest::Client,
}

#[derive(Debug, Clone)]
struct CachedJwks {
    jwks: Jwks,
    cached_at: Instant,
}

impl JwksManager {
    /// Create a new JWKS manager with specified TTL.
    ///
    /// # Arguments
    ///
    /// * `ttl` - Time-to-live for cached JWKS
    pub fn new(ttl: Duration) -> Self {
        Self {
            ttl,
            cache: Arc::new(RwLock::new(None)),
            #[cfg(feature = "jwks-fetch")]
            client: reqwest::Client::new(),
        }
    }

    /// Create a new JWKS manager with custom HTTP client.
    #[cfg(feature = "jwks-fetch")]
    #[cfg_attr(docsrs, doc(cfg(feature = "jwks-fetch")))]
    pub fn with_client(ttl: Duration, client: reqwest::Client) -> Self {
        Self {
            ttl,
            cache: Arc::new(RwLock::new(None)),
            client,
        }
    }

    /// Fetch JWKS from URL with caching.
    ///
    /// Returns cached JWKS if still fresh, otherwise fetches from the URL.
    /// This method is thread-safe and can be called concurrently.
    ///
    /// # Arguments
    ///
    /// * `url` - URL to fetch JWKS from
    ///
    /// # Returns
    ///
    /// Returns the JWKS or an error if fetch/parse fails.
    #[cfg(feature = "jwks-fetch")]
    #[cfg_attr(docsrs, doc(cfg(feature = "jwks-fetch")))]
    pub async fn fetch_from_url(&self, url: &str) -> Result<Jwks> {
        // Check cache first (read lock)
        {
            let cache = self.cache.read().unwrap();
            if let Some(cached) = cache.as_ref() {
                if cached.cached_at.elapsed() < self.ttl {
                    return Ok(cached.jwks.clone());
                }
            }
        }

        // Fetch fresh JWKS
        let response = self
            .client
            .get(url)
            .timeout(Duration::from_secs(30))
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(CertNodeError::NetworkError(format!(
                "HTTP {} from {}",
                response.status(),
                url
            )));
        }

        let jwks: Jwks = response.json().await?;

        // Validate JWKS
        self.validate_jwks(&jwks)?;

        // Update cache (write lock)
        {
            let mut cache = self.cache.write().unwrap();
            *cache = Some(CachedJwks {
                jwks: jwks.clone(),
                cached_at: Instant::now(),
            });
        }

        Ok(jwks)
    }

    /// Set JWKS from object with validation.
    ///
    /// # Arguments
    ///
    /// * `jwks` - The JWKS to cache
    pub fn set_from_object(&self, jwks: Jwks) -> Result<()> {
        self.validate_jwks(&jwks)?;

        let mut cache = self.cache.write().unwrap();
        *cache = Some(CachedJwks {
            jwks,
            cached_at: Instant::now(),
        });

        Ok(())
    }

    /// Get cached JWKS if still fresh.
    ///
    /// Returns `None` if no JWKS is cached or if the cache has expired.
    pub fn get_fresh(&self) -> Option<Jwks> {
        let cache = self.cache.read().unwrap();
        cache.as_ref().and_then(|cached| {
            if cached.cached_at.elapsed() < self.ttl {
                Some(cached.jwks.clone())
            } else {
                None
            }
        })
    }

    /// Get thumbprints of all keys in JWKS.
    ///
    /// # Arguments
    ///
    /// * `jwks` - Optional JWKS to get thumbprints from (uses cached if None)
    ///
    /// # Returns
    ///
    /// Returns a vector of key thumbprints or an error.
    pub fn thumbprints(&self, jwks: Option<&Jwks>) -> Result<Vec<String>> {
        let jwks = if let Some(jwks) = jwks {
            jwks
        } else {
            let cache = self.cache.read().unwrap();
            let cached = cache
                .as_ref()
                .ok_or_else(|| CertNodeError::Other("No JWKS available".into()))?;
            &cached.jwks
        };

        let mut thumbprints = Vec::new();
        for key in &jwks.keys {
            if let Ok(thumbprint) = crate::jwk_thumbprint(key) {
                thumbprints.push(thumbprint);
            }
            // Skip keys that can't generate thumbprints
        }

        Ok(thumbprints)
    }

    /// Validate JWKS structure and keys.
    fn validate_jwks(&self, jwks: &Jwks) -> Result<()> {
        if jwks.keys.is_empty() {
            return Err(CertNodeError::InvalidFormat("JWKS contains no keys".into()));
        }

        for (i, key) in jwks.keys.iter().enumerate() {
            self.validate_jwk(key)
                .map_err(|e| CertNodeError::InvalidFormat(format!("Key {}: {}", i, e)))?;
        }

        Ok(())
    }

    /// Validate a single JWK.
    fn validate_jwk(&self, jwk: &Jwk) -> Result<()> {
        match jwk {
            Jwk::Ec { crv, x, y, .. } => {
                if crv != "P-256" {
                    return Err(CertNodeError::UnsupportedKey(format!(
                        "Only P-256 curve supported for EC keys, got {}",
                        crv
                    )));
                }
                if x.is_empty() || y.is_empty() {
                    return Err(CertNodeError::InvalidFormat(
                        "EC key missing x or y coordinate".into(),
                    ));
                }
            }
            Jwk::Okp { crv, x, .. } => {
                if crv != "Ed25519" {
                    return Err(CertNodeError::UnsupportedKey(format!(
                        "Only Ed25519 curve supported for OKP keys, got {}",
                        crv
                    )));
                }
                if x.is_empty() {
                    return Err(CertNodeError::InvalidFormat(
                        "OKP key missing x coordinate".into(),
                    ));
                }
            }
        }

        Ok(())
    }

    /// Clear the cache.
    ///
    /// Forces the next fetch operation to retrieve fresh JWKS.
    pub fn clear_cache(&self) {
        let mut cache = self.cache.write().unwrap();
        *cache = None;
    }

    /// Check if cache contains fresh JWKS.
    pub fn has_fresh_cache(&self) -> bool {
        let cache = self.cache.read().unwrap();
        cache
            .as_ref()
            .map_or(false, |cached| cached.cached_at.elapsed() < self.ttl)
    }
}

/// Simple JWKS fetch function without caching.
///
/// This is a convenience function for one-time JWKS fetching.
/// For repeated fetches, use `JwksManager` for better performance.
///
/// # Arguments
///
/// * `url` - URL to fetch JWKS from
///
/// # Returns
///
/// Returns the JWKS or an error if fetch/parse fails.
///
/// # Examples
///
/// ```rust,no_run
/// use certnode::jwks::fetch_jwks;
///
/// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
/// let jwks = fetch_jwks("https://api.certnode.io/.well-known/jwks.json").await?;
/// println!("Fetched {} keys", jwks.keys.len());
/// # Ok(())
/// # }
/// ```
#[cfg(feature = "jwks-fetch")]
#[cfg_attr(docsrs, doc(cfg(feature = "jwks-fetch")))]
pub async fn fetch_jwks(url: &str) -> Result<Jwks> {
    let client = reqwest::Client::new();

    let response = client
        .get(url)
        .timeout(Duration::from_secs(30))
        .send()
        .await?;

    if !response.status().is_success() {
        return Err(CertNodeError::NetworkError(format!(
            "HTTP {} from {}",
            response.status(),
            url
        )));
    }

    let jwks: Jwks = response.json().await?;

    // Basic validation
    if jwks.keys.is_empty() {
        return Err(CertNodeError::InvalidFormat("JWKS contains no keys".into()));
    }

    Ok(jwks)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::Jwk;
    use std::time::Duration;

    #[test]
    fn test_jwks_manager_creation() {
        let manager = JwksManager::new(Duration::from_secs(300));
        assert!(!manager.has_fresh_cache());
    }

    #[test]
    fn test_set_from_object() {
        let manager = JwksManager::new(Duration::from_secs(300));

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

        assert!(manager.set_from_object(jwks).is_ok());
        assert!(manager.has_fresh_cache());

        let fresh = manager.get_fresh();
        assert!(fresh.is_some());
        assert_eq!(fresh.unwrap().keys.len(), 1);
    }

    #[test]
    fn test_thumbprints() {
        let manager = JwksManager::new(Duration::from_secs(300));

        let jwks = Jwks {
            keys: vec![
                Jwk::Ec {
                    kty: "EC".to_string(),
                    crv: "P-256".to_string(),
                    x: "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU".to_string(),
                    y: "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0".to_string(),
                    kid: Some("test-key".to_string()),
                    alg: Some("ES256".to_string()),
                },
                Jwk::Okp {
                    kty: "OKP".to_string(),
                    crv: "Ed25519".to_string(),
                    x: "11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo".to_string(),
                    kid: Some("ed25519-key".to_string()),
                    alg: Some("EdDSA".to_string()),
                },
            ],
        };

        let thumbprints = manager.thumbprints(Some(&jwks));
        assert!(thumbprints.is_ok());
        assert_eq!(thumbprints.unwrap().len(), 2);
    }

    #[test]
    fn test_validate_invalid_jwks() {
        let manager = JwksManager::new(Duration::from_secs(300));

        // Empty JWKS
        let empty_jwks = Jwks { keys: vec![] };
        assert!(manager.validate_jwks(&empty_jwks).is_err());

        // Invalid EC key
        let invalid_jwks = Jwks {
            keys: vec![Jwk::Ec {
                kty: "EC".to_string(),
                crv: "P-384".to_string(), // Unsupported curve
                x: "test".to_string(),
                y: "test".to_string(),
                kid: None,
                alg: None,
            }],
        };
        assert!(manager.validate_jwks(&invalid_jwks).is_err());
    }

    #[test]
    fn test_clear_cache() {
        let manager = JwksManager::new(Duration::from_secs(300));

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

        manager.set_from_object(jwks).unwrap();
        assert!(manager.has_fresh_cache());

        manager.clear_cache();
        assert!(!manager.has_fresh_cache());
    }
}