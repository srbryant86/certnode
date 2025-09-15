const assert = require('assert');
const fs = require('fs');
const path = require('path');

(async () => {
  const specPath = path.join(__dirname, '../../web/openapi.json');
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  try {
    const sign = spec.paths && spec.paths['/v1/sign'] && spec.paths['/v1/sign'].post;
    assert(sign, '/v1/sign POST should exist');
    // Ensure 405 documented at path level (responses outside post) or alongside
    const signPath = spec.paths['/v1/sign'];
    const has405 = (signPath.responses && signPath.responses['405']) || (sign.responses && sign.responses['405']);
    assert(has405, '/v1/sign should document 405 method_not_allowed');
    console.log('openapi.sign.examples.test OK');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

