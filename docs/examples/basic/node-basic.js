#!/usr/bin/env node

/**
 * CertNode Basic Node.js Example
 *
 * This example demonstrates basic receipt verification using the CertNode SDK
 * in a Node.js environment. Perfect for command-line tools, scripts, and
 * server-side applications.
 *
 * Features demonstrated:
 * - Basic receipt verification
 * - JWKS fetching and caching
 * - Error handling and logging
 * - Environment configuration
 * - Command-line interface
 */

const { verifyReceipt, JWKSManager } = require('@certnode/sdk');
const https = require('https');

// Configuration from environment variables
const config = {
  apiUrl: process.env.CERTNODE_API_URL || 'https://api.certnode.io',
  jwksUrl: process.env.CERTNODE_JWKS_URL || 'https://api.certnode.io/.well-known/jwks.json',
  verbose: process.env.VERBOSE === 'true'
};

/**
 * Logger utility with different levels
 */
const logger = {
  info: (message, ...args) => {
    console.log(`ℹ️  ${message}`, ...args);
  },
  success: (message, ...args) => {
    console.log(`✅ ${message}`, ...args);
  },
  error: (message, ...args) => {
    console.error(`❌ ${message}`, ...args);
  },
  warn: (message, ...args) => {
    console.warn(`⚠️  ${message}`, ...args);
  },
  debug: (message, ...args) => {
    if (config.verbose) {
      console.log(`🐛 ${message}`, ...args);
    }
  }
};

/**
 * Initialize JWKS manager with caching
 */
