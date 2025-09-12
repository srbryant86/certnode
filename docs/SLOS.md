# Service Level Objectives

## Availability
- SLO: 99.9% monthly for `/v1/sign`
- Error budget: 43 minutes/month

## Latency
- SLO: p99 < 100ms for `/v1/sign` under steady load
- Measure using `tools/benchmark.js` and production metrics

## Correctness
- Receipts verifiable offline via JWKS with 100% success under healthy conditions
- Validation errors are categorized and consistent across environments

## Monitoring & Alerting
- Alert on:
  - 5xx error rate > 1% for 5 minutes
  - p99 latency > 100ms for 10 minutes
  - KMS circuit breaker open for > 1 minute
  - Healthz non‑200

## Dashboards
- Requests by status, latency histograms, rate‑limit counters, KMS operation success/failure
