#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function replaceTitle(html, newTitle){
  return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${newTitle}</title>`);
}

function cleanStatus(html){
  let s = replaceTitle(html, 'Status — CertNode');
  s = s.replace(/<span style="color:#0a0">[\s\S]*?<\/span>/g, '<span style="color:#0a0">OK</span>');
  s = s.replace(/Full compliance[^<]*/g, 'Full compliance');
  // replace odd separators with bullet
  s = s.replace(/[\uFFFD]+/g, '');
  return s;
}

const targets = [
  { file: 'public/status/index.html', fn: cleanStatus },
  { file: 'public/trust/index.fixed.html', fn: (s) => replaceTitle(s, 'Trust Center — CertNode Standards') },
  { file: 'public/trust/index.html', fn: (s) => replaceTitle(s, 'Trust Center — CertNode Standards') },
];

for (const {file, fn} of targets){
  if (!fs.existsSync(file)) continue;
  let s = fs.readFileSync(file, 'utf8');
  s = fn(s);
  fs.writeFileSync(file, s);
  console.log('Polished:', file);
}