const { execFileSync } = require('child_process');

// Windows: pre-kill any stray node servers
try{ execFileSync('taskkill', ['/IM', 'node.exe', '/F'], { stdio: 'ignore' }); }catch(_){}

function run(cmd, args) {
  execFileSync(cmd, args, { stdio: 'inherit' });
}

try {
  run('node', ['test/run.js']);
  run('node', ['test/manifest.test.js']);
  run('node', ['test/validation.test.js']);
  run('node', ['test/validation.sign.test.js']);
  run('node', ['test/ratelimit.test.js']);
  run('node', ['test/ratelimit.unit.test.js']);
  run('node', ['test/routes.jwks.test.js']);
  run('node', ['test/cors.test.js']);
  run('node', ['test/openapi.test.js']);
  console.log('All tests completed');
} catch (e) {
  process.exit(e.status || 1);
}

// Windows: post-kill any stray node servers
try{ execFileSync('taskkill', ['/IM', 'node.exe', '/F'], { stdio: 'ignore' }); }catch(_){}
