const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

function writeTempJson(obj) {
  const p = path.join(os.tmpdir(), `jwks-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  fs.writeFileSync(p, JSON.stringify(obj), 'utf8');
  return p;
}

function runTool(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['tools/jwks-rotate-validate.js', ...args], { stdio: 'pipe' });
    let out=''; let err='';
    child.stdout.on('data', d => out += d.toString());
    child.stderr.on('data', d => err += d.toString());
    child.on('close', code => resolve({ code, out, err }));
    setTimeout(() => { try { child.kill('SIGKILL'); } catch {} }, 5000);
  });
}

function b64uZeros() {
  return Buffer.alloc(32).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');
}

(async () => {
  const x = b64uZeros();
  const y = b64uZeros();
  const keyA = { kty: 'EC', crv: 'P-256', x, y };
  const keyB = { kty: 'EC', crv: 'P-256', x: x.replace(/A$/, 'B'), y };

  // Overlap scenario: current has A; next has A and B
  const cur1 = writeTempJson({ keys: [keyA] });
  const next1 = writeTempJson({ keys: [keyA, keyB] });
  const ok = await runTool(['--current', cur1, '--next', next1]);
  if (ok.code !== 0) { console.error('Expected success for overlapping rotation', ok.out, ok.err); process.exit(1); }

  // No overlap scenario: current has A; next has B only
  const cur2 = writeTempJson({ keys: [keyA] });
  const next2 = writeTempJson({ keys: [keyB] });
  const fail = await runTool(['--current', cur2, '--next', next2]);
  if (fail.code === 0) { console.error('Expected failure for non-overlapping rotation', fail.out, fail.err); process.exit(1); }

  console.log('jwks.rotate.test OK');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });

