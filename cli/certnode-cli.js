#!/usr/bin/env node

/**
 * CertNode Interactive CLI Tool
 * Provides comprehensive management, testing, and monitoring capabilities
 */

const readline = require('readline');
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CLI Core Infrastructure
// ============================================================================

class CertNodeCLI {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'certnode> '
    });

    this.config = {
      apiUrl: process.env.CERTNODE_API_URL || 'http://localhost:3000',
      adminToken: process.env.CERTNODE_ADMIN_TOKEN || 'demo-admin-token-123',
      outputFormat: 'table', // table, json, yaml
      verbose: false
    };

    this.commands = new Map();
    this.setupCommands();
    this.logo();
  }

  logo() {
    console.log('\x1b[36m%s\x1b[0m', `
╔═══════════════════════════════════════════════════════════════╗
║                      CertNode CLI v2.0                       ║
║              Interactive Management & Testing Tool            ║
║                                                               ║
║  Commands: help, config, test, monitor, security, deploy     ║
║  Type 'help' for detailed command information                ║
╚═══════════════════════════════════════════════════════════════╝
    `);
  }

  setupCommands() {
    // Core commands
    this.commands.set('help', {
      description: 'Show available commands and usage',
      handler: this.showHelp.bind(this)
    });

    this.commands.set('config', {
      description: 'Configure CLI settings (set <key> <value>, show)',
      handler: this.configHandler.bind(this)
    });

    this.commands.set('clear', {
      description: 'Clear the terminal screen',
      handler: () => {
        console.clear();
        this.logo();
      }
    });

    this.commands.set('exit', {
      description: 'Exit the CLI',
      handler: () => {
        console.log('Goodbye! 👋');
        process.exit(0);
      }
    });

    this.commands.set('setup', {
      description: 'Interactive setup wizard for new projects',
      handler: this.setupWizard.bind(this)
    });

    // API Testing commands
    this.commands.set('test', {
      description: 'Test API endpoints (health, jwks, sign, performance)',
      handler: this.testHandler.bind(this)
    });

    this.commands.set('benchmark', {
      description: 'Run performance benchmarks (api, sdk)',
      handler: this.benchmarkHandler.bind(this)
    });

    // Monitoring commands
    this.commands.set('monitor', {
      description: 'Monitor system status (metrics, performance, security)',
      handler: this.monitorHandler.bind(this)
    });

    this.commands.set('security', {
      description: 'Security management (audit, alerts, config)',
      handler: this.securityHandler.bind(this)
    });

    // Development commands
    this.commands.set('generate', {
      description: 'Generate test data (receipts, keys, config)',
      handler: this.generateHandler.bind(this)
    });

    this.commands.set('validate', {
      description: 'Validate receipts and configurations',
      handler: this.validateHandler.bind(this)
    });

    // Deployment commands
    this.commands.set('deploy', {
      description: 'Deployment utilities (config, health-check)',
      handler: this.deployHandler.bind(this)
    });
  }

  start() {
    this.rl.prompt();

    this.rl.on('line', async (line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        this.rl.prompt();
        return;
      }

      const [command, ...args] = trimmed.split(' ');
      await this.executeCommand(command.toLowerCase(), args);
      this.rl.prompt();
    });

    this.rl.on('close', () => {
      console.log('\nGoodbye! 👋');
      process.exit(0);
    });
  }

  async executeCommand(command, args) {
    try {
      const cmd = this.commands.get(command);
      if (!cmd) {
        console.log(`\x1b[31mUnknown command: ${command}\x1b[0m`);
        console.log('Type "help" for available commands.');
        return;
      }

      await cmd.handler(args);
    } catch (error) {
      console.error(`\x1b[31mError executing command: ${error.message}\x1b[0m`);
      if (this.config.verbose) {
        console.error(error.stack);
      }
    }
  }

  // ============================================================================
  // Command Handlers
  // ============================================================================

  showHelp(args) {
    if (args.length > 0) {
      const cmd = this.commands.get(args[0]);
      if (cmd) {
        console.log(`\n\x1b[33m${args[0]}\x1b[0m: ${cmd.description}\n`);
      } else {
        console.log(`\x1b[31mUnknown command: ${args[0]}\x1b[0m`);
      }
      return;
    }

    console.log('\n\x1b[33mAvailable Commands:\x1b[0m');
    console.log('═'.repeat(60));

    const categories = {
      'Core': ['help', 'config', 'clear', 'exit'],
      'Testing': ['test', 'benchmark', 'validate'],
      'Monitoring': ['monitor', 'security'],
      'Development': ['generate'],
      'Deployment': ['deploy']
    };

    Object.entries(categories).forEach(([category, commands]) => {
      console.log(`\n\x1b[36m${category}:\x1b[0m`);
      commands.forEach(cmd => {
        const command = this.commands.get(cmd);
        if (command) {
          console.log(`  \x1b[32m${cmd.padEnd(12)}\x1b[0m ${command.description}`);
        }
      });
    });

    console.log('\n\x1b[33mExamples:\x1b[0m');
    console.log('  config set apiUrl http://localhost:3001');
    console.log('  test health');
    console.log('  security audit');
    console.log('  monitor metrics');
    console.log('  benchmark api 100');
    console.log();
  }

  async configHandler(args) {
    if (args.length === 0 || args[0] === 'show') {
      console.log('\n\x1b[33mCurrent Configuration:\x1b[0m');
      console.log('═'.repeat(40));
      Object.entries(this.config).forEach(([key, value]) => {
        console.log(`  \x1b[32m${key.padEnd(15)}\x1b[0m ${value}`);
      });
      console.log();
      return;
    }

    if (args[0] === 'set' && args.length >= 3) {
      const key = args[1];
      const value = args.slice(2).join(' ');

      if (key in this.config) {
        // Type conversion
        if (key === 'verbose') {
          this.config[key] = value.toLowerCase() === 'true';
        } else {
          this.config[key] = value;
        }
        console.log(`\x1b[32m✓ Set ${key} = ${this.config[key]}\x1b[0m`);
      } else {
        console.log(`\x1b[31mUnknown config key: ${key}\x1b[0m`);
        console.log('Available keys:', Object.keys(this.config).join(', '));
      }
      return;
    }

    console.log('\x1b[31mUsage: config [show] | config set <key> <value>\x1b[0m');
  }

  async testHandler(args) {
    if (args.length === 0) {
      console.log('\x1b[31mUsage: test <endpoint> [options]\x1b[0m');
      console.log('Endpoints: health, jwks, sign, performance, all');
      return;
    }

    const endpoint = args[0];
    const spinner = this.createSpinner();

    try {
      switch (endpoint) {
        case 'health':
          spinner.start('Testing health endpoint...');
          await this.testHealth();
          break;

        case 'jwks':
          spinner.start('Testing JWKS endpoint...');
          await this.testJWKS();
          break;

        case 'sign':
          spinner.start('Testing sign endpoint...');
          await this.testSign();
          break;

        case 'performance':
          spinner.start('Testing performance endpoint...');
          await this.testPerformance();
          break;

        case 'all':
          await this.testAll();
          break;

        default:
          console.log(`\x1b[31mUnknown endpoint: ${endpoint}\x1b[0m`);
          return;
      }

      spinner.stop('✓');
    } catch (error) {
      spinner.stop('✗');
      console.error(`\x1b[31mTest failed: ${error.message}\x1b[0m`);
    }
  }

  async testHealth() {
    const startTime = Date.now();
    const response = await this.makeRequest('/health');
    const duration = Date.now() - startTime;

    console.log('\n\x1b[33mHealth Check Results:\x1b[0m');
    console.log('═'.repeat(30));
    console.log(`Status: \x1b[32m${response.status}\x1b[0m`);
    console.log(`Response Time: \x1b[36m${duration}ms\x1b[0m`);

    if (response.data) {
      console.log(`Service: \x1b[32m${response.data.service || 'Unknown'}\x1b[0m`);
      console.log(`Version: \x1b[36m${response.data.version || 'Unknown'}\x1b[0m`);
      console.log(`Uptime: \x1b[36m${response.data.uptime || 'Unknown'}\x1b[0m`);
    }
    console.log();
  }

  async testJWKS() {
    const startTime = Date.now();
    const response = await this.makeRequest('/jwks');
    const duration = Date.now() - startTime;

    console.log('\n\x1b[33mJWKS Test Results:\x1b[0m');
    console.log('═'.repeat(30));
    console.log(`Status: \x1b[32m${response.status}\x1b[0m`);
    console.log(`Response Time: \x1b[36m${duration}ms\x1b[0m`);

    if (response.data && response.data.keys) {
      console.log(`Key Count: \x1b[36m${response.data.keys.length}\x1b[0m`);
      response.data.keys.forEach((key, index) => {
        console.log(`  Key ${index + 1}: \x1b[32m${key.kty}-${key.crv}\x1b[0m (${key.kid})`);
      });
    }
    console.log();
  }

  async testSign() {
    const testPayload = { test: 'data', timestamp: new Date().toISOString() };

    const startTime = Date.now();
    const response = await this.makeRequest('/v1/sign', 'POST', testPayload);
    const duration = Date.now() - startTime;

    console.log('\n\x1b[33mSign Test Results:\x1b[0m');
    console.log('═'.repeat(30));
    console.log(`Status: \x1b[32m${response.status}\x1b[0m`);
    console.log(`Response Time: \x1b[36m${duration}ms\x1b[0m`);

    if (response.data) {
      console.log(`Receipt ID: \x1b[36m${response.data.receipt_id || 'None'}\x1b[0m`);
      console.log(`Algorithm: \x1b[32m${response.data.protected ? 'Detected' : 'Unknown'}\x1b[0m`);
      console.log(`Signature: \x1b[36m${response.data.signature ? response.data.signature.substring(0, 20) + '...' : 'None'}\x1b[0m`);
    }
    console.log();
  }

  async testPerformance() {
    const response = await this.makeRequest('/performance', 'GET', null, true);

    console.log('\n\x1b[33mPerformance Metrics:\x1b[0m');
    console.log('═'.repeat(30));

    if (response.data && response.data.cache) {
      const cache = response.data.cache.response;
      console.log(`Cache Hit Rate: \x1b[36m${cache.hitRate}%\x1b[0m`);
      console.log(`Cache Size: \x1b[36m${cache.size}/${cache.maxSize}\x1b[0m`);
      console.log(`Cache Hits: \x1b[32m${cache.hits}\x1b[0m`);
      console.log(`Cache Misses: \x1b[31m${cache.misses}\x1b[0m`);
    }

    if (response.data && response.data.monitor) {
      const monitor = response.data.monitor;
      console.log(`Requests: \x1b[36m${monitor.requestCount}\x1b[0m`);
      console.log(`Avg Response: \x1b[36m${monitor.averageResponseTime?.toFixed(2) || 0}ms\x1b[0m`);
      console.log(`Memory: \x1b[36m${monitor.memoryUsage?.heapUsed || 0}MB\x1b[0m`);
    }
    console.log();
  }

  async testAll() {
    console.log('\n\x1b[33mRunning Complete Test Suite...\x1b[0m');
    console.log('═'.repeat(40));

    const tests = [
      { name: 'Health', handler: () => this.testHealth() },
      { name: 'JWKS', handler: () => this.testJWKS() },
      { name: 'Sign', handler: () => this.testSign() },
      { name: 'Performance', handler: () => this.testPerformance() }
    ];

    for (const test of tests) {
      try {
        console.log(`\n\x1b[36m→ Testing ${test.name}...\x1b[0m`);
        await test.handler();
        console.log(`\x1b[32m✓ ${test.name} test completed\x1b[0m`);
      } catch (error) {
        console.log(`\x1b[31m✗ ${test.name} test failed: ${error.message}\x1b[0m`);
      }
    }

    console.log('\n\x1b[33mTest Suite Complete\x1b[0m');
  }

  async benchmarkHandler(args) {
    const type = args[0] || 'api';
    const iterations = parseInt(args[1]) || 100;

    console.log(`\n\x1b[33mRunning ${type} benchmark (${iterations} iterations)...\x1b[0m`);
    console.log('═'.repeat(50));

    const spinner = this.createSpinner();
    spinner.start(`Running ${iterations} requests...`);

    try {
      const results = await this.runBenchmark(type, iterations);
      spinner.stop('✓');

      console.log('\n\x1b[33mBenchmark Results:\x1b[0m');
      console.log('═'.repeat(30));
      console.log(`Total Time: \x1b[36m${results.totalTime}ms\x1b[0m`);
      console.log(`Average: \x1b[36m${results.averageTime.toFixed(2)}ms\x1b[0m`);
      console.log(`Min: \x1b[32m${results.minTime.toFixed(2)}ms\x1b[0m`);
      console.log(`Max: \x1b[31m${results.maxTime.toFixed(2)}ms\x1b[0m`);
      console.log(`RPS: \x1b[36m${results.requestsPerSecond.toFixed(2)}\x1b[0m`);
      console.log(`Success Rate: \x1b[32m${results.successRate.toFixed(2)}%\x1b[0m`);
      console.log();

    } catch (error) {
      spinner.stop('✗');
      console.error(`\x1b[31mBenchmark failed: ${error.message}\x1b[0m`);
    }
  }

  async runBenchmark(type, iterations) {
    const times = [];
    let successes = 0;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      try {
        const requestStart = Date.now();

        if (type === 'api') {
          await this.makeRequest('/health');
        } else if (type === 'jwks') {
          await this.makeRequest('/jwks');
        } else if (type === 'sign') {
          await this.makeRequest('/v1/sign', 'POST', { test: 'benchmark' });
        }

        const requestTime = Date.now() - requestStart;
        times.push(requestTime);
        successes++;
      } catch (error) {
        // Count as failure but continue
      }
    }

    const totalTime = Date.now() - startTime;
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const requestsPerSecond = (successes / totalTime) * 1000;
    const successRate = (successes / iterations) * 100;

    return {
      totalTime,
      averageTime,
      minTime,
      maxTime,
      requestsPerSecond,
      successRate
    };
  }

  async monitorHandler(args) {
    const type = args[0] || 'metrics';

    switch (type) {
      case 'metrics':
        await this.showMetrics();
        break;
      case 'performance':
        await this.showPerformance();
        break;
      case 'live':
        await this.startLiveMonitoring();
        break;
      default:
        console.log('\x1b[31mUsage: monitor <type>\x1b[0m');
        console.log('Types: metrics, performance, live');
    }
  }

  async showMetrics() {
    try {
      const response = await this.makeRequest('/metrics');

      console.log('\n\x1b[33mSystem Metrics:\x1b[0m');
      console.log('═'.repeat(30));

      if (typeof response.data === 'string') {
        // Parse Prometheus metrics
        const lines = response.data.split('\n').filter(line =>
          !line.startsWith('#') && line.trim()
        );

        lines.slice(0, 10).forEach(line => {
          const [metric, value] = line.split(' ');
          if (metric && value) {
            console.log(`\x1b[36m${metric.padEnd(30)}\x1b[0m ${value}`);
          }
        });

        if (lines.length > 10) {
          console.log(`\x1b[90m... and ${lines.length - 10} more metrics\x1b[0m`);
        }
      }

      console.log();
    } catch (error) {
      console.error(`\x1b[31mFailed to fetch metrics: ${error.message}\x1b[0m`);
    }
  }

  async showPerformance() {
    try {
      const response = await this.makeRequest('/performance', 'GET', null, true);

      console.log('\n\x1b[33mPerformance Dashboard:\x1b[0m');
      console.log('═'.repeat(40));

      if (response.data) {
        const data = response.data;

        if (data.cache) {
          console.log('\n\x1b[36mCache Performance:\x1b[0m');
          Object.entries(data.cache).forEach(([name, cache]) => {
            console.log(`  ${name}: ${cache.hitRate}% hit rate (${cache.hits}/${cache.hits + cache.misses})`);
          });
        }

        if (data.monitor) {
          console.log('\n\x1b[36mRequest Performance:\x1b[0m');
          const monitor = data.monitor;
          console.log(`  Requests: ${monitor.requestCount}`);
          console.log(`  Avg Response: ${monitor.averageResponseTime?.toFixed(2) || 0}ms`);
          console.log(`  Slow Requests: ${monitor.slowRequests || 0}`);
        }
      }

      console.log();
    } catch (error) {
      console.error(`\x1b[31mFailed to fetch performance data: ${error.message}\x1b[0m`);
    }
  }

  async securityHandler(args) {
    const action = args[0] || 'audit';

    switch (action) {
      case 'audit':
        await this.runSecurityAudit();
        break;
      case 'alerts':
        await this.showSecurityAlerts();
        break;
      case 'config':
        await this.showSecurityConfig();
        break;
      default:
        console.log('\x1b[31mUsage: security <action>\x1b[0m');
        console.log('Actions: audit, alerts, config');
    }
  }

  async runSecurityAudit() {
    const spinner = this.createSpinner();
    spinner.start('Running security audit...');

    try {
      const response = await this.makeRequest('/api/security/audit', 'GET', null, true);
      spinner.stop('✓');

      console.log('\n\x1b[33mSecurity Audit Results:\x1b[0m');
      console.log('═'.repeat(40));

      if (response.data && response.data.overallScore) {
        const score = response.data.overallScore;
        const gradeColor = score.grade === 'A+' || score.grade === 'A' ? '\x1b[32m' :
                          score.grade.startsWith('B') ? '\x1b[33m' : '\x1b[31m';

        console.log(`Overall Score: ${gradeColor}${score.percentage}% (${score.grade})\x1b[0m`);
        console.log(`Recommendation: \x1b[36m${score.recommendation}\x1b[0m`);
      }

      if (response.data && response.data.findings) {
        console.log(`\nFindings: \x1b[31m${response.data.findings.length}\x1b[0m issues found`);

        response.data.findings.forEach((finding, index) => {
          const severityColor = finding.severity === 'critical' ? '\x1b[31m' :
                               finding.severity === 'high' ? '\x1b[33m' : '\x1b[36m';

          console.log(`\n${index + 1}. ${severityColor}[${finding.severity.toUpperCase()}]\x1b[0m ${finding.title}`);
          console.log(`   ${finding.description}`);

          if (finding.issues) {
            finding.issues.forEach(issue => {
              console.log(`   • ${issue}`);
            });
          }
        });
      }

      console.log();
    } catch (error) {
      spinner.stop('✗');
      console.error(`\x1b[31mSecurity audit failed: ${error.message}\x1b[0m`);
    }
  }

  async generateHandler(args) {
    const type = args[0] || 'config';

    switch (type) {
      case 'config':
        await this.generateSecurityConfig();
        break;
      case 'receipt':
        await this.generateTestReceipt();
        break;
      case 'token':
        this.generateSecureToken();
        break;
      default:
        console.log('\x1b[31mUsage: generate <type>\x1b[0m');
        console.log('Types: config, receipt, token');
    }
  }

  async generateSecurityConfig() {
    const spinner = this.createSpinner();
    spinner.start('Generating secure configuration...');

    try {
      const response = await this.makeRequest('/api/security/deployment-config', 'POST', {}, true);
      spinner.stop('✓');

      console.log('\n\x1b[33mSecure Deployment Configuration:\x1b[0m');
      console.log('═'.repeat(50));

      if (response.data && response.data.config) {
        Object.entries(response.data.config).forEach(([key, value]) => {
          console.log(`export ${key}="${value}"`);
        });

        console.log('\n\x1b[36mInstructions:\x1b[0m');
        if (response.data.instructions) {
          response.data.instructions.forEach(instruction => {
            console.log(`• ${instruction}`);
          });
        }
      }

      console.log();
    } catch (error) {
      spinner.stop('✗');
      console.error(`\x1b[31mConfig generation failed: ${error.message}\x1b[0m`);
    }
  }

  generateSecureToken() {
    const token = crypto.randomBytes(64).toString('hex');
    console.log('\n\x1b[33mGenerated Secure Token:\x1b[0m');
    console.log('═'.repeat(30));
    console.log(`\x1b[36m${token}\x1b[0m`);
    console.log('\n\x1b[90mNote: Store this token securely and use for production authentication\x1b[0m\n');
  }

  // ============================================================================
  // Utility Functions
  // ============================================================================

  async makeRequest(endpoint, method = 'GET', data = null, requiresAuth = false) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.config.apiUrl);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CertNode-CLI/2.0'
        }
      };

      if (requiresAuth) {
        options.headers['Authorization'] = `Bearer ${this.config.adminToken}`;
      }

      if (data) {
        const postData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = client.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const responseData = res.headers['content-type']?.includes('application/json')
              ? JSON.parse(body) : body;

            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: responseData
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: body
            });
          }
        });
      });

      req.on('error', reject);

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  createSpinner() {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let frame = 0;
    let interval;

    return {
      start: (message) => {
        process.stdout.write(`${frames[frame]} ${message}`);
        interval = setInterval(() => {
          frame = (frame + 1) % frames.length;
          process.stdout.write(`\r${frames[frame]} ${message}`);
        }, 100);
      },
      stop: (result) => {
        clearInterval(interval);
        process.stdout.write(`\r${result} \n`);
      }
    };
  }

  async validateHandler(args) {
    console.log('\x1b[33mValidation features coming soon...\x1b[0m');
    console.log('Will include: receipt validation, JWKS validation, config validation');
  }

  async deployHandler(args) {
    console.log('\n\x1b[33mDeployment Utilities:\x1b[0m');
    console.log('═'.repeat(30));
    console.log('• \x1b[32mgenerate config\x1b[0m - Generate secure production configuration');
    console.log('• \x1b[32msecurity audit\x1b[0m - Run comprehensive security audit');
    console.log('• \x1b[32mtest all\x1b[0m - Run complete test suite');
    console.log('• \x1b[32mmonitor performance\x1b[0m - Check system performance');
    console.log();
  }

  async startLiveMonitoring() {
    console.log('\n\x1b[33mStarting Live Monitoring...\x1b[0m');
    console.log('Press Ctrl+C to stop\n');

    const interval = setInterval(async () => {
      try {
        const response = await this.makeRequest('/performance', 'GET', null, true);

        process.stdout.write('\r\x1b[K'); // Clear line

        if (response.data && response.data.monitor) {
          const monitor = response.data.monitor;
          const cache = response.data.cache?.response || {};

          process.stdout.write(
            `\x1b[36mRequests: ${monitor.requestCount || 0}\x1b[0m | ` +
            `\x1b[33mAvg: ${(monitor.averageResponseTime || 0).toFixed(1)}ms\x1b[0m | ` +
            `\x1b[32mCache: ${cache.hitRate || 0}%\x1b[0m | ` +
            `\x1b[35mMem: ${monitor.memoryUsage?.heapUsed || 0}MB\x1b[0m`
          );
        }
      } catch (error) {
        process.stdout.write('\r\x1b[31mMonitoring error\x1b[0m');
      }
    }, 2000);

    process.on('SIGINT', () => {
      clearInterval(interval);
      console.log('\n\nLive monitoring stopped.');
      this.rl.prompt();
    });
  }

  async showSecurityAlerts() {
    try {
      const response = await this.makeRequest('/api/security/alerts', 'GET', null, true);

      console.log('\n\x1b[33mSecurity Alerts:\x1b[0m');
      console.log('═'.repeat(30));

      if (response.data && response.data.alerts) {
        response.data.alerts.slice(0, 5).forEach((alert, index) => {
          const severityColor = alert.severity === 'critical' ? '\x1b[31m' :
                               alert.severity === 'high' ? '\x1b[33m' : '\x1b[36m';

          console.log(`${index + 1}. ${severityColor}[${alert.severity.toUpperCase()}]\x1b[0m ${alert.type}`);
          console.log(`   IP: ${alert.ip} | Time: ${new Date(alert.timestamp).toLocaleTimeString()}`);
          console.log(`   URL: ${alert.url}`);
        });

        if (response.data.alerts.length > 5) {
          console.log(`\n\x1b[90m... and ${response.data.alerts.length - 5} more alerts\x1b[0m`);
        }
      } else {
        console.log('\x1b[32mNo recent security alerts\x1b[0m');
      }

      console.log();
    } catch (error) {
      console.error(`\x1b[31mFailed to fetch security alerts: ${error.message}\x1b[0m`);
    }
  }

  async showSecurityConfig() {
    try {
      const response = await this.makeRequest('/api/security/config', 'GET', null, true);

      console.log('\n\x1b[33mSecurity Configuration:\x1b[0m');
      console.log('═'.repeat(40));

      if (response.data) {
        Object.entries(response.data).forEach(([section, config]) => {
          if (typeof config === 'object' && config !== null) {
            console.log(`\n\x1b[36m${section}:\x1b[0m`);
            Object.entries(config).forEach(([key, value]) => {
              console.log(`  ${key}: ${JSON.stringify(value)}`);
            });
          } else {
            console.log(`${section}: ${config}`);
          }
        });
      }

      console.log();
    } catch (error) {
      console.error(`\x1b[31mFailed to fetch security config: ${error.message}\x1b[0m`);
    }
  }

  // ============================================================================
  // Interactive Setup Wizard
  // ============================================================================

  async setupWizard(args) {
    console.log('\n\x1b[36m🔧 CertNode Project Setup Wizard\x1b[0m');
    console.log('═'.repeat(50));
    console.log('This wizard will help you set up a new CertNode project.\n');

    try {
      // Step 1: Project Type
      const projectType = await this.promptChoice(
        'What type of project are you setting up?',
        [
          { name: 'React Application', value: 'react' },
          { name: 'Vue.js Application', value: 'vue' },
          { name: 'Next.js Full-Stack App', value: 'nextjs' },
          { name: 'Express.js API', value: 'express' },
          { name: 'Fastify API', value: 'fastify' },
          { name: 'Cloudflare Workers', value: 'cloudflare-workers' },
          { name: 'Vercel Functions', value: 'vercel' },
          { name: 'AWS Lambda', value: 'aws-lambda' },
          { name: 'React Native App', value: 'react-native' }
        ]
      );

      // Step 2: Project Name
      const projectName = await this.promptInput(
        'Project name:',
        'my-certnode-app',
        (value) => {
          if (!value || value.trim().length === 0) {
            return 'Project name cannot be empty';
          }
          if (!/^[a-z0-9-_]+$/.test(value)) {
            return 'Project name must contain only lowercase letters, numbers, hyphens, and underscores';
          }
          return null;
        }
      );

      // Step 3: Directory
      const projectDir = await this.promptInput(
        'Project directory:',
        `./${projectName}`,
        (value) => {
          if (!value || value.trim().length === 0) {
            return 'Directory cannot be empty';
          }
          if (fs.existsSync(value)) {
            return `Directory '${value}' already exists`;
          }
          return null;
        }
      );

      // Step 4: CertNode Configuration
      const apiUrl = await this.promptInput(
        'CertNode API URL:',
        'https://api.certnode.io'
      );

      const jwksUrl = await this.promptInput(
        'JWKS URL:',
        `${apiUrl}/.well-known/jwks.json`
      );

      // Step 5: Additional Features
      const features = await this.promptMultiChoice(
        'Select additional features to include:',
        [
          { name: 'TypeScript support', value: 'typescript', default: true },
          { name: 'Testing setup (Jest)', value: 'testing', default: true },
          { name: 'Linting (ESLint)', value: 'linting', default: true },
          { name: 'Performance monitoring', value: 'monitoring', default: false },
          { name: 'Docker configuration', value: 'docker', default: false },
          { name: 'CI/CD setup (GitHub Actions)', value: 'cicd', default: false }
        ]
      );

      // Step 6: Package Manager
      const packageManager = await this.promptChoice(
        'Package manager:',
        [
          { name: 'npm', value: 'npm' },
          { name: 'yarn', value: 'yarn' },
          { name: 'pnpm', value: 'pnpm' }
        ]
      );

      // Summary
      console.log('\n\x1b[33m📋 Project Configuration Summary:\x1b[0m');
      console.log('═'.repeat(40));
      console.log(`Project Type: ${projectType}`);
      console.log(`Project Name: ${projectName}`);
      console.log(`Directory: ${projectDir}`);
      console.log(`API URL: ${apiUrl}`);
      console.log(`JWKS URL: ${jwksUrl}`);
      console.log(`Features: ${features.join(', ')}`);
      console.log(`Package Manager: ${packageManager}`);

      const confirmSetup = await this.promptYesNo('\nProceed with project creation?', true);

      if (!confirmSetup) {
        console.log('\x1b[33m⚠️  Setup cancelled.\x1b[0m');
        return;
      }

      // Execute project creation
      await this.createProject({
        type: projectType,
        name: projectName,
        directory: projectDir,
        apiUrl,
        jwksUrl,
        features,
        packageManager
      });

      console.log('\n\x1b[32m✅ Project setup completed successfully!\x1b[0m');
      console.log('\nNext steps:');
      console.log(`  1. cd ${projectDir}`);
      console.log(`  2. ${packageManager} install`);
      console.log(`  3. ${packageManager} run dev`);
      console.log('\nHappy coding! 🚀');

    } catch (error) {
      console.error(`\x1b[31m❌ Setup failed: ${error.message}\x1b[0m`);
    }
  }

  async createProject(config) {
    const spinner = this.createSpinner();

    try {
      spinner.start('Creating project directory...');
      fs.mkdirSync(config.directory, { recursive: true });

      spinner.text = 'Generating project template...';
      await this.generateTemplate(config);

      spinner.text = 'Creating configuration files...';
      await this.createConfigFiles(config);

      if (config.features.includes('docker')) {
        spinner.text = 'Setting up Docker configuration...';
        await this.createDockerFiles(config);
      }

      if (config.features.includes('cicd')) {
        spinner.text = 'Setting up CI/CD configuration...';
        await this.createCICDFiles(config);
      }

      spinner.succeed('Project created successfully!');

    } catch (error) {
      spinner.fail(`Failed to create project: ${error.message}`);
      throw error;
    }
  }

  async generateTemplate(config) {
    // Use the create-certnode-app functionality
    const templatePath = path.join(__dirname, '..', 'templates', config.type, 'basic');

    if (fs.existsSync(templatePath)) {
      // Copy template files
      await this.copyDirectory(templatePath, config.directory);
    } else {
      // Create basic template structure
      await this.createBasicTemplate(config);
    }
  }

  async createBasicTemplate(config) {
    const packageJson = {
      name: config.name,
      version: '1.0.0',
      description: `CertNode ${config.type} application`,
      scripts: this.getScriptsForType(config.type, config.packageManager),
      dependencies: this.getDependenciesForType(config.type, config.features),
      devDependencies: this.getDevDependenciesForType(config.type, config.features)
    };

    fs.writeFileSync(
      path.join(config.directory, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create basic source structure
    const srcDir = path.join(config.directory, 'src');
    fs.mkdirSync(srcDir, { recursive: true });

    // Create main application file
    const mainFile = this.getMainFileContent(config.type, config.features.includes('typescript'));
    const extension = config.features.includes('typescript') ? '.ts' : '.js';
    fs.writeFileSync(path.join(srcDir, `index${extension}`), mainFile);
  }

  async createConfigFiles(config) {
    // .env.example
    const envExample = `# CertNode Configuration
CERTNODE_API_URL=${config.apiUrl}
CERTNODE_JWKS_URL=${config.jwksUrl}

# Development
NODE_ENV=development
PORT=3000

# Optional: Admin token for management endpoints
# CERTNODE_ADMIN_TOKEN=your-admin-token-here
`;
    fs.writeFileSync(path.join(config.directory, '.env.example'), envExample);

    // README.md
    const readme = this.generateReadme(config);
    fs.writeFileSync(path.join(config.directory, 'README.md'), readme);

    // TypeScript configuration
    if (config.features.includes('typescript')) {
      const tsConfig = {
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
          lib: ['ES2020'],
          outDir: './dist',
          rootDir: './src',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          declaration: true,
          declarationMap: true,
          sourceMap: true
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist']
      };
      fs.writeFileSync(
        path.join(config.directory, 'tsconfig.json'),
        JSON.stringify(tsConfig, null, 2)
      );
    }

    // ESLint configuration
    if (config.features.includes('linting')) {
      const eslintConfig = {
        env: {
          node: true,
          es2021: true
        },
        extends: [
          'eslint:recommended'
        ],
        parserOptions: {
          ecmaVersion: 12,
          sourceType: 'module'
        },
        rules: {}
      };

      if (config.features.includes('typescript')) {
        eslintConfig.extends.push('@typescript-eslint/recommended');
        eslintConfig.parser = '@typescript-eslint/parser';
        eslintConfig.plugins = ['@typescript-eslint'];
      }

      fs.writeFileSync(
        path.join(config.directory, '.eslintrc.json'),
        JSON.stringify(eslintConfig, null, 2)
      );
    }
  }

  async createDockerFiles(config) {
    const dockerfile = `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

${config.features.includes('typescript') ? 'RUN npm run build' : ''}

EXPOSE 3000

CMD ["npm", "start"]
`;

    const dockerignore = `node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.npm
.eslintcache
`;

    fs.writeFileSync(path.join(config.directory, 'Dockerfile'), dockerfile);
    fs.writeFileSync(path.join(config.directory, '.dockerignore'), dockerignore);
  }

  async createCICDFiles(config) {
    const cicdDir = path.join(config.directory, '.github', 'workflows');
    fs.mkdirSync(cicdDir, { recursive: true });

    const workflow = `name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]

    steps:
    - uses: actions/checkout@v3

    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        cache: '${config.packageManager}'

    - name: Install dependencies
      run: ${config.packageManager} install

    ${config.features.includes('linting') ? '- name: Run linting\n      run: npm run lint\n    ' : ''}
    ${config.features.includes('typescript') ? '- name: Type check\n      run: npm run type-check\n    ' : ''}
    ${config.features.includes('testing') ? '- name: Run tests\n      run: npm test\n    ' : ''}

    - name: Build
      run: npm run build
`;

    fs.writeFileSync(path.join(cicdDir, 'ci.yml'), workflow);
  }

  // Helper methods for setup wizard
  getScriptsForType(type, packageManager) {
    const baseScripts = {
      start: 'node src/index.js',
      dev: 'nodemon src/index.js',
      test: 'jest',
      lint: 'eslint src/',
      'lint:fix': 'eslint src/ --fix'
    };

    switch (type) {
      case 'react':
      case 'vue':
        return {
          ...baseScripts,
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        };
      case 'nextjs':
        return {
          ...baseScripts,
          dev: 'next dev',
          build: 'next build',
          start: 'next start'
        };
      default:
        return baseScripts;
    }
  }

  getDependenciesForType(type, features) {
    const baseDeps = {
      '@certnode/sdk': 'latest'
    };

    switch (type) {
      case 'express':
        baseDeps.express = '^4.18.0';
        break;
      case 'fastify':
        baseDeps.fastify = '^4.0.0';
        break;
      case 'react':
        Object.assign(baseDeps, {
          react: '^18.0.0',
          'react-dom': '^18.0.0',
          '@certnode/react': 'latest'
        });
        break;
      case 'vue':
        Object.assign(baseDeps, {
          vue: '^3.0.0',
          '@certnode/vue': 'latest'
        });
        break;
      case 'nextjs':
        Object.assign(baseDeps, {
          next: '^13.0.0',
          react: '^18.0.0',
          'react-dom': '^18.0.0',
          '@certnode/react': 'latest'
        });
        break;
    }

    return baseDeps;
  }

  getDevDependenciesForType(type, features) {
    const devDeps = {};

    if (features.includes('typescript')) {
      Object.assign(devDeps, {
        typescript: '^5.0.0',
        '@types/node': '^20.0.0'
      });
    }

    if (features.includes('testing')) {
      Object.assign(devDeps, {
        jest: '^29.0.0'
      });
    }

    if (features.includes('linting')) {
      devDeps.eslint = '^8.0.0';
      if (features.includes('typescript')) {
        Object.assign(devDeps, {
          '@typescript-eslint/eslint-plugin': '^6.0.0',
          '@typescript-eslint/parser': '^6.0.0'
        });
      }
    }

    if (['express', 'fastify'].includes(type)) {
      devDeps.nodemon = '^3.0.0';
    }

    return devDeps;
  }

  getMainFileContent(type, isTypeScript) {
    const ext = isTypeScript ? 'ts' : 'js';

    switch (type) {
      case 'express':
        return `${isTypeScript ? "import express from 'express';\nimport { verifyReceipt } from '@certnode/sdk';\n" : "const express = require('express');\nconst { verifyReceipt } = require('@certnode/sdk');\n"}
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'CertNode Express API', status: 'ready' });
});

app.post('/verify', async (req, res) => {
  try {
    const { receipt, jwks } = req.body;
    const result = await verifyReceipt({ receipt, jwks });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
});
`;

      case 'fastify':
        return `${isTypeScript ? "import Fastify from 'fastify';\nimport { verifyReceipt } from '@certnode/sdk';\n" : "const fastify = require('fastify')({ logger: true });\nconst { verifyReceipt } = require('@certnode/sdk');\n"}
${!isTypeScript ? "const fastify = require('fastify')({ logger: true });\n" : "const server = Fastify({ logger: true });\n"}

${isTypeScript ? "server" : "fastify"}.get('/', async (request, reply) => {
  return { message: 'CertNode Fastify API', status: 'ready' };
});

${isTypeScript ? "server" : "fastify"}.post('/verify', async (request, reply) => {
  try {
    const { receipt, jwks } = request.body;
    const result = await verifyReceipt({ receipt, jwks });
    return result;
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

const start = async () => {
  try {
    await ${isTypeScript ? "server" : "fastify"}.listen({ port: 3000 });
    console.log('🚀 Server running on port 3000');
  } catch (err) {
    ${isTypeScript ? "server" : "fastify"}.log.error(err);
    process.exit(1);
  }
};

start();
`;

      default:
        return `${isTypeScript ? "import { verifyReceipt } from '@certnode/sdk';\n" : "const { verifyReceipt } = require('@certnode/sdk');\n"}
console.log('🔐 CertNode Application Started');

// Example usage
async function example() {
  const receipt = {
    // Your receipt data here
  };

  const jwks = {
    // Your JWKS data here
  };

  try {
    const result = await verifyReceipt({ receipt, jwks });
    console.log('Verification result:', result);
  } catch (error) {
    console.error('Verification failed:', error);
  }
}

// Uncomment to run example
// example();
`;
    }
  }

  generateReadme(config) {
    return `# ${config.name}

A CertNode ${config.type} application for tamper-evident digital receipt verification.

## Getting Started

1. Install dependencies:
   \`\`\`bash
   ${config.packageManager} install
   \`\`\`

2. Copy environment configuration:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

3. Update your environment variables in \`.env\`

4. Start development server:
   \`\`\`bash
   ${config.packageManager} run dev
   \`\`\`

## Features

${config.features.map(feature => `- ✅ ${feature.charAt(0).toUpperCase() + feature.slice(1)} support`).join('\n')}

## CertNode Configuration

- **API URL**: ${config.apiUrl}
- **JWKS URL**: ${config.jwksUrl}

## Documentation

- [CertNode Documentation](https://certnode.io/docs)
- [${config.type.charAt(0).toUpperCase() + config.type.slice(1)} Integration Guide](https://certnode.io/docs/integrations/${config.type})

## Support

- [GitHub Issues](https://github.com/certnode/certnode/issues)
- [Community Discussions](https://github.com/certnode/certnode/discussions)

---

Generated with CertNode CLI Setup Wizard
`;
  }

  // Interactive prompt helpers
  async promptInput(question, defaultValue = '', validator = null) {
    return new Promise((resolve) => {
      const prompt = defaultValue
        ? `${question} (${defaultValue}): `
        : `${question}: `;

      this.rl.question(prompt, (answer) => {
        const value = answer.trim() || defaultValue;

        if (validator) {
          const error = validator(value);
          if (error) {
            console.log(`\x1b[31m${error}\x1b[0m`);
            resolve(this.promptInput(question, defaultValue, validator));
            return;
          }
        }

        resolve(value);
      });
    });
  }

  async promptChoice(question, choices) {
    console.log(`\n${question}`);
    choices.forEach((choice, index) => {
      console.log(`  ${index + 1}. ${choice.name}`);
    });

    return new Promise((resolve) => {
      this.rl.question('\nSelect option (1-' + choices.length + '): ', (answer) => {
        const index = parseInt(answer) - 1;
        if (index >= 0 && index < choices.length) {
          resolve(choices[index].value);
        } else {
          console.log('\x1b[31mInvalid selection. Please try again.\x1b[0m');
          resolve(this.promptChoice(question, choices));
        }
      });
    });
  }

  async promptMultiChoice(question, choices) {
    console.log(`\n${question}`);
    choices.forEach((choice, index) => {
      const defaultIndicator = choice.default ? ' (default)' : '';
      console.log(`  ${index + 1}. ${choice.name}${defaultIndicator}`);
    });

    return new Promise((resolve) => {
      this.rl.question('\nSelect options (comma-separated numbers, or press Enter for defaults): ', (answer) => {
        if (!answer.trim()) {
          // Use defaults
          const selected = choices.filter(choice => choice.default).map(choice => choice.value);
          resolve(selected);
          return;
        }

        const indices = answer.split(',').map(n => parseInt(n.trim()) - 1);
        const selected = [];

        for (const index of indices) {
          if (index >= 0 && index < choices.length) {
            selected.push(choices[index].value);
          }
        }

        if (selected.length === 0) {
          console.log('\x1b[31mNo valid selections. Please try again.\x1b[0m');
          resolve(this.promptMultiChoice(question, choices));
        } else {
          resolve(selected);
        }
      });
    });
  }

  async promptYesNo(question, defaultValue = true) {
    const defaultText = defaultValue ? 'Y/n' : 'y/N';

    return new Promise((resolve) => {
      this.rl.question(`${question} (${defaultText}): `, (answer) => {
        const input = answer.trim().toLowerCase();
        if (input === '') {
          resolve(defaultValue);
        } else if (input === 'y' || input === 'yes') {
          resolve(true);
        } else if (input === 'n' || input === 'no') {
          resolve(false);
        } else {
          console.log('\x1b[31mPlease answer yes (y) or no (n).\x1b[0m');
          resolve(this.promptYesNo(question, defaultValue));
        }
      });
    });
  }

  async copyDirectory(src, dest) {
    const entries = fs.readdirSync(src, { withFileTypes: true });

    fs.mkdirSync(dest, { recursive: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

function main() {
  console.log('Initializing CertNode CLI...');

  const cli = new CertNodeCLI();

  // Handle CLI arguments for non-interactive mode
  const args = process.argv.slice(2);
  if (args.length > 0) {
    cli.executeCommand(args[0], args.slice(1))
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(`Error: ${error.message}`);
        process.exit(1);
      });
  } else {
    // Start interactive mode
    cli.start();
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = CertNodeCLI;