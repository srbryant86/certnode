#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const files = [
  'web/verify.html',
  'web/trust.html',
  'web/pricing.html',
  'web/account.html'
];

function replaceTitle(html, newTitle){
  return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${newTitle}</title>`);
}

function setFooter(html){
  return html.replace(/&copy;[^<]*CertNode[\s\S]*?standard\./i, '&copy; 2025 CertNode — Universal receipt infrastructure standard.');
}

function replaceBodyFont(html){
  return html.replace(/font-family:[^;]*serif;?/i, "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', Arial, sans-serif;");
}

for (const f of files){
  if (!fs.existsSync(f)) continue;
  let s = fs.readFileSync(f, 'utf8');
  if (f.endsWith('verify.html')){
    s = replaceTitle(s, 'Receipt Validator — CertNode');
    s = setFooter(s);
    // add OG/Twitter meta if absent
    if (!/og:title/.test(s)){
      s = s.replace(/<link rel="canonical"[^>]*>\s*/i, (m) => m + `  <meta property="og:title" content="Receipt Validator — CertNode" />\n  <meta property=\"og:type\" content=\"website\" />\n  <meta property=\"og:url\" content=\"https://certnode.io/verify\" />\n  <meta property=\"og:description\" content=\"Verify CertNode receipts quickly in the browser.\" />\n  <meta name=\"twitter:card\" content=\"summary\" />\n  <meta name=\"twitter:title\" content=\"Receipt Validator — CertNode\" />\n  <meta name=\"twitter:description\" content=\"Verify CertNode receipts quickly in the browser.\" />\n`);
    }
  }
  if (f.endsWith('trust.html')){
    s = replaceTitle(s, 'Trust Center — CertNode');
    s = replaceBodyFont(s);
  }
  if (f.endsWith('pricing.html')){
    s = replaceTitle(s, 'Pricing — CertNode');
    s = replaceBodyFont(s);
  }
  if (f.endsWith('account.html')){
    s = replaceTitle(s, 'Research Platform Dashboard — CertNode');
  }
  fs.writeFileSync(f, s);
  console.log('Polished:', f);
}