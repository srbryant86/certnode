# @certnode/cli

[![npm version](https://badge.fury.io/js/%40certnode%2Fcli.svg)](https://badge.fury.io/js/%40certnode%2Fcli)

Command-line interface for CertNode - receipt verification, project scaffolding, and development utilities.

## 🚀 Quick Start

```bash
# Install globally
npm install -g @certnode/cli

# Or use with npx
npx @certnode/cli --help
```

## 📖 Commands

### `certnode verify`

Verify a CertNode receipt against a JWKS.

```bash
# Verify with local files
certnode verify -r receipt.json -k jwks.json

# Verify with remote JWKS
certnode verify -r receipt.json -k https://api.certnode.io/.well-known/jwks.json

# Verbose output
certnode verify -r receipt.json -k jwks.json --verbose
```

**Options:**
- `-r, --receipt <file>` - Receipt file (JSON) [required]
- `-k, --jwks <file|url>` - JWKS file or URL [required]
- `-v, --verbose` - Verbose output

### `certnode init`

Initialize a new CertNode project with scaffolding.

```bash
# Create Node.js project
certnode init my-app

# Create with specific template
certnode init my-web-app --template web
certnode init my-api --template express

# Skip npm install
certnode init my-app --skip-install
```

**Templates:**
- `node` - Node.js application with SDK integration (default)
- `web` - Browser application with WebCrypto verification
- `express` - Express.js API with verification middleware

**Options:**
- `-t, --template <type>` - Template type (node|web|express)
- `--skip-install` - Skip npm install

### `certnode generate`

Generate example files and cryptographic keys.

```bash
# Generate JWKS
certnode generate jwks --algorithm ES256
certnode generate jwks --algorithm EdDSA -o my-keys.json

# Generate key pair
certnode generate keys --algorithm ES256
certnode generate keys --algorithm EdDSA -o my-keypair

# Generate receipt template
certnode generate receipt -o example-receipt.json
```

**Types:**
- `jwks` - Generate JWKS with public key
- `keys` - Generate public/private key pair
- `receipt` - Generate receipt template

**Options:**
- `-a, --algorithm <alg>` - Algorithm (ES256|EdDSA)
- `-o, --output <file>` - Output file

### `certnode inspect`

Inspect and analyze receipt or JWKS files.

```bash
# Inspect receipt
certnode inspect receipt.json

# Inspect JWKS
certnode inspect jwks.json

# JSON output
certnode inspect receipt.json --format json
```

**Options:**
- `-f, --format <type>` - Output format (table|json)

## 🏗️ Project Templates

### Node.js Template

Creates a Node.js application with:
- Receipt verification example
- Error handling
- Test suite
- JWKS Manager integration

```bash
certnode init my-node-app
cd my-node-app
npm start
```

### Web Template

Creates a browser application with:
- HTML interface for receipt verification
- WebCrypto API integration
- ES256 and EdDSA examples
- No server dependencies

```bash
certnode init my-web-app --template web
cd my-web-app
npm start  # Serves on http://localhost:8080
```

### Express Template

Creates an Express.js API with:
- CertNode verification middleware
- Protected endpoints
- Manual verification routes
- CORS support
- Test suite

```bash
certnode init my-api --template express
cd my-api
npm start  # Starts server on http://localhost:3000
```

## 📚 Examples

### Basic Verification Workflow

```bash
# 1. Generate test keys
certnode generate keys --algorithm ES256

# 2. Create JWKS from public key
certnode generate jwks --algorithm ES256 -o test-jwks.json

# 3. Generate receipt template
certnode generate receipt -o test-receipt.json

# 4. Verify receipt (will fail with template data)
certnode verify -r test-receipt.json -k test-jwks.json -v
```

### Project Setup

```bash
# Create and set up a new project
certnode init document-verifier --template express
cd document-verifier
npm install

# Generate development keys
certnode generate keys --algorithm EdDSA -o dev-keys

# Start development server
npm start
```

### Production Verification

```bash
# Verify against live CertNode JWKS
certnode verify \
  --receipt production-receipt.json \
  --jwks https://api.certnode.io/.well-known/jwks.json \
  --verbose
```

## 🔧 Development

### Building from Source

```bash
git clone https://github.com/srbryant86/certnode.git
cd certnode/cli
npm install
npm link  # Make 'certnode' command available globally
```

### Testing

```bash
# Test CLI commands
npm test

# Test generated projects
certnode init test-project
cd test-project
npm test
```

## 🔒 Security Considerations

- **Always verify receipts** against trusted JWKS sources
- **Use HTTPS** when fetching remote JWKS
- **Validate key sources** - ensure JWKS comes from trusted authorities
- **Handle private keys securely** - never commit to repositories
- **Use environment variables** for production JWKS URLs

## 📝 Exit Codes

- `0` - Success
- `1` - Verification failed or command error
- `2` - Invalid arguments or file not found

## 🔗 Integration Examples

### CI/CD Pipeline

```yaml
# .github/workflows/verify.yml
name: Verify Receipts
on: [push]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install -g @certnode/cli
      - run: certnode verify -r receipts/*.json -k ${{ secrets.JWKS_URL }}
```

### Docker Usage

```dockerfile
FROM node:20-alpine
RUN npm install -g @certnode/cli
COPY receipts/ /app/receipts/
WORKDIR /app
CMD ["certnode", "verify", "-r", "receipts/receipt.json", "-k", "$JWKS_URL"]
```

### Makefile Integration

```makefile
verify:
	certnode verify -r $(RECEIPT_FILE) -k $(JWKS_URL) -v

setup:
	certnode init $(PROJECT_NAME) --template $(TEMPLATE)
	cd $(PROJECT_NAME) && npm install

.PHONY: verify setup
```

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.

## 🔗 Links

- **Documentation**: [https://certnode.io/docs](https://certnode.io/docs)
- **Node.js SDK**: [@certnode/sdk](https://www.npmjs.com/package/@certnode/sdk)
- **GitHub**: [https://github.com/srbryant86/certnode](https://github.com/srbryant86/certnode)
- **Issues**: [https://github.com/srbryant86/certnode/issues](https://github.com/srbryant86/certnode/issues)

---

**Made with ❤️ by the CertNode team**