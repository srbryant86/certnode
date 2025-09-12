const emit = (name, value = 1, extra = {}) => {
  try {
    const evt = { event: String(name), ts: new Date().toISOString(), value };
    const out = Object.assign(evt, extra && typeof extra === 'object' ? extra : {});
    // Structured, single-line JSON for log collectors
    console.log(JSON.stringify(out));
  } catch (_) { /* never throw from metrics */ }
};

module.exports = { emit };