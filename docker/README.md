# CertNode Docker Integration

Complete Docker setup for CertNode services including CLI, Web SDK, and microservices architecture.

## 🚀 Quick Start

### Single Container Usage

```bash
# CLI for receipt verification
docker run --rm -v $(pwd):/app certnode/cli \
  verify --receipt receipt.json --jwks https://api.certnode.io/.well-known/jwks.json

# Web SDK and documentation server
docker run -p 8080:80 certnode/web

# Example Express.js API
docker run -p 3000:3000 -e JWKS_URL=https://api.certnode.io/.well-known/jwks.json certnode/example-api
```

### Full Stack with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## 📦 Available Images

### 1. `certnode/cli` - Command Line Interface

**Purpose:** Receipt verification, project scaffolding, and key generation.

```bash
# Basic usage
docker run --rm certnode/cli --help

# Verify receipts (mount your files)
docker run --rm -v $(pwd):/app certnode/cli \
  verify --receipt /app/receipt.json --jwks /app/jwks.json

# Generate new project
docker run --rm -v $(pwd):/app certnode/cli \
  init my-project --template node

# Generate test keys
docker run --rm -v $(pwd):/app certnode/cli \
  generate keys --algorithm ES256 -o /app/test-keys
```

**Environment Variables:**
- `JWKS_URL` - Default JWKS endpoint

### 2. `certnode/web` - Web SDK & Documentation

**Purpose:** Serves the browser SDK and interactive documentation.

```bash
# Run documentation server
docker run -p 8080:80 certnode/web

# Access at http://localhost:8080/docs/
# SDK available at http://localhost:8080/sdk/index.js
```

**Endpoints:**
- `/` - Redirects to documentation
- `/docs/` - Interactive documentation
- `/sdk/` - Browser SDK files
- `/health` - Health check

### 3. `certnode/example-api` - Express.js Example

**Purpose:** Example API with CertNode verification middleware.

```bash
# Run example API
docker run -p 3000:3000 \
  -e JWKS_URL=https://api.certnode.io/.well-known/jwks.json \
  certnode/example-api

# Test the API
curl http://localhost:3000/health
```

**Environment Variables:**
- `JWKS_URL` - JWKS endpoint for verification
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)

### 4. `certnode/verification-service` - Microservice

**Purpose:** Dedicated verification service with Redis caching.

```bash
# Run with Redis (use docker-compose for full setup)
docker run -p 4000:4000 \
  -e REDIS_URL=redis://localhost:6379 \
  -e JWKS_URL=https://api.certnode.io/.well-known/jwks.json \
  certnode/verification-service
```

**Features:**
- Redis caching for performance
- Rate limiting
- Batch verification
- Metrics endpoint
- Health checks

**API Endpoints:**
- `POST /api/verify` - Verify single receipt
- `POST /api/verify/batch` - Verify multiple receipts
- `GET /api/metrics` - Service metrics
- `GET /health` - Health check

## 🏗️ Docker Compose Services

### Development Stack

```yaml
services:
  certnode-cli:     # CLI for verification tasks
  certnode-web:     # Web SDK and docs (port 8080)
  example-api:      # Example Express.js API (port 3000)
  verification-service: # Microservice with caching (port 4000)
  redis:            # Redis for caching (port 6379)
  prometheus:       # Monitoring (port 9090)
```

### Production Configuration

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  verification-service:
    image: certnode/verification-service:latest
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis-cluster:6379
      - JWKS_URL=${PRODUCTION_JWKS_URL}
    networks:
      - certnode-production

  redis:
    image: redis:7-alpine
    deploy:
      replicas: 1
    volumes:
      - redis-data:/data
    networks:
      - certnode-production

volumes:
  redis-data:
    external: true

networks:
  certnode-production:
    external: true
```

## 🔧 Configuration Examples

### Enterprise Setup with Secrets

```bash
# Use Docker secrets for sensitive data
echo "https://internal.company.com/jwks.json" | docker secret create jwks_url -

# Run with secrets
docker service create \
  --name certnode-verification \
  --secret jwks_url \
  --env JWKS_URL_FILE=/run/secrets/jwks_url \
  certnode/verification-service
```

### Kubernetes Deployment

```yaml
# k8s/certnode-deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: certnode-verification
spec:
  replicas: 3
  selector:
    matchLabels:
      app: certnode-verification
  template:
    metadata:
      labels:
        app: certnode-verification
    spec:
      containers:
      - name: verification-service
        image: certnode/verification-service:latest
        ports:
        - containerPort: 4000
        env:
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        - name: JWKS_URL
          valueFrom:
            secretKeyRef:
              name: certnode-secrets
              key: jwks-url
        livenessProbe:
          httpGet:
            path: /health
            port: 4000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 4000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: certnode-verification-service
