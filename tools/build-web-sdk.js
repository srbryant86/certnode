#!/usr/bin/env node

// Build a minimal ESM bundle for sdk/web without external deps.
// Produces: sdk/web/dist/index.esm.min.js

const fs = require('fs');
const path = require('path');

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function stripComments(src) {
  // Remove /* */ comments (non-greedy) and // comments at line end; keep newlines for safety
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(/\r?\n/)
    .map((line) => line.replace(/(^|\s)\/\/.*$/, ''))
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .join('\n');
}

function build() {
  const root = process.cwd();
  const webDir = path.join(root, 'sdk', 'web');
  const distDir = path.join(webDir, 'dist');

  const index = read(path.join(webDir, 'index.js'));
  const mgr = read(path.join(webDir, 'jwks-manager.js'));

  // Create a single ESM file that exports verifyReceipt and JWKSManager
  let bundle = '';
  bundle += '// Minified ESM bundle (no external deps)\n';
  bundle += '// Source: sdk/web/index.js + sdk/web/jwks-manager.js\n';
  bundle += '\n';
  bundle += mgr + '\n\n';
  bundle += index + '\n';

  const min = stripComments(bundle);
  ensureDir(distDir);
  fs.writeFileSync(path.join(distDir, 'index.esm.min.js'), min, 'utf8');
  console.log('Wrote sdk/web/dist/index.esm.min.js (', Buffer.byteLength(min), 'bytes)');
}

build();

