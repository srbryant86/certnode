# CertNode Express.js Template

A production-ready Express.js application template with CertNode receipt verification middleware and endpoints.

## 🚀 Quick Start

```bash
# Clone or download this template
git clone https://github.com/certnode/certnode.git
cd certnode/templates/express/basic

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start development server
npm run dev

# Or start production server
npm start
```

## 📦 Features

### Security & Middleware
- **🔒 CertNode Authentication** - Middleware for receipt verification
- **🛡️ Security Headers** - Helmet.js for security headers
- **🌐 CORS Protection** - Configurable CORS policies
- **⚡ Rate Limiting** - Request rate limiting per IP
- **📊 Request Logging** - Morgan logging with rotation

### CertNode Integration
- **🔐 Authentication Middleware** - Verify receipts from headers/body/query
- **🔍 Verification Endpoints** - Single and batch receipt verification
- **📋 Optional Authentication** - Mixed endpoints with optional verification
- **🔑 JWKS Management** - Automatic JWKS fetching and caching

### Development & Production
- **🔧 Environment Configuration** - Comprehensive .env support
- **🧪 Testing Setup** - Jest with supertest for API testing
- **📈 Health Checks** - Built-in health and status endpoints
- **🐳 Docker Ready** - Dockerfile and docker-compose included

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# CertNode Configuration
CERTNODE_JWKS_URL=https://api.certnode.io/.well-known/jwks.json
JWKS_CACHE_TTL=300000

# Security Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
RATE_LIMIT_MAX=100

# Optional: Custom API URL
CERTNODE_API_URL=https://api.certnode.io
```

### Package Scripts

```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm test             # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run lint         # Lint code with ESLint
npm run lint:fix     # Fix linting issues
npm run docker:build # Build Docker image
npm run docker:run   # Run Docker container
```

## 📚 API Endpoints

### Public Endpoints

#### Health Check
```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "development"
}
```

#### Public Data
```http
GET /api/public
```

No authentication required.

### Protected Endpoints

#### Protected Resource
```http
POST /api/protected
Authorization: CertNode <base64-encoded-receipt>
```

Or with receipt in body:
```http
POST /api/protected
Content-Type: application/json

{
  "receipt": {
    "protected": "eyJhbGciOiJFUzI1Ni...",
    "payload": { "user_id": "123" },
    "signature": "MEQCIAH8B3K2l1D0...",
    "kid": "key-2025"
  }
}
```

#### Mixed Authentication
```http
GET /api/mixed
Authorization: CertNode <base64-encoded-receipt>  # Optional
```

### Verification Endpoints

#### Single Verification
```http
POST /api/verify
Content-Type: application/json

