#!/usr/bin/env node

const http = require('http');
const { spawn } = require('child_process');
const { performance } = require('perf_hooks');

// Avoid killing unrelated Node processes; manage only the server we spawn.
function killStrayNodes() { /* deprecated noop */ }

// Configuration
const config = {
  warmupRequests: parseInt(process.env.BENCH_WARMUP || '50'),
  testRequests: parseInt(process.env.BENCH_REQUESTS || '1000'),
  concurrency: parseInt(process.env.BENCH_CONCURRENCY || '10'),
  serverStartDelay: parseInt(process.env.BENCH_START_DELAY || '3000'),
  requestTimeout: parseInt(process.env.BENCH_TIMEOUT || '5000'),
  host: process.env.BENCH_HOST || '127.0.0.1',
  port: parseInt(process.env.BENCH_PORT || '3000')
};

// Memory tracking
class MemoryTracker {
  constructor() {
    this.snapshots = [];
    this.interval = null;
  }

  start(intervalMs = 1000) {
    this.snapshots = [];
    this.interval = setInterval(() => {
      const usage = process.memoryUsage();
      this.snapshots.push({
        timestamp: Date.now(),
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        rss: usage.rss
      });
    }, intervalMs);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  getStats() {
    if (this.snapshots.length === 0) return null;
    
    const heapUsed = this.snapshots.map(s => s.heapUsed);
    const heapTotal = this.snapshots.map(s => s.heapTotal);
    const rss = this.snapshots.map(s => s.rss);
    
    return {
      samples: this.snapshots.length,
      heapUsed: {
        min: Math.min(...heapUsed),
        max: Math.max(...heapUsed),
        avg: heapUsed.reduce((a, b) => a + b) / heapUsed.length
      },
      heapTotal: {
        min: Math.min(...heapTotal),
        max: Math.max(...heapTotal),
        avg: heapTotal.reduce((a, b) => a + b) / heapTotal.length
      },
      rss: {
        min: Math.min(...rss),
        max: Math.max(...rss),
        avg: rss.reduce((a, b) => a + b) / rss.length
      }
    };
  }
}

// Latency statistics calculator
class LatencyStats {
  constructor() {
    this.latencies = [];
    this.errors = [];
  }

  addLatency(latencyMs, error = null) {
    if (error) {
      this.errors.push({ latency: latencyMs, error: error.message || error });
    } else {
      this.latencies.push(latencyMs);
    }
  }

  getStats() {
    if (this.latencies.length === 0) {
      return { error: 'No successful requests' };
    }

    const sorted = [...this.latencies].sort((a, b) => a - b);
    const total = sorted.reduce((a, b) => a + b, 0);
    
    return {
      count: sorted.length,
      errors: this.errors.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: total / sorted.length,
      p50: this.percentile(sorted, 0.5),
      p95: this.percentile(sorted, 0.95),
      p99: this.percentile(sorted, 0.99),
      errorRate: this.errors.length / (this.errors.length + sorted.length)
    };
  }

  percentile(sortedArray, p) {
    const index = Math.ceil(sortedArray.length * p) - 1;
    return sortedArray[Math.max(0, index)];
  }
}

// HTTP request helper
function makeRequest(path, method = 'POST', data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const options = {
      hostname: config.host,
      port: config.port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
      },
      timeout: config.requestTimeout
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData, headers: res.headers, parseError: e });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Load test scenario
async function runLoadTest(scenario, stats, memTracker) {
  const { requests, concurrency, payload } = scenario;
  
  console.log(`Running ${requests} requests with concurrency ${concurrency}...`);
  
  let completed = 0;
  let inFlight = 0;
  const maxInFlight = concurrency;
  
  memTracker.start(500);
  const startTime = performance.now();
  
  return new Promise((resolve) => {
    function startRequest() {
      if (completed >= requests) {
        if (inFlight === 0) {
          memTracker.stop();
          resolve();
        }
        return;
      }

      if (inFlight >= maxInFlight) {
        return;
      }

      inFlight++;
      const requestStart = performance.now();
      
      makeRequest('/v1/sign', 'POST', payload)
        .then((response) => {
          const latency = performance.now() - requestStart;
          stats.addLatency(latency, response.status !== 200 ? new Error(`HTTP ${response.status}`) : null);
        })
        .catch((error) => {
          const latency = performance.now() - requestStart;
          stats.addLatency(latency, error);
        })
        .finally(() => {
          inFlight--;
          completed++;
          
          if (completed % 100 === 0) {
            const elapsed = (performance.now() - startTime) / 1000;
            const rps = completed / elapsed;
            console.log(`  ${completed}/${requests} requests (${rps.toFixed(1)} req/s)`);
          }
          
          // Start next request
          setImmediate(startRequest);
          
          if (completed >= requests && inFlight === 0) {
            memTracker.stop();
            resolve();
          }
        });

      // Start next request if we haven't reached max concurrency
      if (inFlight < maxInFlight) {
        setImmediate(startRequest);
      }
    }

    // Start initial requests up to concurrency limit
    for (let i = 0; i < Math.min(maxInFlight, requests); i++) {
      setImmediate(startRequest);
    }
  });
}

// Format memory size
function formatBytes(bytes) {
  const mb = bytes / (1024 * 1024);
  return mb.toFixed(2) + ' MB';
}

