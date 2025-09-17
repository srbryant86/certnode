# SDK Publishing Guide

This guide documents the process for publishing CertNode SDKs to package managers with billion-dollar infrastructure positioning.

## Publishing Status

### ✅ Python SDK (PyPI)
- **Package Name:** `certnode`
- **Built:** `certnode-1.1.0.tar.gz` and `certnode-1.1.0-py3-none-any.whl`
- **Ready to publish:** `cd sdk/python && python -m twine upload dist/*`
- **Requirements:** PyPI account with API token

### ✅ Node.js SDK (npm)
- **Package Name:** `@certnode/sdk`
- **Built:** `certnode-sdk-1.1.0.tgz`
- **Ready to publish:** `cd sdk/node && npm publish`
- **Requirements:** npm account with 2FA enabled

### 🔧 Rust SDK (crates.io)
- **Package Name:** `certnode`
- **Status:** Package prepared, needs Rust toolchain
- **To build:** `cd sdk/rust && cargo package`
- **To publish:** `cd sdk/rust && cargo publish`
- **Requirements:** crates.io account with API token

### ✅ Go SDK (GitHub)
- **Module Path:** `github.com/certnode/certnode/sdk/go`
- **Status:** Updated module path for standards positioning
- **Publishing:** Automatic via Git tags (go modules)

## Pre-Publishing Checklist

### All SDKs Updated With:
- ✅ Universal standard positioning in descriptions
- ✅ "Infrastructure" keywords added
- ✅ Standards committee authorship
- ✅ Updated repository URLs (github.com/certnode/certnode)
- ✅ Homepage pointing to certnode.io
- ✅ RFC-compliant tags and categorization

### Documentation Links:
- Homepage: https://certnode.io
- Documentation: https://certnode.io/openapi
- Standards: https://certnode.io/trust
- Issues: https://github.com/certnode/certnode/issues

## Publishing Commands

### Python (PyPI)
```bash
cd sdk/python
# Install publishing tools if needed
pip install twine

# Upload to PyPI (requires API token)
python -m twine upload dist/*

# Verify installation
pip install certnode
python -c "import certnode; print('CertNode Python SDK installed successfully')"
```

### Node.js (npm)
```bash
cd sdk/node
# Login to npm (if not already)
npm login

# Publish to npm registry
npm publish

# Verify installation
npm install @certnode/sdk
node -e "const certnode = require('@certnode/sdk'); console.log('CertNode Node.js SDK installed successfully');"
```

### Rust (crates.io)
```bash
cd sdk/rust
# Login to crates.io (if not already)
cargo login

# Publish to crates.io
cargo publish

# Verify installation
cargo add certnode
```

### Go (GitHub/Go Modules)
```bash
# Tag the release for Go modules
git tag sdk/go/v1.1.0
git push origin sdk/go/v1.1.0

# Verify module
go mod tidy
go get github.com/certnode/certnode/sdk/go@v1.1.0
```

## Post-Publishing Tasks

1. **Update Documentation:**
   - Add installation instructions to README files
   - Update getting started guides on certnode.io

2. **GitHub Release:**
   - Create GitHub release with SDK binaries
   - Include changelog and migration notes

3. **Community Announcement:**
   - Developer community Discord/forum posts
   - Social media announcement
   - Blog post about universal standard availability

4. **Monitoring:**
   - Track download statistics
   - Monitor for issues and feedback
   - Update billion-dollar blueprint with publishing milestone

## Billion-Dollar Positioning Notes

- SDKs positioned as **infrastructure implementations**, not vendor tools
- Emphasize **cross-platform compatibility** and **standards compliance**
- Documentation should encourage **ecosystem adoption**
- Focus on **interoperability** between different implementations
- Support multiple implementations of the same standard (competitive collaboration)

## Next Steps After Publishing

1. Build developer community around the open standard
2. Create example applications and integration guides
3. Partner with platforms for ecosystem adoption
4. Establish standards governance and community feedback loops
5. Track adoption metrics for billion-dollar scale validation