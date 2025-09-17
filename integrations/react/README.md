# @certnode/react

[![npm version](https://badge.fury.io/js/%40certnode%2Freact.svg)](https://badge.fury.io/js/%40certnode%2Freact)

React hooks for CertNode receipt verification. Provides declarative, type-safe React integration for verifying tamper-evident digital records.

## 🚀 Quick Start

```bash
npm install @certnode/react @certnode/sdk
```

```jsx
import { useCertNodeVerification } from '@certnode/react';

function ReceiptVerifier() {
  const { verify, result, loading, isValid } = useCertNodeVerification();

  const handleVerify = () => {
    verify(myReceipt, myJwks);
  };

  return (
    <div>
      <button onClick={handleVerify} disabled={loading}>
        {loading ? 'Verifying...' : 'Verify Receipt'}
      </button>
      {result && (
        <div className={isValid ? 'success' : 'error'}>
          {isValid ? '✅ Valid' : `❌ ${result.reason}`}
        </div>
      )}
    </div>
  );
}
```

## 🎣 Available Hooks

### `useCertNodeVerification`

Core hook for verifying individual receipts.

```jsx
import { useCertNodeVerification } from '@certnode/react';

function DocumentVerifier({ receipt, jwks }) {
  const {
    verify,      // Function to trigger verification
    result,      // VerifyResult | null
    loading,     // boolean
    error,       // Error | null
    reset,       // Function to clear state
    isValid,     // boolean - true if result.ok === true
    isInvalid    // boolean - true if result.ok === false
  } = useCertNodeVerification({
    receipt,     // Optional: receipt to verify
    jwks,        // Optional: JWKS for verification
    autoVerify: true  // Optional: auto-verify when inputs change
  });

  return (
    <div>
      {loading && <p>Verifying receipt...</p>}
      {error && <p>Error: {error.message}</p>}
      {isValid && <p>✅ Receipt is valid!</p>}
      {isInvalid && <p>❌ Invalid: {result.reason}</p>}

      <button onClick={() => verify()}>Verify Again</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### `useJWKSManager`

Hook for managing JWKS fetching and caching.

```jsx
import { useJWKSManager } from '@certnode/react';

function JwksProvider({ children }) {
  const {
    jwks,           // JWKS | null
    fetchJwks,      // Function to fetch from URL
    setJwks,        // Function to set JWKS object
    loading,        // boolean
    error,          // Error | null
    thumbprints,    // string[] - available key thumbprints
    manager         // JWKSManager instance
  } = useJWKSManager({
    ttlMs: 5 * 60 * 1000  // 5-minute cache
  });

  useEffect(() => {
    fetchJwks('https://api.certnode.io/.well-known/jwks.json');
  }, [fetchJwks]);

  if (loading) return <div>Loading keys...</div>;
  if (error) return <div>Error loading keys: {error.message}</div>;

  return (
    <JwksContext.Provider value={jwks}>
      {children}
    </JwksContext.Provider>
  );
}
```

### `useBatchVerification`

Hook for verifying multiple receipts simultaneously.

```jsx
import { useBatchVerification } from '@certnode/react';

function BatchVerifier({ receipts, jwks }) {
  const {
    verify,      // Function to verify all receipts
    results,     // BatchVerificationResult[]
    loading,     // boolean
    error,       // Error | null
    summary      // { total, valid, invalid, validPercentage, allValid, allInvalid }
  } = useBatchVerification({
    receipts,
    jwks,
    autoVerify: true
  });

  return (
    <div>
      <h3>Batch Verification Results</h3>
      <p>{summary.valid}/{summary.total} receipts valid ({summary.validPercentage}%)</p>

      {loading && <p>Verifying {receipts.length} receipts...</p>}

      <div>
        {results.map((result, index) => (
          <div key={index} className={result.valid ? 'success' : 'error'}>
            Receipt {index + 1}: {result.valid ? '✅ Valid' : `❌ ${result.reason}`}
          </div>
        ))}
      </div>

      <button onClick={() => verify()}>Verify All Again</button>
    </div>
  );
}
```

### `useCertNodeClient`

High-level hook that combines JWKS management with verification.

```jsx
import { useCertNodeClient } from '@certnode/react';

function CertNodeApp() {
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

    // Actions
    initialize,
    reset
  } = useCertNodeClient({
    jwksUrl: 'https://api.certnode.io/.well-known/jwks.json',
    retryAttempts: 3,
    retryDelay: 1000
  });

  const handleVerifyReceipt = (receipt) => {
    verify(receipt);  // Automatically fetches JWKS if needed
  };

  return (
    <div>
      {loading && <p>Loading...</p>}
      {retryCount > 0 && <p>Retrying... (attempt {retryCount})</p>}
      {error && <p>Error: {error.message}</p>}

      {jwks && (
        <div>
          <p>Keys loaded: {thumbprints.length} available</p>
          <button onClick={() => handleVerifyReceipt(myReceipt)}>
            Verify Receipt
          </button>
        </div>
      )}

      {result && (
        <div className={isValid ? 'success' : 'error'}>
          {isValid ? '✅ Valid' : `❌ ${result.reason}`}
        </div>
      )}
    </div>
  );
}
```

## 📚 Complete Examples

### Basic Document Verifier

```jsx
import React, { useState } from 'react';
import { useCertNodeVerification } from '@certnode/react';

function DocumentVerifier() {
  const [receiptText, setReceiptText] = useState('');
  const [jwksText, setJwksText] = useState('');

  const { verify, result, loading, error, isValid } = useCertNodeVerification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const receipt = JSON.parse(receiptText);
      const jwks = JSON.parse(jwksText);
      await verify(receipt, jwks);
    } catch (err) {
      console.error('Parse error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Receipt JSON:</label>
        <textarea
          value={receiptText}
          onChange={(e) => setReceiptText(e.target.value)}
          rows={8}
          cols={50}
        />
      </div>

      <div>
        <label>JWKS JSON:</label>
        <textarea
          value={jwksText}
          onChange={(e) => setJwksText(e.target.value)}
          rows={8}
          cols={50}
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Verifying...' : 'Verify Receipt'}
      </button>

      {error && <div className="error">Error: {error.message}</div>}
      {result && (
        <div className={isValid ? 'success' : 'error'}>
          {isValid ? '✅ Receipt is valid!' : `❌ Invalid: ${result.reason}`}
        </div>
      )}
    </form>
  );
}
```

### Real-time Receipt Monitor

```jsx
import React, { useEffect } from 'react';
import { useCertNodeClient, useBatchVerification } from '@certnode/react';

function ReceiptMonitor({ receipts }) {
  const client = useCertNodeClient({
    jwksUrl: 'https://api.certnode.io/.well-known/jwks.json'
  });

  const batchVerifier = useBatchVerification({
    receipts,
    jwks: client.jwks,
    autoVerify: true
  });

  return (
    <div>
      <h2>Receipt Monitor</h2>

      {client.loading && <p>Loading verification keys...</p>}
      {client.error && <p>Error: {client.error.message}</p>}

      {client.jwks && (
        <div>
          <p>✅ Keys loaded ({client.thumbprints.length} available)</p>

          <div>
            <h3>Batch Results ({batchVerifier.summary.validPercentage}% valid)</h3>
            <p>
              {batchVerifier.summary.valid} valid,
              {batchVerifier.summary.invalid} invalid
            </p>

            {batchVerifier.loading && <p>Verifying receipts...</p>}

            <div className="results">
              {batchVerifier.results.map((result, index) => (
                <div
                  key={index}
                  className={`receipt-result ${result.valid ? 'valid' : 'invalid'}`}
                >
                  <strong>Receipt {index + 1}</strong>
                  <span>{result.valid ? '✅' : '❌'}</span>
                  {!result.valid && <span>{result.reason}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### TypeScript Integration

```tsx
import React from 'react';
import { useCertNodeVerification } from '@certnode/react';
import { Receipt, JWKS } from '@certnode/sdk';

interface DocumentReceiptPayload {
  document_id: string;
  content: string;
  timestamp: string;
}

interface DocumentReceiptProps {
  receipt: Receipt & { payload: DocumentReceiptPayload };
  jwks: JWKS;
}

const DocumentReceiptVerifier: React.FC<DocumentReceiptProps> = ({ receipt, jwks }) => {
  const { verify, result, loading, isValid, error } = useCertNodeVerification({
    receipt,
    jwks,
    autoVerify: true
  });

  if (loading) return <div>Verifying document...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="document-verifier">
      <h3>Document: {receipt.payload.document_id}</h3>
      <p>Content: {receipt.payload.content}</p>
      <p>Timestamp: {receipt.payload.timestamp}</p>

      <div className={`verification-status ${isValid ? 'valid' : 'invalid'}`}>
        {isValid ? (
          <span>✅ Document verified and tamper-evident</span>
        ) : (
          <span>❌ Verification failed: {result?.reason}</span>
        )}
      </div>

      <button onClick={() => verify()}>Verify Again</button>
    </div>
  );
};
```

## 🎯 Best Practices

### 1. Error Boundaries

```jsx
import React from 'react';

class CertNodeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CertNode verification error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong with receipt verification.</div>;
    }

    return this.props.children;
  }
}
```

### 2. Context Provider Pattern

```jsx
import React, { createContext, useContext } from 'react';
import { useCertNodeClient } from '@certnode/react';

const CertNodeContext = createContext();

export function CertNodeProvider({ children, jwksUrl }) {
  const client = useCertNodeClient({ jwksUrl });

  return (
    <CertNodeContext.Provider value={client}>
      {children}
    </CertNodeContext.Provider>
  );
}

export function useCertNode() {
  const context = useContext(CertNodeContext);
  if (!context) {
    throw new Error('useCertNode must be used within CertNodeProvider');
  }
  return context;
}
```

### 3. Memoization for Performance

```jsx
import React, { useMemo } from 'react';
import { useCertNodeVerification } from '@certnode/react';

function OptimizedVerifier({ receipts, jwks }) {
  // Memoize expensive computations
  const memoizedReceipts = useMemo(() =>
    receipts.filter(r => r.kid && r.signature),
    [receipts]
  );

  const { verify, results, summary } = useBatchVerification({
    receipts: memoizedReceipts,
    jwks,
    autoVerify: true
  });

  return <div>{/* Render results */}</div>;
}
```

## 🔧 Development

```bash
# Clone the repository
git clone https://github.com/srbryant86/certnode.git
cd certnode/integrations/react

# Install dependencies
npm install

# Link for local development
npm link @certnode/sdk
npm link
```

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.

## 🔗 Links

- **Main SDK**: [@certnode/sdk](https://www.npmjs.com/package/@certnode/sdk)
- **CLI Tool**: [@certnode/cli](https://www.npmjs.com/package/@certnode/cli)
- **Documentation**: [https://certnode.io/docs](https://certnode.io/docs)
- **GitHub**: [https://github.com/srbryant86/certnode](https://github.com/srbryant86/certnode)

---

**Made with ❤️ by the CertNode team**