#!/usr/bin/env node

// tools/verify-receipt.js - CLI tool to verify CertNode receipts
const fs = require('fs');
const { loadJwks, verifyReceiptWithJwks } = require('./verify-lib');

function usage() {
  console.error('Usage: node tools/verify-receipt.js --receipt <file> --jwks <file|url>');
  console.error('');
  console.error('Options:');
  console.error('  --receipt <file>    Path to receipt JSON file');
  console.error('  --jwks <file|url>   Path to JWKS file or HTTP(S) URL');
  console.error('');
  console.error('Exit codes:');
  console.error('  0  PASS - receipt is valid');
  console.error('  1  usage/error');
  console.error('  2  FAIL - receipt is invalid');
}

async function main() {
  const args = process.argv.slice(2);
  let receiptFile = null;
  let jwksSource = null;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--receipt' && i + 1 < args.length) {
      receiptFile = args[++i];
    } else if (args[i] === '--jwks' && i + 1 < args.length) {
      jwksSource = args[++i];
    } else if (args[i] === '--help' || args[i] === '-h') {
      usage();
      process.exit(1);
    } else {
      console.error(`Unknown argument: ${args[i]}`);
      usage();
      process.exit(1);
    }
  }

  if (!receiptFile || !jwksSource) {
    console.error('Missing required arguments');
    usage();
    process.exit(1);
  }

  try {
    // Load receipt
    let receipt;
    try {
      const receiptData = fs.readFileSync(receiptFile, 'utf8');
      receipt = JSON.parse(receiptData);
    } catch (e) {
      console.error(`FAIL: Cannot load receipt from ${receiptFile}: ${e.message}`);
      process.exit(2);
    }

    // Load JWKS
    let jwks;
    try {
      jwks = await loadJwks(jwksSource);
    } catch (e) {
      console.error(`FAIL: Cannot load JWKS from ${jwksSource}: ${e.message}`);
      process.exit(2);
    }

    // Verify receipt
    const isValid = verifyReceiptWithJwks(receipt, jwks);
    
    if (isValid) {
      console.log('PASS');
      process.exit(0);
    } else {
      console.log('FAIL: Signature verification failed');
      process.exit(2);
    }

  } catch (e) {
    console.log(`FAIL: ${e.message}`);
    process.exit(2);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.log(`FAIL: ${err.message}`);
  process.exit(2);
});

if (require.main === module) {
  main();
}

module.exports = { main };