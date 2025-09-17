# GitHub Actions Workflow Templates

Ready-to-use GitHub Actions workflows for CertNode integration. Copy these to your repository's `.github/workflows/` directory.

## 🚀 Available Workflows

### 1. `certnode-verify.yml` - Receipt Verification

Automatically verify CertNode receipts in your repository.

**Features:**
- Verifies receipts on push/PR
- Supports custom JWKS URLs
- Manual workflow dispatch
- Security audit mode
- Performance testing
- Smart file detection (only changed files in PRs)

**Setup:**
```bash
# Copy to your repository
mkdir -p .github/workflows
curl -o .github/workflows/certnode-verify.yml \
  https://raw.githubusercontent.com/srbryant86/certnode/main/.github/workflows/certnode-verify.yml

# Set secrets (optional)
# CERTNODE_JWKS_URL - Your JWKS endpoint
```

**Usage:**
```yaml
# Triggered automatically on:
# - Push to main/develop with receipt changes
# - Pull requests with receipt changes
# - Manual dispatch

# Manual trigger:
# Go to Actions → Verify CertNode Receipts → Run workflow
```

### 2. `certnode-integration.yml` - Comprehensive Testing

Full integration testing across platforms and Node.js versions.

**Features:**
- Cross-platform testing (Ubuntu, Windows, macOS)
- Multiple Node.js versions (18, 20, 21)
- SDK, CLI, and framework testing
- Security scanning
- Performance benchmarking
- Daily scheduled runs

**Setup:**
```bash
curl -o .github/workflows/certnode-integration.yml \
  https://raw.githubusercontent.com/srbryant86/certnode/main/.github/workflows/certnode-integration.yml
```

## 📁 Directory Structure

Organize your repository for optimal workflow performance:

```
your-repo/
├── .github/
│   └── workflows/
│       ├── certnode-verify.yml
│       └── certnode-integration.yml
├── receipts/                 # Receipt files
│   ├── document-1.receipt.json
│   └── document-2.receipt.json
├── documents/               # Document + receipt pairs
│   ├── contract.pdf
│   └── contract.receipt.json
└── your-app/               # Your application code
```

## 🔧 Configuration Examples

### Basic Receipt Verification

```yaml
# .github/workflows/verify-receipts.yml
name: Verify Receipts

on:
  push:
    paths: ['receipts/**']
  pull_request:
    paths: ['receipts/**']

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g @certnode/cli
      - run: |
          for receipt in receipts/*.json; do
            certnode verify \
              --receipt "$receipt" \
              --jwks "https://api.certnode.io/.well-known/jwks.json"
          done
```

### Enterprise Setup with Secrets

```yaml
# .github/workflows/enterprise-verify.yml
name: Enterprise Receipt Verification

on:
  push:
    branches: [main, staging, production]

jobs:
  verify-staging:
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g @certnode/cli
      - name: Verify against staging JWKS
        run: |
          certnode verify \
            --receipt "receipts/staging/*.json" \
            --jwks "${{ secrets.STAGING_JWKS_URL }}"

  verify-production:
    if: github.ref == 'refs/heads/production'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g @certnode/cli
      - name: Verify against production JWKS
        run: |
          certnode verify \
            --receipt "receipts/production/*.json" \
            --jwks "${{ secrets.PRODUCTION_JWKS_URL }}"
        env:
          NODE_EXTRA_CA_CERTS: ${{ secrets.CUSTOM_CA_BUNDLE }}
```

### Multi-Environment Testing

```yaml
# .github/workflows/multi-env-test.yml
name: Multi-Environment Testing

on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM
  workflow_dispatch:

jobs:
  test-environments:
    strategy:
      matrix:
        environment: [dev, staging, production]
        include:
          - environment: dev
            jwks_url: ${{ secrets.DEV_JWKS_URL }}
          - environment: staging
            jwks_url: ${{ secrets.STAGING_JWKS_URL }}
          - environment: production
            jwks_url: ${{ secrets.PROD_JWKS_URL }}

    runs-on: ubuntu-latest
    environment: ${{ matrix.environment }}

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g @certnode/cli
      - name: Test ${{ matrix.environment }} receipts
        run: |
          certnode verify \
            --receipt "receipts/${{ matrix.environment }}/*.json" \
            --jwks "${{ matrix.jwks_url }}" \
            --verbose
```

