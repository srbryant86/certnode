const assert = require("assert");
const { generateKeyPairSync, createSign, createPublicKey } = require("crypto");
const { createKmsAdapter } = require("../src/aws/kms");

function spkiFromPublicKey(pk){
  return pk.export({ type:"spki", format:"der" });
}

(async () => {
  const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const spki = spkiFromPublicKey(publicKey);

  class GetPublicKeyCommand { constructor(input){ this.input = input; } }
  class SignCommand { constructor(input){ this.input = input; } }
  class KMSClient {
    constructor(){ this.calls = 0; }
    async send(cmd){
      if (cmd instanceof GetPublicKeyCommand) {
        return { PublicKey: spki };
      }
      if (cmd instanceof SignCommand) {
        this.calls++;
        if (this.calls <= 2) {
          const e = new Error("Throttling"); e.name = "ThrottlingException"; throw e;
        }
        const msg = cmd.input?.Message ?? cmd.Message;
        const der = createSign("SHA256").update(Buffer.from(msg)).sign({ key: privateKey, dsaEncoding: "der" });
        return { Signature: der };
      }
      throw new Error("unknown command");
    }
  }

  process.env.KMS_MAX_RETRIES = "5";
  process.env.KMS_BACKOFF_BASE_MS = "0";
  process.env.KMS_BACKOFF_MAX_MS = "0";

  const sdk = { KMSClient, SignCommand, GetPublicKeyCommand };
  const adapter = createKmsAdapter({ sdk, keyId: "alias/fake", client: new KMSClient() });

  const jwk = await adapter.getPublicJwk();
  assert.strictEqual(jwk.kty, "EC");
  assert.strictEqual(jwk.crv, "P-256");
  assert.ok(jwk.x && jwk.y, "x/y present");

  const sig = await adapter.signRaw(Buffer.from("hello.world"));
  assert.strictEqual(sig.length, 64, "P-1363 r||s length");

  class BadKMS extends KMSClient {
    async send(cmd){
      if (cmd instanceof GetPublicKeyCommand) return { PublicKey: spki };
      const e = new Error("Throttling"); e.name = "ThrottlingException"; throw e;
    }
  }
  process.env.KMS_CIRCUIT_THRESHOLD = "3";
  process.env.KMS_CIRCUIT_COOLDOWN_MS = "10";
  const bad = createKmsAdapter({ sdk, keyId: "alias/fake", client: new BadKMS() });
  await bad.getPublicJwk();
  let tripped = false;
  for (let i=0;i<4;i++){
    try { await bad.signRaw(Buffer.from("x")); } catch(e){ if (e.code === "circuit_open") { tripped = true; break; } }
  }
  assert.ok(tripped, "circuit breaker should open");

  console.log("kms.wrapper tests passed");
})().catch(e => { console.error(e); process.exit(1); });
