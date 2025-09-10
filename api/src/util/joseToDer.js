// Convert JOSE (r||s) -> ASN.1 DER for ECDSA P-256 signatures
function joseToDer(jose) {
  if (!Buffer.isBuffer(jose)) jose = Buffer.from(jose, 'base64url');
  if (jose.length !== 64) throw new Error('JOSE signature must be 64 bytes for P-256');
  const r = jose.slice(0, 32);
  const s = jose.slice(32);

  function trimLeadingZeros(buf) {
    let i = 0;
    while (i < buf.length - 1 && buf[i] === 0x00) i++;
    return buf.slice(i);
  }

  const rTrim = trimLeadingZeros(r);
  const sTrim = trimLeadingZeros(s);

  const rInt = (rTrim[0] & 0x80) ? Buffer.concat([Buffer.from([0x00]), rTrim]) : rTrim;
  const sInt = (sTrim[0] & 0x80) ? Buffer.concat([Buffer.from([0x00]), sTrim]) : sTrim;

  const rSeq = Buffer.concat([Buffer.from([0x02, rInt.length]), rInt]);
  const sSeq = Buffer.concat([Buffer.from([0x02, sInt.length]), sInt]);
  const seq  = Buffer.concat([Buffer.from([0x30, rSeq.length + sSeq.length]), rSeq, sSeq]);
  return seq;
}

module.exports = joseToDer;

