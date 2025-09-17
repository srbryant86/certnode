//---------------------------------------------------------------------
// integrations/vue/index.js
// Vue composables for CertNode receipt verification

const { ref, computed, watch, onMounted, onUnmounted } = require('vue');
const { verifyReceipt, JWKSManager } = require('@certnode/sdk');

/**
 * Composable for verifying a single CertNode receipt
 * @param {Object} options - Configuration options
 * @param {Ref|Object} options.receipt - The receipt to verify (can be reactive)
 * @param {Ref|Object} options.jwks - The JWKS containing public keys (can be reactive)
 * @param {Ref|boolean} options.autoVerify - Whether to verify automatically when inputs change
 * @returns {Object} Reactive verification state and methods
 */
function useCertNodeVerification(options = {}) {
  // Convert options to refs if they aren't already
  const receipt = ref(options.receipt);
  const jwks = ref(options.jwks);
  const autoVerify = ref(options.autoVerify ?? false);

  // Reactive state
  const result = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Computed properties
  const isValid = computed(() => result.value?.ok === true);
  const isInvalid = computed(() => result.value?.ok === false);

  // Verification function
  const verify = async (receiptOverride, jwksOverride) => {
    const receiptToVerify = receiptOverride || receipt.value;
    const jwksToUse = jwksOverride || jwks.value;

    if (!receiptToVerify || !jwksToUse) {
      error.value = new Error('Both receipt and JWKS are required');
      return { ok: false, reason: 'Missing receipt or JWKS' };
    }

    loading.value = true;
    error.value = null;

    try {
      const verification = await verifyReceipt({
        receipt: receiptToVerify,
        jwks: jwksToUse
      });

      result.value = verification;
      return verification;
    } catch (err) {
      error.value = err;
      const errorResult = { ok: false, reason: err.message };
      result.value = errorResult;
      return errorResult;
    } finally {
      loading.value = false;
    }
  };

  // Reset function
  const reset = () => {
    result.value = null;
    error.value = null;
    loading.value = false;
  };

  // Auto-verify watcher
  watch(
    [receipt, jwks, autoVerify],
    () => {
      if (autoVerify.value && receipt.value && jwks.value && !loading.value) {
        verify();
      }
    },
    { deep: true }
  );

  return {
    // Reactive state
    result: computed(() => result.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    isValid,
    isInvalid,

    // Input refs (for two-way binding)
    receipt,
    jwks,
    autoVerify,

    // Methods
    verify,
    reset
  };
}

/**
 * Composable for managing JWKS fetching and caching
 * @param {Object} options - Configuration options
 * @param {number} options.ttlMs - Cache TTL in milliseconds
 * @param {Function} options.fetcher - Custom fetch function
 * @returns {Object} Reactive JWKS management state and methods
 */
function useJWKSManager(options = {}) {
  const { ttlMs = 5 * 60 * 1000, fetcher } = options;

  // Reactive state
  const jwks = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Manager instance
  const manager = new JWKSManager({ ttlMs, fetcher });

  // Computed properties
  const thumbprints = computed(() => {
    return jwks.value ? manager.thumbprints(jwks.value) : [];
  });

  // Fetch JWKS from URL
  const fetchJwks = async (url) => {
    loading.value = true;
    error.value = null;

    try {
      const fetchedJwks = await manager.fetchFromUrl(url);
      jwks.value = fetchedJwks;
      return fetchedJwks;
    } catch (err) {
      error.value = err;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Set JWKS from object
  const setJwks = (jwksObject) => {
    const validatedJwks = manager.setFromObject(jwksObject);
    jwks.value = validatedJwks;
    return validatedJwks;
  };

  // Reset function
  const reset = () => {
    jwks.value = null;
    error.value = null;
    loading.value = false;
  };

  return {
    // Reactive state
    jwks: computed(() => jwks.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    thumbprints,

    // Methods
    fetchJwks,
    setJwks,
    reset,

    // Manager instance
    manager
  };
}

/**
 * Composable for batch verification of multiple receipts
 * @param {Object} options - Configuration options
 * @param {Ref|Array} options.receipts - Array of receipts to verify (can be reactive)
 * @param {Ref|Object} options.jwks - The JWKS containing public keys (can be reactive)
 * @param {Ref|boolean} options.autoVerify - Whether to verify automatically when inputs change
 * @returns {Object} Reactive batch verification state and methods
 */
function useBatchVerification(options = {}) {
  // Convert options to refs if they aren't already
  const receipts = ref(options.receipts || []);
  const jwks = ref(options.jwks);
  const autoVerify = ref(options.autoVerify ?? false);

  // Reactive state
  const results = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Computed summary
  const summary = computed(() => {
    const total = results.value.length;
    const valid = results.value.filter(r => r.valid).length;
    const invalid = total - valid;

    return {
      total,
      valid,
      invalid,
      validPercentage: total > 0 ? Math.round((valid / total) * 100) : 0,
      allValid: total > 0 && valid === total,
      allInvalid: total > 0 && invalid === total
    };
  });

  // Verification function
  const verify = async (receiptsOverride, jwksOverride) => {
    const receiptsToVerify = receiptsOverride || receipts.value;
    const jwksToUse = jwksOverride || jwks.value;

    if (!receiptsToVerify.length || !jwksToUse) {
      error.value = new Error('Both receipts array and JWKS are required');
      return [];
    }

    loading.value = true;
    error.value = null;

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

      results.value = verificationResults;
      return verificationResults;
    } catch (err) {
      error.value = err;
      return [];
    } finally {
      loading.value = false;
    }
  };

  // Reset function
  const reset = () => {
    results.value = [];
    error.value = null;
    loading.value = false;
  };

  // Auto-verify watcher
  watch(
    [receipts, jwks, autoVerify],
    () => {
      if (autoVerify.value && receipts.value.length && jwks.value && !loading.value) {
        verify();
      }
    },
    { deep: true }
  );

  return {
    // Reactive state
    results: computed(() => results.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    summary,

    // Input refs
    receipts,
    jwks,
    autoVerify,

    // Methods
    verify,
    reset
  };
}

/**
 * Composable for real-time receipt verification with auto-retry
 * @param {Object} options - Configuration options
 * @param {string} options.jwksUrl - URL to fetch JWKS from
 * @param {number} options.retryAttempts - Number of retry attempts
 * @param {number} options.retryDelay - Delay between retries in ms
 * @param {boolean} options.autoInitialize - Whether to initialize on mount
 * @returns {Object} Combined JWKS management and verification functionality
 */
function useCertNodeClient(options = {}) {
  const {
    jwksUrl,
    retryAttempts = 3,
    retryDelay = 1000,
    autoInitialize = true
  } = options;

  // Use JWKS manager
  const jwksManager = useJWKSManager();

  // Use verification with JWKS manager's JWKS
  const verification = useCertNodeVerification({
    jwks: jwksManager.jwks
  });

  // Additional state
  const retryCount = ref(0);
  const initialized = ref(false);

  // Combined loading state
  const loading = computed(() =>
    jwksManager.loading.value || verification.loading.value
  );

  // Combined error state
  const error = computed(() =>
    jwksManager.error.value || verification.error.value
  );

  // Initialize function
  const initialize = async () => {
    if (!jwksUrl) return;

    let attempts = 0;
    while (attempts < retryAttempts) {
      try {
        await jwksManager.fetchJwks(jwksUrl);
        retryCount.value = 0;
        initialized.value = true;
        break;
      } catch (err) {
        attempts++;
        retryCount.value = attempts;

        if (attempts >= retryAttempts) {
          throw err;
        }

        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  };

  // Verify receipt (auto-initializes if needed)
  const verifyReceipt = async (receipt) => {
    if (!jwksManager.jwks.value) {
      await initialize();
    }
    return verification.verify(receipt);
  };

  // Reset function
  const reset = () => {
    jwksManager.reset();
    verification.reset();
    retryCount.value = 0;
    initialized.value = false;
  };

  // Auto-initialize on mount
  onMounted(() => {
    if (autoInitialize && jwksUrl && !initialized.value) {
      initialize().catch(console.error);
    }
  });

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

    // Combined state
    loading,
    error,
    retryCount: computed(() => retryCount.value),
    initialized: computed(() => initialized.value),

    // Actions
    initialize,
    reset
  };
}

/**
 * Composable for reactive receipt validation
 * @param {Ref} receipt - Reactive receipt object
 * @returns {Object} Validation state and methods
 */
function useReceiptValidation(receipt) {
  const errors = ref([]);

  const isValid = computed(() => {
    const r = receipt.value;
    if (!r) return false;

    const newErrors = [];

    if (!r.protected) newErrors.push('Missing protected header');
    if (!r.signature) newErrors.push('Missing signature');
    if (!('payload' in r)) newErrors.push('Missing payload');
    if (!r.kid) newErrors.push('Missing key ID');

    errors.value = newErrors;
    return newErrors.length === 0;
  });

  const algorithm = computed(() => {
    try {
      if (!receipt.value?.protected) return null;
      const header = JSON.parse(
        atob(receipt.value.protected.replace(/-/g, '+').replace(/_/g, '/'))
      );
      return header.alg;
    } catch {
      return null;
    }
  });

  return {
    isValid,
    errors: computed(() => errors.value),
    algorithm
  };
}

module.exports = {
  useCertNodeVerification,
  useJWKSManager,
  useBatchVerification,
  useCertNodeClient,
  useReceiptValidation
};
//---------------------------------------------------------------------