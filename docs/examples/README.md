# CertNode Real-World Examples Library

This directory contains practical, production-ready examples demonstrating how to integrate CertNode receipt verification into real-world applications and use cases.

## 📁 Directory Structure

```
examples/
├── README.md                    # This file
├── basic/                       # Basic integration examples
│   ├── node-basic.js           # Simple Node.js script
│   ├── browser-basic.html      # Browser-based verification
│   └── curl-examples.sh        # API testing with curl
├── web-frameworks/             # Web framework integrations
│   ├── express-middleware/     # Express.js middleware
│   ├── fastify-plugin/         # Fastify plugin
│   ├── koa-middleware/         # Koa.js middleware
│   └── nextjs-api/             # Next.js API routes
├── frontend/                   # Frontend framework examples
│   ├── react-hooks/            # React hooks and components
│   ├── vue-composables/        # Vue 3 composables
│   ├── angular-services/       # Angular services
│   └── vanilla-js/             # Pure JavaScript
├── cloud-platforms/            # Cloud platform integrations
│   ├── aws-lambda/             # AWS Lambda functions
│   ├── cloudflare-workers/     # Cloudflare Workers
│   ├── vercel-functions/       # Vercel Edge Functions
│   └── google-cloud-functions/ # Google Cloud Functions
├── databases/                  # Database integration examples
│   ├── mongodb/                # MongoDB storage
│   ├── postgresql/             # PostgreSQL integration
│   ├── redis/                  # Redis caching
│   └── sqlite/                 # SQLite local storage
├── authentication/             # Auth system integrations
│   ├── jwt-integration/        # JWT token integration
│   ├── oauth2-flow/            # OAuth2 authentication
│   ├── session-based/          # Session-based auth
│   └── api-key-auth/           # API key authentication
├── enterprise/                 # Enterprise-grade examples
│   ├── microservices/          # Microservices architecture
│   ├── kubernetes/             # Kubernetes deployments
│   ├── docker-compose/         # Docker Compose setups
│   └── monitoring/             # Monitoring and observability
├── industry-specific/          # Industry use cases
│   ├── healthcare/             # Healthcare compliance
│   ├── finance/                # Financial services
│   ├── legal/                  # Legal document verification
│   └── supply-chain/           # Supply chain tracking
└── testing/                    # Testing strategies
    ├── unit-tests/             # Unit testing examples
    ├── integration-tests/      # Integration testing
    ├── performance-tests/      # Performance benchmarking
    └── security-tests/         # Security testing
```

## 🚀 Getting Started

### Prerequisites

```bash
# Install CertNode SDK
npm install @certnode/sdk

# For browser examples
npm install @certnode/web

# For React examples
npm install @certnode/react

# For Vue examples
npm install @certnode/vue
```

### Running Examples

Each example directory contains:
- `README.md` - Detailed explanation and setup instructions
- Source code files with comprehensive comments
- `package.json` - Dependencies and scripts
- `.env.example` - Environment configuration template
- `docker-compose.yml` - Docker setup (where applicable)

## 📚 Example Categories

### Basic Integration
Perfect for getting started with CertNode verification.

- **Node.js Script**: Simple command-line receipt verification
- **Browser Integration**: Client-side verification with Web Crypto API
- **API Testing**: Using curl and Postman for API verification

### Web Frameworks
Production-ready middleware and plugins for popular web frameworks.

- **Express.js**: Middleware with caching, error handling, and metrics
- **Fastify**: High-performance plugin with schema validation
- **Koa.js**: Async/await middleware with context integration
- **Next.js**: API routes with SSR/SSG receipt verification

### Frontend Frameworks
Complete UI components and state management solutions.

- **React**: Hooks, components, and context providers
- **Vue 3**: Composables with Composition API
- **Angular**: Services, guards, and reactive forms
- **Vanilla JS**: Framework-agnostic implementations

### Cloud Platforms
Serverless and cloud-native deployments.

- **AWS Lambda**: Event-driven verification with DynamoDB
- **Cloudflare Workers**: Edge computing with KV storage
- **Vercel Functions**: Serverless with edge caching
- **Google Cloud**: Functions with Firestore integration

### Enterprise Solutions
Scalable, production-grade architectures.

- **Microservices**: Service mesh with receipt verification
- **Kubernetes**: Helm charts and operator patterns
- **Monitoring**: Prometheus metrics and Grafana dashboards
- **CI/CD**: GitHub Actions and deployment pipelines

## 🎯 Use Case Examples

### E-commerce Platform
```javascript
// Product authenticity verification
const receipt = await generateReceipt({
  product_id: "PROD-12345",
  batch_number: "B2024001",
  manufacture_date: "2024-01-15",
  quality_checks: ["visual", "functional", "safety"]
});

const verification = await verifyReceipt({ receipt, jwks });
// Use verification.ok to display authenticity badge
```

### Document Management
```javascript
// Legal document integrity
const documentReceipt = {
  document_hash: sha256(documentContent),
  signer: "legal-dept@company.com",
  timestamp: new Date().toISOString(),
  document_type: "contract"
};
```

### Supply Chain Tracking
```javascript
// Multi-party verification chain
const shipmentReceipt = {
  shipment_id: "SHIP-789",
  origin: "Factory-A",
  destination: "Warehouse-B",
  custody_chain: [
    { party: "manufacturer", timestamp: "2024-01-01T08:00:00Z" },
    { party: "logistics", timestamp: "2024-01-02T14:30:00Z" }
  ]
};
```

## 🔧 Development Tools

### Testing Utilities
- **Mock JWKS Server**: For development and testing
- **Receipt Generator**: Create test receipts with various scenarios
- **Performance Benchmarks**: Load testing tools and scripts
- **Security Scanners**: Vulnerability assessment tools

### Debugging Helpers
- **Receipt Inspector**: Visual receipt analysis tool
- **JWKS Validator**: Validate key set configurations
- **Signature Debugger**: Step-by-step verification process
- **Error Analyzer**: Common error scenarios and solutions

## 📖 Best Practices

### Security
- Always validate receipt structure before processing
- Implement proper error handling for network failures
- Use circuit breakers for external JWKS endpoints
- Cache JWKS responses with appropriate TTL
- Log verification attempts for audit trails

### Performance
- Batch verify multiple receipts when possible
- Implement connection pooling for high-throughput scenarios
- Use CDN caching for JWKS endpoints
- Monitor verification latency and success rates
- Implement graceful degradation strategies

### Error Handling
- Distinguish between verification failures and system errors
- Provide clear error messages for debugging
- Implement retry logic with exponential backoff
- Handle network timeouts gracefully
- Log errors with sufficient context

## 🤝 Contributing

We welcome contributions to the examples library! Please:

1. Follow the existing code style and structure
2. Include comprehensive documentation and comments
3. Add appropriate error handling and logging
4. Include unit tests where applicable
5. Update this README when adding new examples

### Example Template Structure
```
new-example/
├── README.md           # Detailed explanation
├── src/               # Source code
├── tests/             # Unit tests
├── docs/              # Additional documentation
├── package.json       # Dependencies
├── .env.example       # Environment template
└── docker-compose.yml # Container setup (optional)
```

## 📞 Support

- 📚 [Documentation](https://certnode.io/docs)
- 🐛 [Issue Tracker](https://github.com/certnode/certnode/issues)
- 💬 [Community Discussions](https://github.com/certnode/certnode/discussions)
- 📧 [Email Support](mailto:support@certnode.io)

## 📄 License

All examples are provided under the MIT License. See individual example directories for specific licensing information.

---

*This library is maintained by the CertNode team and community contributors. Last updated: 2024-01-15*