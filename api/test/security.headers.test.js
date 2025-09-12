const assert=require('assert'); const {securityHeaders}=require('../src/plugins/security');
const req={headers:{}}; const res={_h:{}, setHeader:(k,v)=>res._h[k]=v};
process.env.NODE_ENV='development'; securityHeaders(req,res);
assert.strictEqual(res._h['X-Content-Type-Options'],'nosniff'); assert.strictEqual(res._h['Referrer-Policy'],'no-referrer');
assert.strictEqual(res._h['X-Frame-Options'],'SAMEORIGIN'); console.log('security.headers ok');