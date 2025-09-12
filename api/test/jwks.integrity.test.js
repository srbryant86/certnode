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
    const child = spawn(process.execPath, ['tools/jwks-integrity-check.js', ...args], { stdio: 'pipe' });
    let out=''; let err='';
    child.stdout.on('data', d => out += d.toString());
    child.stderr.on('data', d => err += d.toString());
    child.on('close', code => resolve({ code, out, err }));
    setTimeout(() => { try { child.kill('SIGKILL'); } catch {} }, 5000);
  });
}

(async () => {
  // Minimal valid P-256 coords (32 bytes base64url of zeros -> 'AAAAAAAA...')
  const zeros = Buffer.alloc(32).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');

  const good = { keys: [{ kty: 'EC', crv: 'P-256', x: zeros, y: zeros }] };
  const goodPath = writeTempJson(good);
  const ok = await runTool(['--jwks', goodPath]);
  if (ok.code !== 0) { console.error('Expected success for valid JWKS', ok.out, ok.err); process.exit(1); }

  const bad = { keys: [{ kty: 'EC', crv: 'P-256', x: 'AA', y: zeros }] };
  const badPath = writeTempJson(bad);
  const fail = await runTool(['--jwks', badPath]);
  if (fail.code === 0) { console.error('Expected failure for invalid JWKS', fail.out, fail.err); process.exit(1); }

  console.log('jwks.integrity.test OK');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });

