# Threat Model (High Level)

## Assets
- Signing capability (AWS KMS keys)
- JWKS (public keys) integrity and freshness
- Receipt integrity (protected header, payload, signature, kid)
- Service availability and latency SLOs

## Actors
- Legitimate clients requesting `/v1/sign`
- External verifiers consuming JWKS and verifying receipts
- Adversaries: abusive traffic sources, input fuzzers, MITM on client side

## Trust Boundaries
- API edge (client → service)
- Service → AWS KMS (signing)
- JWKS hosting (static origin → CDN → clients)

## Key Threats & Mitigations
- Abusive traffic / DoS → per‑IP token bucket rate limiting
- Input attacks (oversized/malformed) → strict validation + size limits + JCS determinism
- Key misuse/leakage → KMS RAW signing, no private keys in app; static JWKS only
- JWKS tampering/staleness → integrity/rotation tooling; cache TTL; ETag/Last‑Modified support
- Cross‑origin abuse → strict CORS
- Info leakage in errors/logs → sanitized responses, no payload logging, correlation IDs

## Out of Scope
- Client‑side storage security
- Non‑ES256 algorithms

## Residual Risks
- CDN/JWKS hosting misconfiguration (mitigated by checks and rotation validation)
- Misconfigured rate limits (documented defaults and env guards)

