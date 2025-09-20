#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['.git','node_modules','sdk/rust/target']);

function walk(dir, cb){
  for (const e of fs.readdirSync(dir, { withFileTypes: true })){
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, cb); else cb(p);
  }
}

let changed = 0;
walk(ROOT, (file) => {
  try {
    const buf = fs.readFileSync(file);
    if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
      const out = buf.slice(3);
      fs.writeFileSync(file, out);
      console.log('Stripped BOM:', path.relative(ROOT, file));
      changed++;
    }
  } catch {}
});

console.log(`Done. Files changed: ${changed}`);
