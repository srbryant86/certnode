/**
 * Usage Limits Test Suite
 *
 * Tests the free tier enforcement system for CertNode monetization
 */

const test = require('node:test');
const assert = require('node:assert');
const {
  enforceUsageLimits,
  getCurrentUsage,
  getUsageStatus,
  isOverLimit,
  FREE_TIER_LIMIT
} = require('../src/plugins/usage-limits');

// Mock request/response objects
function createMockRequest(ip = '127.0.0.1', id = 'test-req-123') {
  return {
    headers: {
      'x-forwarded-for': ip
    },
    connection: { remoteAddress: ip },
    id
  };
}

function createMockResponse() {
  const headers = {};
  const response = {
    headers,
    setHeader(name, value) { headers[name] = value; },
    writeHead: test.mock.fn(),
    end: test.mock.fn()
  };
  return response;
}

test('Usage Limits - Initial state', () => {
  const testIp = '192.168.1.100';

  // New IP should have zero usage
  assert.strictEqual(getCurrentUsage(testIp), 0);
  assert.strictEqual(isOverLimit(testIp), false);

  const status = getUsageStatus(testIp);
  assert.strictEqual(status.used, 0);
  assert.strictEqual(status.limit, FREE_TIER_LIMIT);
  assert.strictEqual(status.remaining, FREE_TIER_LIMIT);
  assert.strictEqual(status.overLimit, false);
});

test('Usage Limits - Enforcement allows under limit', () => {
  const testIp = '192.168.1.101';
  const req = createMockRequest(testIp);
  const res = createMockResponse();

  // First request should be allowed
  const result = enforceUsageLimits(req, res);

  assert.strictEqual(result.allowed, true);
  assert.strictEqual(result.status.used, 1);
  assert.strictEqual(result.status.remaining, FREE_TIER_LIMIT - 1);

  // Headers should be set
  assert.strictEqual(res.headers['X-Usage-Limit'], String(FREE_TIER_LIMIT));
  assert.strictEqual(res.headers['X-Usage-Used'], '1');
  assert.strictEqual(res.headers['X-Usage-Remaining'], String(FREE_TIER_LIMIT - 1));
});

test('Usage Limits - Blocks over limit', () => {
  const testIp = '192.168.1.102';
  const req = createMockRequest(testIp);
  const res = createMockResponse();

  // Simulate reaching the limit (this is a simplified test)
  // In a real scenario, we'd make 1000 requests
  for (let i = 0; i < FREE_TIER_LIMIT; i++) {
    enforceUsageLimits(req, res);
  }

  // Next request should be blocked
  const blockedReq = createMockRequest(testIp, 'blocked-req');
  const blockedRes = createMockResponse();
  const result = enforceUsageLimits(blockedReq, blockedRes);

  // Should be blocked (no result returned when blocked)
  assert.strictEqual(result, undefined);

  // Should have called writeHead with 429
  assert.strictEqual(blockedRes.writeHead.mock.callCount(), 1);
  const [statusCode, headers] = blockedRes.writeHead.mock.calls[0].arguments;
  assert.strictEqual(statusCode, 429);
  assert.strictEqual(headers['X-Usage-Limit'], String(FREE_TIER_LIMIT));
  assert.strictEqual(headers['X-Usage-Used'], String(FREE_TIER_LIMIT));
  assert.strictEqual(headers['X-Usage-Remaining'], '0');

  // Should have called end with error message
  assert.strictEqual(blockedRes.end.mock.callCount(), 1);
  const responseBody = JSON.parse(blockedRes.end.mock.calls[0].arguments[0]);
  assert.strictEqual(responseBody.error, 'usage_limit_exceeded');
  assert.strictEqual(responseBody.usage.overLimit, true);
  assert.ok(responseBody.upgrade.message.includes('Upgrade to Pro'));
});

test('Usage Limits - Different IPs have separate limits', () => {
  const ip1 = '192.168.1.103';
  const ip2 = '192.168.1.104';

  const req1 = createMockRequest(ip1);
  const res1 = createMockResponse();
  const result1 = enforceUsageLimits(req1, res1);

  const req2 = createMockRequest(ip2);
  const res2 = createMockResponse();
  const result2 = enforceUsageLimits(req2, res2);

  // Both should be allowed and have usage = 1
  assert.strictEqual(result1.allowed, true);
  assert.strictEqual(result1.status.used, 1);
  assert.strictEqual(result2.allowed, true);
  assert.strictEqual(result2.status.used, 1);

  // Each IP should have independent usage
  assert.strictEqual(getCurrentUsage(ip1), 1);
  assert.strictEqual(getCurrentUsage(ip2), 1);
});