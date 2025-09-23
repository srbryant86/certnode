/**
 * Performance Benchmarking and Monitoring Utilities
 * Provides comprehensive performance measurement and analysis capabilities
 */

// ============================================================================
// Performance Measurement Classes
// ============================================================================

/**
 * High-precision performance tracking session
 */
class BenchmarkSession {
  constructor(name) {
    this.name = name;
    this.startTime = process.hrtime.bigint();
    this.checkpoints = [];
    this.finished = false;
  }

  /**
   * Mark a checkpoint in the benchmark
   */
  checkpoint(name) {
    if (this.finished) {
      throw new Error('Cannot add checkpoint to finished benchmark session');
    }

    const currentTime = process.hrtime.bigint();
    const timeMs = Number(currentTime - this.startTime) / 1000000;

    this.checkpoints.push({
      name,
      timeMs: parseFloat(timeMs.toFixed(3))
    });

    return timeMs;
  }

  /**
   * Finish the benchmark and get comprehensive results
   */
  finish() {
    if (this.finished) {
      throw new Error('Benchmark session already finished');
    }

    const endTime = process.hrtime.bigint();
    const totalTimeMs = Number(endTime - this.startTime) / 1000000;

    this.finished = true;

    return {
      name: this.name,
      iterations: 1,
      totalTimeMs: parseFloat(totalTimeMs.toFixed(3)),
      averageTimeMs: parseFloat(totalTimeMs.toFixed(3)),
      minTimeMs: parseFloat(totalTimeMs.toFixed(3)),
      maxTimeMs: parseFloat(totalTimeMs.toFixed(3)),
      stdDevMs: 0,
      opsPerSecond: parseFloat((1000 / totalTimeMs).toFixed(3)),
      checkpoints: this.checkpoints
    };
  }
}

/**
 * Performance benchmarking utility class
 */
class PerformanceBenchmark {
  /**
   * Start a new benchmark session
   */
  static start(name) {
    return new BenchmarkSession(name);
  }

  /**
   * Run multiple iterations of an operation and collect statistics
   */
  static async runBenchmark(name, operation, iterations = 100) {
    const times = [];
    let totalTime = 0;

    for (let i = 0; i < iterations; i++) {
      const startTime = process.hrtime.bigint();

      try {
        await operation();
      } catch (error) {
        // Still record the time even if operation fails
      }

      const endTime = process.hrtime.bigint();
      const timeMs = Number(endTime - startTime) / 1000000;
      times.push(timeMs);
      totalTime += timeMs;
    }

    // Calculate statistics
    const averageTimeMs = totalTime / iterations;
    const minTimeMs = Math.min(...times);
    const maxTimeMs = Math.max(...times);

    // Calculate standard deviation
    const variance = times.reduce((sum, time) => {
      return sum + Math.pow(time - averageTimeMs, 2);
    }, 0) / iterations;
    const stdDevMs = Math.sqrt(variance);

    const opsPerSecond = 1000 / averageTimeMs;

    return {
      name,
      iterations,
      totalTimeMs: parseFloat(totalTime.toFixed(3)),
      averageTimeMs: parseFloat(averageTimeMs.toFixed(3)),
      minTimeMs: parseFloat(minTimeMs.toFixed(3)),
      maxTimeMs: parseFloat(maxTimeMs.toFixed(3)),
      stdDevMs: parseFloat(stdDevMs.toFixed(3)),
      opsPerSecond: parseFloat(opsPerSecond.toFixed(3))
    };
  }

  /**
   * Benchmark receipt verification performance
   */
  static async benchmarkVerification(verifyOptions, iterations = 100) {
    const { verifyReceipt } = require('../index');

    return await PerformanceBenchmark.runBenchmark(
      'Receipt Verification',
      async () => {
        await verifyReceipt(verifyOptions);
      },
      iterations
    );
  }

  /**
   * Benchmark JWKS fetch performance
   */
  static async benchmarkJWKSFetch(url, iterations = 10) {
    const { JWKSManager } = require('../index');
    const jwksManager = new JWKSManager();

    return await PerformanceBenchmark.runBenchmark(
      'JWKS Fetch',
      async () => {
        await jwksManager.fetchFromUrl(url);
      },
      iterations
    );
  }

  /**
   * Benchmark batch verification performance
   */
  static async benchmarkBatchVerification(receipts, jwks, options = {}, iterations = 10) {
    const { verifyReceiptBatch } = require('../index');

    return await PerformanceBenchmark.runBenchmark(
      'Batch Verification',
      async () => {
        await verifyReceiptBatch(receipts, jwks, options);
      },
      iterations
    );
  }

