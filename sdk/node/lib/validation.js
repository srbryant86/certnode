/**
 * Validation Utilities for CertNode SDK
 * Provides comprehensive validation for receipts, JWKS, and other data structures
 */

const crypto = require('crypto');

// ============================================================================
// Receipt Validation
// ============================================================================

/**
 * Validate receipt structure and contents
 */
function validateReceiptStructure(receipt) {
  const errors = [];
  const warnings = [];

  // Check if receipt is an object
  if (!receipt || typeof receipt !== 'object') {
    errors.push('Receipt must be a non-null object');
    return { valid: false, errors, warnings };
  }

  // Required fields
  const requiredFields = ['protected', 'signature', 'payload', 'kid'];
  requiredFields.forEach(field => {
    if (!receipt[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Validate protected header
  if (receipt.protected) {
    try {
      const protectedHeader = JSON.parse(Buffer.from(receipt.protected, 'base64url').toString());

      if (!protectedHeader.alg) {
        errors.push('Protected header missing algorithm (alg)');
      } else if (!['ES256', 'EdDSA'].includes(protectedHeader.alg)) {
        warnings.push(`Unsupported algorithm: ${protectedHeader.alg}`);
      }

      if (!protectedHeader.typ) {
        warnings.push('Protected header missing type (typ)');
      } else if (protectedHeader.typ !== 'JWT') {
        warnings.push(`Unexpected type: ${protectedHeader.typ}, expected 'JWT'`);
      }
    } catch (error) {
      errors.push('Invalid protected header: not valid base64url JSON');
    }
  }

  // Validate signature format
  if (receipt.signature && !isValidBase64Url(receipt.signature)) {
    errors.push('Signature must be valid base64url encoded');
  }

  // Validate kid format
  if (receipt.kid && typeof receipt.kid !== 'string') {
    errors.push('Key ID (kid) must be a string');
  }

  // Validate optional fields
  if (receipt.payload_jcs_sha256) {
    if (typeof receipt.payload_jcs_sha256 !== 'string') {
      errors.push('payload_jcs_sha256 must be a string');
    } else if (!isValidSHA256Hash(receipt.payload_jcs_sha256)) {
      errors.push('payload_jcs_sha256 must be a valid SHA256 hash');
    }
  }

  if (receipt.timestamp) {
    if (typeof receipt.timestamp !== 'string') {
      errors.push('Timestamp must be a string');
    } else if (!isValidISO8601(receipt.timestamp)) {
      errors.push('Timestamp must be a valid ISO 8601 date string');
    }
  }

  if (receipt.receipt_id && typeof receipt.receipt_id !== 'string') {
    errors.push('Receipt ID must be a string');
  }

  if (receipt.metadata && typeof receipt.metadata !== 'object') {
    errors.push('Metadata must be an object');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// JWKS Validation
// ============================================================================

/**
 * Validate JWKS structure and contents
 */
function validateJWKSStructure(jwks) {
  const errors = [];
  const warnings = [];

  // Check if JWKS is an object
  if (!jwks || typeof jwks !== 'object') {
    errors.push('JWKS must be a non-null object');
    return { valid: false, errors, warnings };
  }

  // Check required keys array
  if (!Array.isArray(jwks.keys)) {
    errors.push('JWKS must contain a "keys" array');
    return { valid: false, errors, warnings };
  }

  if (jwks.keys.length === 0) {
    warnings.push('JWKS contains no keys');
  }

  // Validate each key
  jwks.keys.forEach((key, index) => {
    const keyErrors = validateJWKStructure(key);
    keyErrors.forEach(error => {
      errors.push(`Key ${index}: ${error}`);
    });
  });

  // Validate optional metadata
  if (jwks.metadata) {
    if (typeof jwks.metadata !== 'object') {
      errors.push('JWKS metadata must be an object');
    } else {
      if (jwks.metadata.issuer && typeof jwks.metadata.issuer !== 'string') {
        errors.push('JWKS metadata issuer must be a string');
      }
      if (jwks.metadata.updated && !isValidISO8601(jwks.metadata.updated)) {
        errors.push('JWKS metadata updated must be a valid ISO 8601 date string');
      }
      if (jwks.metadata.version && typeof jwks.metadata.version !== 'string') {
        errors.push('JWKS metadata version must be a string');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate individual JWK structure
 */
function validateJWKStructure(jwk) {
  const errors = [];

  if (!jwk || typeof jwk !== 'object') {
    return ['JWK must be a non-null object'];
  }

  // Check key type
  if (!jwk.kty) {
    errors.push('Missing key type (kty)');
  } else if (!['EC', 'OKP'].includes(jwk.kty)) {
    errors.push(`Unsupported key type: ${jwk.kty}`);
  }

  // Validate based on key type
  if (jwk.kty === 'EC') {
    if (!jwk.crv) {
      errors.push('EC key missing curve (crv)');
    } else if (jwk.crv !== 'P-256') {
      errors.push(`Unsupported EC curve: ${jwk.crv}`);
    }

    if (!jwk.x || !isValidBase64Url(jwk.x)) {
      errors.push('EC key missing or invalid x coordinate');
    }

    if (!jwk.y || !isValidBase64Url(jwk.y)) {
      errors.push('EC key missing or invalid y coordinate');
    }

    if (jwk.alg && jwk.alg !== 'ES256') {
      errors.push(`Invalid algorithm for EC key: ${jwk.alg}`);
    }
  }

  if (jwk.kty === 'OKP') {
    if (!jwk.crv) {
      errors.push('OKP key missing curve (crv)');
    } else if (jwk.crv !== 'Ed25519') {
      errors.push(`Unsupported OKP curve: ${jwk.crv}`);
    }

    if (!jwk.x || !isValidBase64Url(jwk.x)) {
      errors.push('OKP key missing or invalid x coordinate');
    }

    if (jwk.alg && jwk.alg !== 'EdDSA') {
      errors.push(`Invalid algorithm for OKP key: ${jwk.alg}`);
    }
  }

  // Validate optional fields
  if (jwk.kid && typeof jwk.kid !== 'string') {
    errors.push('Key ID (kid) must be a string');
  }

  if (jwk.use && jwk.use !== 'sig') {
    errors.push(`Invalid key use: ${jwk.use}, expected 'sig'`);
  }

  if (jwk.key_ops && !Array.isArray(jwk.key_ops)) {
    errors.push('Key operations (key_ops) must be an array');
  }

  return errors;
}

// ============================================================================
// JWS Parsing and Validation
// ============================================================================

/**
 * Parse and validate a JWS token
 */
function parseJWS(token) {
  if (typeof token !== 'string') {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    const signature = parts[2];

    // Basic validation
    if (!header.alg || !header.typ) {
      return null;
    }

    return {
      header,
      payload,
      signature
    };
  } catch (error) {
    return null;
  }
}

// ============================================================================
// JCS Canonical JSON Utilities
// ============================================================================

/**
 * Calculate JCS canonical hash of an object
 */
function calculateJCSHash(obj) {
  try {
    const canonical = canonicalizeJSON(obj);
    return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
  } catch (error) {
    throw new Error(`Failed to calculate JCS hash: ${error.message}`);
  }
}

/**
 * Canonicalize JSON according to JCS (RFC 8785)
 */
function canonicalizeJSON(obj) {
  if (obj === null) {
    return 'null';
  }

  if (typeof obj === 'boolean') {
    return obj.toString();
  }

  if (typeof obj === 'number') {
    if (!Number.isFinite(obj)) {
      throw new Error('Cannot canonicalize non-finite numbers');
    }
    return obj.toString();
  }

  if (typeof obj === 'string') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    const elements = obj.map(canonicalizeJSON);
    return `[${elements.join(',')}]`;
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj).sort();
    const pairs = keys.map(key => {
      const canonicalKey = JSON.stringify(key);
      const canonicalValue = canonicalizeJSON(obj[key]);
      return `${canonicalKey}:${canonicalValue}`;
    });
    return `{${pairs.join(',')}}`;
  }

  throw new Error(`Cannot canonicalize value of type ${typeof obj}`);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if string is valid base64url encoding
 */
function isValidBase64Url(str) {
  if (typeof str !== 'string') {
    return false;
  }

  // Base64url uses A-Z, a-z, 0-9, -, _ and no padding
  const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
  return base64UrlRegex.test(str);
}

/**
 * Check if string is valid SHA256 hash (64 hex characters)
 */
function isValidSHA256Hash(str) {
  if (typeof str !== 'string') {
    return false;
  }

  const sha256Regex = /^[a-f0-9]{64}$/i;
  return sha256Regex.test(str);
}

/**
 * Check if string is valid ISO 8601 date
 */
function isValidISO8601(str) {
  if (typeof str !== 'string') {
    return false;
  }

  try {
    const date = new Date(str);
    return date.toISOString() === str;
  } catch (error) {
    return false;
  }
}

/**
 * Validate payload hash against JCS canonical form
 */
function validatePayloadHash(payload, expectedHash) {
  try {
    const actualHash = calculateJCSHash(payload);
    return actualHash === expectedHash;
  } catch (error) {
    return false;
  }
}

/**
 * Deep validation of receipt with custom validators
 */
function validateReceiptDeep(receipt, options = {}) {
  const {
    verifyPayloadHash = true,
    strictMode = false,
    customValidators = []
  } = options;

  // Start with structure validation
  const structureResult = validateReceiptStructure(receipt);

  if (!structureResult.valid) {
    return structureResult;
  }

  const errors = [...structureResult.errors];
  const warnings = [...structureResult.warnings];

  // Verify payload hash if present and requested
  if (verifyPayloadHash && receipt.payload_jcs_sha256) {
    if (!validatePayloadHash(receipt.payload, receipt.payload_jcs_sha256)) {
      errors.push('Payload hash does not match JCS canonical form');
    }
  }

  // Strict mode validations
  if (strictMode) {
    if (!receipt.timestamp) {
      warnings.push('Receipt missing timestamp (recommended in strict mode)');
    }

    if (!receipt.receipt_id) {
      warnings.push('Receipt missing receipt_id (recommended in strict mode)');
    }

    // Check timestamp age if present
    if (receipt.timestamp) {
      const age = Date.now() - new Date(receipt.timestamp).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (age > maxAge) {
        warnings.push(`Receipt timestamp is older than 24 hours (${Math.round(age / 1000 / 60 / 60)} hours)`);
      }
    }
  }

  // Run custom validators
  customValidators.forEach((validator, index) => {
    try {
      if (typeof validator === 'function') {
        const result = validator(receipt.payload);
        if (result === false) {
          errors.push(`Custom validator ${index + 1} failed`);
        } else if (typeof result === 'string') {
          errors.push(`Custom validator ${index + 1}: ${result}`);
        }
      }
    } catch (error) {
      errors.push(`Custom validator ${index + 1} threw error: ${error.message}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  validateReceiptStructure,
  validateJWKSStructure,
  validateJWKStructure,
  parseJWS,
  calculateJCSHash,
  canonicalizeJSON,
  validatePayloadHash,
  validateReceiptDeep,
  isValidBase64Url,
  isValidSHA256Hash,
  isValidISO8601
};