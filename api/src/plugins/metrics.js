// Simple in-memory registry for Prometheus exposition
const registry = {
  requests: Object.create(null), // key: `${method}|${path}|${status}` -> count
  duration: Object.create(null), // key: `${method}|${path}` -> histogram
  rateLimited: 0
};

const buckets = [5, 10, 25, 50, 100, 250, 500, 1000, 2000]; // ms

function ensureHist(key) {
  if (!registry.duration[key]) {
    registry.duration[key] = { buckets: buckets.map(() => 0), sum: 0, count: 0 };
  }
  return registry.duration[key];
}

function observeDuration(method, path, ms) {
  const key = `${method}|${path}`;
  const h = ensureHist(key);
  h.count++;
  h.sum += ms;
  for (let i = 0; i < buckets.length; i++) {
    if (ms <= buckets[i]) h.buckets[i]++;
  }
}

function incRequest(method, path, status) {
  const key = `${method}|${path}|${status}`;
  registry.requests[key] = (registry.requests[key] || 0) + 1;
}

function incRateLimited() {
  registry.rateLimited++;
}

const emit = (name, value = 1, extra = {}) => {
  try {
    const evt = { event: String(name), ts: new Date().toISOString(), value };
    const out = Object.assign(evt, extra && typeof extra === 'object' ? extra : {});
    // Structured, single-line JSON for log collectors
    console.log(JSON.stringify(out));

    // Update in-memory metrics
    if (name === 'request_completed') {
      const { method = 'GET', path = '/', status = 0, ms = 0 } = out;
      incRequest(method, path, status);
      if (typeof ms === 'number') observeDuration(method, path, ms);
    } else if (name === 'rate_limit_triggered') {
      incRateLimited();
    }
  } catch (_) { /* never throw from metrics */ }
};

function escapeLabel(str) {
  return String(str).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');
}

function getPrometheusMetrics() {
  let out = '';
  out += '# HELP certnode_requests_total Total number of HTTP requests by method, path, and status\n';
  out += '# TYPE certnode_requests_total counter\n';
  for (const key of Object.keys(registry.requests)) {
    const [method, path, status] = key.split('|');
    const val = registry.requests[key];
    out += `certnode_requests_total{method="${escapeLabel(method)}",path="${escapeLabel(path)}",status="${escapeLabel(status)}"} ${val}\n`;
  }

  out += '\n# HELP certnode_request_duration_ms Request duration in milliseconds\n';
  out += '# TYPE certnode_request_duration_ms histogram\n';
  for (const key of Object.keys(registry.duration)) {
    const [method, path] = key.split('|');
    const h = registry.duration[key];
    let cum = 0;
    for (let i = 0; i < buckets.length; i++) {
      cum += h.buckets[i];
      out += `certnode_request_duration_ms_bucket{method="${escapeLabel(method)}",path="${escapeLabel(path)}",le="${buckets[i]}"} ${cum}\n`;
    }
    out += `certnode_request_duration_ms_bucket{method="${escapeLabel(method)}",path="${escapeLabel(path)}",le="+Inf"} ${h.count}\n`;
    out += `certnode_request_duration_ms_sum{method="${escapeLabel(method)}",path="${escapeLabel(path)}"} ${h.sum}\n`;
    out += `certnode_request_duration_ms_count{method="${escapeLabel(method)}",path="${escapeLabel(path)}"} ${h.count}\n`;
  }

  out += '\n# HELP certnode_rate_limit_triggered_total Number of times rate limiting was triggered\n';
  out += '# TYPE certnode_rate_limit_triggered_total counter\n';
  out += `certnode_rate_limit_triggered_total ${registry.rateLimited}\n`;

  return out;
}

module.exports = { emit, getPrometheusMetrics };