{
  "receipt": {
    "protected": "eyJhbGciOiJFUzI1Ni...",
    "payload": { "document": "test" },
    "signature": "MEQCIAH8B3K2l1D0...",
    "kid": "key-2025"
  },
  "jwks": {  // Optional, uses configured JWKS URL if not provided
    "keys": [...]
  }
}
```

Response:
```json
{
  "valid": true,
  "reason": null,
  "receiptId": "key-2025",
  "algorithm": "ES256",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

#### Batch Verification
```http
POST /api/verify/batch
Content-Type: application/json

{
  "receipts": [
    { /* receipt 1 */ },
    { /* receipt 2 */ },
    { /* receipt 3 */ }
  ]
}
```

Response:
```json
{
  "summary": {
    "total": 3,
    "valid": 2,
    "invalid": 1,
    "validPercentage": 67
  },
  "results": [
    {
      "index": 0,
      "receiptId": "key-2025",
      "valid": true,
      "reason": null
    },
    {
      "index": 1,
      "receiptId": "key-2025",
      "valid": true,
      "reason": null
    },
    {
      "index": 2,
      "receiptId": "key-2025",
      "valid": false,
      "reason": "Invalid signature"
    }
  ],
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

#### JWKS Proxy
```http
GET /api/jwks
```

Returns the current JWKS from the configured URL.

## 🔐 Authentication Middleware

### Required Authentication

Use `certNodeAuth` middleware for endpoints that require valid receipts:

```javascript
const { certNodeAuth } = require('./src/middleware/certnode');

app.post('/api/secure-endpoint', certNodeAuth, (req, res) => {
  // req.certnode contains verified receipt data
  const { payload, kid, receipt } = req.certnode;

  res.json({
    message: 'Authenticated successfully',
    verifiedData: payload,
    keyId: kid
  });
});
```

### Optional Authentication

Use `optionalCertNodeAuth` for endpoints that enhance functionality with authentication:

```javascript
const { optionalCertNodeAuth } = require('./src/middleware/certnode');

app.get('/api/enhanced-endpoint', optionalCertNodeAuth, (req, res) => {
  if (req.certnode.isValid) {
    // Enhanced functionality for authenticated users
    res.json({
      message: 'Enhanced data for authenticated user',
      userData: req.certnode.payload,
      premium: true
    });
  } else {
    // Basic functionality for anonymous users
    res.json({
      message: 'Basic public data',
      premium: false
    });
  }
});
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Examples

```javascript
const request = require('supertest');
const app = require('../src/app');

describe('CertNode Authentication', () => {
  test('should authenticate with valid receipt', async () => {
    const receipt = {
      protected: "eyJhbGciOiJFUzI1Ni...",
      payload: { user_id: "test-user" },
      signature: "MEQCIAH8B3K2l1D0...",
      kid: "test-key"
    };

    const response = await request(app)
      .post('/api/protected')
      .send({ receipt })
      .expect(200);

    expect(response.body.verifiedPayload).toEqual(receipt.payload);
  });

  test('should reject invalid receipt', async () => {
    const invalidReceipt = {
      payload: { user_id: "test-user" }
      // Missing required fields
    };

    await request(app)
      .post('/api/protected')
      .send({ receipt: invalidReceipt })
      .expect(401);
  });
});
```

## 🐳 Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S certnode -u 1001

# Change ownership
RUN chown -R certnode:nodejs /app
USER certnode

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  certnode-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - CERTNODE_JWKS_URL=https://api.certnode.io/.well-known/jwks.json
      - RATE_LIMIT_MAX=1000
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
```

### Build and Run

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run

# Or use docker-compose
docker-compose up -d
```

## 🔒 Security Best Practices

### Environment Security
- Never commit `.env` files to version control
- Use environment-specific configuration files
- Validate all environment variables on startup

### API Security
- **Rate Limiting**: Configured per endpoint and IP
- **CORS**: Restrict origins in production
- **Security Headers**: Helmet.js for comprehensive headers
- **Input Validation**: Validate all receipt inputs
- **Error Handling**: Don't expose sensitive information

### Production Checklist
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting for your traffic
- [ ] Configure logging and monitoring
- [ ] Set up health checks and alerts
- [ ] Use HTTPS in production
- [ ] Regular security audits with `npm audit`

## 📊 Monitoring & Logging

### Request Logging
Uses Morgan middleware with configurable formats:

```javascript
// Development
app.use(morgan('dev'));

// Production
app.use(morgan('combined'));
```

### Health Monitoring
Built-in health check endpoint includes:
- Server status
- Environment information
- Version information
- Timestamp

### Error Tracking
Comprehensive error handling with:
- Request ID tracking
- Error categorization
- Environment-specific error details

## 🚀 Production Deployment

### Environment Setup
1. **Set NODE_ENV=production**
2. **Configure JWKS_URL** for your environment
3. **Set ALLOWED_ORIGINS** to your frontend domains
4. **Configure RATE_LIMIT_MAX** for your traffic needs

### Deployment Platforms

#### Vercel
```json
{
  "functions": {
    "src/app.js": {
      "maxDuration": 30
    }
  },
  "routes": [
    { "src": "/(.*)", "dest": "src/app.js" }
  ]
}
```

#### Railway
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
```

#### Heroku
```json
{
  "scripts": {
    "heroku-postbuild": "npm run build"
  }
}
```

## 🆘 Troubleshooting

### Common Issues

#### JWKS Fetch Errors
```bash
# Check JWKS URL accessibility
curl https://api.certnode.io/.well-known/jwks.json

# Verify environment variable
echo $CERTNODE_JWKS_URL
```

#### Authentication Failures
- Verify receipt format matches CertNode specification
- Check JWKS contains the required key (kid)
- Ensure signature algorithm matches

#### Rate Limiting Issues
- Adjust `RATE_LIMIT_MAX` for your traffic
- Implement user-specific rate limiting if needed
- Consider Redis for distributed rate limiting

### Debug Mode
Enable debug logging:
```bash
DEBUG=certnode:* npm run dev
```

## 🔗 Related Resources

- **[CertNode SDK](https://www.npmjs.com/package/@certnode/sdk)** - Core SDK
- **[API Documentation](https://certnode.io/docs)** - Complete API reference
- **[React Template](../react/)** - Frontend integration
- **[Vue Template](../vue/)** - Vue.js integration

---

**Need help?** Check the [CertNode Documentation](https://certnode.io/docs) or [open an issue](https://github.com/certnode/certnode/issues).