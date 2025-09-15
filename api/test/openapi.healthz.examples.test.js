const assert = require('assert');
const fs = require('fs');
const path = require('path');

(async () => {
  const specPath = path.join(__dirname, '../../web/openapi.json');
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  try {
    const healthz = spec.paths && spec.paths['/healthz'] && spec.paths['/healthz'].get;
    assert(healthz, '/healthz GET should exist');
    const resp405 = healthz.responses && healthz.responses['405'];
    const resp500 = healthz.responses && healthz.responses['500'];
    assert(resp405 && resp405.content && resp405.content['application/json'], '/healthz 405 should have JSON content');
    assert(resp500 && resp500.content && resp500.content['application/json'], '/healthz 500 should have JSON content');
    console.log('openapi.healthz.examples.test OK');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

