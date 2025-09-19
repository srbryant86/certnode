document.addEventListener('DOMContentLoaded', function() {
  if (typeof SwaggerUIBundle === 'function') {
    window.ui = SwaggerUIBundle({
      url: '/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.presets.standalone
      ],
      plugins: [ SwaggerUIBundle.plugins.DownloadUrl ],
      layout: 'BaseLayout',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      docExpansion: 'list',
      filter: true,
      showRequestHeaders: true,
      showCommonExtensions: true,
      tryItOutEnabled: true
    });
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

