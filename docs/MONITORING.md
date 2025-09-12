# Monitoring and Alerts

This guide outlines suggested metrics/events and alert thresholds for CertNode.

## Metrics (structured logs)

Emit events via `api/src/plugins/metrics.js` (console JSON, one line per event):

- `request_received` — { path, method, request_id }
- `request_completed` — { path, method, status, ms, request_id }
- `rate_limit_triggered` — { ip, path, capacity, remaining }
- `kms_sign_success` — { ms }
- `kms_sign_error` — { code, message }
- `breaker_state` — { state } (closed|open|half_open)
- `payload_size_warning` — { bytes, warn, hard }

## SLOs and Alerts

- Availability (sign): 99.9% monthly
- Latency (sign): p99 < 100ms sustained

Suggested alerts:
- 5xx rate > 1% for 5m
- p99 latency > 100ms for 10m
- KMS breaker open for > 1m
- healthz non‑200 for > 1m

## Dashboards

- Requests by status and endpoint
- Latency histograms (p50/p95/p99)
- Rate limit counters and remaining capacity
- KMS success/error counts and breaker state over time

