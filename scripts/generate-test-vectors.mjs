// scripts/generate-test-vectors.mjs
import { generateKeyPair, exportJWK, CompactSign, compactVerify, createLocalJWKSet } from 'jose';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const enc = (s) => new TextEncoder().encode(s);
const b64url = (b) => Buffer.from(b).toString('base64url');
const todayKid = `demo-${new Date().toISOString().slice(0,10)}`;

await mkdir('public/test-vectors/valid', { recursive: true });
await mkdir('public/test-vectors/wrong-kid', { recursive: true });
await mkdir('public/test-vectors/tampered-payload', { recursive: true });
await mkdir('public/test-vectors/wrong-alg', { recursive: true });
await mkdir('public/test-vectors/malformed-payloadb64', { recursive: true });

// Primary ES256 key (KID A)
const { privateKey: skA, publicKey: pkA } = await generateKeyPair('ES256');
const jwkA = await exportJWK(pkA); jwkA.kid = todayKid; jwkA.alg = 'ES256'; jwkA.use = 'sig';
const jwksA = { keys: [jwkA] };

// Secondary ES256 key (KID B) for wrong-kid case
const { privateKey: skB, publicKey: pkB } = await generateKeyPair('ES256');
const jwkB = await exportJWK(pkB); jwkB.kid = todayKid + '-alt'; jwkB.alg = 'ES256'; jwkB.use = 'sig';

// Base payload
const payloadObj = {
  docId: "tv-123",
  hash: "sha256-" + createHash('sha256').update("demo-payload").digest('base64'),
  issuer: "certnode.test",
  issued_at: new Date().toISOString()
};
const payloadJson = JSON.stringify(payloadObj);

// Helper: sign compact JWS with ES256
async function signES256(obj, sk, kid) {
  const compact = await new CompactSign(enc(JSON.stringify(obj)))
    .setProtectedHeader({ alg: 'ES256', kid })
    .sign(sk);
  const [prot, pay, sig] = compact.split('.');
  return { protected: prot, payload: pay, signature: sig, kid };
}

// 1) VALID (ES256, KID A, jwksA)
const valid = await signES256(payloadObj, skA, jwkA.kid);

// 2) WRONG KID (signed with KID B, but JWKS only has KID A)
const wrongKid = await signES256(payloadObj, skB, jwkB.kid);

// 3) TAMPERED PAYLOAD (change a field after signing)
const tampered = { ...valid, payload: b64url(enc(JSON.stringify({ ...payloadObj, hash: "sha256-INVALID" }))) };

// 4) WRONG ALG (HS256) — sign with symmetric key and alg HS256 (should be rejected by ES256-only verifiers)
import { createHmac } from 'node:crypto';
function signHS256(obj, kid='hs-demo') {
  const secret = 'not-a-real-shared-secret';
  const protectedHeader = b64url(enc(JSON.stringify({ alg: 'HS256', kid })));
  const payload = b64url(enc(JSON.stringify(obj)));
  const mac = createHmac('sha256', secret).update(`${protectedHeader}.${payload}`).digest();
  return { protected: protectedHeader, payload, signature: b64url(mac), kid };
}
const wrongAlg = signHS256(payloadObj);

// 5) MALFORMED PAYLOADB64 (corrupt base64url)
const malformed = { ...valid, payload: valid.payload.slice(0, -1) + '_' };

// Write fixtures
async function dump(dir, receipt, jwks, payload=payloadObj, expected) {
  await writeFile(`${dir}/receipt.json`, JSON.stringify(receipt, null, 2));
  await writeFile(`${dir}/jwks.json`, JSON.stringify(jwks, null, 2));
  await writeFile(`${dir}/payload.json`, JSON.stringify(payload, null, 2));
  await writeFile(`${dir}/expected.json`, JSON.stringify(expected, null, 2));
}

await dump('public/test-vectors/valid', valid, jwksA, payloadObj, { ok: true });
await dump('public/test-vectors/wrong-kid', wrongKid, jwksA, payloadObj, { ok: false, reason: "unknown kid or key mismatch" });
await dump('public/test-vectors/tampered-payload', tampered, jwksA, payloadObj, { ok: false, reason: "signature or payload mismatch" });
await dump('public/test-vectors/wrong-alg', wrongAlg, jwksA, payloadObj, { ok: false, reason: "alg not allowed (ES256 only)" });
await dump('public/test-vectors/malformed-payloadb64', malformed, jwksA, payloadObj, { ok: false, reason: "invalid base64url payload" });

// Index page (static links)
const indexHtml = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Test Vectors — CertNode</title>
<style>body{font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;margin:0}main{max-width:960px;margin:0 auto;padding:24px}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #eee;padding:8px;text-align:left}</style>
</head><body><main>
<h1>Test Vectors</h1>
<p>Deterministic fixtures for verifying detached JWS receipts. Each case includes <code>receipt.json</code>, <code>jwks.json</code>, <code>payload.json</code>, and <code>expected.json</code>.</p>
<table><thead><tr><th>Case</th><th>Purpose</th><th>Expected</th><th>Links</th></tr></thead><tbody>
<tr><td><code>valid</code></td><td>Baseline ES256 verification</td><td>ok: true</td><td><a href="/test-vectors/valid/receipt.json">receipt</a> · <a href="/test-vectors/valid/jwks.json">jwks</a> · <a href="/test-vectors/valid/payload.json">payload</a> · <a href="/test-vectors/valid/expected.json">expected</a></td></tr>
<tr><td><code>wrong-kid</code></td><td>Receipt signed by unknown KID</td><td>ok: false</td><td><a href="/test-vectors/wrong-kid/receipt.json">receipt</a> · <a href="/test-vectors/wrong-kid/jwks.json">jwks</a> · <a href="/test-vectors/wrong-kid/payload.json">payload</a> · <a href="/test-vectors/wrong-kid/expected.json">expected</a></td></tr>
<tr><td><code>tampered-payload</code></td><td>Payload changed post-sign</td><td>ok: false</td><td><a href="/test-vectors/tampered-payload/receipt.json">receipt</a> · <a href="/test-vectors/tampered-payload/jwks.json">jwks</a> · <a href="/test-vectors/tampered-payload/payload.json">payload</a> · <a href="/test-vectors/tampered-payload/expected.json">expected</a></td></tr>
<tr><td><code>wrong-alg</code></td><td>HS256 signature rejected</td><td>ok: false</td><td><a href="/test-vectors/wrong-alg/receipt.json">receipt</a> · <a href="/test-vectors/wrong-alg/jwks.json">jwks</a> · <a href="/test-vectors/wrong-alg/payload.json">payload</a> · <a href="/test-vectors/wrong-alg/expected.json">expected</a></td></tr>
<tr><td><code>malformed-payloadb64</code></td><td>Base64url payload corrupted</td><td>ok: false</td><td><a href="/test-vectors/malformed-payloadb64/receipt.json">receipt</a> · <a href="/test-vectors/malformed-payloadb64/jwks.json">jwks</a> · <a href="/test-vectors/malformed-payloadb64/payload.json">payload</a> · <a href="/test-vectors/malformed-payloadb64/expected.json">expected</a></td></tr>
</tbody></table>
</main></body></html>`;
await writeFile('public/test-vectors/index.html', indexHtml);

console.log('Test vectors generated under public/test-vectors/');