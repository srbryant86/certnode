const test = require('node:test');
const assert = require('node:assert');
const { Readable } = require('stream');

// Helper to create mock request with JSON body of specific size
function createMockReq(bodySize) {
  // Create JSON payload of approximately bodySize bytes
  const paddingSize = Math.max(0, bodySize - 30); // Account for JSON structure
  const padding = 'x'.repeat(paddingSize);
  const jsonBody = JSON.stringify({ payload: { hello: padding } });
  const actualSize = Buffer.byteLength(jsonBody, 'utf8');
  
  const chunks = [Buffer.from(jsonBody)];
  let chunkIndex = 0;
  
  const req = new Readable({
    read() {
      if (chunkIndex < chunks.length) {
        this.push(chunks[chunkIndex++]);
      } else {
        this.push(null);
      }
    }
  });
  
  req.headers = { 'content-type': 'application/json' };
  req._payloadSize = undefined;
  
  return { req, actualSize };
}

test('payload size warning but not cap', async () => {
  // Set environment variables before requiring the module
  const originalWarn = process.env.PAYLOAD_WARN_BYTES;
  const originalHard = process.env.PAYLOAD_HARD_BYTES;
  
  process.env.PAYLOAD_WARN_BYTES = '1024';
  process.env.PAYLOAD_HARD_BYTES = '4096';
  
  // Clear module cache to pick up new env vars
  delete require.cache[require.resolve('../src/config/env')];
  delete require.cache[require.resolve('../src/plugins/validation')];
  
  try {
    // Import after setting env vars
    const { readJsonLimited } = require('../src/plugins/validation');
    
    // Capture console.warn
    const originalConsoleWarn = console.warn;
    let warnMessage = null;
    console.warn = (msg) => {
      warnMessage = msg;
    };
    
    // Create request with ~1500 bytes (exceeds warn, under hard limit)
    const { req, actualSize } = createMockReq(1500);
    
    // Call readJsonLimited - should not throw
    const result = await readJsonLimited(req);
    
    // Restore console.warn
    console.warn = originalConsoleWarn;
    
    // Assertions
    assert(req._payloadSize !== undefined, 'req._payloadSize should be set');
    assert(req._payloadSize >= 1024, 'payload size should be >= warn threshold');
    assert(req._payloadSize < 4096, 'payload size should be < hard limit');
    assert(warnMessage !== null, 'warning should have been emitted');
    
    const parsedWarn = JSON.parse(warnMessage);
    assert.strictEqual(parsedWarn.event, 'payload_size_warning', 'warning should contain payload_size_warning event');
    assert.strictEqual(parsedWarn.warn, 1024, 'warning should contain warn threshold');
    assert(parsedWarn.size >= 1024, 'warning should contain actual size');
    
    console.log('✓ Warn threshold test passed');
    
  } finally {
    // Restore original environment
    if (originalWarn !== undefined) {
      process.env.PAYLOAD_WARN_BYTES = originalWarn;
    } else {
      delete process.env.PAYLOAD_WARN_BYTES;
    }
    
    if (originalHard !== undefined) {
      process.env.PAYLOAD_HARD_BYTES = originalHard;
    } else {
      delete process.env.PAYLOAD_HARD_BYTES;
    }
    
    // Clear cache again to reset
    delete require.cache[require.resolve('../src/config/env')];
    delete require.cache[require.resolve('../src/plugins/validation')];
  }
});

test('hard cap 413 error', async () => {
  // Set environment variables before requiring the module
  const originalWarn = process.env.PAYLOAD_WARN_BYTES;
  const originalHard = process.env.PAYLOAD_HARD_BYTES;
  
  process.env.PAYLOAD_WARN_BYTES = '1024';
  process.env.PAYLOAD_HARD_BYTES = '1200';
  
  // Clear module cache to pick up new env vars
  delete require.cache[require.resolve('../src/config/env')];
  delete require.cache[require.resolve('../src/plugins/validation')];
  
  try {
    // Import after setting env vars
    const { readJsonLimited } = require('../src/plugins/validation');
    
    // Create request with ~1500 bytes (exceeds hard limit)
    const { req } = createMockReq(1500);
    
    // Call readJsonLimited - should throw
    let threwError = false;
    let caughtError = null;
    
    try {
      await readJsonLimited(req);
    } catch (error) {
      threwError = true;
      caughtError = error;
    }
    
    // Assertions
    assert(threwError, 'readJsonLimited should have thrown an error');
    assert.strictEqual(caughtError.statusCode, 413, 'error should have 413 status code');
    assert(caughtError.details && caughtError.details.limit_exceeded === true, 'error should have limit_exceeded details');
    
    console.log('✓ Hard limit test passed');
    
  } finally {
    // Restore original environment
    if (originalWarn !== undefined) {
      process.env.PAYLOAD_WARN_BYTES = originalWarn;
    } else {
      delete process.env.PAYLOAD_WARN_BYTES;
    }
    
    if (originalHard !== undefined) {
      process.env.PAYLOAD_HARD_BYTES = originalHard;
    } else {
      delete process.env.PAYLOAD_HARD_BYTES;
    }
    
    // Clear cache again to reset
    delete require.cache[require.resolve('../src/config/env')];
    delete require.cache[require.resolve('../src/plugins/validation')];
  }
});

console.log('All payload size tests completed');