// Minimal local API reference web component (self-contained, no external CDN)
class ApiReferenceElement extends HTMLElement {
  connectedCallback() {
    const cfgAttr = this.getAttribute('configuration');
    let url = '/openapi.json';
    try { if (cfgAttr) { const cfg = JSON.parse(cfgAttr); url = cfg?.spec?.url || url; } } catch {}
    this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      :host { display: block; }
      .wrap { border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; background:#fff; }
      .hdr { padding:16px 20px; border-bottom:1px solid #e2e8f0; background:#f8fafc; }
      .hdr strong { font-weight:600; color:#0f172a; }
      .hdr code { color:#64748b; }
      .body { padding:16px 20px; white-space:pre-wrap; overflow:auto; color:#0f172a; font: 14px/1.6 system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
      .path { margin:12px 0 6px; font-weight:600; color:#0f172a; }
      .op { color:#334155; }
    `;
    const root = document.createElement('div');
    root.className = 'wrap';
    root.innerHTML = `
      <div class="hdr">
        <strong>OpenAPI Specification</strong>
        <span style="color:#64748b;margin-left:8px">(<code>${url}</code>)</span>
      </div>
      <div id="content" class="body">Loading…</div>`;
    this.shadowRoot.append(style, root);
    fetch(url, { headers:{ 'Accept':'application/json' }})
      .then(r=>r.json())
      .then(spec => {
        const c = this.shadowRoot.getElementById('content');
        try {
          const parts = [];
          if (spec.info?.title) parts.push(`# ${spec.info.title}`);
          if (spec.info?.description) parts.push(spec.info.description);
          const paths = spec.paths || {};
          for (const [p, ops] of Object.entries(paths)) {
            parts.push('', `## ${p}`);
            for (const [method, op] of Object.entries(ops)) {
              parts.push(`- ${method.toUpperCase()} — ${op.summary || ''}`);
            }
          }
          c.textContent = parts.join('\n');
        } catch {
          c.textContent = JSON.stringify(spec, null, 2);
        }
      })
      .catch(err => {
        const c = this.shadowRoot.getElementById('content');
        c.textContent = 'Failed to load OpenAPI: ' + (err && err.message || String(err));
      });
  }
}

customElements.define('api-reference', ApiReferenceElement);

