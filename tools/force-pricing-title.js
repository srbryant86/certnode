#!/usr/bin/env node
const fs = require('fs');
const p = 'web/pricing.html';
if (!fs.existsSync(p)) process.exit(0);
let s = fs.readFileSync(p,'utf8');
// Remove all existing <title> tags
s = s.replace(/<title[\s\S]*?<\/title>/ig, '');
// Insert a new title before first <style> or before </head>
if (/<style/i.test(s)) {
  s = s.replace(/<style/i, '<title>Pricing — CertNode</title>\n  <style');
} else {
  s = s.replace(/<\/head>/i, '  <title>Pricing — CertNode</title>\n</head>');
}
fs.writeFileSync(p, s);
console.log('Forced new title in', p);