#!/usr/bin/env node

// Quick check that required API paths exist in the OpenAPI document.
// Usage: node tools/check-openapi.js [path/to/openapi.json]

const fs = require('fs');
const path = require('path');

const specPath = process.argv[2] || path.join(__dirname, '../web/openapi.json');

let spec;
try { spec = JSON.parse(fs.readFileSync(specPath, 'utf8')); }
catch (e) { console.error('Failed to read OpenAPI spec:', e.message); process.exit(2); }

const required = [
  { path: '/v1/sign', method: 'post' }
];

function hasPath(p, m) {
  const paths = spec.paths || {};
  const entry = paths[p];
  if (!entry) return false;
  if (!m) return true;
  return !!entry[m];
}

const missing = [];
for (const r of required) {
  if (!hasPath(r.path, r.method)) missing.push(`${r.method || '*'} ${r.path}`);
}

if (missing.length) {
  console.error('OpenAPI missing required entries:', missing.join(', '));
  process.exit(1);
}

// Validate error component schemas
const comps = spec.components && spec.components.schemas;
const requiredSchemas = ['ErrorResponse', 'ValidationError', 'RateLimitError'];
const missingSchemas = requiredSchemas.filter(n => !comps || !comps[n]);
if (missingSchemas.length) {
  console.error('OpenAPI missing required schemas:', missingSchemas.join(', '));
  process.exit(1);
}

console.log('OpenAPI check OK');
process.exit(0);
