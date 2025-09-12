const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function sh(cmd) { return execSync(cmd, { encoding: 'utf8' }).trim(); }
function root()    { return sh('git rev-parse --show-toplevel'); }

function doneTasks() {
  const msgs = sh('git log --pretty=format:%s');
  const set = new Set();
  for (const line of msgs.split('\n')) {
    const m = line.match(/feat\(\s*a(\d{1,3})\s*\)/i);
    if (m) set.add(Number(m[1]));
  }
  return Array.from(set).sort((a,b)=>a-b);
}

function nextId(done) { return done.length ? done[done.length-1] + 1 : 1; }

function exists(p) { try { return fs.existsSync(p); } catch { return false; } }
function listIfExists(rel) { return exists(rel) ? '✅ ' + rel : '—'; }

function writeFile(p, s) { fs.mkdirSync(path.dirname(p), { recursive:true }); fs.writeFileSync(p, s, 'utf8'); }

function pad(n){ return n.toString().padStart(2,'0'); }

(function main(){
  const repo = root();
  process.chdir(repo);

  const done = doneTasks();              // e.g., [16,17,18]
  const next = nextId(done);             // e.g., 19
  const completedLines = done.length
    ? done.map(n => `- a${pad(n)} — completed (see git history)`).join('\n')
    : '_No completed tasks detected via feat(aNN) commit subjects._';

  // Quick components snapshot (presence only; no secrets):
  const components = [
    listIfExists('api/src/index.js'),
    listIfExists('api/src/routes/sign.js'),
    listIfExists('api/src/util/jcs.js'),
    listIfExists('api/src/util/joseToDer.js'),
    listIfExists('api/src/util/derToJose.js'),
    listIfExists('api/src/util/kid.js'),
    listIfExists('tools/verify-receipt.js'),
    listIfExists('tools/verify-lib.js'),
    listIfExists('sdk/node/index.js'),
    listIfExists('sdk/node/index.d.ts'),
    listIfExists('sdk/web/index.js'),
    listIfExists('sdk/web/index.d.ts'),
    listIfExists('web/js/verify.js'),
    listIfExists('web/verify.html')
  ].filter(Boolean).join('\n- ');

  // TASKS_TODO.md
  const todoPath = path.join('docs','internal','TASKS_TODO.md');
  const todo = [
    '# Tasks — CertNode (Application Layer)',
    '',
    'You are operating **only** on the application layer. Do not change infra/secrets.',
    '',
    '## Completed (from git)',
    completedLines,
    '',
    '## Next (define scope + acceptance clearly, then implement only that task)',
    `- a${pad(next)} — **TBD** (fill scope & acceptance)`,
    '',
    '## Backlog (candidates; pick and spec one at a time)',
    '- aXX — SDK packaging & npm publish (node+browser, types, README, size checks, CI dry-run)',
    '- aXX — JWKS static publishing hardening (S3+CloudFront OAC, versioned keys, cache headers, rotation doc)',
    '- aXX — Web receipt viewer polish (drag/drop, copy/paste receipt, error reason mapping)',
    '- aXX — Malformed/fuzz test corpus for receipt/JOSE/JCS edge cases',
    '',
    '> Keep commit subjects as `feat(aNN): ...` for auditability.',
    ''
  ].join('\n');
  writeFile(todoPath, todo);

  // PROJECT_SUMMARY.md
  const sumPath = path.join('docs','internal','PROJECT_SUMMARY.md');
  const sum = [
    '# Project Summary — CertNode',
    '',
    '## What it does (short)',
    '- Signs **JCS-normalized** JSON payloads (ES256, P-256).',
    '- Returns a minimal receipt `{protected, payload, signature, kid, payload_jcs_sha256, receipt_id}`.',
    '- Public **JWKS** used for offline verification.',
    '',
    '## Current components (presence only)',
    '- ' + components,
    '',
    '## Endpoints',
    '- `POST /v1/sign` — accepts `{ payload, headers? }`, returns receipt (JWS-like).',
    '',
    '## Tools / SDK',
    '- `tools/verify-receipt.js` — offline verifier CLI (JWKS file/URL).',
    '- `sdk/node`, `sdk/web` — verify helpers (present if listed above).',
    '',
    '## Constraints',
    '- ES256 (ECDSA P-256) only.',
    '- RFC 8785 (JCS) canonicalization before signing/verifying.',
    '- DER↔JOSE conversion for ECDSA.',
    '- kid: RFC 7638 JWK thumbprint.',
    '- Node 20, CommonJS in /api. No secrets in repo.',
    '',
    '## Completed tasks (from git)',
    completedLines,
    '',
    `## Next task: a${pad(next)}`,
    '- Edit `docs/internal/TASKS_TODO.md` to define scope + acceptance, then implement strictly that.',
    ''
  ].join('\n');
  writeFile(sumPath, sum);

  console.log('== Repo Task Audit ==');
  console.log('Repo:', repo);
  console.log('Completed:', done.length ? done.map(n=>`a${n}`).join(', ') : '(none)');
  console.log('Next task id:', `a${next}`);
  console.log('Wrote:', todoPath);
  console.log('Wrote:', sumPath);
})();