#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Kill any stray node.exe processes on Windows
function killStrayNodes() {
  if (process.platform === 'win32') {
    try {
      require('child_process').execSync('taskkill /IM node.exe /F', { stdio: 'ignore' });
    } catch (e) {
      // Ignore if no processes to kill
    }
  }
}

// Test files to run (only if they exist)
const testFiles = [
  'api/test/jcs.test.js',
  'api/test/validation.test.js', 
  'api/test/validation.sign.test.js',
  'api/test/ratelimit.unit.test.js',
  'api/test/routes.sign.test.js',
  'api/test/verify.cli.test.js',
  'api/test/health.test.js',
  'api/test/errors.test.js',
  'api/test/request-id.test.js',
  'api/test/payload-size.test.js'
];

async function runTest(testFile) {
  return new Promise((resolve) => {
    if (!fs.existsSync(testFile)) {
      console.log(`SKIP ${testFile} (not found)`);
      resolve({ file: testFile, result: 'SKIP' });
      return;
    }

    console.log(`Running ${testFile}...`);
    const child = spawn('node', [testFile], {
      stdio: 'pipe',
      timeout: 15000
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      const result = code === 0 ? 'PASS' : 'FAIL';
      console.log(`${result} ${testFile}`);
      
      if (code !== 0) {
        console.log(`  ERROR: ${stderr.split('\n')[0] || stdout.split('\n').find(line => line.includes('Error')) || 'Unknown error'}`);
      }
      
      resolve({ file: testFile, result, code, stdout, stderr });
    });

    child.on('error', (error) => {
      console.log(`FAIL ${testFile} (spawn error: ${error.message})`);
      resolve({ file: testFile, result: 'FAIL', error: error.message });
    });

    // Timeout handling
    setTimeout(() => {
      child.kill('SIGKILL');
      console.log(`FAIL ${testFile} (timeout)`);
      resolve({ file: testFile, result: 'FAIL', error: 'timeout' });
    }, 15000);
  });
}

async function main() {
  console.log('Fast Test Runner - Starting');
  console.log('===============================');
  
  // Kill stray processes before starting
  killStrayNodes();
  
  const results = [];
  
  for (const testFile of testFiles) {
    const result = await runTest(testFile);
    results.push(result);
  }
  
  // Kill stray processes after all tests
  killStrayNodes();
  
  console.log('\n===============================');
  console.log('Test Summary:');
  
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  
  results.forEach(r => {
    if (r.result === 'PASS') passed++;
    else if (r.result === 'FAIL') failed++;
    else if (r.result === 'SKIP') skipped++;
  });
  
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`SKIPPED: ${skipped}`);
  
  if (failed === 0) {
    console.log('ALL PASSED');
    process.exit(0);
  } else {
    console.log('SOME FAILED');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});