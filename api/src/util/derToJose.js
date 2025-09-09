// Convert ASN.1 DER ECDSA signature to JOSE (r||s) for P-256 (32-byte each)
function derToJose(der) {
  if (!Buffer.isBuffer(der)) der = Buffer.from(der);
  let offset = 0;
  if (der[offset++] !== 0x30) throw new Error('Invalid DER: expected sequence');
  const seqLen = der[offset++];
  if (der[offset++] !== 0x02) throw new Error('Invalid DER: expected integer (r)');
  let rLen = der[offset++];
  if (rLen > 33) throw new Error('Invalid DER: r too long');
  let r = der.slice(offset, offset + rLen);
  offset += rLen;
  if (der[offset++] !== 0x02) throw new Error('Invalid DER: expected integer (s)');
  let sLen = der[offset++];
  if (sLen > 33) throw new Error('Invalid DER: s too long');
  let s = der.slice(offset, offset + sLen);
  // Strip leading zero if present
  if (r[0] === 0x00 && r.length > 32) r = r.slice(1);
  if (s[0] === 0x00 && s.length > 32) s = s.slice(1);
  // Left pad to 32 bytes
  if (r.length > 32 || s.length > 32) throw new Error('Invalid r/s length');
  const rPad = Buffer.concat([Buffer.alloc(32 - r.length, 0), r]);
  const sPad = Buffer.concat([Buffer.alloc(32 - s.length, 0), s]);
  return Buffer.concat([rPad, sPad]);
}

module.exports = derToJose;

