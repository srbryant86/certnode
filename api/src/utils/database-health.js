/**
 * Database Health Check Utilities
 * Provides comprehensive database connectivity and performance monitoring
 */

const { Pool } = require('pg');

class DatabaseHealth {
  constructor() {
    this.pool = null;
    this.lastHealthCheck = null;
    this.healthCheckInterval = 30000; // 30 seconds
    this.connectionTimeout = 5000; // 5 seconds
    this.queryTimeout = 10000; // 10 seconds
  }

  async initialize() {
    if (!this.pool) {
      this.pool = new Pool({
        connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: this.connectionTimeout,
        statement_timeout: this.queryTimeout,
        query_timeout: this.queryTimeout
      });

      // Handle pool errors
      this.pool.on('error', (err) => {
        console.error('PostgreSQL pool error:', err);
      });
    }
  }

  async check() {
    await this.initialize();

    const healthResult = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {},
      metrics: {}
    };

    try {
      // Basic connectivity check
      const connectivityResult = await this.checkConnectivity();
      healthResult.checks.connectivity = connectivityResult;

      // Query performance check
      const performanceResult = await this.checkQueryPerformance();
      healthResult.checks.performance = performanceResult;

      // Connection pool status
      const poolResult = await this.checkConnectionPool();
      healthResult.checks.pool = poolResult;

      // Database metrics
      const metricsResult = await this.collectMetrics();
      healthResult.metrics = metricsResult;

      // Determine overall status
      const hasFailures = Object.values(healthResult.checks).some(check => !check.success);
      if (hasFailures) {
        healthResult.status = 'degraded';
      }

      this.lastHealthCheck = Date.now();
      return healthResult;

    } catch (error) {
      healthResult.status = 'unhealthy';
      healthResult.error = error.message;
      throw error;
    }
  }

  async isReady() {
    try {
      await this.initialize();

      // Quick connectivity test
      const client = await this.pool.connect();
      try {
        const result = await client.query('SELECT 1 as ready');
        return result.rows[0].ready === 1;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Database readiness check failed:', error.message);
      return false;
    }
  }

  async checkConnectivity() {
    const startTime = Date.now();

    try {
      const client = await this.pool.connect();

      try {
        // Test basic connectivity with a simple query
        await client.query('SELECT NOW() as current_time, version() as db_version');

        const responseTime = Date.now() - startTime;

        return {
          success: true,
          response_time_ms: responseTime,
          message: 'Database connectivity successful'
        };
      } finally {
        client.release();
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        response_time_ms: Date.now() - startTime
      };
    }
  }

  async checkQueryPerformance() {
    const performanceTests = [
      {
        name: 'simple_select',
        query: 'SELECT 1 as test',
        timeout: 1000
      },
      {
        name: 'table_count',
        query: 'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = \'public\'',
        timeout: 2000
      },
      {
        name: 'database_size',
        query: 'SELECT pg_size_pretty(pg_database_size(current_database())) as size',
        timeout: 3000
      }
    ];

    const results = {};

    for (const test of performanceTests) {
      const startTime = Date.now();

      try {
        const client = await this.pool.connect();

        try {
          const result = await Promise.race([
            client.query(test.query),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Query timeout')), test.timeout)
            )
          ]);

          const responseTime = Date.now() - startTime;

          results[test.name] = {
            success: true,
            response_time_ms: responseTime,
            rows_returned: result.rows.length
          };
        } finally {
          client.release();
        }
      } catch (error) {
        results[test.name] = {
          success: false,
          error: error.message,
          response_time_ms: Date.now() - startTime
        };
      }
    }

    const allSuccessful = Object.values(results).every(result => result.success);
    const avgResponseTime = Object.values(results)
      .map(r => r.response_time_ms)
      .reduce((sum, time) => sum + time, 0) / Object.keys(results).length;

    return {
      success: allSuccessful,
      average_response_time_ms: Math.round(avgResponseTime),
      tests: results
    };
  }

  async checkConnectionPool() {
    try {
      const poolInfo = {
        total_connections: this.pool.totalCount,
        idle_connections: this.pool.idleCount,
        waiting_requests: this.pool.waitingCount
      };

      // Check if pool is healthy
      const utilizationRate = (poolInfo.total_connections - poolInfo.idle_connections) / this.pool.options.max;
      const isHealthy = utilizationRate < 0.8; // Alert if over 80% utilization

      return {
        success: isHealthy,
        pool_utilization_rate: Math.round(utilizationRate * 100),
        ...poolInfo,
        warning: utilizationRate > 0.8 ? 'High connection pool utilization' : null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async collectMetrics() {
    const metricsQueries = [
      {
        name: 'active_connections',
        query: 'SELECT count(*) as value FROM pg_stat_activity WHERE state = \'active\''
      },
      {
        name: 'idle_connections',
        query: 'SELECT count(*) as value FROM pg_stat_activity WHERE state = \'idle\''
      },
      {
        name: 'database_size_bytes',
        query: 'SELECT pg_database_size(current_database()) as value'
      },
      {
        name: 'slow_queries',
        query: 'SELECT count(*) as value FROM pg_stat_activity WHERE state = \'active\' AND query_start < NOW() - INTERVAL \'30 seconds\''
      }
    ];

    const metrics = {};

    for (const metric of metricsQueries) {
      try {
        const client = await this.pool.connect();

        try {
          const result = await client.query(metric.query);
          metrics[metric.name] = parseInt(result.rows[0].value) || 0;
        } finally {
          client.release();
        }
      } catch (error) {
        metrics[metric.name] = null;
        console.error(`Failed to collect metric ${metric.name}:`, error.message);
      }
    }

    return metrics;
  }

  async getDetailedStatus() {
    await this.initialize();

    try {
      const client = await this.pool.connect();

      try {
        const queries = {
          server_info: 'SELECT version() as version, current_database() as database, current_user as user',
          stats: `
            SELECT
              numbackends as active_connections,
              xact_commit as transactions_committed,
              xact_rollback as transactions_rolled_back,
              blks_read as blocks_read,
              blks_hit as blocks_hit,
              tup_returned as tuples_returned,
              tup_fetched as tuples_fetched,
              tup_inserted as tuples_inserted,
              tup_updated as tuples_updated,
              tup_deleted as tuples_deleted
            FROM pg_stat_database
            WHERE datname = current_database()
          `,
          locks: 'SELECT mode, count(*) as count FROM pg_locks GROUP BY mode',
          slow_queries: `
            SELECT
              query,
              state,
              query_start,
              EXTRACT(EPOCH FROM (now() - query_start)) as duration_seconds
            FROM pg_stat_activity
            WHERE state = 'active'
              AND query_start < NOW() - INTERVAL '10 seconds'
              AND query NOT LIKE '%pg_stat_activity%'
            ORDER BY query_start
            LIMIT 5
          `
        };

        const results = {};

        for (const [key, query] of Object.entries(queries)) {
          try {
            const result = await client.query(query);
            results[key] = result.rows;
          } catch (error) {
            results[key] = { error: error.message };
          }
        }

        return {
          success: true,
          timestamp: new Date().toISOString(),
          ...results
        };
      } finally {
        client.release();
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async cleanup() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

// Export singleton instance
const databaseHealth = new DatabaseHealth();

module.exports = databaseHealth;