  /**
   * Generate comprehensive performance report
   */
  static generateReport(benchmarkResults) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalBenchmarks: benchmarkResults.length,
        totalOperations: benchmarkResults.reduce((sum, result) => sum + result.iterations, 0),
        totalTime: benchmarkResults.reduce((sum, result) => sum + result.totalTimeMs, 0)
      },
      results: benchmarkResults,
      recommendations: []
    };

    // Add performance recommendations
    benchmarkResults.forEach(result => {
      if (result.averageTimeMs > 1000) {
        report.recommendations.push({
          operation: result.name,
          issue: 'High latency detected',
          suggestion: 'Consider optimization or caching strategies',
          threshold: '1000ms',
          actual: `${result.averageTimeMs}ms`
        });
      }

      if (result.stdDevMs > result.averageTimeMs * 0.5) {
        report.recommendations.push({
          operation: result.name,
          issue: 'High variance in performance',
          suggestion: 'Investigate inconsistent performance causes',
          threshold: `${(result.averageTimeMs * 0.5).toFixed(3)}ms`,
          actual: `${result.stdDevMs}ms`
        });
      }

      if (result.opsPerSecond < 10) {
        report.recommendations.push({
          operation: result.name,
          issue: 'Low throughput detected',
          suggestion: 'Consider performance optimization or scaling',
          threshold: '10 ops/sec',
          actual: `${result.opsPerSecond} ops/sec`
        });
      }
    });

    return report;
  }
}

// ============================================================================
// Memory and Resource Monitoring
// ============================================================================

/**
 * System resource monitoring utilities
 */
class ResourceMonitor {
  /**
   * Get current memory usage
   */
  static getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100, // MB
      arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024 * 100) / 100 // MB
    };
  }

  /**
   * Get CPU usage information
   */
  static getCPUUsage() {
    const usage = process.cpuUsage();
    return {
      user: usage.user / 1000, // milliseconds
      system: usage.system / 1000 // milliseconds
    };
  }

  /**
   * Monitor resource usage during operation
   */
  static async monitorOperation(name, operation) {
    const startMemory = ResourceMonitor.getMemoryUsage();
    const startCPU = ResourceMonitor.getCPUUsage();
    const startTime = process.hrtime.bigint();

    let result;
    let error;

    try {
      result = await operation();
    } catch (err) {
      error = err;
    }

    const endTime = process.hrtime.bigint();
    const endMemory = ResourceMonitor.getMemoryUsage();
    const endCPU = ResourceMonitor.getCPUUsage();

    const duration = Number(endTime - startTime) / 1000000; // milliseconds

    const report = {
      operation: name,
      duration: parseFloat(duration.toFixed(3)),
      success: !error,
      memory: {
        start: startMemory,
        end: endMemory,
        delta: {
          rss: parseFloat((endMemory.rss - startMemory.rss).toFixed(2)),
          heapUsed: parseFloat((endMemory.heapUsed - startMemory.heapUsed).toFixed(2))
        }
      },
      cpu: {
        start: startCPU,
        end: endCPU,
        delta: {
          user: parseFloat((endCPU.user - startCPU.user).toFixed(3)),
          system: parseFloat((endCPU.system - startCPU.system).toFixed(3))
        }
      }
    };

    if (error) {
      report.error = {
        name: error.name,
        message: error.message
      };
      throw error;
    }

    return { result, report };
  }
}

// ============================================================================
// Performance Analysis Utilities
// ============================================================================

/**
 * Statistical analysis utilities for performance data
 */
class PerformanceAnalyzer {
  /**
   * Calculate percentiles from a dataset
   */
  static calculatePercentiles(data, percentiles = [50, 75, 90, 95, 99]) {
    const sorted = [...data].sort((a, b) => a - b);
    const result = {};

    percentiles.forEach(percentile => {
      const index = Math.ceil((percentile / 100) * sorted.length) - 1;
      result[`p${percentile}`] = sorted[Math.max(0, index)];
    });

    return result;
  }

  /**
   * Detect performance regressions between two benchmark results
   */
  static detectRegressions(baseline, current, threshold = 0.1) {
    const regressions = [];

    if (current.averageTimeMs > baseline.averageTimeMs * (1 + threshold)) {
      regressions.push({
        metric: 'Average Time',
        baseline: baseline.averageTimeMs,
        current: current.averageTimeMs,
        change: ((current.averageTimeMs - baseline.averageTimeMs) / baseline.averageTimeMs * 100).toFixed(2) + '%',
        severity: 'high'
      });
    }

    if (current.opsPerSecond < baseline.opsPerSecond * (1 - threshold)) {
      regressions.push({
        metric: 'Operations Per Second',
        baseline: baseline.opsPerSecond,
        current: current.opsPerSecond,
        change: ((current.opsPerSecond - baseline.opsPerSecond) / baseline.opsPerSecond * 100).toFixed(2) + '%',
        severity: 'high'
      });
    }

    return regressions;
  }

  /**
   * Generate trend analysis from historical performance data
   */
  static analyzeTrends(historicalResults) {
    if (historicalResults.length < 2) {
      return { error: 'Insufficient data for trend analysis' };
    }

    const metrics = ['averageTimeMs', 'opsPerSecond'];
    const trends = {};

    metrics.forEach(metric => {
      const values = historicalResults.map(result => result[metric]);
      const firstValue = values[0];
      const lastValue = values[values.length - 1];

      const change = ((lastValue - firstValue) / firstValue) * 100;
      const direction = change > 5 ? 'deteriorating' : change < -5 ? 'improving' : 'stable';

      trends[metric] = {
        direction,
        change: parseFloat(change.toFixed(2)),
        first: firstValue,
        last: lastValue
      };
    });

    return trends;
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  PerformanceBenchmark,
  BenchmarkSession,
  ResourceMonitor,
  PerformanceAnalyzer
};