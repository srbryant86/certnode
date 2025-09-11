// api/test/run-all.js — verbose with per-test banners + 90s watchdog
const { exec, execFile } = require('child_process');

const tests = [
  'api/test/manifest.test.js',
  'api/test/ratelimit.unit.test.js',
  'api/test/ratelimit.test.js',
  'api/test/validation.test.js',
  'api/test/validation.sign.test.js',
  'api/test/cors.test.js',
  'api/test/cors.integration.test.js',
  'api/test/verify.cli.test.js',
];

function killStrays(cb) {
  exec('taskkill /IM node.exe /F', () => cb());
}

function run(cmd, args) {
  const cp = execFile(cmd, args, { stdio: 'inherit' });
  cp.on('close', (code) => {
    if (code !== 0) {
      console.log(`❌ Command failed with code ${code}`);
      process.exit(code);
    }
  });
}

function runOne(i) {
  if (i >= tests.length) {
    return killStrays(() => { console.log('\n✅ All tests completed'); process.exit(0); });
  }
  const file = tests[i];
  console.log(`\n=== RUN ${file} ===`);
  killStrays(() => {
    const cp = execFile(process.execPath, [file], { stdio: 'inherit' });
    const timer = setTimeout(() => {
      console.log(`⏰ Test ${file} timed out after 90s, killing...`);
      cp.kill('SIGKILL');
    }, 90000);
    
    cp.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        console.log(`❌ Test ${file} failed with code ${code}`);
        process.exit(code);
      }
      console.log(`✅ Test ${file} passed`);
      runOne(i + 1);
    });
  });
}

console.log('🚀 Starting test suite with 90s per-test timeout...');
runOne(0);
