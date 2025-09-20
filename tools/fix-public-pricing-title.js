#!/usr/bin/env node
const fs = require('fs');
const p = 'public/pricing/index.html';
if (!fs.existsSync(p)) process.exit(0);
let s = fs.readFileSync(p,'utf8');
s = s.replace(/<title[\s\S]*?<\/title>/i, '<title>Pricing — CertNode</title>');
fs.writeFileSync(p, s);
console.log('Fixed public pricing title');