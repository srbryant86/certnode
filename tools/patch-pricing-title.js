#!/usr/bin/env node
const fs = require('fs');
const p = 'web/pricing.html';
let s = fs.readFileSync(p,'utf8');
const before = s;
// Normalize any corrupted title to the correct one
s = s.replace(/<title>[\s\S]*?<\/title>/i, '<title>Pricing — CertNode</title>');
if (s !== before) {
  fs.writeFileSync(p, s);
  console.log('Updated title in', p);
} else {
  console.log('No change to title (already correct?)');
}