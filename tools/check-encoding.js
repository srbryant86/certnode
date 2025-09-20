#!/usr/bin/env node
/* Simple repository hygiene check: UTF-8, no replacement chars, no zero-length assets */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const TEXT_EXT = new Set(['.html','.htm','.css','.js','.mjs','.cjs','.ts','.tsx','.json','.md','.yml','.yaml','.toml','.rs','.go','.py','.ps1','.sh','.txt','.ini','.conf']);
const SKIP_DIRS = new Set(['node_modules','.git','sdk/rust/target']);
const ZERO_LEN_DIRS = [ 'web/assets', 'assets' ];

let hadError = false;

function isTextFile(p) {
  const ext = path.extname(p).toLowerCase();
  return TEXT_EXT.has(ext);
}

function walk(dir, cb) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, cb);
    else cb(full);
  }
}

// Check for replacement char or BOM in text files
walk(ROOT, (file) => {
  if (!isTextFile(file)) return;
  try {
    const buf = fs.readFileSync(file);
    // UTF-8 BOM check
    if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
      console.error(`BOM found: ${path.relative(ROOT, file)}`);
      hadError = true;
    }
    const text = buf.toString('utf8');
    // Detect U+FFFD replacement char without embedding it in this file
    const hasReplacement = [...text].some(ch => ch.charCodeAt(0) === 0xFFFD);
    if (hasReplacement) {
      console.error(`Encoding artifact found: ${path.relative(ROOT, file)}`);
      hadError = true;
    }
  } catch {}
});

// Check zero-length assets
for (const d of ZERO_LEN_DIRS) {
  const dir = path.join(ROOT, d);
  if (!fs.existsSync(dir)) continue;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const full = path.join(dir, entry.name);
    const st = fs.statSync(full);
    if (st.size === 0) {
      console.error(`Zero-length asset: ${path.relative(ROOT, full)}`);
      hadError = true;
    }
  }
}

if (hadError) {
  process.exit(1);
} else {
  console.log('Encoding/asset checks passed');
}
