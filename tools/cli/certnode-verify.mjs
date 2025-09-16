#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { compactVerify, createLocalJWKSet } from 'jose';

const enc = new TextDecoder();

async function load(source) {
  if (!source) return null;
  if (/^https?:\/\//.test(source)) {
    const r = await fetch(source);
    if (!r.ok) throw new Error(`Fetch failed ${r.status} ${source}`);
    return await r.json();
  }
  return JSON.parse(await readFile(source, 'utf8'));
}

function asCompact(receipt) {
  const { protected: p, payload, signature } = receipt;
  if (!p || !payload || !signature) throw new Error('Invalid receipt object shape');
  return `${p}.${payload}.${signature}`;
}

async function main() {
  const args = Object.fromEntries(process.argv.slice(2).map((a,i,arr)=>{
    if(!a.startsWith('--')) return []; const k=a.slice(2); const v=arr[i+1] && !arr[i+1].startsWith('--')?arr[i+1]:true; return [k,v];
  }).filter(Boolean));

  const receipt = await load(args.receipt || args.r) || (args.stdin ? await new Promise((res)=>{
    const rl=createInterface({input:process.stdin}); let d=''; rl.on('line',l=>d+=l); rl.on('close',()=>res(JSON.parse(d)));
  }): null);
  const jwks = await load(args.jwks || args.k);
  const payloadExpected = await load(args.payload || args.p);

  if (!receipt || !jwks) {
    console.error('Usage: certnode-verify --receipt <file|url> --jwks <file|url> [--payload <file|url>] [--allow-alg ES256]');
    process.exit(2);
  }
  const allowAlg = (args['allow-alg'] || 'ES256').split(',').map(s=>s.trim());
  const JWKSet = createLocalJWKSet(jwks);
  try {
    const jws = asCompact(receipt);
    const { protectedHeader, payload } = await compactVerify(jws, JWKSet, { algorithms: allowAlg });
    const payloadJson = JSON.parse(enc.decode(payload));
    let ok = true, reason = null;
    if (payloadExpected && JSON.stringify(payloadExpected) !== JSON.stringify(payloadJson)) {
      ok = false; reason = 'payload mismatch';
    }
    const out = { ok, alg: protectedHeader.alg, kid: protectedHeader.kid || receipt.kid || null, reason };
    console.log(JSON.stringify(out, null, 2));
    process.exit(ok ? 0 : 1);
  } catch (e) {
    console.log(JSON.stringify({ ok:false, reason: e.message }, null, 2));
    process.exit(1);
  }
}
main();