const jwksManager = new JWKSManager({
  ttlMs: 300000, // 5 minutes cache
  fetcher: async (url, headers) => {
    logger.debug('Fetching JWKS from:', url);

    return new Promise((resolve, reject) => {
      const req = https.request(url, { headers }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }
});

/**
 * Verify a single receipt
 */
async function verifySingleReceipt(receipt, jwks = null) {
  try {
    logger.info('Starting receipt verification...');
    logger.debug('Receipt kid:', receipt.kid);

    // Get JWKS if not provided
    if (!jwks) {
      logger.info('Fetching JWKS from configured endpoint...');
      jwks = await jwksManager.fetchFromUrl(config.jwksUrl);
      logger.success(`JWKS fetched successfully (${jwks.keys.length} keys)`);
    }

    // Perform verification
    const startTime = Date.now();
    const result = await verifyReceipt({ receipt, jwks });
    const duration = Date.now() - startTime;

    // Log results
    if (result.ok) {
      logger.success(`Receipt verified successfully in ${duration}ms`);
      logger.info('Receipt is authentic and tamper-evident');
    } else {
      logger.error(`Receipt verification failed: ${result.reason}`);
    }

    return result;

  } catch (error) {
    logger.error('Verification error:', error.message);
    throw error;
  }
}

/**
 * Verify multiple receipts in batch
 */
async function verifyBatchReceipts(receipts, jwks = null) {
  logger.info(`Starting batch verification of ${receipts.length} receipts...`);

  // Get JWKS once for all receipts
  if (!jwks) {
    jwks = await jwksManager.fetchFromUrl(config.jwksUrl);
  }

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < receipts.length; i++) {
    const receipt = receipts[i];
    logger.debug(`Verifying receipt ${i + 1}/${receipts.length}: ${receipt.kid}`);

    try {
      const result = await verifyReceipt({ receipt, jwks });
      results.push({ index: i, receipt: receipt.kid, ...result });
    } catch (error) {
      results.push({
        index: i,
        receipt: receipt.kid,
        ok: false,
        reason: error.message
      });
    }
  }

  const duration = Date.now() - startTime;
  const validCount = results.filter(r => r.ok).length;
  const invalidCount = results.length - validCount;

  logger.success(`Batch verification completed in ${duration}ms`);
  logger.info(`Valid: ${validCount}, Invalid: ${invalidCount}, Total: ${results.length}`);

  return results;
}

/**
 * Generate example receipt data for testing
 */
function generateExampleReceipt() {
  return {
    protected: "eyJhbGciOiJFUzI1NiIsImtpZCI6ImVzMjU2LWtleSJ9",
    payload: {
      document_id: `DOC-${Date.now()}`,
      content: "Example document content for testing",
      timestamp: new Date().toISOString(),
      user_id: "user-12345",
      action: "create"
    },
    signature: "MEUCIQDKxF8cF6GGXr7j8Z_example_signature_data_here_replace_with_real",
    kid: "es256-key",
    receipt_id: `receipt-${Date.now()}`
  };
}

/**
 * Generate example JWKS for testing
 */
function generateExampleJWKS() {
  return {
    keys: [{
      kty: "EC",
      crv: "P-256",
      x: "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
      y: "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
      kid: "es256-key",
      alg: "ES256"
    }]
  };
}

/**
 * Command-line interface
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'verify':
        // Verify a receipt from file or stdin
        if (args[1]) {
          const fs = require('fs');
          const receiptData = JSON.parse(fs.readFileSync(args[1], 'utf8'));
          const jwksData = args[2] ? JSON.parse(fs.readFileSync(args[2], 'utf8')) : null;
          await verifySingleReceipt(receiptData, jwksData);
        } else {
          logger.error('Usage: node node-basic.js verify <receipt-file> [jwks-file]');
          process.exit(1);
        }
        break;

      case 'batch':
        // Verify multiple receipts from file
        if (args[1]) {
          const fs = require('fs');
          const receiptsData = JSON.parse(fs.readFileSync(args[1], 'utf8'));
          const jwksData = args[2] ? JSON.parse(fs.readFileSync(args[2], 'utf8')) : null;
          const results = await verifyBatchReceipts(receiptsData, jwksData);

          // Output results as JSON
          console.log(JSON.stringify(results, null, 2));
        } else {
          logger.error('Usage: node node-basic.js batch <receipts-file> [jwks-file]');
          process.exit(1);
        }
        break;

      case 'example':
        // Run example verification
        logger.info('Running example verification with test data...');
        const exampleReceipt = generateExampleReceipt();
        const exampleJWKS = generateExampleJWKS();

        logger.debug('Example receipt:', JSON.stringify(exampleReceipt, null, 2));
        await verifySingleReceipt(exampleReceipt, exampleJWKS);
        break;

      case 'jwks':
        // Fetch and display JWKS
        logger.info('Fetching JWKS from configured endpoint...');
        const jwks = await jwksManager.fetchFromUrl(config.jwksUrl);
        console.log(JSON.stringify(jwks, null, 2));

        // Show thumbprints
        const thumbprints = jwksManager.thumbprints(jwks);
        logger.info('Key thumbprints:', thumbprints);
        break;

      case 'config':
        // Show current configuration
        logger.info('Current configuration:');
        console.log(JSON.stringify(config, null, 2));
        break;

      default:
        // Show help
        console.log(`
CertNode Basic Node.js Example

Usage:
  node node-basic.js <command> [options]

Commands:
  verify <receipt-file> [jwks-file]  Verify a single receipt
  batch <receipts-file> [jwks-file]  Verify multiple receipts
  example                            Run example verification
  jwks                              Fetch and display JWKS
  config                            Show current configuration

Environment Variables:
  CERTNODE_API_URL     API base URL (default: https://api.certnode.io)
  CERTNODE_JWKS_URL    JWKS endpoint URL
  VERBOSE              Enable debug logging (true/false)

Examples:
  node node-basic.js example
  node node-basic.js verify receipt.json
  node node-basic.js batch receipts.json jwks.json
  VERBOSE=true node node-basic.js verify receipt.json

For more information, visit: https://certnode.io/docs
        `);
        break;
    }

  } catch (error) {
    logger.error('Command failed:', error.message);
    if (config.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    logger.error('Unexpected error:', error.message);
    process.exit(1);
  });
}

// Export functions for use as a module
module.exports = {
  verifySingleReceipt,
  verifyBatchReceipts,
  generateExampleReceipt,
  generateExampleJWKS,
  logger,
  config
};