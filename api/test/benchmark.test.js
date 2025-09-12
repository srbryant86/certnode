const assert = require('assert');
const { LatencyStats, MemoryTracker } = require('../../tools/benchmark');

(async () => {
  // Test LatencyStats
  console.log('Testing LatencyStats...');
  const stats = new LatencyStats();
  
  // Add some test latencies
  stats.addLatency(10);
  stats.addLatency(20);
  stats.addLatency(50);
  stats.addLatency(100);
  stats.addLatency(200, new Error('timeout'));
  
  const result = stats.getStats();
  
  assert.ok(result.count === 4, 'Should count successful requests only');
  assert.ok(result.errors === 1, 'Should count errors');
  assert.ok(result.min === 10, 'Min latency should be correct');
  assert.ok(result.max === 100, 'Max latency should be correct');
  assert.ok(result.avg === 45, 'Average should be correct');
  assert.ok(result.p99 === 100, 'P99 should be correct for small dataset');
  assert.ok(result.errorRate === 0.2, 'Error rate should be 20%');
  
  console.log('✓ LatencyStats test passed');
  
  // Test MemoryTracker
  console.log('Testing MemoryTracker...');
  const memTracker = new MemoryTracker();
  
  memTracker.start(10); // Very fast for testing
  await new Promise(resolve => setTimeout(resolve, 50));
  memTracker.stop();
  
  const memStats = memTracker.getStats();
  assert.ok(memStats, 'Should have memory stats');
  assert.ok(memStats.samples > 0, 'Should have collected samples');
  assert.ok(memStats.heapUsed.min > 0, 'Should track heap usage');
  assert.ok(memStats.rss.min > 0, 'Should track RSS');
  
  console.log('✓ MemoryTracker test passed');
  
  console.log('benchmark.test OK');
})().catch(e => { console.error(e); process.exit(1); });