# CertNode Integration Templates

This directory contains ready-to-use integration templates for popular frameworks and platforms. Each template provides a complete, production-ready starting point for integrating CertNode receipt verification into your applications.

## 🚀 Available Templates

### Frontend Frameworks
- **[React](./react/)** - React hooks and components with TypeScript support
- **[Vue](./vue/)** - Vue 3 composables and components
- **[Angular](./angular/)** - Angular services and components
- **[Svelte](./svelte/)** - Svelte stores and components
- **[Next.js](./nextjs/)** - Next.js API routes and components
- **[Nuxt](./nuxt/)** - Nuxt 3 modules and composables

### Backend Frameworks
- **[Express](./express/)** - Express.js middleware and routes
- **[Fastify](./fastify/)** - Fastify plugins and handlers
- **[Koa](./koa/)** - Koa middleware and routes
- **[NestJS](./nestjs/)** - NestJS modules and services
- **[Hapi](./hapi/)** - Hapi plugins and routes

### Cloud Platforms
- **[Vercel](./vercel/)** - Vercel Edge Functions and API routes
- **[Netlify](./netlify/)** - Netlify Functions and redirects
- **[AWS Lambda](./aws-lambda/)** - Lambda functions and API Gateway
- **[Cloudflare Workers](./cloudflare-workers/)** - Workers and KV integration
- **[Supabase](./supabase/)** - Edge Functions and database integration

### Mobile & Desktop
- **[React Native](./react-native/)** - React Native components and hooks
- **[Flutter](./flutter/)** - Flutter widgets and services
- **[Electron](./electron/)** - Electron main and renderer process integration

### Testing & CI/CD
- **[Jest](./testing/jest/)** - Jest test suites and helpers
- **[Cypress](./testing/cypress/)** - E2E testing components
- **[GitHub Actions](./ci-cd/github-actions/)** - CI/CD workflows
- **[Docker](./docker/)** - Docker containers and compose files

## 📦 Template Structure

Each template includes:

- **📋 Complete README** with setup instructions
- **🔧 Configuration files** (package.json, tsconfig.json, etc.)
- **💻 Source code** with best practices implemented
- **🧪 Tests** with examples and utilities
- **📚 Documentation** specific to the framework
- **🚀 Deployment guides** for the platform

## 🏃 Quick Start

### Option 1: Use Template CLI
```bash
# Install the template CLI
npm install -g @certnode/create

# Create a new project from template
npx @certnode/create my-app --template react
npx @certnode/create my-api --template express
npx @certnode/create my-worker --template cloudflare-workers
```

### Option 2: Manual Setup
```bash
# Clone the repository
git clone https://github.com/certnode/certnode.git
cd certnode/templates

# Copy your desired template
cp -r ./react/basic ./my-react-app
cd my-react-app

# Install dependencies
npm install

# Start development
npm run dev
```

### Option 3: Direct Download
```bash
# Download specific template
curl -L https://github.com/certnode/certnode/archive/main.tar.gz | tar -xz --strip=3 certnode-main/templates/react/basic
```

## 🎯 Template Categories

### **Starter Templates**
Basic implementations perfect for learning and prototyping:
- Minimal setup with essential features
- Clear, commented code
- Basic error handling
- Single-file examples where possible

### **Production Templates**
Enterprise-ready implementations with comprehensive features:
- Full TypeScript support
- Comprehensive error handling
- Logging and monitoring
- Security best practices
- Testing suites
- CI/CD pipelines

### **Example Templates**
Specific use-case implementations:
- Document verification systems
- API authentication middleware
- Real-time verification dashboards
- Batch processing systems

## 🔧 Customization Guide

### Environment Configuration
All templates support environment-based configuration:

```bash
# Required
CERTNODE_API_URL=https://api.certnode.io
CERTNODE_JWKS_URL=https://api.certnode.io/.well-known/jwks.json

# Optional
CERTNODE_CACHE_TTL=300000
CERTNODE_RETRY_ATTEMPTS=3
CERTNODE_TIMEOUT=10000
```

### Framework-Specific Configuration
Each template includes framework-specific configuration files:
- React: `craco.config.js` or `vite.config.js`
- Vue: `vue.config.js` or `vite.config.js`
- Angular: `angular.json` and `tsconfig.json`
- Node.js: `tsconfig.json` and environment files

## 🧪 Testing Templates

All production templates include comprehensive test suites:

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## 📚 Documentation

### Framework-Specific Guides
- [React Integration Guide](./docs/react.md)
- [Vue Integration Guide](./docs/vue.md)
- [Node.js Backend Guide](./docs/nodejs.md)
- [Cloud Platform Guide](./docs/cloud.md)

### Best Practices
- [Security Best Practices](./docs/security.md)
- [Performance Optimization](./docs/performance.md)
- [Error Handling Strategies](./docs/error-handling.md)
- [Testing Strategies](./docs/testing.md)

## 🤝 Contributing Templates

We welcome community contributions! To contribute a new template:

1. **Fork the repository**
2. **Create your template** following our [Template Guidelines](./docs/template-guidelines.md)
3. **Include comprehensive tests**
4. **Update documentation**
5. **Submit a pull request**

### Template Guidelines
- Follow the established directory structure
- Include comprehensive README with examples
- Provide both TypeScript and JavaScript versions where applicable
- Include error handling and edge cases
- Add unit and integration tests
- Follow security best practices
- Include deployment instructions

## 🆘 Support

### Getting Help
- **Documentation**: [https://certnode.io/docs](https://certnode.io/docs)
- **GitHub Issues**: [Report template issues](https://github.com/certnode/certnode/issues)
- **Community**: [Join discussions](https://github.com/certnode/certnode/discussions)

### Template-Specific Support
Each template includes:
- Troubleshooting section in README
- Common issues and solutions
- Links to framework-specific resources
- Example implementations

## 📋 Template Checklist

When using a template, ensure you:

- [ ] Update package.json with your project details
- [ ] Configure environment variables
- [ ] Update API URLs for your environment
- [ ] Review and update security configurations
- [ ] Set up your CI/CD pipeline
- [ ] Configure monitoring and logging
- [ ] Run security audits
- [ ] Update documentation for your use case

## 🔗 Related Resources

- **[Main SDK](../sdk/)** - Core CertNode SDKs
- **[CLI Tool](../cli/)** - Command-line interface
- **[Documentation](../docs/)** - Comprehensive documentation
- **[Examples](../examples/)** - Additional code examples

---

**Made with ❤️ by the CertNode community**