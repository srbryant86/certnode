#!/usr/bin/env node
const fs = require('fs');
const p = 'web/pricing.html';
if (!fs.existsSync(p)) process.exit(0);
let s = fs.readFileSync(p,'utf8');
if (!/Pricing — CertNode/.test(s)){
  s = s.replace(/<title[\s\S]*?<\/title>/i, (m)=> m + '\n  <title>Pricing — CertNode</title>');
  fs.writeFileSync(p,s);
  console.log('Appended corrected title in', p);
} else {
  console.log('Pricing title already contains correct string');
}