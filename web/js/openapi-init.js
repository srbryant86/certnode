document.addEventListener('DOMContentLoaded', function() {
  // Simple fallback for when external API viewer isn't available
  const swaggerContainer = document.getElementById('swagger-ui');
  if (swaggerContainer && !window.SwaggerUIBundle) {
    swaggerContainer.innerHTML = `
      <div style="text-align: center; padding: 40px; background: var(--panel); border-radius: 8px; border: 1px solid var(--border);">
        <h3 style="color: var(--primary); margin-bottom: 16px;">API Specification</h3>
        <p style="margin-bottom: 20px; color: var(--text-muted);">Interactive API documentation is temporarily unavailable.</p>
        <a href="/openapi.json" style="color: var(--primary); text-decoration: none; font-weight: 600;">Download OpenAPI JSON →</a>
      </div>`;
  }

  const tabOverview = document.getElementById('tab-overview');
  const tabApi = document.getElementById('tab-api');
  const contentOverview = document.getElementById('content-overview');
  const contentApi = document.getElementById('content-api');

  function showOverview() {
    if (!tabOverview || !tabApi || !contentOverview || !contentApi) return;
    tabOverview.style.background = 'var(--primary)';
    tabOverview.style.color = 'white';
    tabApi.style.background = 'var(--panel)';
    tabApi.style.color = 'var(--text-muted)';
    contentOverview.style.display = 'block';
    contentApi.style.display = 'none';
  }

  function showApi() {
    if (!tabOverview || !tabApi || !contentOverview || !contentApi) return;
    tabApi.style.background = 'var(--primary)';
    tabApi.style.color = 'white';
    tabOverview.style.background = 'var(--panel)';
    tabOverview.style.color = 'var(--text-muted)';
    contentOverview.style.display = 'none';
    contentApi.style.display = 'block';
    if (window.ui && window.ui.getSystem) {
      setTimeout(() => {
        try { window.ui.getSystem().layoutActions.updateLayout('BaseLayout'); } catch(_) {}
      }, 100);
    }
  }

  if (tabOverview && tabApi) {
    tabOverview.addEventListener('click', showOverview);
    tabApi.addEventListener('click', showApi);
    showOverview();
  }
});

