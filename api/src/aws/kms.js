/* File: api/src/aws/kms.js
   KMS adapter with:
   - RAW ECDSA_SHA_256 signing (DER -> P1363 r||s)
   - Exponential backoff (full jitter) + max retries
   - Simple circuit breaker to avoid hot loops on persistent failure
   Environment (optional):
     KMS_MAX_RETRIES (default 5)
     KMS_BACKOFF_BASE_MS (default 50)
     KMS_BACKOFF_MAX_MS  (default 1000)
     KMS_CIRCUIT_THRESHOLD (default 10)
     KMS_CIRCUIT_COOLDOWN_MS (default 1000)
*/
const { createPublicKey } = require('crypto');
const derToJose = require('../util/derToJose');
const { jwkThumbprint } = require('../util/kid');

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
function b64u(buf){ return Buffer.from(buf).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }

const RETRYABLE = new Set([
  'ThrottlingException','TooManyRequestsException','InternalErrorException','InternalFailure',
  'ServiceUnavailableException','LimitExceededException','TimeoutError','NetworkingError'
]);

function computeBackoff(attempt, base, cap){
  // Full jitter: random(0, min(cap, base * 2^attempt))
  const exp = Math.min(cap, base * Math.pow(2, attempt));
  return Math.floor(Math.random() * exp);
}

/**
 * createKmsAdapter({ sdk, keyId, client? })
 *  - sdk: require('@aws-sdk/client-kms') (in prod) or a test double
 *  - keyId: KMS key id/arn/alias
 *  - client: optional instantiated client (tests)
 */
function createKmsAdapter({ sdk, keyId, client }) {
  if (!sdk) throw new Error('kms adapter: sdk missing');
  if (!keyId) throw new Error('kms adapter: keyId missing');

  const maxRetries  = parseInt(process.env.KMS_MAX_RETRIES || '5', 10);
  const baseMs      = parseInt(process.env.KMS_BACKOFF_BASE_MS || '50', 10);
  const capMs       = parseInt(process.env.KMS_BACKOFF_MAX_MS || '1000', 10);
  const brkThresh   = parseInt(process.env.KMS_CIRCUIT_THRESHOLD || '10', 10);
  const brkCooldown = parseInt(process.env.KMS_CIRCUIT_COOLDOWN_MS || '1000', 10);

  const KMSClient            = sdk.KMSClient;
  const SignCommand          = sdk.SignCommand;
  const GetPublicKeyCommand  = sdk.GetPublicKeyCommand;

  const kms = client || new KMSClient({});
  let failCount = 0;
  let breakerOpenUntil = 0;

  let __lastKmsError = null;
  function __recordKmsError(e) {
    __lastKmsError = { type: e && (e.name || e.code || 'Error'), at: new Date().toISOString() };
  }
  function getCircuitState() {
    const now = Date.now();
    const open = (typeof breakerOpenUntil === 'number') && now < breakerOpenUntil;
    return {
      state: open ? 'open' : 'closed',
      opens: typeof failCount === 'number' ? failCount : 0,
      last_open_ms_ago: (open ? 0 : (typeof breakerOpenUntil === 'number' ? Math.max(0, now - breakerOpenUntil) : null))
    };
  }
  function getLastKmsError() { return __lastKmsError; }

  let cachedJwk = null;
  let cachedKid = null;

  function jwkFromSpkiDer(spki) {
    const keyObj = createPublicKey({ key: Buffer.from(spki), type: 'spki', format: 'der' });
    const jwk = keyObj.export({ format: 'jwk' });
    if (!(jwk && jwk.kty === 'EC' && jwk.crv === 'P-256' && jwk.x && jwk.y)) {
      throw new Error('Unsupported public key (expect EC P-256)');
    }
    return { kty:'EC', crv:'P-256', x:jwk.x, y:jwk.y };
  }

  async function getPublicJwk() {
    if (cachedJwk) return cachedJwk;
    const out = await kms.send(new GetPublicKeyCommand({ KeyId: keyId }));
    if (!out || !out.PublicKey) throw new Error('KMS GetPublicKey returned no key');
    cachedJwk = jwkFromSpkiDer(out.PublicKey);
    cachedKid = jwkThumbprint(cachedJwk);
    return cachedJwk;
  }

  function getKid(){
    if (!cachedKid) throw new Error('kid not ready; call getPublicJwk() first');
    return cachedKid;
  }

  async function withRetries(fn, opName){
    // Circuit breaker
    const now = Date.now();
    if (now < breakerOpenUntil) {
      const err = new Error('circuit_open');
      err.code = 'circuit_open';
      throw err;
    }

    let attempt = 0;
    const emit = (name, val, extra={}) => { try { process.emit && process.emit('metrics', { name, value: val, ...extra }); } catch {} };

    for(;;){
      try {
        const result = await fn();
        failCount = 0;
        emit(`kms_${opName}_retries`, attempt);
        return result;
      } catch (e) {
        const name = e.name || e.code || 'Error';
        const status = e.$metadata && e.$metadata.httpStatusCode;
        const retryable = RETRYABLE.has(name) || (status && status >= 500);
        if (!retryable || attempt >= maxRetries) {
          failCount++;
          if (failCount >= brkThresh) {
            breakerOpenUntil = Date.now() + brkCooldown;
            const { emit } = require('../plugins/metrics');
            emit('kms_circuit_open', 1, { fail_count: failCount });
          }
          __recordKmsError(e);
          const { emit } = require('../plugins/metrics');
          emit('kms_error', 1, { error_type: name || e.code || 'Error', retryable });
          e.retryable = !!retryable;
          throw e;
        }
        const delay = computeBackoff(attempt, baseMs, capMs);
        emit('kms_backoff_ms', delay, { attempt, op: opName });
        await sleep(delay);
        attempt++;
      }
    }
  }

  async function signRaw(messageBuffer) {
    const out = await withRetries(
      () => kms.send(new SignCommand({
        KeyId: keyId,
        Message: messageBuffer,
        MessageType: 'RAW',
        SigningAlgorithm: 'ECDSA_SHA_256'
      })),
      'sign'
    );
    if (!out || !out.Signature) throw new Error('KMS Sign returned no signature');
    return derToJose(Buffer.from(out.Signature));
  }

  return { getPublicJwk, getKid, signRaw, getCircuitState, getLastKmsError };
}

module.exports = { createKmsAdapter };