// Main benchmark function
async function runBenchmark() {
  console.log('CertNode Performance Benchmark');
  console.log('===============================');
  console.log(`Config: ${config.testRequests} requests, ${config.concurrency} concurrency`);
  console.log(`Target: <100ms p99 latency\n`);

  // Kill any existing processes and start server
  console.log('Starting server...');
  killStrayNodes();
  
  const serverProcess = spawn('node', ['api/src/index.js'], {
    stdio: 'pipe',
    cwd: process.cwd(),
    env: {
      ...process.env,
      API_RATE_LIMIT_MAX: String(config.testRequests * 10),
      API_RATE_LIMIT_WINDOW_MS: '1000'
    }
  });
  
  let serverReady = false;
  serverProcess.stdout.on('data', (data) => {
    if (data.toString().includes('Server on') || data.toString().includes('listening')) {
      serverReady = true;
    }
  });
  
  // Wait for server
  await new Promise(resolve => {
    const checkReady = () => {
      if (serverReady) {
        resolve();
      } else {
        setTimeout(checkReady, 100);
      }
    };
    setTimeout(() => {
      checkReady();
      setTimeout(resolve, config.serverStartDelay);
    }, 1000);
  });

  try {
    // Test payloads
    const payloads = [
      { name: 'Small', payload: { hello: 'world', n: 42 } },
      { name: 'Medium', payload: { 
        user: 'test@example.com', 
        action: 'create_order', 
        data: { items: Array(10).fill().map((_, i) => ({ id: i, name: `item-${i}`, qty: 1 })) }
      }},
      { name: 'Large', payload: { 
        bulk_data: Array(100).fill().map((_, i) => ({ 
          id: i, 
          timestamp: Date.now(), 
          data: 'x'.repeat(100) 
        }))
      }}
    ];

    const results = {};
    
    for (const payloadTest of payloads) {
      console.log(`\n--- ${payloadTest.name} Payload Test ---`);
      
      // Warmup
      console.log('Warming up...');
      const warmupStats = new LatencyStats();
      const warmupMemTracker = new MemoryTracker();
      
      await runLoadTest({
        requests: config.warmupRequests,
        concurrency: Math.min(config.concurrency, 5),
        payload: payloadTest.payload
      }, warmupStats, warmupMemTracker);
      
      // Main test
      console.log('\nRunning main test...');
      const mainStats = new LatencyStats();
      const mainMemTracker = new MemoryTracker();
      const testStart = performance.now();
      
      await runLoadTest({
        requests: config.testRequests,
        concurrency: config.concurrency,
        payload: payloadTest.payload
      }, mainStats, mainMemTracker);
      
      const testDuration = (performance.now() - testStart) / 1000;
      const latencyResult = mainStats.getStats();
      const memoryResult = mainMemTracker.getStats();
      
      results[payloadTest.name] = {
        latency: latencyResult,
        memory: memoryResult,
        duration: testDuration,
        throughput: config.testRequests / testDuration
      };
      
      // Display results
      console.log(`\nResults for ${payloadTest.name} payload:`);
      console.log(`  Duration: ${testDuration.toFixed(2)}s`);
      console.log(`  Throughput: ${results[payloadTest.name].throughput.toFixed(1)} req/s`);
      const totalCount = (latencyResult.count || 0) + (latencyResult.errors || 0);
      const successRate = totalCount > 0 ? ((latencyResult.count || 0) / totalCount) * 100 : 0;
      const fmt = (v) => (typeof v === 'number' && Number.isFinite(v)) ? v.toFixed(2) + 'ms' : 'n/a';

      console.log(  Success rate: %);
      console.log(  Latency:);
      console.log(    Min: );
      console.log(    Avg: );
      console.log(    P95: );
      console.log(    P99: );
      console.log(    Max: );
      console.log(`    Avg: ${latencyResult.avg?.toFixed(2)}ms`);
      console.log(`    P95: ${latencyResult.p95?.toFixed(2)}ms`);
      console.log(`    P99: ${latencyResult.p99?.toFixed(2)}ms`);
      console.log(`    Max: ${latencyResult.max?.toFixed(2)}ms`);
      
      if (memoryResult) {
        console.log(`  Memory:`);
        console.log(`    Heap: ${formatBytes(memoryResult.heapUsed.min)} - ${formatBytes(memoryResult.heapUsed.max)}`);
        console.log(`    RSS: ${formatBytes(memoryResult.rss.min)} - ${formatBytes(memoryResult.rss.max)}`);
      }
    }

    // Summary
    console.log('\n===============================');
    console.log('BENCHMARK SUMMARY');
    console.log('===============================');
    
    let allPassed = true;
    for (const [name, result] of Object.entries(results)) {
      const p99 = result.latency.p99;
      const passed = p99 && p99 < 100;
      allPassed = allPassed && passed;
      
      console.log(`${name}: P99=${p99?.toFixed(2)}ms ${passed ? '✅' : '❌'} (target: <100ms)`);
    }
    
    console.log(`\nOverall: ${allPassed ? '✅ PASSED' : '❌ FAILED'} - ${allPassed ? 'Ready for production load' : 'Performance optimization needed'}`);
    
    process.exit(allPassed ? 0 : 1);
    
  } finally {
    // Cleanup only the server we spawned
    try {
      serverProcess.kill('SIGTERM');
      setTimeout(() => serverProcess.kill('SIGKILL'), 2000);
    } catch (e) {}
  }
}

// CLI
if (require.main === module) {
  runBenchmark().catch(error => {
    console.error('Benchmark failed:', error);
    killStrayNodes();
    process.exit(1);
  });
}

module.exports = { runBenchmark, LatencyStats, MemoryTracker };


