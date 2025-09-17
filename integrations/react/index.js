//---------------------------------------------------------------------
// integrations/react/index.js
// React hooks for CertNode receipt verification

const { useState, useCallback, useEffect, useMemo } = require('react');
const { verifyReceipt, JWKSManager } = require('@certnode/sdk');

/**
 * Hook for verifying a single CertNode receipt
 * @param {Object} options - Configuration options
 * @param {Object} options.receipt - The receipt to verify
 * @param {Object} options.jwks - The JWKS containing public keys
 * @param {boolean} options.autoVerify - Whether to verify automatically when inputs change
 * @returns {Object} { verify, result, loading, error, reset }
 */
function useCertNodeVerification({ receipt, jwks, autoVerify = false } = {}) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const verify = useCallback(async (receiptOverride, jwksOverride) => {
    const receiptToVerify = receiptOverride || receipt;
    const jwksToUse = jwksOverride || jwks;

    if (!receiptToVerify || !jwksToUse) {
      setError(new Error('Both receipt and JWKS are required'));
      return { ok: false, reason: 'Missing receipt or JWKS' };
    }

    setLoading(true);
    setError(null);

    try {
      const verification = await verifyReceipt({
        receipt: receiptToVerify,
        jwks: jwksToUse
      });

      setResult(verification);
      return verification;
    } catch (err) {
      setError(err);
      const errorResult = { ok: false, reason: err.message };
      setResult(errorResult);
      return errorResult;
    } finally {
      setLoading(false);
    }
  }, [receipt, jwks]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  // Auto-verify when inputs change
  useEffect(() => {
    if (autoVerify && receipt && jwks && !loading) {
      verify();
    }
  }, [autoVerify, receipt, jwks, verify, loading]);

  return {
    verify,
    result,
    loading,
    error,
    reset,
    isValid: result?.ok === true,
    isInvalid: result?.ok === false
  };
}

/**
 * Hook for managing JWKS fetching and caching
 * @param {Object} options - Configuration options
 * @param {number} options.ttlMs - Cache TTL in milliseconds
 * @param {Function} options.fetcher - Custom fetch function
 * @returns {Object} { jwks, fetchJwks, loading, error, reset, thumbprints }
 */
