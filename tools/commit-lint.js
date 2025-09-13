#!/usr/bin/env node

// Lints the latest commit subject against the taxonomy and conventional pattern.
// Usage: node tools/commit-lint.js [--strict]

const { execSync } = require('child_process');

function sh(cmd) { return execSync(cmd, { encoding: 'utf8' }).trim(); }

const subject = sh('git log -1 --pretty=%s');
const strict = process.argv.includes('--strict');

// Allowed types and label letters
const types = ['feat','fix','docs','chore','test','ci','refactor','style','perf'];
const labelLetters = ['a','i','w','d','s','t','c','m','r','e','g'];

const ccRe = new RegExp(`^(${types.join('|')})(?:\\(([^)]+)\\))?:\\s+.+$`);
const m = subject.match(ccRe);

let ok = true;
let warnings = [];

if (!m) {
  ok = !strict; // allow pass in non-strict mode
  warnings.push(`Subject does not match Conventional Commits: "${subject}"`);
} else {
  const scope = m[2] || '';
  if (scope) {
    // Validate labels if present, allow multiple separated by commas
    const labels = scope.split(',').map(s => s.trim());
    for (const lab of labels) {
      const mm = lab.match(/^([a-z])(\d{1,3})$/);
      if (!mm) {
        // Allow non-taxonomy scopes for now
        continue;
      }
      if (!labelLetters.includes(mm[1])) {
        warnings.push(`Unknown taxonomy label: ${lab}`);
        ok = !strict;
      }
    }
  } else {
    warnings.push('No scope provided. Consider adding a taxonomy label (e.g., a24).');
    ok = !strict;
  }
}

if (warnings.length) {
  console.log('Commit Lint Warnings:');
  for (const w of warnings) console.log(' -', w);
}

process.exit(ok ? 0 : 1);

