// web/js/verify-page.js (module)
// Drives the verify.html UI without inline scripts (CSP-friendly)

import { JWKSManager } from '../../sdk/web/jwks-manager.js';

const $ = (s) => document.querySelector(s);
const LS_JWKS = 'certnode:jwks';
const LS_RECEIPT = 'certnode:receipt';
const LS_THEME = 'certnode:theme';

const reasonMap = {
  missing_fields: 'Receipt missing required fields (protected, payload, signature, kid).',
  bad_protected: 'Protected header is not valid base64url‑encoded JSON.',
  unsupported_alg: 'Unsupported algorithm in header. Only ES256 (P‑256) is supported.',
  kid_mismatch: 'Key ID mismatch between protected header and receipt.',
  kid_not_found: 'Key not found in the provided JWKS (check kid/thumbprint).',
  payload_hash_mismatch: 'Payload hash mismatch (JCS) — receipt payload was modified or JCS mismatch.',
  signature_invalid: 'Signature verification failed — receipt may be invalid or JWKS incorrect.',
  receipt_id_mismatch: 'Receipt ID does not match computed value.',
  bad_receipt: 'Receipt must be a JSON object.',
  invalid_json: 'Invalid JSON provided.'
};

function setStatus(ok, msg) {
  const el = $('#status');
  el.style.display = 'block';
  el.className = 'status ' + (ok ? 'ok' : 'err');
  el.textContent = msg;
}
function clearAll() {
  $('#receipt').value = '';
  $('#jwks').value = '';
  $('#jwks-url').value = '';
  $('#result').textContent = '';
  $('#hdr').textContent = '';
  $('#status').style.display = 'none';
  localStorage.removeItem(LS_JWKS);
  localStorage.removeItem(LS_RECEIPT);
}
async function readFileToText(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result || ''));
    r.onerror = (e) => rej(e);
    r.readAsText(file);
  });
}
function parseJsonSafe(s) {
  try { return JSON.parse(s); } catch { return null; }
}
function decodeHeaderB64u(protectedB64u) {
  try {
    const padded = protectedB64u + '='.repeat((4 - protectedB64u.length % 4) % 4);
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(base64), c => c.charCodeAt(0))));
  } catch { return null; }
}
function formatTextarea(id) {
  const el = document.getElementById(id);
  const obj = parseJsonSafe(el.value);
  if (!obj) return setStatus(false, 'invalid_json');
  el.value = JSON.stringify(obj, null, 2);
}
function minifyTextarea(id) {
  const el = document.getElementById(id);
  const obj = parseJsonSafe(el.value);
  if (!obj) return setStatus(false, 'invalid_json');
  el.value = JSON.stringify(obj);
}
function copyText(text) { try { navigator.clipboard.writeText(text); } catch {} }

// Drag & drop
function setupDrop(zoneId, targetTextarea, fileInputId) {
  const dz = document.getElementById(zoneId);
  function reset() { dz.classList.remove('drag'); }
  dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', reset);
  dz.addEventListener('drop', async (e) => {
    e.preventDefault(); reset();
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!f) return;
    try {
      const txt = await readFileToText(f);
      document.getElementById(targetTextarea).value = txt.trim();
      if (targetTextarea === 'jwks') localStorage.setItem(LS_JWKS, txt.trim());
      if (targetTextarea === 'receipt') localStorage.setItem(LS_RECEIPT, txt.trim());
    } catch (err) { setStatus(false, 'Failed to read file: ' + err.message); }
  });
  // Keyboard: Enter/Space opens file picker
  dz.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const inp = document.getElementById(fileInputId);
      if (inp) inp.click();
      e.preventDefault();
    }
  });
}

// Theme toggle
(function initTheme(){
  const t = localStorage.getItem(LS_THEME) || 'dark';
  document.documentElement.setAttribute('data-theme', t);
  $('#theme-toggle').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(LS_THEME, next);
  });
})();

// Hook up dropzones
setupDrop('receipt-drop', 'receipt', 'receipt-file');
setupDrop('jwks-drop', 'jwks', 'jwks-file');

// File inputs
$('#receipt-file').addEventListener('change', async (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  const txt = await readFileToText(f);
  $('#receipt').value = txt;
  localStorage.setItem(LS_RECEIPT, txt);
});
$('#jwks-file').addEventListener('change', async (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  const txt = await readFileToText(f);
  $('#jwks').value = txt;
  localStorage.setItem(LS_JWKS, txt);
});

