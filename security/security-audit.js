#!/usr/bin/env node

/**
 * CertNode Security Audit Tool
 * Comprehensive security assessment and vulnerability scanning
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const crypto = require('crypto');

class SecurityAuditor {
  constructor(options = {}) {
    this.config = {
      verbose: options.verbose || false,
      outputDir: options.outputDir || './security-reports',
      format: options.format || 'json',
      severity: options.severity || 'medium',
      includeFixed: options.includeFixed || false,
      ...options
    };

    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        total_vulnerabilities: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0
      },
      scans: {},
      recommendations: []
    };

    this.ensure_output_directory();
  }

  ensure_output_directory() {
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  log(message, level = 'info') {
    if (this.config.verbose || level === 'error') {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    }
  }

  async run_command(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        ...options
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      proc.on('error', (error) => {
        reject(error);
      });
    });
  }

  async npm_audit() {
    this.log('Running npm audit...');

    try {
      const { stdout } = await this.run_command('npm', ['audit', '--json'], {
        cwd: path.join(process.cwd(), 'api')
      });

      const auditResult = JSON.parse(stdout);

      this.results.scans.npm_audit = {
        status: 'completed',
        vulnerabilities: auditResult.vulnerabilities || {},
        metadata: auditResult.metadata || {},
        advisories: auditResult.advisories || {}
      };

      // Update summary
      if (auditResult.metadata) {
        this.results.summary.total_vulnerabilities += auditResult.metadata.vulnerabilities || 0;

        const severities = auditResult.metadata.vulnerabilities || {};
        this.results.summary.critical += severities.critical || 0;
        this.results.summary.high += severities.high || 0;
        this.results.summary.medium += severities.moderate || 0;
        this.results.summary.low += severities.low || 0;
        this.results.summary.info += severities.info || 0;
      }

      this.log(`npm audit completed. Found ${auditResult.metadata?.vulnerabilities || 0} vulnerabilities`);

    } catch (error) {
      this.log(`npm audit failed: ${error.message}`, 'error');
      this.results.scans.npm_audit = {
        status: 'failed',
        error: error.message
      };
    }
  }

  async snyk_scan() {
    this.log('Running Snyk security scan...');

    try {
      const { stdout } = await this.run_command('snyk', ['test', '--json'], {
        cwd: path.join(process.cwd(), 'api')
      });

      const snykResult = JSON.parse(stdout);

      this.results.scans.snyk = {
        status: 'completed',
        vulnerabilities: snykResult.vulnerabilities || [],
        summary: snykResult.summary || {},
        policy: snykResult.policy || ''
      };

      this.log(`Snyk scan completed. Found ${snykResult.vulnerabilities?.length || 0} issues`);

    } catch (error) {
      // Snyk returns non-zero exit code when vulnerabilities are found
      if (error.message.includes('Command failed')) {
        try {
          const { stdout } = await this.run_command('snyk', ['test', '--json'], {
            cwd: path.join(process.cwd(), 'api')
          }).catch(() => ({ stdout: '{}' }));

          this.results.scans.snyk = {
            status: 'completed_with_issues',
            raw_output: stdout
          };
        } catch (parseError) {
          this.results.scans.snyk = {
            status: 'failed',
            error: parseError.message
          };
        }
      } else {
        this.log(`Snyk scan failed: ${error.message}`, 'error');
        this.results.scans.snyk = {
          status: 'failed',
          error: error.message
        };
      }
    }
  }

  async trivy_scan() {
    this.log('Running Trivy container security scan...');

    try {
      // Scan filesystem
      const { stdout: fsOutput } = await this.run_command('trivy', [
        'fs',
        '--format', 'json',
        '--severity', 'CRITICAL,HIGH,MEDIUM',
        '.'
      ]);

      const trivyFsResult = JSON.parse(fsOutput);

      // Scan Docker image if available
      let imageResult = null;
      try {
        const { stdout: imageOutput } = await this.run_command('trivy', [
          'image',
          '--format', 'json',
          '--severity', 'CRITICAL,HIGH,MEDIUM',
          'certnode/api:latest'
        ]);
        imageResult = JSON.parse(imageOutput);
      } catch (imageError) {
        this.log(`Trivy image scan skipped: ${imageError.message}`);
      }

      this.results.scans.trivy = {
        status: 'completed',
        filesystem_scan: trivyFsResult,
        image_scan: imageResult
      };

      this.log('Trivy scan completed');

    } catch (error) {
      this.log(`Trivy scan failed: ${error.message}`, 'error');
      this.results.scans.trivy = {
        status: 'failed',
        error: error.message
      };
    }
  }

  async semgrep_scan() {
    this.log('Running Semgrep static analysis...');

    try {
      const { stdout } = await this.run_command('semgrep', [
        '--config', 'auto',
        '--json',
        '--severity', 'ERROR',
        '--severity', 'WARNING',
        'api/'
      ]);

      const semgrepResult = JSON.parse(stdout);

      this.results.scans.semgrep = {
        status: 'completed',
        results: semgrepResult.results || [],
        errors: semgrepResult.errors || [],
        paths: semgrepResult.paths || {}
      };

      this.log(`Semgrep scan completed. Found ${semgrepResult.results?.length || 0} issues`);

    } catch (error) {
      this.log(`Semgrep scan failed: ${error.message}`, 'error');
      this.results.scans.semgrep = {
        status: 'failed',
        error: error.message
      };
    }
  }

  async custom_security_checks() {
    this.log('Running custom security checks...');

    const checks = [
      this.check_hardcoded_secrets(),
      this.check_security_headers(),
      this.check_input_validation(),
      this.check_authentication(),
      this.check_https_enforcement(),
      this.check_error_handling(),
      this.check_rate_limiting(),
      this.check_cors_configuration()
    ];

    const results = await Promise.allSettled(checks);

    this.results.scans.custom_checks = {
      status: 'completed',
      checks: results.map((result, index) => ({
        name: ['hardcoded_secrets', 'security_headers', 'input_validation',
               'authentication', 'https_enforcement', 'error_handling',
               'rate_limiting', 'cors_configuration'][index],
        status: result.status,
        result: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }))
    };

    this.log('Custom security checks completed');
  }

  async check_hardcoded_secrets() {
    const patterns = [
      /(?i)(api[_-]?key|secret[_-]?key|access[_-]?token)["\s]*[:=]["\s]*[a-zA-Z0-9_-]{16,}/,
      /(?i)(password|passwd)["\s]*[:=]["\s]*["\'][^"\']{8,}["\']/,
      /(?i)(private[_-]?key)["\s]*[:=]/,
      /(?i)(jwt[_-]?secret|session[_-]?secret)["\s]*[:=]/
    ];

    const files = await this.get_js_files('api/');
    const violations = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          violations.push({
            file,
            pattern: pattern.toString(),
            line: this.get_line_number(content, matches[0])
          });
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      severity: 'critical'
    };
  }

  async check_security_headers() {
    const serverFiles = await this.find_files('api/', /server\.js$/);
    const violations = [];

    for (const file of serverFiles) {
      const content = fs.readFileSync(file, 'utf8');

      const requiredHeaders = [
        'helmet',
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection'
      ];

      for (const header of requiredHeaders) {
        if (!content.toLowerCase().includes(header.toLowerCase())) {
          violations.push({
            file,
            missing_header: header,
            severity: 'medium'
          });
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      severity: 'medium'
    };
  }

  async check_input_validation() {
    const routeFiles = await this.find_files('api/', /routes.*\.js$/);
    const violations = [];

    const validationLibraries = ['joi', 'express-validator', 'validator', 'yup'];

    for (const file of routeFiles) {
      const content = fs.readFileSync(file, 'utf8');

      const hasValidation = validationLibraries.some(lib =>
        content.includes(`require('${lib}')`) ||
        content.includes(`import ${lib}`) ||
        content.includes(`from '${lib}'`)
      );

      if (!hasValidation) {
        violations.push({
          file,
          issue: 'No input validation library detected',
          severity: 'high'
        });
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      severity: 'high'
    };
  }

  async check_authentication() {
    const files = await this.get_js_files('api/');
    let hasAuthentication = false;
    const violations = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');

      if (content.includes('jwt') || content.includes('passport') || content.includes('auth')) {
        hasAuthentication = true;

        // Check for weak JWT secrets
        const jwtSecretPattern = /jwt.*secret.*[=:]['"](.{1,20})['"]/i;
        const match = content.match(jwtSecretPattern);
        if (match && match[1].length < 32) {
          violations.push({
            file,
            issue: 'JWT secret appears to be too short (< 32 characters)',
            severity: 'high'
          });
        }
      }
    }

    if (!hasAuthentication) {
      violations.push({
        issue: 'No authentication mechanism detected',
        severity: 'critical'
      });
    }

    return {
      passed: violations.length === 0,
      violations,
      severity: hasAuthentication ? 'medium' : 'critical'
    };
  }

  async check_https_enforcement() {
    const files = await this.get_js_files('api/');
    const violations = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');

      if (content.includes('http://') && !content.includes('localhost')) {
        violations.push({
          file,
          issue: 'HTTP URLs detected (should use HTTPS)',
          severity: 'medium'
        });
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      severity: 'medium'
    };
  }

  async check_error_handling() {
    const files = await this.get_js_files('api/');
    const violations = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for proper error handling patterns
      const hasTryCatch = content.includes('try') && content.includes('catch');
      const hasErrorMiddleware = content.includes('(err, req, res, next)');

      if (!hasTryCatch && !hasErrorMiddleware && content.includes('async')) {
        violations.push({
          file,
          issue: 'Async functions without proper error handling',
          severity: 'medium'
        });
      }

      // Check for information disclosure in errors
      if (content.includes('error.stack') || content.includes('err.stack')) {
        violations.push({
          file,
          issue: 'Stack traces may be exposed to clients',
          severity: 'low'
        });
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      severity: 'medium'
    };
  }

  async check_rate_limiting() {
    const files = await this.get_js_files('api/');
    let hasRateLimit = false;

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');

      if (content.includes('express-rate-limit') || content.includes('rate-limiter')) {
        hasRateLimit = true;
        break;
      }
    }

    return {
      passed: hasRateLimit,
      violations: hasRateLimit ? [] : [{
        issue: 'No rate limiting detected',
        severity: 'medium'
      }],
      severity: 'medium'
    };
  }

  async check_cors_configuration() {
    const files = await this.get_js_files('api/');
    const violations = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');

      if (content.includes('cors') && content.includes('origin: "*"')) {
        violations.push({
          file,
          issue: 'CORS configured to allow all origins (*)',
          severity: 'medium'
        });
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      severity: 'medium'
    };
  }

  async get_js_files(directory) {
    return this.find_files(directory, /\.js$/);
  }

  async find_files(directory, pattern) {
    const files = [];

    function scanDirectory(dir) {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(fullPath);
        } else if (stat.isFile() && pattern.test(item)) {
          files.push(fullPath);
        }
      }
    }

    scanDirectory(directory);
    return files;
  }

  get_line_number(content, searchString) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchString)) {
        return i + 1;
      }
    }
    return 0;
  }

  generate_recommendations() {
    const recommendations = [];

    // Critical recommendations
    if (this.results.summary.critical > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'vulnerabilities',
        title: 'Address Critical Vulnerabilities',
        description: `Found ${this.results.summary.critical} critical vulnerabilities that require immediate attention.`,
        action: 'Update dependencies and apply security patches immediately.'
      });
    }

    // High priority recommendations
    if (this.results.summary.high > 5) {
      recommendations.push({
        priority: 'high',
        category: 'vulnerabilities',
        title: 'Address High-Priority Vulnerabilities',
        description: `Found ${this.results.summary.high} high-priority vulnerabilities.`,
        action: 'Review and address high-priority vulnerabilities within 7 days.'
      });
    }

    // Custom check recommendations
    const customChecks = this.results.scans.custom_checks?.checks || [];
    const failedChecks = customChecks.filter(check => !check.result?.passed);

    for (const check of failedChecks) {
      recommendations.push({
        priority: check.result?.severity || 'medium',
        category: 'security_best_practices',
        title: `Fix ${check.name.replace(/_/g, ' ')}`,
        description: `Security check failed: ${check.name}`,
        action: `Review and implement proper ${check.name.replace(/_/g, ' ')} measures.`
      });
    }

    this.results.recommendations = recommendations;
  }

  async generate_report() {
    this.generate_recommendations();

    const reportPath = path.join(this.config.outputDir, `security-audit-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    // Generate HTML report if requested
    if (this.config.format === 'html' || this.config.format === 'both') {
      await this.generate_html_report();
    }

    return reportPath;
  }

  async generate_html_report() {
    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title>CertNode Security Audit Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #e9ecef; padding: 15px; border-radius: 5px; text-align: center; }
        .critical { background: #dc3545; color: white; }
        .high { background: #fd7e14; color: white; }
        .medium { background: #ffc107; }
        .low { background: #28a745; color: white; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #dee2e6; border-radius: 5px; }
        .recommendation { margin: 10px 0; padding: 10px; background: #f8f9fa; border-left: 4px solid #007bff; }
    </style>
</head>
<body>
    <div class="header">
        <h1>CertNode Security Audit Report</h1>
        <p>Generated: ${this.results.timestamp}</p>
    </div>

    <div class="summary">
        <div class="metric critical">
            <h3>${this.results.summary.critical}</h3>
            <p>Critical</p>
        </div>
        <div class="metric high">
            <h3>${this.results.summary.high}</h3>
            <p>High</p>
        </div>
        <div class="metric medium">
            <h3>${this.results.summary.medium}</h3>
            <p>Medium</p>
        </div>
        <div class="metric low">
            <h3>${this.results.summary.low}</h3>
            <p>Low</p>
        </div>
    </div>

    <div class="section">
        <h2>Recommendations</h2>
        ${this.results.recommendations.map(rec => `
            <div class="recommendation ${rec.priority}">
                <h4>${rec.title}</h4>
                <p>${rec.description}</p>
                <strong>Action:</strong> ${rec.action}
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>Scan Results</h2>
        <pre>${JSON.stringify(this.results.scans, null, 2)}</pre>
    </div>
</body>
</html>`;

    const htmlPath = path.join(this.config.outputDir, `security-audit-${Date.now()}.html`);
    fs.writeFileSync(htmlPath, htmlTemplate);
    return htmlPath;
  }

  async run_full_audit() {
    this.log('Starting comprehensive security audit...');

    const scans = [
      this.npm_audit(),
      this.snyk_scan(),
      this.trivy_scan(),
      this.semgrep_scan(),
      this.custom_security_checks()
    ];

    await Promise.allSettled(scans);

    const reportPath = await this.generate_report();

    this.log(`Security audit completed. Report generated: ${reportPath}`);

    // Exit with non-zero code if critical vulnerabilities found
    if (this.results.summary.critical > 0) {
      process.exit(1);
    }

    return this.results;
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    format: args.includes('--html') ? 'html' : 'json',
    severity: args.find(arg => arg.startsWith('--severity='))?.split('=')[1] || 'medium'
  };

  const auditor = new SecurityAuditor(options);
  auditor.run_full_audit().catch(error => {
    console.error('Security audit failed:', error.message);
    process.exit(1);
  });
}

module.exports = SecurityAuditor;