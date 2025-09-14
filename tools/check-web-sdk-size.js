#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'sdk', 'web', 'dist', 'index.esm.min.js');
const maxBytes = parseInt(process.env.WEB_SDK_MAX_BYTES || '10240', 10);

try {
  const buf = fs.readFileSync(file);
  const bytes = buf.length;
  const kb = (bytes / 1024).toFixed(2);
  console.log(`web-sdk bundle size: ${bytes} bytes (${kb} KB), limit: ${maxBytes} bytes`);
  if (bytes > maxBytes) {
    console.error(`Size budget exceeded by ${bytes - maxBytes} bytes`);
    process.exit(1);
  }
  process.exit(0);
} catch (e) {
  console.error('Size check failed:', e.message);
  process.exit(1);
}

