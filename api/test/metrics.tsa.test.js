const assert = require('assert');
const { getPrometheusMetrics, emit } = require('../src/plugins/metrics');

(async () => {
  // Emit a success and an error with a small duration
  emit('tsa_request_success', 1, { ms: 42 });
  emit('tsa_request_error', 1, { code: 'TSA_TIMEOUT', status: 0 });

  const text = getPrometheusMetrics();
  try {
    assert(text.includes('certnode_tsa_success_total'));
    assert(text.includes('certnode_tsa_error_total'));
    assert(text.includes('certnode_tsa_duration_ms_bucket'));
    assert(text.includes('certnode_tsa_duration_ms_count'));
    console.log('metrics.tsa.test OK');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})().catch((e) => { console.error(e); process.exit(1); });