spec:
  selector:
    app: certnode-verification
  ports:
  - port: 80
    targetPort: 4000
  type: LoadBalancer
```

### CI/CD Integration

```yaml
# .github/workflows/docker-build.yml
name: Build and Push Docker Images

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        image: [cli, web, example-api, verification-service]

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: certnode/${{ matrix.image }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./docker/Dockerfile.${{ matrix.image }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

## 📊 Monitoring & Observability

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'certnode-verification'
    static_configs:
      - targets: ['verification-service:4000']
    metrics_path: '/api/metrics'

  - job_name: 'certnode-web'
    static_configs:
      - targets: ['certnode-web:80']
    metrics_path: '/health'

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
```

### Health Checks

```bash
# Check all services
docker-compose ps

# Individual health checks
curl http://localhost:8080/health    # Web SDK
curl http://localhost:3000/health    # Example API
curl http://localhost:4000/health    # Verification service

# Service metrics
curl http://localhost:4000/api/metrics
```

### Logging

```bash
# View logs from all services
docker-compose logs -f

# View logs from specific service
docker-compose logs -f verification-service

# Export logs
docker-compose logs --no-color > certnode-logs.txt
```

## 🔒 Security Best Practices

### 1. Non-root Users

All containers run as non-root users for security:

```dockerfile
# Create and use non-root user
RUN addgroup -g 1001 -S certnode && \
    adduser -S certnode -u 1001
USER certnode
```

### 2. Security Headers

Web services include security headers:

```nginx
# nginx.conf
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
```

### 3. Resource Limits

```yaml
# docker-compose.yml
services:
  verification-service:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

### 4. Network Isolation

```yaml
# Separate networks for different tiers
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # No external access
```

## 🧪 Testing

### Unit Tests in Containers

```bash
# Test CLI functionality
docker run --rm certnode/cli generate --help

# Test API endpoints
docker run --rm --network host curlimages/curl \
  curl -f http://localhost:3000/health

# Test verification service
docker run --rm --network host curlimages/curl \
  -X POST http://localhost:4000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"receipt": {...}, "jwksUrl": "https://api.certnode.io/.well-known/jwks.json"}'
```

### Load Testing

```bash
# Install artillery
npm install -g artillery

# Load test verification service
artillery run load-test.yml
```

```yaml
# load-test.yml
config:
  target: 'http://localhost:4000'
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "Verify receipts"
    requests:
      - post:
          url: "/api/verify"
          json:
            receipt:
              protected: "eyJhbGciOiJFUzI1NiIsImtpZCI6InRlc3Qta2V5In0"
              payload: { test: "data" }
              signature: "test-signature"
              kid: "test-key"
            jwksUrl: "https://api.certnode.io/.well-known/jwks.json"
```

## 🚀 Deployment Strategies

### 1. Single Server

```bash
# Simple deployment
git clone https://github.com/srbryant86/certnode.git
cd certnode/docker
docker-compose up -d
```

### 2. Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml certnode

# Scale services
docker service scale certnode_verification-service=3
```

### 3. Kubernetes

```bash
# Apply manifests
kubectl apply -f k8s/

# Get services
kubectl get services

# Scale deployment
kubectl scale deployment certnode-verification --replicas=5
```

### 4. Cloud Platforms

#### AWS ECS

```json
{
  "family": "certnode-verification",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "verification-service",
      "image": "certnode/verification-service:latest",
      "portMappings": [
        {
          "containerPort": 4000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "REDIS_URL",
          "value": "redis://redis-cluster.cache.amazonaws.com:6379"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:4000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

#### Google Cloud Run

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: certnode-verification
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
    spec:
      containers:
      - image: gcr.io/PROJECT-ID/certnode/verification-service
        ports:
        - containerPort: 4000
        env:
        - name: REDIS_URL
          value: "redis://REDIS-IP:6379"
        resources:
          limits:
            cpu: "1"
            memory: "512Mi"
```

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.

## 🔗 Links

- **Documentation**: [https://certnode.io/docs](https://certnode.io/docs)
- **Docker Hub**: [https://hub.docker.com/u/certnode](https://hub.docker.com/u/certnode)
- **GitHub**: [https://github.com/srbryant86/certnode](https://github.com/srbryant86/certnode)
- **Issues**: [https://github.com/srbryant86/certnode/issues](https://github.com/srbryant86/certnode/issues)

---

**Made with ❤️ by the CertNode team**