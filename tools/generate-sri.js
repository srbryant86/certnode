#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const file = path.join(process.cwd(), 'sdk', 'web', 'dist', 'index.esm.min.js');
if (!fs.existsSync(file)) {
  console.error('File not found:', file, '\nRun: npm run build:web-sdk first');
  process.exit(1);
}

const buf = fs.readFileSync(file);
const hash = crypto.createHash('sha384').update(buf).digest('base64');
const sri = `sha384-${hash}`;
console.log('SRI (sha384):', sri);
console.log('\nExample:');
console.log(`<script type="module" integrity="${sri}" crossorigin="anonymous" src="https://cdn.jsdelivr.net/npm/@certnode/sdk-web@${process.env.SDK_WEB_VERSION || 'X.Y.Z'}/dist/index.esm.min.js"></script>`);

