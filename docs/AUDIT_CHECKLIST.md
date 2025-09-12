# CertNode Audit Checklist

**One-page verification checklist for 9.5+/10 audit compliance**

## Fast Quality Gates

### 1. Run Fast Test Suite
```bash
node tools/test-fast.js
```

**Expected Output**: 
```
Fast Test Runner - Starting
===============================
Running api/test/jcs.test.js...
PASS api/test/jcs.test.js
Running api/test/validation.test.js...
PASS api/test/validation.test.js
...
===============================
PASSED: 10
FAILED: 0
SKIPPED: 0
ALL PASSED
```

### 2. Smoke Test Receipt Verification
```bash
node tools/smoke-receipt.js
```

**Expected Output**:
```
Smoke test starting...
RECEIPT OK
```

### 3. Health Check Verification  
```bash
node api/test/health.test.js
```

**Expected Output**:
```
health.test OK
```

## Manual Verification Steps

### 4. Check Project Structure
```bash
# Verify core files exist
ls api/src/routes/sign.js          # ✅ Core signing endpoint
ls api/src/aws/kms.js             # ✅ KMS integration with circuit breaker
ls api/src/util/jcs.js            # ✅ RFC 8785 canonicalization
ls api/src/plugins/validation.js  # ✅ Multi-layer input validation
ls tools/verify-receipt.js        # ✅ Offline verification CLI
```

### 5. Environment Configuration Check
```bash
# Optional: Set production-like config
export NODE_ENV=production
export PAYLOAD_WARN_BYTES=65536
export PAYLOAD_HARD_BYTES=262144
export RATE_LIMIT_RPM=120
```

### 6. Error Response Validation
```bash
# Test structured error responses
curl -X POST http://localhost:3000/v1/sign \
  -H "Content-Type: application/json" \
  -d '{"invalid":true}' 
```

**Expected Response**:
```json
{
  "error": "missing_payload", 
  "message": "payload is required",
  "timestamp": "2025-01-XX...",
  "request_id": "req_..."
}
```

## Acceptance Criteria ✅

- [ ] `tools/test-fast.js` ends with "ALL PASSED"
- [ ] `tools/smoke-receipt.js` prints "RECEIPT OK" and exits 0  
- [ ] `api/test/health.test.js` prints "health.test OK" and exits 0
- [ ] All 22 core tasks (a1-a22) show as "present" in task index
- [ ] Zero production dependencies except `@aws-sdk/client-kms`
- [ ] Error responses include request_id correlation
- [ ] Payload size warnings trigger at configurable thresholds
- [ ] Rate limiting enforced per-IP with token bucket algorithm
- [ ] JCS canonicalization produces deterministic output
- [ ] Receipt verification works offline with static JWKS

## Red Flags (Audit Failures)

❌ **Test timeouts or hangs** - indicates non-deterministic behavior  
❌ **Missing request correlation** - reduces observability  
❌ **Payload logging** - violates privacy requirements  
❌ **Network dependencies in core tests** - breaks test isolation  
❌ **Non-deterministic JCS output** - breaks offline verification  
❌ **Missing circuit breaker behavior** - reduces resilience

## Documentation Completeness

- [x] `docs/QUALITY.md` - Maps to audit criteria with evidence
- [x] `docs/TRACEABILITY.md` - Task→files→tests mapping  
- [x] `docs/internal/TASKS_INDEX.json` - Authoritative task registry
- [x] `docs/internal/PROJECT_SUMMARY.md` - Updated with current state