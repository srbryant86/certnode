#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const p = path.join(process.cwd(), 'sdk', 'web', 'dist', 'index.esm.min.js');
try {
  const buf = fs.readFileSync(p);
  const bytes = buf.length;
  const kb = (bytes / 1024).toFixed(2);
  console.log(`sdk/web/dist/index.esm.min.js size: ${bytes} bytes (${kb} KB)`);
  process.exit(0);
} catch (e) {
  console.error('Size check failed:', e.message);
  process.exit(1);
}

