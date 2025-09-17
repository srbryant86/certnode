# @certnode/vue

[![npm version](https://badge.fury.io/js/%40certnode%2Fvue.svg)](https://badge.fury.io/js/%40certnode%2Fvue)

Vue 3 composables for CertNode receipt verification. Provides reactive, type-safe Vue integration for verifying tamper-evident digital records.

## 🚀 Quick Start

```bash
npm install @certnode/vue @certnode/sdk
```

```vue
<template>
  <div>
    <button @click="verify" :disabled="loading">
      {{ loading ? 'Verifying...' : 'Verify Receipt' }}
    </button>
    <div v-if="result" :class="isValid ? 'success' : 'error'">
      {{ isValid ? '✅ Valid' : `❌ ${result.reason}` }}
    </div>
  </div>
</template>

<script setup>
import { useCertNodeVerification } from '@certnode/vue';

const { verify, result, loading, isValid } = useCertNodeVerification();

// Call verify() with your receipt and JWKS
</script>
```

## 🎯 Available Composables

### `useCertNodeVerification`

Core composable for verifying individual receipts with full reactivity.

```vue
<template>
  <div class="receipt-verifier">
    <div class="form-group">
      <label>Auto-verify:</label>
      <input v-model="autoVerify" type="checkbox" />
    </div>

    <div class="verification-status">
      <div v-if="loading" class="loading">
        🔄 Verifying receipt...
      </div>
      <div v-else-if="error" class="error">
        🚨 Error: {{ error.message }}
      </div>
      <div v-else-if="isValid" class="success">
        ✅ Receipt is valid!
      </div>
      <div v-else-if="isInvalid" class="error">
        ❌ Invalid: {{ result.reason }}
      </div>
    </div>

    <div class="actions">
      <button @click="verify()" :disabled="loading">
        Verify Again
      </button>
      <button @click="reset">Reset</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useCertNodeVerification } from '@certnode/vue';

const myReceipt = ref({
  protected: "eyJhbGciOiJFUzI1Ni...",
  payload: { document: "Hello, World!" },
  signature: "MEQCIAH8B3K2l1D0...",
  kid: "test-key"
});

const myJwks = ref({
  keys: [/* your keys */]
});

const {
  // Reactive state
  result,
  loading,
  error,
  isValid,
  isInvalid,

  // Reactive inputs (two-way binding)
  receipt,
  jwks,
  autoVerify,

  // Methods
  verify,
  reset
} = useCertNodeVerification({
  receipt: myReceipt,
  jwks: myJwks,
  autoVerify: true
});
</script>
```

### `useJWKSManager`

Composable for managing JWKS fetching and caching with Vue reactivity.

```vue
<template>
  <div class="jwks-manager">
    <div v-if="loading" class="loading">
      Loading verification keys...
    </div>
    <div v-else-if="error" class="error">
      Error: {{ error.message }}
    </div>
    <div v-else-if="jwks" class="success">
      ✅ Keys loaded: {{ thumbprints.length }} available
      <ul>
        <li v-for="thumbprint in thumbprints" :key="thumbprint">
          {{ thumbprint.slice(0, 16) }}...
        </li>
      </ul>
    </div>

    <div class="actions">
      <button @click="fetchJwks('https://api.certnode.io/.well-known/jwks.json')">
        Fetch JWKS
      </button>
      <button @click="reset">Reset</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useJWKSManager } from '@certnode/vue';

const {
  jwks,           // ComputedRef<JWKS | null>
  loading,        // ComputedRef<boolean>
  error,          // ComputedRef<Error | null>
  thumbprints,    // ComputedRef<string[]>
  fetchJwks,      // Function to fetch from URL
  setJwks,        // Function to set JWKS object
  reset,          // Reset function
  manager         // JWKSManager instance
} = useJWKSManager({
  ttlMs: 5 * 60 * 1000  // 5-minute cache
});

// Auto-fetch on component mount
onMounted(() => {
  fetchJwks('https://api.certnode.io/.well-known/jwks.json');
});
</script>
```

### `useBatchVerification`

Composable for verifying multiple receipts with reactive batch processing.

```vue
<template>
  <div class="batch-verifier">
    <h3>Batch Verification</h3>

    <div class="summary" v-if="summary.total > 0">
      <h4>Results Summary</h4>
      <p>{{ summary.valid }}/{{ summary.total }} receipts valid ({{ summary.validPercentage }}%)</p>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: summary.validPercentage + '%' }"
        ></div>
      </div>
    </div>

    <div v-if="loading" class="loading">
      Verifying {{ receipts.length }} receipts...
    </div>

    <div class="results">
      <div
        v-for="(result, index) in results"
        :key="index"
        :class="['result-item', result.valid ? 'valid' : 'invalid']"
      >
        <strong>Receipt {{ index + 1 }}</strong>
        <span class="status">{{ result.valid ? '✅' : '❌' }}</span>
        <span v-if="!result.valid" class="reason">{{ result.reason }}</span>
      </div>
    </div>

    <div class="actions">
      <button @click="verify()" :disabled="loading">
        Verify All
      </button>
      <button @click="reset">Reset Results</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useBatchVerification } from '@certnode/vue';

const receipts = ref([
  // Array of receipt objects
]);

const jwks = ref({
  keys: [/* your keys */]
});

const {
  results,     // ComputedRef<BatchVerificationResult[]>
  loading,     // ComputedRef<boolean>
  error,       // ComputedRef<Error | null>
  summary,     // ComputedRef<BatchVerificationSummary>
  verify,      // Verification function
  reset        // Reset function
} = useBatchVerification({
  receipts,
  jwks,
  autoVerify: true
});
</script>

<style scoped>
.progress-bar {
  width: 100%;
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4caf50;
  transition: width 0.3s ease;
}

.result-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  margin: 0.5rem 0;
  border-radius: 4px;
}

.result-item.valid {
  background: #e8f5e8;
  border-left: 4px solid #4caf50;
}

.result-item.invalid {
  background: #ffeaea;
  border-left: 4px solid #f44336;
}
</style>
```

### `useCertNodeClient`

High-level composable that combines JWKS management with verification and auto-retry.

```vue
<template>
  <div class="certnode-client">
    <div class="status">
      <div v-if="loading" class="loading">
        Loading...
        <span v-if="retryCount > 0">(Retry attempt {{ retryCount }})</span>
      </div>
      <div v-else-if="error" class="error">
        Error: {{ error.message }}
        <button @click="initialize">Retry</button>
      </div>
      <div v-else-if="initialized" class="success">
        ✅ Ready for verification ({{ thumbprints.length }} keys available)
      </div>
    </div>

    <div v-if="jwks" class="verification-section">
      <h3>Verify Receipt</h3>
      <textarea
        v-model="receiptJson"
        placeholder="Paste receipt JSON here..."
        rows="8"
        cols="50"
      ></textarea>
      <br />
      <button @click="handleVerify" :disabled="loading">
        Verify Receipt
      </button>

      <div v-if="result" :class="['result', isValid ? 'valid' : 'invalid']">
        {{ isValid ? '✅ Valid receipt!' : `❌ Invalid: ${result.reason}` }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useCertNodeClient } from '@certnode/vue';

const receiptJson = ref('');

const {
  // JWKS management
  jwks,
  fetchJwks,
  thumbprints,

  // Verification
  verify,
  result,
  isValid,
  isInvalid,

  // State
  loading,
  error,
  retryCount,
  initialized,

  // Actions
  initialize,
  reset
} = useCertNodeClient({
  jwksUrl: 'https://api.certnode.io/.well-known/jwks.json',
  retryAttempts: 3,
  retryDelay: 1000,
  autoInitialize: true
});

const handleVerify = async () => {
  try {
    const receipt = JSON.parse(receiptJson.value);
    await verify(receipt);
  } catch (err) {
    console.error('Invalid JSON:', err);
  }
};
</script>
```

### `useReceiptValidation`

Utility composable for reactive receipt validation.

```vue
<template>
  <div class="receipt-validation">
    <h3>Receipt Validation</h3>

    <textarea
      v-model="receiptText"
      placeholder="Paste receipt JSON..."
      @input="parseReceipt"
    ></textarea>

    <div class="validation-status">
      <div v-if="isValid" class="success">
        ✅ Receipt structure is valid
        <p v-if="algorithm">Algorithm: {{ algorithm }}</p>
      </div>
      <div v-else class="error">
        ❌ Receipt validation failed:
        <ul>
          <li v-for="error in errors" :key="error">{{ error }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useReceiptValidation } from '@certnode/vue';

const receiptText = ref('');
const receipt = ref(null);

const { isValid, errors, algorithm } = useReceiptValidation(receipt);

const parseReceipt = () => {
  try {
    receipt.value = receiptText.value ? JSON.parse(receiptText.value) : null;
  } catch {
    receipt.value = null;
  }
};
</script>
```

## 📚 Complete Examples

### Document Verification App

```vue
<template>
  <div class="document-verifier">
    <h1>🔐 Document Verifier</h1>

    <!-- JWKS Configuration -->
    <section class="jwks-section">
      <h2>Verification Keys</h2>
      <div class="form-group">
        <label>JWKS URL:</label>
        <input
          v-model="jwksUrl"
          type="url"
          placeholder="https://api.certnode.io/.well-known/jwks.json"
        />
        <button @click="client.fetchJwks(jwksUrl)" :disabled="client.loading.value">
          Load Keys
        </button>
      </div>

      <div v-if="client.jwks.value" class="keys-info">
        ✅ {{ client.thumbprints.value.length }} keys loaded
      </div>
    </section>

    <!-- Receipt Verification -->
    <section class="verification-section">
      <h2>Receipt Verification</h2>

      <div class="form-group">
        <label>Receipt JSON:</label>
        <textarea
          v-model="receiptText"
          rows="10"
          placeholder="Paste your receipt JSON here..."
        ></textarea>
      </div>

      <div class="form-group">
        <label>
          <input v-model="autoVerify" type="checkbox" />
          Auto-verify when receipt changes
        </label>
      </div>

      <button
        @click="handleVerify"
        :disabled="verification.loading.value || !client.jwks.value"
        class="verify-btn"
      >
        {{ verification.loading.value ? 'Verifying...' : 'Verify Receipt' }}
      </button>

      <!-- Results -->
      <div v-if="verification.result.value" class="result">
        <div :class="['result-badge', verification.isValid.value ? 'valid' : 'invalid']">
          {{ verification.isValid.value ? '✅ VALID' : '❌ INVALID' }}
        </div>
        <div v-if="!verification.isValid.value" class="error-details">
          Reason: {{ verification.result.value.reason }}
        </div>
        <div v-if="parsedReceipt" class="receipt-details">
          <p><strong>Document ID:</strong> {{ parsedReceipt.payload?.document_id }}</p>
          <p><strong>Algorithm:</strong> {{ validation.algorithm.value }}</p>
          <p><strong>Key ID:</strong> {{ parsedReceipt.kid }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import {
  useCertNodeClient,
  useCertNodeVerification,
  useReceiptValidation
} from '@certnode/vue';

// Reactive data
const jwksUrl = ref('https://api.certnode.io/.well-known/jwks.json');
const receiptText = ref('');
const autoVerify = ref(false);

// Parsed receipt
const parsedReceipt = computed(() => {
  try {
    return receiptText.value ? JSON.parse(receiptText.value) : null;
  } catch {
    return null;
  }
});

// Client for JWKS management
const client = useCertNodeClient({
  jwksUrl: jwksUrl.value,
  autoInitialize: true
});

// Receipt validation
const validation = useReceiptValidation(parsedReceipt);

// Receipt verification
const verification = useCertNodeVerification({
  receipt: parsedReceipt,
  jwks: client.jwks,
  autoVerify
});

// Manual verification handler
const handleVerify = async () => {
  if (parsedReceipt.value && client.jwks.value) {
    await verification.verify();
  }
};
</script>

<style scoped>
.document-verifier {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.verify-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.verify-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.result {
  margin-top: 2rem;
  padding: 1rem;
  border-radius: 4px;
}

.result-badge {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.result-badge.valid {
  color: #28a745;
}

.result-badge.invalid {
  color: #dc3545;
}

.keys-info {
  color: #28a745;
  font-weight: bold;
}
</style>
```

### Composition API with TypeScript

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCertNodeVerification } from '@certnode/vue';
import type { Receipt, JWKS } from '@certnode/sdk';

interface DocumentReceipt extends Receipt {
  payload: {
    document_id: string;
    content: string;
    timestamp: string;
  };
}

const receipt = ref<DocumentReceipt>({
  protected: "eyJhbGciOiJFUzI1NiIsImtpZCI6InRlc3Qta2V5In0",
  payload: {
    document_id: "DOC-123",
    content: "Confidential document",
    timestamp: "2025-01-15T10:30:00Z"
  },
  signature: "MEQCIAH8B3K2l1D0F9X7Zz8Q2P5M6N7R3S4T5U6V7W8X9Y0Z...",
  kid: "test-key"
});

const jwks = ref<JWKS>({
  keys: [
    // Your JWKS keys here
  ]
});

const {
  result,
  loading,
  error,
  isValid,
  verify,
  reset
} = useCertNodeVerification({
  receipt,
  jwks,
  autoVerify: true
});

// Type-safe access to payload
const documentInfo = computed(() => {
  if (!receipt.value) return null;
  return {
    id: receipt.value.payload.document_id,
    content: receipt.value.payload.content,
    timestamp: new Date(receipt.value.payload.timestamp).toLocaleString()
  };
});
</script>

<template>
  <div class="typed-verifier">
    <h2>Document Verification</h2>

    <div v-if="documentInfo" class="document-info">
      <h3>{{ documentInfo.id }}</h3>
      <p>{{ documentInfo.content }}</p>
      <small>{{ documentInfo.timestamp }}</small>
    </div>

    <div class="verification-status">
      <div v-if="loading" class="loading">Verifying...</div>
      <div v-else-if="error" class="error">{{ error.message }}</div>
      <div v-else-if="isValid" class="success">✅ Document verified</div>
      <div v-else-if="result" class="error">❌ {{ result.reason }}</div>
    </div>

    <button @click="verify()">Verify Again</button>
    <button @click="reset">Reset</button>
  </div>
</template>
```

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.

## 🔗 Links

- **Main SDK**: [@certnode/sdk](https://www.npmjs.com/package/@certnode/sdk)
- **React Integration**: [@certnode/react](https://www.npmjs.com/package/@certnode/react)
- **CLI Tool**: [@certnode/cli](https://www.npmjs.com/package/@certnode/cli)
- **Documentation**: [https://certnode.io/docs](https://certnode.io/docs)
- **GitHub**: [https://github.com/srbryant86/certnode](https://github.com/srbryant86/certnode)

---

**Made with ❤️ by the CertNode team**