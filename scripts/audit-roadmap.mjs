#!/usr/bin/env node
const fs = require('fs'); const p = require('path'); const root = process.cwd();
const ex = f=>fs.existsSync(f); const rd=f=>{try{return fs.readFileSync(f,'utf8')}catch{ return ''}};
const has=(f,re)=>{const s=rd(f); return s && new RegExp(re,'m').test(s)};

const tasks=[
 {id:'a1',d:'Receipts-by-default',f:['api/src/routes/sign.js'],ok:()=>ex('api/src/routes/sign.js')&&has('api/src/routes/sign.js','receipt_id')},
 {id:'a2',d:'Crypto utils',f:['api/src/util/jcs.js','api/src/util/derToJose.js','api/src/util/kid.js'],ok:()=>['api/src/util/jcs.js','api/src/util/derToJose.js','api/src/util/kid.js'].every(ex)},
 {id:'a3',d:'KMS RAW + resilience',f:['api/src/aws/kms.js'],ok:()=>ex('api/src/aws/kms.js')},
 {id:'a4',d:'Env & startup guards',f:['api/src/config/env.js'],ok:()=>ex('api/src/config/env.js')&&has('api/src/config/env.js','validate')},
 {id:'a5',d:'Logging/metrics base',f:['api/src/plugins/logging.js','api/src/plugins/metrics.js'],ok:()=>ex('api/src/plugins/logging.js')||ex('api/src/plugins/metrics.js')},
 {id:'a6',d:'Dev verify route',f:['api/src/routes/verify.js'],ok:()=>ex('api/src/routes/verify.js')},
 {id:'a7',d:'Security headers',f:['api/src/plugins/security.js'],ok:()=>ex('api/src/plugins/security.js')&&has('api/src/plugins/security.js','X-Content-Type-Options')},
 {id:'a8',d:'Validation middleware',f:['api/src/plugins/validation.js'],ok:()=>ex('api/src/plugins/validation.js')},
 {id:'a9',d:'Smoke scripts',f:['api/scripts/smoke.sh','api/scripts/smoke.ps1'],ok:()=>ex('api/scripts/smoke.sh')||ex('api/scripts/smoke.ps1')},
 {id:'a10',d:'Rate limit v1',f:['api/src/plugins/ratelimit.js'],ok:()=>ex('api/src/plugins/ratelimit.js')},
 {id:'a11',d:'Rate limit v2 tests',f:['api/test/ratelimit.unit.test.js'],ok:()=>ex('api/test/ratelimit.unit.test.js')},
 {id:'a12',d:'JWKS tooling',f:['api/scripts/jwks-make-manifest.js'],ok:()=>ex('api/scripts/jwks-make-manifest.js')},
 {id:'a13',d:'Node SDK',f:['api/test/verify.sdk.node.test.js'],ok:()=>ex('api/test/verify.sdk.node.test.js')},
 {id:'a14',d:'CORS hardening',f:['api/src/plugins/cors.js'],ok:()=>ex('api/src/plugins/cors.js')},
 {id:'a15',d:'Structured error model',f:['api/src/plugins/errors.js'],ok:()=>ex('api/src/plugins/errors.js')},
 {id:'a16',d:'Offline CLI',f:['tools/verify-receipt.js'],ok:()=>ex('tools/verify-receipt.js')},
 {id:'a17',d:'OpenAPI+pitch',f:['web/openapi.json','web/pitch.html'],ok:()=>ex('web/openapi.json')&&ex('web/pitch.html')},
 {id:'a18',d:'Enhanced errors/breaker',f:['api/src/plugins/errors.js','api/src/aws/kms.js'],ok:()=>ex('api/src/plugins/errors.js')&&ex('api/src/aws/kms.js')},
 {id:'a19',d:'Offline web verifier',f:['web/verify_offline.html','web/js/verify_offline.js','web/verify.html'],ok:()=>['web/verify_offline.html','web/js/verify_offline.js','web/verify.html'].some(ex)},
 {id:'a20',d:'TSA plumbing (mock)',f:['api/src/util/timestamp.js'],ok:()=>ex('api/src/util/timestamp.js')}
];

function row(cols){return '| '+cols.join(' | ')+' |'}
const out=['# Roadmap Audit','',row(['Task','Description','Key file','Status']),row(['---:','---','---','---'])];
const missing=[];

for(const t of tasks){
  const ok=t.ok(); out.push(row([t.id,t.d,t.f[0]||'', ok?'✅':'❌'])); if(!ok) missing.push(t.id);
}
console.log(out.join('\n')); console.log('\nMissing:', missing.length?missing.join(', '):'none');