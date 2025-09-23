# CertNode Documentation Portal

Welcome to the CertNode comprehensive documentation portal! This directory contains all the documentation, guides, and resources for CertNode.

## 🏠 Documentation Home

The main documentation portal is available at [`docs/index.html`](./index.html) - a comprehensive interactive guide with:

- **Interactive Demos**: Test receipt verification in your browser
- **SDK Examples**: Code samples for all supported languages
- **API Reference**: Complete API documentation with examples
- **Quick Start Guides**: Get up and running in minutes
- **Security Documentation**: Comprehensive security information

## 📚 Documentation Structure

### Core Documentation
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) - System architecture overview
- [`SECURITY.md`](./SECURITY.md) - Security design and best practices
- [`DATA_FLOW.md`](./DATA_FLOW.md) - Data flow and processing documentation
- [`DEPLOY_NOTES.md`](./DEPLOY_NOTES.md) - Deployment guides and notes

### Security & Compliance
- [`policies/`](./policies/) - Security policies and procedures
- [`mappings/`](./mappings/) - Compliance framework mappings (SOC2, ISO27001, NIST)
- [`procedures/`](./procedures/) - Operational procedures and runbooks
- [`THREAT_MODEL.md`](./THREAT_MODEL.md) - Threat modeling documentation
- [`AUDIT_CHECKLIST.md`](./AUDIT_CHECKLIST.md) - Security audit checklist

### Operations & Deployment
- [`RUNBOOK.md`](./RUNBOOK.md) - Operations runbook
- [`MONITORING.md`](./MONITORING.md) - Monitoring and observability
- [`DOCKER.md`](./DOCKER.md) - Docker deployment guide
- [`SLOS.md`](./SLOS.md) - Service level objectives

### Development & Integration
- [`adr/`](./adr/) - Architecture Decision Records
- [`internal/`](./internal/) - Internal development documentation
- [`QUALITY.md`](./QUALITY.md) - Code quality standards
- [`AUDIT.md`](./AUDIT.md) - Audit trail documentation

## 🚀 Quick Navigation

### For Developers
1. Start with the [Interactive Documentation](./index.html)
2. Read the [Architecture Overview](./ARCHITECTURE.md)
3. Follow the [Quick Start Guide](../README.md)
4. Explore [SDK Examples](../examples/)

### For Security Teams
1. Review [Security Documentation](./SECURITY.md)
2. Check [Compliance Mappings](./mappings/)
3. Examine [Security Policies](./policies/)
4. Review [Threat Model](./THREAT_MODEL.md)

### For Operations Teams
1. Read the [Operations Runbook](./RUNBOOK.md)
2. Set up [Monitoring](./MONITORING.md)
3. Follow [Deployment Notes](./DEPLOY_NOTES.md)
4. Review [Service Level Objectives](./SLOS.md)

### For Auditors
1. Start with [Audit Checklist](./AUDIT_CHECKLIST.md)
2. Review [Compliance Mappings](./mappings/)
3. Examine [Security Policies](./policies/)
4. Check [Audit Documentation](./AUDIT.md)

## 🔧 Documentation Tools

### CLI Documentation
The CertNode CLI provides built-in documentation:
```bash
# Install CLI
npm install -g @certnode/cli

# View help
certnode help

# Interactive mode
certnode
```

### API Documentation
- **Interactive API Docs**: Visit `/openapi` on your CertNode instance
- **OpenAPI Spec**: Available at `/openapi.json`
- **Postman Collection**: Available in [`../tools/`](../tools/)

## 📖 Additional Resources

### External Links
- **Main Website**: [https://certnode.com](https://certnode.com)
- **GitHub Repository**: [https://github.com/certnode/certnode](https://github.com/certnode/certnode)
- **NPM Packages**: [https://www.npmjs.com/org/certnode](https://www.npmjs.com/org/certnode)

### Community & Support
- **GitHub Issues**: [Report bugs and request features](https://github.com/certnode/certnode/issues)
- **Discussions**: [Community discussions](https://github.com/certnode/certnode/discussions)
- **Security Issues**: [Responsible disclosure](mailto:security@certnode.com)

## 🆘 Getting Help

1. **Start with the interactive documentation**: [`docs/index.html`](./index.html)
2. **Search existing documentation**: Use Ctrl+F to search within documents
3. **Check examples**: Browse [`../examples/`](../examples/) for code samples
4. **CLI help**: Run `certnode help` for command-line assistance
5. **Community support**: Post questions on GitHub Discussions

## 📝 Contributing to Documentation

We welcome contributions to improve our documentation! Please:

1. Read our [Contributing Guidelines](../CONTRIBUTING.md)
2. Check the [Documentation Style Guide](./internal/DOCS_STYLE_GUIDE.md)
3. Submit pull requests with clear descriptions
4. Test documentation changes locally

---

**Last Updated**: January 2025
**Version**: 2.0.0
**Maintained by**: CertNode Team