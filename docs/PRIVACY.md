# Privacy

CertNode is designed to avoid handling or storing sensitive payload data.

## Principles
- No payload logging: only hashes and request correlation IDs are logged
- Deterministic cryptography with RFC 8785 JCS; no payload persistence
- JWKS contains only public keys

## Data Handling
- Requests: payload processed in memory for signing; not stored
- Logs: structured without payloads
- Metrics: aggregate counters/timers; no PII
