#!/usr/bin/env node

const http = require('http');
const { spawn } = require('child_process');
const { createHash } = require('crypto');

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

// Base64URL encode
function b64u(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

// JCS canonicalization (simple implementation)
function canonicalize(value) {
  function stringifyCanonical(value) {
    if (value === null || typeof value === 'number' || typeof value === 'boolean') {
      return JSON.stringify(value);
    }
    if (typeof value === 'string') {
      return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
      const items = value.map((v) => stringifyCanonical(v));
      return '[' + items.join(',') + ']';
    }
    if (value !== null && typeof value === 'object') {
      const keys = Object.keys(value).sort();
      const parts = [];
      for (const k of keys) {
        const v = value[k];
        if (typeof v === 'undefined') continue;
        parts.push(JSON.stringify(k) + ':' + stringifyCanonical(v));
      }
      return '{' + parts.join(',') + '}';
    }
    return JSON.stringify(value);
  }
  return Buffer.from(stringifyCanonical(value), 'utf8');
}

async function smokeTest() {
  console.log('Smoke test starting...');
  
  // Kill any existing processes
  killStrayNodes();
  
  // Start server
  const serverProcess = spawn('node', ['api/src/index.js'], {
    stdio: 'pipe'
  });
  
  let serverReady = false;
  
  serverProcess.stdout.on('data', (data) => {
    if (data.toString().includes('Server on') || data.toString().includes('listening')) {
      serverReady = true;
    }
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error('Server stderr:', data.toString());
  });
  
  // Wait for server to be ready (max 3 seconds)
  await new Promise(resolve => {
    const checkReady = () => {
      if (serverReady) {
        resolve();
      } else {
        setTimeout(checkReady, 100);
      }
    };
    checkReady();
    
    // Fallback timeout
    setTimeout(resolve, 3000);
  });
  
  try {
    // Test payload
    const payload = { hello: 'world', timestamp: Date.now() };
    const postData = JSON.stringify({ payload });
    
    // Make request
    const result = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port: 3000,
        path: '/v1/sign',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            resolve({ status: res.statusCode, data: parsed, headers: res.headers });
          } catch (e) {
            reject(new Error(`Failed to parse response: ${responseData}`));
          }
        });
      });
      
      req.on('error', (err) => {
        reject(err);
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.write(postData);
      req.end();
    });
    
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}: ${JSON.stringify(result.data)}`);
    }
    
    const receipt = result.data;
    
    // Verify receipt structure
    if (!receipt.protected || !receipt.signature || !receipt.payload || !receipt.kid || !receipt.receipt_id) {
      throw new Error(`Missing receipt fields: ${JSON.stringify(Object.keys(receipt))}`);
    }
    
    // Verify receipt_id computation
    const jcsBytes = canonicalize(receipt.payload);
    const payloadB64 = b64u(jcsBytes);
    const fullReceipt = `${receipt.protected}.${payloadB64}.${receipt.signature}`;
    const expectedReceiptId = b64u(createHash('sha256').update(fullReceipt, 'utf8').digest());
    
    if (receipt.receipt_id !== expectedReceiptId) {
      throw new Error(`Receipt ID mismatch: expected ${expectedReceiptId}, got ${receipt.receipt_id}`);
    }
    
    console.log('RECEIPT OK');
    process.exit(0);
    
  } catch (error) {
    console.error('Smoke test failed:', error.message);
    process.exit(1);
  } finally {
    // Clean up server
    try {
      serverProcess.kill('SIGTERM');
      setTimeout(() => {
        serverProcess.kill('SIGKILL');
      }, 1000);
    } catch (e) {
      // Ignore cleanup errors
    }
    
    // Kill any remaining processes
    killStrayNodes();
  }
}

smokeTest();