// Fetch JWKS from URL (with JWKSManager)
$('#fetch-jwks').addEventListener('click', async () => {
  const url = $('#jwks-url').value.trim();
  if (!url) return setStatus(false, 'Enter a JWKS URL');
  try {
    const mgr = new JWKSManager({ ttlMs: 300000 });
    const jwks = await mgr.fetchFromUrl(url);
    const text = JSON.stringify(jwks, null, 2);
    $('#jwks').value = text;
    localStorage.setItem(LS_JWKS, text);
    setStatus(true, 'Fetched JWKS');
  } catch (e) { setStatus(false, 'Failed to fetch JWKS: ' + e.message); }
});

// Load sample
$('#receipt-sample').addEventListener('click', () => {
  const sample = {
    protected: 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImRlbW8ta2lkIn0',
    payload: { hello: 'world', n: 42 },
    signature: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    kid: 'demo-kid'
  };
  const txt = JSON.stringify(sample, null, 2);
  $('#receipt').value = txt;
  localStorage.setItem(LS_RECEIPT, txt);
});

// Format/minify and copy
$('#receipt-format').addEventListener('click', () => formatTextarea('receipt'));
$('#receipt-minify').addEventListener('click', () => minifyTextarea('receipt'));
$('#jwks-format').addEventListener('click', () => formatTextarea('jwks'));
$('#jwks-minify').addEventListener('click', () => minifyTextarea('jwks'));
$('#copy-hdr').addEventListener('click', () => copyText($('#hdr').textContent));
$('#copy-result').addEventListener('click', () => copyText($('#result').textContent));

// Restore from localStorage
(function restore() {
  const jwks = localStorage.getItem(LS_JWKS);
  const rcpt = localStorage.getItem(LS_RECEIPT);
  if (jwks) $('#jwks').value = jwks;
  if (rcpt) $('#receipt').value = rcpt;
})();

// Verify
$('#verify').addEventListener('click', async () => {
  const btn = $('#verify');
  btn.disabled = true; btn.textContent = 'Verifying…';
  $('#result').textContent = '';
  $('#hdr').textContent = '';
  const receiptTxt = $('#receipt').value.trim();
  const jwksTxt = $('#jwks').value.trim();
  if (!receiptTxt || !jwksTxt) { setStatus(false, 'Provide both receipt and JWKS'); btn.disabled = false; btn.textContent = 'Verify'; return; }

  const receipt = parseJsonSafe(receiptTxt);
  const jwks = parseJsonSafe(jwksTxt);
  if (!receipt || !jwks) { setStatus(false, 'Invalid JSON in receipt or JWKS'); btn.disabled = false; btn.textContent = 'Verify'; return; }

  const header = decodeHeaderB64u(receipt.protected || '');
  if (header) $('#hdr').textContent = JSON.stringify(header, null, 2);

  try {
    // Quick check first
    if (window.CertNode && window.CertNode.quickCheck) {
      const qc = await window.CertNode.quickCheck(receipt);
      if (!qc.ok) { setStatus(false, `Quick check failed: ${qc.reason}`); btn.disabled = false; btn.textContent = 'Verify'; return; }
    }
    // Full WebCrypto verify
    const res = await window.CertNode.verifyReceipt(receipt, jwks);
    if (res && res.ok) {
      setStatus(true, 'Receipt valid');
      $('#result').textContent = JSON.stringify({ ok: true }, null, 2);
    } else {
      const reason = (res && res.reason) || 'signature_invalid';
      const friendly = reasonMap[reason] || reason;
      setStatus(false, 'Invalid: ' + friendly);
      $('#result').textContent = JSON.stringify({ ok: false, reason, message: friendly }, null, 2);
    }
  } catch (e) {
    const reason = e && e.message ? e.message : 'error';
    const friendly = reasonMap[reason] || String(reason);
    setStatus(false, 'Verification error: ' + friendly);
    $('#result').textContent = JSON.stringify({ ok: false, error: String(reason), message: friendly }, null, 2);
  }
  btn.disabled = false; btn.textContent = 'Verify';
});

// Download result
(function addDownload(){
  const btn = document.createElement('button');
  btn.textContent = 'Download Result';
  btn.id = 'download-result';
  document.querySelector('section.panel:last-of-type .row').appendChild(btn);
  btn.addEventListener('click', () => {
    const txt = $('#result').textContent.trim() || '{}';
    const blob = new Blob([txt], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'verify-result.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
})();

