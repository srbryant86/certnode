#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function ensureSiteCss(html){
  if (/web\/assets\/site\.css/.test(html)) return html;
  return html.replace(/<meta[^>]*viewport[^>]*>\s*/i, (m)=> m + '\n  <link rel="stylesheet" href="/web/assets/site.css" />\n');
}

function fixTitle(html){
  return html.replace(/<title>[\s\S]*?<\/title>/i, '<title>Pricing — CertNode</title>');
}

function process(file){
  if (!fs.existsSync(file)) return false;
  let s = fs.readFileSync(file,'utf8');
  const before = s;
  s = ensureSiteCss(s);
  s = fixTitle(s);
  if (s !== before){ fs.writeFileSync(file,s); console.log('Updated', file); return true; }
  console.log('No change', file); return false;
}

const changed = [process('web/pricing.html'), process('public/pricing/index.html')].some(Boolean);
process.exit(0);