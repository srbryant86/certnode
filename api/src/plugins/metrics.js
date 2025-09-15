// Simple in-memory registry for Prometheus exposition
const registry = {
  requests: Object.create(null), // key: `${method}|${path}|${status}` -> count
  errors: Object.create(null),   // key: `${method}|${path}|${status}` (status >=400) -> count
  duration: Object.create(null), // key: `${method}|${path}` -> histogram
  rateLimited: 0,
  tsa: {
    success: 0,
    error: 0,
    duration: { buckets: null, sum: 0, count: 0 }
  }
};

const buckets = [5, 10, 25, 50, 100, 250, 500, 1000, 2000]; // ms
const tsaBuckets = [10, 25, 50, 100, 250, 500, 1000, 2000, 5000]; // ms

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

function incError(method, path, status) {
  if (Number(status) >= 400) {
    const key = `${method}|${path}|${status}`;
    registry.errors[key] = (registry.errors[key] || 0) + 1;
  }
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
      incError(method, path, status);
      if (typeof ms === 'number') observeDuration(method, path, ms);
    } else if (name === 'rate_limit_triggered') {
      incRateLimited();
    } else if (name === 'tsa_request_success') {
      // increment success and observe duration
      try {
        registry.tsa.success++;
        const ms = Number(out.ms || 0);
        if (!registry.tsa.duration.buckets) {
          registry.tsa.duration.buckets = tsaBuckets.map(() => 0);
        }
        registry.tsa.duration.count += 1;
        registry.tsa.duration.sum += isFinite(ms) ? ms : 0;
        for (let i = 0; i < tsaBuckets.length; i++) {
          if (ms <= tsaBuckets[i]) registry.tsa.duration.buckets[i]++;
        }
      } catch (_) {}
    } else if (name === 'tsa_request_error') {
      try { registry.tsa.error++; } catch (_) {}
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

  out += '\n# HELP certnode_errors_total Total number of error responses by method, path, and status (>=400)\n';
  out += '# TYPE certnode_errors_total counter\n';
  for (const key of Object.keys(registry.errors)) {
    const [method, path, status] = key.split('|');
    const val = registry.errors[key];
    out += `certnode_errors_total{method="${escapeLabel(method)}",path="${escapeLabel(path)}",status="${escapeLabel(status)}"} ${val}\n`;
  }

  // TSA metrics (low-cardinality, global counters)
  out += '\n# HELP certnode_tsa_success_total Total number of successful TSA requests\n';
  out += '# TYPE certnode_tsa_success_total counter\n';
  out += `certnode_tsa_success_total ${registry.tsa.success}\n`;

  out += '\n# HELP certnode_tsa_error_total Total number of TSA request errors\n';
  out += '# TYPE certnode_tsa_error_total counter\n';
  out += `certnode_tsa_error_total ${registry.tsa.error}\n`;

  out += '\n# HELP certnode_tsa_duration_ms TSA request duration in milliseconds\n';
  out += '# TYPE certnode_tsa_duration_ms histogram\n';
  if (registry.tsa.duration && registry.tsa.duration.buckets) {
    let cum = 0;
    for (let i = 0; i < tsaBuckets.length; i++) {
      cum += registry.tsa.duration.buckets[i];
      out += `certnode_tsa_duration_ms_bucket{le="${tsaBuckets[i]}"} ${cum}\n`;
    }
    out += `certnode_tsa_duration_ms_bucket{le="+Inf"} ${registry.tsa.duration.count}\n`;
    out += `certnode_tsa_duration_ms_sum ${registry.tsa.duration.sum}\n`;
    out += `certnode_tsa_duration_ms_count ${registry.tsa.duration.count}\n`;
  } else {
    out += `certnode_tsa_duration_ms_bucket{le="+Inf"} 0\n`;
    out += `certnode_tsa_duration_ms_sum 0\n`;
    out += `certnode_tsa_duration_ms_count 0\n`;
  }

  return out;
}

module.exports = { emit, getPrometheusMetrics };
