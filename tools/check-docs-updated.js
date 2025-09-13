#!/usr/bin/env node

// Fails PRs when code changes are made without updating docs.
// Usage: BASE_REF=origin/main node tools/check-docs-updated.js

const { execSync } = require('child_process');

function sh(cmd) { return execSync(cmd, { encoding: 'utf8' }).trim(); }
function listChanged(baseRef) {
  try { sh(`git fetch --no-tags --prune --depth=50 origin +refs/heads/*:refs/remotes/origin/*`); } catch {}
  const base = baseRef || 'origin/main';
  const mergeBase = sh(`git merge-base HEAD ${base}`);
  const out = sh(`git diff --name-only --diff-filter=ACMR ${mergeBase}..HEAD`);
  return out.split('\n').filter(Boolean);
}

const baseRef = process.env.BASE_REF || 'origin/main';
const changed = listChanged(baseRef);

if (!changed.length) {
  console.log('No changes detected.');
  process.exit(0);
}

const codePatterns = [
  /^api\/src\//,
  /^sdk\//,
  /^web\//,
  /^tools\//,
];
const docPatterns = [
  /^README\.md$/,
  /^AGENTS\.md$/,
  /^docs\//,
  /^web\/openapi\.json$/,
];

const isCode = (f) => codePatterns.some((re) => re.test(f)) && !/^docs\//.test(f);
const isDoc  = (f) => docPatterns.some((re) => re.test(f));

const codeChanged = changed.filter(isCode);
const docChanged  = changed.filter(isDoc);

if (codeChanged.length && docChanged.length === 0) {
  console.error('Docs gate: Code changed without docs updates.');
  console.error('Changed code files:\n - ' + codeChanged.join('\n - '));
  console.error('Please update relevant docs (README.md, AGENTS.md, docs/internal/*, web/openapi.json) and push again.');
  process.exit(1);
}

console.log('Docs gate OK');
process.exit(0);

