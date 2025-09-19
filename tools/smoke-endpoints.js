#!/usr/bin/env node
// Simple smoke test for critical endpoints; default host certnode.io or env HOST
const HOST = process.env.HOST || 'https://certnode.io';

async function check(path, expectType) {
  const url = HOST.replace(/\/$/,'') + path;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${path} HTTP ${res.status}`);
  const ct = res.headers.get('content-type') || '';
  if (expectType && !ct.includes(expectType)) throw new Error(`${path} content-type ${ct} != ${expectType}`);
  return true;
}

(async () => {
  try {
    await check('/.well-known/jwks.json', 'application/jwk-set+json');
    await check('/trust/keys.jsonl', 'application/json');
    await check('/openapi.json', 'application/json');
    console.log('Smoke OK');
  } catch (e) {
    console.error('Smoke FAILED:', e.message || e);
    process.exit(1);
  }
})();

