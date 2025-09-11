# CertNode Project Summary

## Overview
CertNode is a production-grade service that generates tamper-evident receipts using detached JSON Web Signatures (JWS) with RFC 8785 JSON Canonicalization Scheme (JCS). The service exclusively uses ES256 algorithm with AWS KMS for signing operations.

## Core Functionality
- **Tamper-evident receipts**: Creates detached JWS signatures over canonicalized JSON payloads
- **ES256 only**: ECDSA_SHA_256 with P-256 curve via AWS KMS (MessageType=RAW in production)
- **RFC 8785 JCS**: Ensures deterministic JSON canonicalization
- **DER↔JOSE conversion**: Proper signature format handling between KMS and JWS
- **RFC 7638 kid**: JWK thumbprint for key identification
- **Static JWKS**: Served via S3+CloudFront OAC (current+previous keys)
- **No secrets in repo**: All sensitive data managed externally

## Architecture Components

### API Layer (`/api`)
- **Node.js 20** with CommonJS modules
- **Core endpoints**:
  - `POST /v1/sign` - Main signing endpoint with rate limiting
  - `GET /v1/health` - Health check
  - `POST /v1/verify` - Dev-only verification (NODE_ENV !== 'production')
- **Rate limiting**: Token bucket per-IP (120 req/min default, configurable)
- **Input validation**: Strict schema validation with size limits
- **Dependencies**: Minimal (only @aws-sdk/client-kms)

### Key Modules
- **Signer** (`crypto/signer.js`): KMS integration with retry/circuit breaker
- **JCS** (`util/jcs.js`): RFC 8785 canonicalization
- **DER/JOSE** (`util/derToJose.js`, `util/joseToDer.js`): Format conversion
- **Validation** (`plugins/validation.js`): Request validation and size limits
- **Rate limiting** (`plugins/ratelimit.js`): Token bucket implementation

### Web Layer (`/web`)
- Static frontend with verification tools
- OpenAPI documentation (currently empty)
- Pitch/demo pages

## Security Features
- **Input validation**: Schema-based with body size limits
- **Rate limiting**: Per-IP token bucket to protect KMS
- **CORS policy**: Controlled cross-origin access
- **No secrets exposure**: Logging only hashes/IDs
- **Backward compatibility**: Maintained across updates

## Current Status
- **Application layer**: Tasks a1-a12 completed (rate limiting, validation, KMS integration)
- **Infrastructure**: Complete (AWS ECS Fargate, private subnets, KMS, S3+CloudFront)
- **Testing**: Comprehensive unit tests for all core functionality
- **Documentation**: Extensive security policies and procedures

## Development Workflow
- **Test command**: `npm run test` (runs all unit tests)
- **Start command**: `npm start` (starts API server)
- **Smoke test**: `npm run smoke` (integration test)
- **No linting/typecheck**: Manual code review process

## Missing/TODO Items
- JWKS endpoint implementation (jwks.js is empty)
- OpenAPI specification (openapi.json is empty)
- Additional application layer features (a13-a15)
- Enhanced logging and monitoring
- Advanced security headers