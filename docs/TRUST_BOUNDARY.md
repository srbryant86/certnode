# Trust Boundaries

1) Client → API
- Untrusted input; validated aggressively (schema + size) and rate limited
- CORS allowlist enforced for browser contexts

2) API → AWS KMS
- Trusted AWS boundary; failures isolated via retries and circuit breaker
- No private keys leave KMS; app uses RAW signing only

3) JWKS Hosting → Clients
- JWKS published statically (e.g., S3 + CDN)
- Integrity and rotation validated with tools; clients may cache with TTL and conditional requests