## 🔒 Security Best Practices

### 1. Secret Management

```yaml
# Use GitHub Secrets for sensitive URLs
env:
  JWKS_URL: ${{ secrets.CERTNODE_JWKS_URL }}
  CUSTOM_CA: ${{ secrets.CUSTOM_CA_BUNDLE }}
```

### 2. Permission Restrictions

```yaml
permissions:
  contents: read        # Read repository contents
  security-events: write  # Write security alerts
  actions: read         # Read workflow status
```

### 3. OIDC Authentication

```yaml
permissions:
  id-token: write      # Required for OIDC
  contents: read

steps:
  - name: Configure AWS credentials
    uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
      aws-region: us-east-1

  - name: Fetch JWKS from private S3
    run: |
      aws s3 cp s3://your-bucket/jwks.json ./private-jwks.json
      certnode verify --receipt receipts/*.json --jwks ./private-jwks.json
```

## 📊 Advanced Features

### 1. Matrix Testing

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    node-version: [18, 20, 21]
    algorithm: [ES256, EdDSA]
```

### 2. Conditional Execution

```yaml
# Only run on receipt changes
on:
  push:
    paths:
      - 'receipts/**'
      - 'documents/**/*.receipt.json'

# Skip certain jobs based on commit message
jobs:
  verify:
    if: "!contains(github.event.head_commit.message, '[skip-verify]')"
```

### 3. Artifact Upload

```yaml
- name: Upload verification reports
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: verification-reports
    path: |
      verification-*.json
      verification-*.html
```

### 4. Slack Notifications

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: rtCamp/action-slack-notify@v2
  env:
    SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
    SLACK_MESSAGE: |
      🚨 CertNode verification failed!
      Branch: ${{ github.ref }}
      Commit: ${{ github.sha }}
```

## 🚀 Quick Start Guide

1. **Choose your workflow:**
   - Simple verification: `certnode-verify.yml`
   - Comprehensive testing: `certnode-integration.yml`
   - Custom setup: Use examples above

2. **Add to your repository:**
   ```bash
   mkdir -p .github/workflows
   # Copy chosen workflow file
   git add .github/workflows/
   git commit -m "Add CertNode verification workflow"
   ```

3. **Configure secrets (if needed):**
   ```
   CERTNODE_JWKS_URL - Your JWKS endpoint
   SLACK_WEBHOOK - For notifications
   AWS_ROLE_ARN - For private JWKS
   ```

4. **Test the workflow:**
   - Push a receipt file change
   - Or manually trigger via Actions tab

## 📚 Examples by Use Case

### Document Management System
```yaml
# Verify document receipts when documents change
on:
  push:
    paths: ['documents/**']
```

### Financial Records
```yaml
# High-security verification with audit trail
- name: Verify with audit logging
  run: |
    certnode verify --receipt "$receipt" --jwks "$JWKS_URL" --verbose \
      | tee "audit-$(date +%Y%m%d-%H%M%S).log"
```

### CI/CD Pipeline Integration
```yaml
# Block deployment if receipt verification fails
deploy:
  needs: [verify-receipts]
  if: needs.verify-receipts.result == 'success'
```

### Compliance Reporting
```yaml
# Generate compliance reports
- name: Generate compliance report
  run: |
    certnode verify --receipt receipts/*.json --jwks "$JWKS_URL" \
      --format json > compliance-report.json
```

## 📄 License

MIT License - see [LICENSE](../../../LICENSE) for details.

---

**Need help?** Check the [CertNode documentation](https://certnode.io/docs) or [open an issue](https://github.com/srbryant86/certnode/issues).