function useJWKSManager({ ttlMs = 5 * 60 * 1000, fetcher } = {}) {
  const [jwks, setJwks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const manager = useMemo(() => {
    return new JWKSManager({ ttlMs, fetcher });
  }, [ttlMs, fetcher]);

  const fetchJwks = useCallback(async (url) => {
    setLoading(true);
    setError(null);

    try {
      const fetchedJwks = await manager.fetchFromUrl(url);
      setJwks(fetchedJwks);
      return fetchedJwks;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [manager]);

  const setJwksFromObject = useCallback((jwksObject) => {
    const validatedJwks = manager.setFromObject(jwksObject);
    setJwks(validatedJwks);
    return validatedJwks;
  }, [manager]);

  const reset = useCallback(() => {
    setJwks(null);
    setError(null);
    setLoading(false);
  }, []);

  const thumbprints = useMemo(() => {
    return jwks ? manager.thumbprints(jwks) : [];
  }, [jwks, manager]);

  return {
    jwks,
    fetchJwks,
    setJwks: setJwksFromObject,
    loading,
    error,
    reset,
    thumbprints,
    manager
  };
}

/**
 * Hook for batch verification of multiple receipts
 * @param {Object} options - Configuration options
 * @param {Array} options.receipts - Array of receipts to verify
 * @param {Object} options.jwks - The JWKS containing public keys
 * @param {boolean} options.autoVerify - Whether to verify automatically when inputs change
 * @returns {Object} { verify, results, loading, error, reset, summary }
 */
function useBatchVerification({ receipts = [], jwks, autoVerify = false } = {}) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const verify = useCallback(async (receiptsOverride, jwksOverride) => {
    const receiptsToVerify = receiptsOverride || receipts;
    const jwksToUse = jwksOverride || jwks;

    if (!receiptsToVerify.length || !jwksToUse) {
      setError(new Error('Both receipts array and JWKS are required'));
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const verificationResults = await Promise.all(
        receiptsToVerify.map(async (receipt, index) => {
          try {
            const result = await verifyReceipt({ receipt, jwks: jwksToUse });
            return {
              index,
              receipt,
              result,
              receiptId: receipt.kid,
              valid: result.ok,
              reason: result.reason
            };
          } catch (err) {
            return {
              index,
              receipt,
              result: { ok: false, reason: err.message },
              receiptId: receipt.kid,
              valid: false,
              reason: err.message
            };
          }
        })
      );

      setResults(verificationResults);
      return verificationResults;
    } catch (err) {
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [receipts, jwks]);

  const reset = useCallback(() => {
    setResults([]);
    setError(null);
    setLoading(false);
  }, []);

  // Auto-verify when inputs change
  useEffect(() => {
    if (autoVerify && receipts.length && jwks && !loading) {
      verify();
    }
  }, [autoVerify, receipts, jwks, verify, loading]);

  const summary = useMemo(() => {
    const total = results.length;
    const valid = results.filter(r => r.valid).length;
    const invalid = total - valid;

    return {
      total,
      valid,
      invalid,
      validPercentage: total > 0 ? Math.round((valid / total) * 100) : 0,
      allValid: total > 0 && valid === total,
      allInvalid: total > 0 && invalid === total
    };
  }, [results]);

  return {
    verify,
    results,
    loading,
    error,
    reset,
    summary
  };
}

/**
 * Hook for real-time receipt verification with auto-retry
 * @param {Object} options - Configuration options
 * @param {string} options.jwksUrl - URL to fetch JWKS from
 * @param {number} options.retryAttempts - Number of retry attempts
 * @param {number} options.retryDelay - Delay between retries in ms
 * @returns {Object} Combined JWKS management and verification functionality
 */
function useCertNodeClient({ jwksUrl, retryAttempts = 3, retryDelay = 1000 } = {}) {
  const jwksManager = useJWKSManager();
  const verification = useCertNodeVerification({ jwks: jwksManager.jwks });

  const [retryCount, setRetryCount] = useState(0);

  const initialize = useCallback(async () => {
    if (!jwksUrl) return;

    let attempts = 0;
    while (attempts < retryAttempts) {
      try {
        await jwksManager.fetchJwks(jwksUrl);
        setRetryCount(0);
        break;
      } catch (err) {
        attempts++;
        setRetryCount(attempts);

        if (attempts >= retryAttempts) {
          throw err;
        }

        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }, [jwksUrl, retryAttempts, retryDelay, jwksManager]);

  const verifyReceipt = useCallback(async (receipt) => {
    if (!jwksManager.jwks) {
      await initialize();
    }
    return verification.verify(receipt);
  }, [jwksManager.jwks, initialize, verification]);

  // Initialize on mount if jwksUrl is provided
  useEffect(() => {
    if (jwksUrl && !jwksManager.jwks && !jwksManager.loading) {
      initialize().catch(console.error);
    }
  }, [jwksUrl, jwksManager.jwks, jwksManager.loading, initialize]);

  return {
    // JWKS management
    jwks: jwksManager.jwks,
    fetchJwks: jwksManager.fetchJwks,
    thumbprints: jwksManager.thumbprints,

    // Verification
    verify: verifyReceipt,
    result: verification.result,
    isValid: verification.isValid,
    isInvalid: verification.isInvalid,

    // State
    loading: jwksManager.loading || verification.loading,
    error: jwksManager.error || verification.error,
    retryCount,

    // Actions
    initialize,
    reset: () => {
      jwksManager.reset();
      verification.reset();
      setRetryCount(0);
    }
  };
}

module.exports = {
  useCertNodeVerification,
  useJWKSManager,
  useBatchVerification,
  useCertNodeClient
};
//---------------------------------------------------------------------