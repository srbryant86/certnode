#!/usr/bin/env node
const fs = require('fs');
function rep(file, edits){
  let s = fs.readFileSync(file, 'utf8');
  for (const [pattern, replace] of edits){
    s = s.replace(pattern, replace);
  }
  fs.writeFileSync(file, s);
  console.log('Updated:', file);
}
// verify.html refactor
{
  const file = 'web/verify.html';
  if (fs.existsSync(file)){
    const edits = [
      [/<title>[\s\S]*?<\/title>/i, '<title>Receipt Validator — CertNode</title>'],
      [/<meta\s+property=\"og:title\"[\s\S]*?>/i, '<meta property="og:title" content="Receipt Validator — CertNode" />'],
      [/<meta\s+name=\"twitter:title\"[\s\S]*?>/i, '<meta name="twitter:title" content="Receipt Validator — CertNode" />'],
      [/<style>[\s\S]*?<\/style>/i, ''],
      [/<section class=\"verify-hero\">[\s\S]*?<\/section>/i, '<section class="section section--hero">\n  <div class="container text-center">\n    <h1 class="mb-2">Receipt Validator<\/h1>\n    <p class="mb-0" style="color: rgba(255,255,255,0.9)">Paste or drop a receipt and a JWKS to verify authenticity with WebCrypto (ES256\/EdDSA over JWS\/JCS).<\/p>\n  <\/div>\n<\/section>'],
      [/class=\"container\"\s+style=\"padding:\s*2rem\s*0;\"/i, 'class="container section"'],
      [/\<div\s+style=\"background:[\s\S]*?margin-bottom:\s*32px;\"\>\s*<h3[\s\S]*?<\/div>/i, '<div class="notice notice--info mb-6">\n  <h3 class="mb-2" style="color: var(--primary); font-size: var(--font-size-xl);">How to Use the Validator<\/h3>\n  <ol class="mb-0" style="padding-left: 20px; color: var(--text-primary); line-height: 1.6;">\n    <li>Load your receipt JSON file (contains protected, payload, signature, kid fields)<\/li>\n    <li>Load the corresponding JWKS file (contains the public key for verification)<\/li>\n    <li>Click \"Verify Receipt\" to validate the cryptographic signature<\/li>\n  <\/ol>\n  <p class="mb-0" style="margin-top: var(--space-3); color: var(--text-tertiary); font-size: var(--font-size-sm);">\n    <strong>Need test data?<\/strong> Use the \"Load Sample\" buttons below to try with example files.\n  <\/p>\n<\/div>']
    ];
    rep(file, edits);
  }
}