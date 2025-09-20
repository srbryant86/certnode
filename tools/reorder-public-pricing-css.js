#!/usr/bin/env node
const fs = require('fs');
const p = 'public/pricing/index.html';
let s = fs.readFileSync(p,'utf8');
// Remove any site.css link
s = s.replace(/\n\s*<link[^>]*href=["']\/web\/assets\/site\.css["'][^>]*>\s*/i, '\n');
// Insert after /css/style.css
s = s.replace(/(<link[^>]*href=["']\/css\/style\.css["'][^>]*>)/i, `$1\n    <link rel="stylesheet" href="/web/assets/site.css" />`);
fs.writeFileSync(p, s);
console.log('Reordered CSS links in', p);