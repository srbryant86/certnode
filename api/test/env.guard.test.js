const assert=require('assert');
process.env.PORT='3001'; process.env.MAX_BODY_BYTES='204800'; process.env.RATE_LIMIT_RPM='200';
process.env.API_ALLOWED_ORIGINS='https://a.com,https://b.com';
const {cfg}=require('../src/config/env');
assert.strictEqual(cfg.PORT,3001); assert.strictEqual(cfg.MAX_BODY_BYTES,204800); assert.strictEqual(cfg.RATE_LIMIT_RPM,200);
assert.deepStrictEqual(cfg.API_ALLOWED_ORIGINS,['https://a.com','https://b.com']);
console.log('env.guard ok');