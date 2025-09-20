#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const TEXT_EXT = new Set(['.html','.htm','.css','.js','.mjs','.cjs','.ts','.tsx','.json','.md','.yml','.yaml','.toml','.rs','.go','.py','.ps1','.sh','.txt','.ini','.conf']);
const SKIP_DIRS = new Set(['.git','node_modules','sdk/rust/target']);
const ROOT = process.cwd();
let changed = 0;
function walk(dir){
  for (const e of fs.readdirSync(dir, { withFileTypes: true })){
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else fix(p);
  }
}
function isText(p){ return TEXT_EXT.has(path.extname(p).toLowerCase()); }
function fix(file){
  if (!isText(file)) return;
  let buf;
  try { buf = fs.readFileSync(file); } catch { return; }
  const orig = buf.toString('utf8');
  const cleaned = [...orig].filter(ch => ch.charCodeAt(0) !== 0xFFFD).join('');
  if (cleaned !== orig) {
    fs.writeFileSync(file, cleaned);
    console.log('Removed U+FFFD:', path.relative(ROOT, file));
    changed++;
  }
}
walk(ROOT);
console.log('Total files cleaned:', changed);