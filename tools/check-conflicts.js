#!/usr/bin/env node
// Fail if merge conflict markers exist in tracked files
const { execSync } = require('node:child_process');
const pat = /^(<<<<<<<|=======|>>>>>>>) /m;
const files = execSync('git ls-files', { encoding: 'utf8' }).trim().split('\n');
let bad = [];
for (const f of files) {
  const content = require('node:fs').readFileSync(f, 'utf8');
  if (pat.test(content)) bad.push(f);
}
if (bad.length) {
  console.error('Conflict markers found in:\n' + bad.join('\n'));
  process.exit(1);
} else {
  console.log('No conflict markers found.');
}

