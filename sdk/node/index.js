//---------------------------------------------------------------------
// sdk/node/index.js
// Simple Node SDK wrapper around tools/verify-lib.js
const { verifyReceiptWithJwks, loadJwks } = require('../../tools/verify-lib');
const fs = require('fs');

/** Verify a CertNode receipt using a JWKS object. */
function verifyReceipt(receipt, jwks) {
  try {
    const result = verifyReceiptWithJwks(receipt, jwks);
    return { ok: result };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}

/** Convenience: verify from file paths (sync). */
function verifyReceiptFromFiles(receiptPath, jwksPath) {
  const rcpt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
  const jwks = JSON.parse(fs.readFileSync(jwksPath, 'utf8'));
  return verifyReceipt(rcpt, jwks);
}

/** Convenience: verify from a JWKS URL (sync read receipt, async JWKS). */
async function verifyReceiptFromFilesOrUrl(receiptPath, jwksSrc) {
  const rcpt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
  const jwks = await loadJwks(jwksSrc);
  return verifyReceipt(rcpt, jwks);
}

module.exports = { verifyReceipt, verifyReceiptFromFiles, verifyReceiptFromFilesOrUrl };
//---------------------------------------------------------------------