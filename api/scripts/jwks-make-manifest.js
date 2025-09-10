#!/usr/bin/env node
// Dev/CI helper: read a JWKS JSON file, produce manifest.json + manifest.sig
const fs = require('fs');
const path = require('path');
const { makeManifest, signManifest, makeLocalSigner } = require('../src/util/manifest');

function usage() {
  console.error('Usage: node api/scripts/jwks-make-manifest.js --in <jwks.json> --version <versionId> [--out <dir>]');
  process.exit(2);
}
const args = process.argv.slice(2);
function arg(k) { const i = args.indexOf(k); return i >= 0 ? args[i+1] : undefined; }
const inPath = arg('--in'); const versionId = arg('--version'); const outDir = arg('--out') || (inPath ? path.dirname(inPath) : '.');
if (!inPath || !versionId) usage();

const jwks = JSON.parse(fs.readFileSync(inPath, 'utf8'));
const manifest = makeManifest({ versionId, jwks });
const { signFn, publicJwk } = makeLocalSigner(); // In prod, replace with KMS signer
signManifest(manifest, signFn).then(({ manifest, sig }) => {
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(outDir, 'manifest.sig'), sig + '\n');
  fs.writeFileSync(path.join(outDir, 'manifest.pubjwk.json'), JSON.stringify(publicJwk, null, 2));
  console.log('Wrote manifest.json, manifest.sig, manifest.pubjwk.json to', outDir);
  process.exit(0);
}).catch((e) => { console.error(e); process.exit(1); });

