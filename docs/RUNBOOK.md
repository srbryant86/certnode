# Operations Runbook

This runbook outlines common incidents and quick remediation steps.

## References
- Health: `GET /healthz` (status + KMS circuit state)
- Logs: structured, hash‑only; search by `request_id`
- JWKS: hosted statically (e.g., S3 + CDN), integrity tools in `tools/`

## Incidents

1) KMS circuit breaker tripped
- Symptom: `/v1/sign` errors, health indicates breaker = open
- Action:
  - Check AWS KMS region/endpoint connectivity
  - Verify KMS key policy and throttling
  - Reduce traffic if spiking; confirm rate limits
  - Once KMS recovers, breaker closes automatically

2) JWKS stale or mismatched
- Symptom: external verification fails (kid not found, invalid signature)
- Action:
  - Validate current JWKS: `node tools/jwks-integrity-check.js --jwks jwks.json`
  - For rotations: ensure overlap: `node tools/jwks-rotate-validate.js --current current.json --next next.json`
  - In CDN: purge cache or shorten TTLs temporarily

3) High 429 rate (rate limiting)
- Symptom: many `429` responses on `/v1/sign`
- Action:
  - Confirm expected traffic spike vs abuse
  - Adjust env rate limit values if necessary and safe
  - Communicate client backoff guidance

4) Latency regression
- Symptom: p99 > 100ms observed
- Action:
  - Run `node tools/benchmark.js` with representative load
  - Inspect payload sizes and validation warnings
  - Check underlying infra (CPU throttling, noisy neighbor)

5) CORS / browser integration failures
- Symptom: preflight denied or origin blocked
- Action:
  - Validate `API_ALLOWED_ORIGINS`
  - Review `api/src/plugins/cors.js` allowlist matching

## Escalation
- Page on repeated 5xx or healthz non‑200
- Open incident ticket with timestamps, request IDs, and repro steps
