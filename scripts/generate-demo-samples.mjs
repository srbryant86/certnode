// scripts/generate-demo-samples.mjs
// Generates consistent demo JWKS and sample receipt using jose library
import { generateKeyPair, exportJWK, CompactSign } from 'jose';
import { writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const enc = (o) => new TextEncoder().encode(o);
const b64url = (buf) => Buffer.from(buf).toString('base64url');

const kid = `demo-${new Date().toISOString().slice(0,10)}`;

console.log('Generating demo cryptographic assets...');

// 1) Generate ES256 keypair
const { privateKey, publicKey } = await generateKeyPair('ES256');
const pubJwk = await exportJWK(publicKey);
pubJwk.kid = kid;
pubJwk.alg = 'ES256';
pubJwk.use = 'sig';

// 2) Sample payload (JCS-clean JSON)
const payloadObj = {
  docId: "demo-123",
  hash: "sha256-" + createHash('sha256').update("demo").digest('base64'),
  issuer: "certnode.sample",
  issued_at: new Date().toISOString()
};
const payloadJson = JSON.stringify(payloadObj);

// 3) Sign (compact JWS)
const jws = await new CompactSign(enc(payloadJson))
  .setProtectedHeader({ alg: 'ES256', kid })
  .sign(privateKey);

// 4) Produce "detached JWS object" fields
const [protB64, payloadB64, sigB64] = jws.split('.');

const receipt = {
  protected: protB64,
  payload: payloadB64,      // base64url(JCS JSON)
  signature: sigB64,
  kid
};

// 5) Write files under /web
await mkdir('web/.well-known', { recursive: true });
await mkdir('web/samples', { recursive: true });

await writeFile('web/.well-known/jwks.json', JSON.stringify({ keys: [pubJwk] }, null, 2));
await writeFile('web/samples/receipt.json', JSON.stringify(receipt, null, 2));
await writeFile('web/samples/payload.json', JSON.stringify(payloadObj, null, 2));

console.log('✅ Generated demo assets:');
console.log('   - web/.well-known/jwks.json');
console.log('   - web/samples/receipt.json');
console.log('   - web/samples/payload.json');
console.log('   - Key ID:', kid);