//! Utility functions for CertNode SDK.

use crate::{CertNodeError, Result};
use serde_json::Value;
use std::collections::BTreeMap;

/// Canonicalize JSON according to RFC 8785 (JCS).
///
/// This function converts a JSON value to its canonical byte representation
/// following the JSON Canonicalization Scheme specification.
///
/// # Arguments
///
/// * `value` - The JSON value to canonicalize
///
/// # Returns
///
/// Returns the canonical JSON bytes or an error if canonicalization fails.
///
/// # Examples
///
/// ```rust
/// use certnode::utils::canonicalize_json;
/// use serde_json::json;
///
/// let data = json!({"b": 2, "a": 1});
/// let canonical = canonicalize_json(&data).unwrap();
/// assert_eq!(canonical, b"{\"a\":1,\"b\":2}");
/// ```
pub fn canonicalize_json(value: &Value) -> Result<Vec<u8>> {
    let canonical_string = stringify_canonical(value)?;
    Ok(canonical_string.into_bytes())
}

/// Convert a JSON value to canonical string representation.
fn stringify_canonical(value: &Value) -> Result<String> {
    match value {
        Value::Null => Ok("null".to_string()),
        Value::Bool(b) => Ok(if *b { "true" } else { "false" }.to_string()),
        Value::Number(n) => {
            // Handle numbers carefully to match JSON specification
            if let Some(i) = n.as_i64() {
                Ok(i.to_string())
            } else if let Some(u) = n.as_u64() {
                Ok(u.to_string())
            } else if let Some(f) = n.as_f64() {
                if f.is_finite() {
                    // Use serde_json's number formatting for consistency
                    Ok(n.to_string())
                } else {
                    Err(CertNodeError::InvalidFormat(
                        "NaN and infinity not allowed in JSON".into(),
                    ))
                }
            } else {
                Err(CertNodeError::InvalidFormat("Invalid number format".into()))
            }
        }
        Value::String(s) => {
            // Use serde_json to properly escape the string
            Ok(serde_json::to_string(s)?)
        }
        Value::Array(arr) => {
            let mut items = Vec::new();
            for item in arr {
                items.push(stringify_canonical(item)?);
            }
            Ok(format!("[{}]", items.join(",")))
        }
        Value::Object(obj) => {
            // Sort keys for canonical representation
            let mut sorted_obj = BTreeMap::new();
            for (k, v) in obj {
                sorted_obj.insert(k, v);
            }

            let mut parts = Vec::new();
            for (k, v) in sorted_obj {
                // Skip null values at object level for JCS compliance
                if !v.is_null() {
                    let key_str = serde_json::to_string(k)?;
                    let val_str = stringify_canonical(v)?;
                    parts.push(format!("{}:{}", key_str, val_str));
                }
            }
            Ok(format!("{{{}}}", parts.join(",")))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_canonicalize_null() {
        let result = canonicalize_json(&Value::Null).unwrap();
        assert_eq!(result, b"null");
    }

    #[test]
    fn test_canonicalize_boolean() {
        let result = canonicalize_json(&json!(true)).unwrap();
        assert_eq!(result, b"true");

        let result = canonicalize_json(&json!(false)).unwrap();
        assert_eq!(result, b"false");
    }

    #[test]
    fn test_canonicalize_number() {
        let result = canonicalize_json(&json!(42)).unwrap();
        assert_eq!(result, b"42");

        let result = canonicalize_json(&json!(3.14)).unwrap();
        assert_eq!(result, b"3.14");
    }

    #[test]
    fn test_canonicalize_string() {
        let result = canonicalize_json(&json!("hello")).unwrap();
        assert_eq!(result, b"\"hello\"");

        // Test string with special characters
        let result = canonicalize_json(&json!("hello\nworld")).unwrap();
        assert_eq!(result, b"\"hello\\nworld\"");
    }

    #[test]
    fn test_canonicalize_array() {
        let result = canonicalize_json(&json!([3, 1, 2])).unwrap();
        assert_eq!(result, b"[3,1,2]");

        let result = canonicalize_json(&json!([])).unwrap();
        assert_eq!(result, b"[]");
    }

    #[test]
    fn test_canonicalize_object() {
        // Keys should be sorted
        let result = canonicalize_json(&json!({"b": 2, "a": 1})).unwrap();
        assert_eq!(result, b"{\"a\":1,\"b\":2}");

        // Empty object
        let result = canonicalize_json(&json!({})).unwrap();
        assert_eq!(result, b"{}");

        // Null values should be skipped
        let result = canonicalize_json(&json!({"a": 1, "b": null, "c": 3})).unwrap();
        assert_eq!(result, b"{\"a\":1,\"c\":3}");
    }

    #[test]
    fn test_canonicalize_nested() {
        let data = json!({
            "array": [3, 1, 2],
            "object": {"z": 26, "a": 1},
            "string": "test",
            "number": 42,
            "boolean": true,
            "null": null
        });

        let result = canonicalize_json(&data).unwrap();
        let expected = b"{\"array\":[3,1,2],\"boolean\":true,\"number\":42,\"object\":{\"a\":1,\"z\":26},\"string\":\"test\"}";
        assert_eq!(result, expected);
    }
}