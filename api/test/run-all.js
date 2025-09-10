const { execFileSync } = require('child_process');

function run(cmd, args) {
  execFileSync(cmd, args, { stdio: 'inherit' });
}

try {
  run('node', ['api/test/run.js']);
  run('node', ['api/test/manifest.test.js']);
  console.log('All tests completed');
} catch (e) {
  process.exit(e.status || 1);
}

