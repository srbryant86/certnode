#!/usr/bin/env bash
set -euo pipefail

PORT=${PORT:-3000}

payload='{"hello":"world","n":42}'
resp=$(curl -s -X POST "http://127.0.0.1:${PORT}/v1/sign" -H 'Content-Type: application/json' --data "{\"payload\": ${payload}}")
if [ -z "$resp" ]; then echo "No response"; exit 1; fi

protected=$(echo "$resp" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const o=JSON.parse(s);process.stdout.write(o.protected||'')})")
sig=$(echo "$resp" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const o=JSON.parse(s);process.stdout.write(o.signature||'')})")

# Recreate JCS and receipt id locally
jcs=$(echo "$payload" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const v=JSON.parse(s);const {canonicalize}=require('../src/util/jcs');process.stdout.write(Buffer.from(canonicalize(v),'utf8').toString())})")
jcs_b64=$(echo "$jcs" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const {b64u}=require('../src/util/kid');process.stdout.write(b64u(Buffer.from(s,'utf8')))})")
rid_local=$(node -e "const {createHash}=require('crypto');const inStr=process.argv[1];const h=createHash('sha256').update(inStr).digest('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');process.stdout.write(h)" "${protected}.${jcs_b64}.${sig}")
rid_resp=$(echo "$resp" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const o=JSON.parse(s);process.stdout.write(o.receipt_id||'')})")

if [ "$rid_local" = "$rid_resp" ]; then echo "RECEIPT OK"; exit 0; else echo "RECEIPT MISMATCH"; echo "$resp"; exit 2; fi

