# CertNode Python SDK

[![PyPI version](https://badge.fury.io/py/certnode.svg)](https://badge.fury.io/py/certnode)
[![Python versions](https://img.shields.io/pypi/pyversions/certnode.svg)](https://pypi.org/project/certnode/)

Python SDK for CertNode receipt verification. Supports ES256 (ECDSA P-256) and EdDSA (Ed25519) algorithms with minimal dependencies.

## 🚀 Quick Start

```bash
pip install certnode
```

```python
from certnode import verify_receipt

# Verify a CertNode receipt
receipt = {
    "protected": "eyJhbGciOiJFUzI1NiIsImtpZCI6InRlc3Qta2V5In0",
    "payload": {"document": "Hello, World!"},
    "signature": "MEQCIAH8B3K2l1D0F9X7Zz8Q2P5M6N7R3S4T5U6V7W8X9Y0Z...",
    "kid": "test-key"
}

jwks = {
    "keys": [{
        "kty": "EC",
        "crv": "P-256",
        "x": "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
        "y": "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
        "kid": "test-key"
    }]
}

result = verify_receipt(receipt, jwks)
print("Valid!" if result.ok else f"Invalid: {result.reason}")
```

## 📖 Features

- ✅ **Minimal Dependencies** - Only requires `cryptography` library
- ✅ **ES256 Support** - ECDSA P-256 signatures (RFC 7515)
- ✅ **EdDSA Support** - Ed25519 deterministic signatures
- ✅ **JSON Canonicalization** - RFC 8785 JCS for consistent hashing
- ✅ **Type Hints** - Full typing support for better IDE experience
- ✅ **JWKS Management** - Automatic key fetching and caching
- ✅ **CLI Tool** - Command-line interface for verification tasks
- ✅ **Production Ready** - Used in enterprise environments

## 🔧 API Reference

### `verify_receipt(receipt, jwks)`

Verifies a CertNode receipt against a JWKS.

**Parameters:**
- `receipt` (dict|str): The receipt to verify (dict or JSON string)
- `jwks` (dict): JWKS containing public keys

**Returns:** `VerifyResult` with `ok: bool` and optional `reason: str`

### Receipt Format

```python
from typing import Dict, Any, Optional

class Receipt:
    protected: str              # Base64url JWS header
    payload: Any               # Original data
    signature: str             # Base64url signature
    kid: str                   # Key identifier
    payload_jcs_sha256: Optional[str]  # Optional payload hash
    receipt_id: Optional[str]  # Optional receipt ID
```

### JWKS Format

**ES256 (ECDSA P-256) Key:**
```python
{
    "keys": [{
        "kty": "EC",
        "crv": "P-256",
        "x": "base64url-encoded-x-coordinate",
        "y": "base64url-encoded-y-coordinate",
        "kid": "key-identifier",
        "alg": "ES256"
    }]
}
```

**EdDSA (Ed25519) Key:**
```python
{
    "keys": [{
        "kty": "OKP",
        "crv": "Ed25519",
        "x": "base64url-encoded-public-key",
        "kid": "key-identifier",
        "alg": "EdDSA"
    }]
}
```

## 📚 Examples

### Basic Verification

```python
import json
from certnode import verify_receipt

def verify_document_receipt():
    receipt = {
        "protected": "eyJhbGciOiJFUzI1NiIsImtpZCI6InByb2QtMjAyNSJ9",
        "payload": {
            "document_id": "DOC-2025-001",
            "content": "Financial audit report Q4 2024",
            "timestamp": "2025-01-15T10:30:00Z"
        },
        "signature": "MEQCIAH8B3K2l1D0F9X7Zz8Q2P5M6N7R3S4T5U6V7W8X9Y0Z...",
        "kid": "prod-2025",
        "payload_jcs_sha256": "uU0nuZNNPgilLlLX2n2r-sSE7-N6U4DukIj3rOLvzek"
    }

    jwks = {
        "keys": [{
            "kty": "EC",
            "crv": "P-256",
            "x": "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
            "y": "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
            "kid": "prod-2025",
            "alg": "ES256"
        }]
    }

    result = verify_receipt(receipt, jwks)

    if result.ok:
        print("✅ Document is authentic and unmodified")
        return True
    else:
        print(f"❌ Verification failed: {result.reason}")
        return False

if __name__ == "__main__":
    verify_document_receipt()
```

### Using EdDSA (Deterministic Signatures)

```python
from certnode import verify_receipt

def verify_with_eddsa():
    receipt = {
        "protected": "eyJhbGciOiJFZERTQSIsImtpZCI6ImVkMjU1MTkta2V5In0",
        "payload": {
            "transaction_id": "TXN-123456",
            "amount": 45000,
            "currency": "USD"
        },
        "signature": "hgyY0il_MGCjP0JzlnLWG1PPOt7-09PGcvMg3AIbQR6d...",
        "kid": "ed25519-key"
    }

    jwks = {
        "keys": [{
            "kty": "OKP",
            "crv": "Ed25519",
            "x": "11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo",
            "kid": "ed25519-key",
            "alg": "EdDSA"
        }]
    }

    result = verify_receipt(receipt, jwks)
    print("Valid EdDSA signature!" if result.ok else f"Invalid: {result.reason}")

verify_with_eddsa()
```

### JWKS Management with Auto-Fetching

```python
from certnode import verify_receipt, JWKSManager

def verify_with_jwks_manager():
    # Initialize JWKS manager with 5-minute cache
    jwks_manager = JWKSManager(ttl_seconds=300)

    # Fetch JWKS from CertNode's public endpoint
    jwks = jwks_manager.fetch_from_url("https://api.certnode.io/.well-known/jwks.json")

    receipt = {
        "protected": "eyJhbGciOiJFUzI1NiIsImtpZCI6ImNlcnQtMjAyNS0wMS0xNSJ9",
        "payload": {"message": "Hello from CertNode!"},
        "signature": "MEQCIAH8B3K2l1D0F9X7Zz8Q2P5M6N7R3S4T5U6V7W8X9Y0Z...",
        "kid": "cert-2025-01-15"
    }

    result = verify_receipt(receipt, jwks)

    if result.ok:
        print("✅ Receipt verified against live JWKS")
    else:
        print(f"❌ {result.reason}")

    # Check available key thumbprints
    thumbprints = jwks_manager.thumbprints()
    print(f"Available keys: {thumbprints}")

verify_with_jwks_manager()
```

### Error Handling

```python
from certnode import verify_receipt, CertNodeError, VerificationError, JWKSError

def handle_verification_errors():
    receipt = {}  # Malformed receipt
    jwks = {"keys": []}

    try:
        result = verify_receipt(receipt, jwks)

        if not result.ok:
            # Handle specific error cases
            if "Unsupported algorithm" in result.reason:
                print("Algorithm not supported. Use ES256 or EdDSA.")
            elif "Key not found" in result.reason:
                print("Signing key not available in JWKS.")
            elif "Invalid signature" in result.reason:
                print("Document has been tampered with.")
            else:
                print(f"Verification failed: {result.reason}")

    except VerificationError as e:
        print(f"Verification error: {e}")
    except JWKSError as e:
        print(f"JWKS error: {e}")
    except CertNodeError as e:
        print(f"CertNode error: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

handle_verification_errors()
```

### Batch Verification

```python
import asyncio
import concurrent.futures
from certnode import verify_receipt

def verify_batch(receipts, jwks, max_workers=4):
    """Verify multiple receipts in parallel."""

    def verify_single(receipt_data):
        index, receipt = receipt_data
        result = verify_receipt(receipt, jwks)
        return {
            "index": index,
            "receipt_id": receipt.get("kid"),
            "valid": result.ok,
            "reason": result.reason
        }

    # Use ThreadPoolExecutor for I/O bound verification
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        results = list(executor.map(verify_single, enumerate(receipts)))

    # Summarize results
    valid_count = sum(1 for r in results if r["valid"])
    print(f"{valid_count}/{len(results)} receipts verified successfully")

    # Log failures
    for result in results:
        if not result["valid"]:
            print(f"Receipt {result['index']} ({result['receipt_id']}): {result['reason']}")

    return results

# Usage
receipts = [
    # List of receipt dictionaries
]
jwks = {"keys": [...]}  # Your JWKS
results = verify_batch(receipts, jwks)
```

### Django Integration

```python
# Django middleware for CertNode verification
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from certnode import verify_receipt, JWKSManager

class CertNodeMiddleware(MiddlewareMixin):
    def __init__(self, get_response):
        self.get_response = get_response
        self.jwks_manager = JWKSManager(ttl_seconds=300)
        super().__init__(get_response)

    def process_request(self, request):
        # Only verify requests with receipts
        if not hasattr(request, 'json') or 'receipt' not in request.json:
            return None

        try:
            receipt = request.json['receipt']
            jwks_url = getattr(settings, 'CERTNODE_JWKS_URL')
            jwks = self.jwks_manager.fetch_from_url(jwks_url)

            result = verify_receipt(receipt, jwks)

            if result.ok:
                # Store verified payload for view access
                request.verified_payload = receipt['payload']
                return None
            else:
                return JsonResponse({
                    'error': 'Invalid receipt',
                    'reason': result.reason
                }, status=401)

        except Exception as e:
            return JsonResponse({
                'error': 'Verification failed',
                'details': str(e)
            }, status=500)

# In views.py
def protected_view(request):
    if hasattr(request, 'verified_payload'):
        # Access verified data
        data = request.verified_payload
        return JsonResponse({'success': True, 'data': data})
    else:
        return JsonResponse({'error': 'Receipt required'}, status=400)
```

### Flask Integration

```python
from flask import Flask, request, jsonify
from functools import wraps
from certnode import verify_receipt, JWKSManager

app = Flask(__name__)
jwks_manager = JWKSManager()

def require_receipt_verification(jwks_url):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                receipt = request.json.get('receipt')
                if not receipt:
                    return jsonify({'error': 'Receipt required'}), 400

                jwks = jwks_manager.fetch_from_url(jwks_url)
                result = verify_receipt(receipt, jwks)

                if result.ok:
                    # Add verified payload to request context
                    request.verified_payload = receipt['payload']
                    return f(*args, **kwargs)
                else:
                    return jsonify({
                        'error': 'Invalid receipt',
                        'reason': result.reason
                    }), 401

            except Exception as e:
                return jsonify({
                    'error': 'Verification failed',
                    'details': str(e)
                }), 500

        return decorated_function
    return decorator

@app.route('/api/protected', methods=['POST'])
@require_receipt_verification('https://api.certnode.io/.well-known/jwks.json')
def protected_endpoint():
    data = request.verified_payload
    return jsonify({'status': 'success', 'data': data})
```

### Data Science / Jupyter Integration

```python
# Perfect for data science workflows
import pandas as pd
from certnode import verify_receipt, JWKSManager

class ReceiptDataFrame:
    """DataFrame-like interface for receipt verification."""

    def __init__(self, jwks_url):
        self.jwks_manager = JWKSManager()
        self.jwks = self.jwks_manager.fetch_from_url(jwks_url)

    def verify_dataframe(self, df, receipt_col='receipt'):
        """Verify receipts in a pandas DataFrame."""
        results = []

        for idx, row in df.iterrows():
            receipt = row[receipt_col]
            if isinstance(receipt, str):
                import json
                receipt = json.loads(receipt)

            result = verify_receipt(receipt, self.jwks)
            results.append({
                'index': idx,
                'valid': result.ok,
                'reason': result.reason,
                'payload': receipt.get('payload', {})
            })

        return pd.DataFrame(results)

# Usage in Jupyter
verifier = ReceiptDataFrame('https://api.certnode.io/.well-known/jwks.json')

# Load receipts from CSV
receipts_df = pd.read_csv('receipts.csv')

# Verify all receipts
results_df = verifier.verify_dataframe(receipts_df)

# Analyze results
print(f"Verification rate: {results_df['valid'].mean():.1%}")
print(f"Valid receipts: {results_df['valid'].sum()}")
print(f"Invalid receipts: {(~results_df['valid']).sum()}")

# Plot verification results
import matplotlib.pyplot as plt
results_df['valid'].value_counts().plot(kind='bar')
plt.title('Receipt Verification Results')
plt.show()
```

## 🔧 Command Line Interface

The package includes a CLI tool for common verification tasks:

```bash
# Verify a receipt
certnode-py verify --receipt receipt.json --jwks https://api.certnode.io/.well-known/jwks.json

# Verbose verification
certnode-py verify -r receipt.json -k jwks.json --verbose

# Inspect a receipt
certnode-py inspect receipt.json

# Inspect a JWKS file
certnode-py inspect jwks.json --format json

# Generate key thumbprints
certnode-py thumbprint https://api.certnode.io/.well-known/jwks.json
```

## 🔒 Security Considerations

- **Always verify receipts** against a trusted JWKS source
- **Use HTTPS** when fetching JWKS from remote endpoints
- **Validate key sources** - ensure JWKS comes from trusted authorities
- **Handle errors gracefully** - log failures for security monitoring
- **Pin cryptography version** in production for consistent behavior

## 🧪 Testing

```bash
# Install development dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Run with coverage
pytest --cov=src/certnode --cov-report=html

# Type checking
mypy src/certnode

# Code formatting
black src/certnode tests/
isort src/certnode tests/

# Linting
flake8 src/certnode tests/
```

## 📦 Installation Options

```bash
# Basic installation
pip install certnode

# With development tools
pip install certnode[dev]

# With documentation tools
pip install certnode[docs]

# From source
git clone https://github.com/srbryant86/certnode.git
cd certnode/sdk/python
pip install -e .
```

## 🏗️ Integration Examples

### Docker Usage

```dockerfile
FROM python:3.11-slim

RUN pip install certnode

COPY receipt.json jwks.json ./

CMD ["certnode-py", "verify", "--receipt", "receipt.json", "--jwks", "jwks.json"]
```

### GitHub Actions

```yaml
name: Verify Receipts

on: [push]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install certnode
      - run: |
          for receipt in receipts/*.json; do
            certnode-py verify --receipt "$receipt" --jwks "${{ secrets.JWKS_URL }}"
          done
```

### AWS Lambda

```python
import json
import boto3
from certnode import verify_receipt, JWKSManager

# Initialize outside handler for reuse
jwks_manager = JWKSManager(ttl_seconds=300)

def lambda_handler(event, context):
    try:
        # Get receipt from event
        receipt = json.loads(event['body'])['receipt']

        # Fetch JWKS from Parameter Store
        ssm = boto3.client('ssm')
        jwks_url = ssm.get_parameter(Name='/certnode/jwks-url')['Parameter']['Value']
        jwks = jwks_manager.fetch_from_url(jwks_url)

        # Verify
        result = verify_receipt(receipt, jwks)

        return {
            'statusCode': 200 if result.ok else 400,
            'body': json.dumps({
                'valid': result.ok,
                'reason': result.reason
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.

## 🔗 Links

- **Documentation**: [https://certnode.io/docs](https://certnode.io/docs)
- **PyPI**: [https://pypi.org/project/certnode/](https://pypi.org/project/certnode/)
- **GitHub**: [https://github.com/srbryant86/certnode](https://github.com/srbryant86/certnode)
- **Issues**: [https://github.com/srbryant86/certnode/issues](https://github.com/srbryant86/certnode/issues)

## 🤝 Contributing

Contributions welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) and [Code of Conduct](../../CODE_OF_CONDUCT.md).

---

**Made with ❤️ by the CertNode team**