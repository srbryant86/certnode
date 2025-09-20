(function(){
  function showManageBilling(){
    var link = document.getElementById('manage-billing');
    if (!link) return;
    var apiKey = localStorage.getItem('certnode_api_key');
    if (!apiKey) return; // only show for authenticated users
    link.style.display = 'inline-block';
    link.addEventListener('click', async function(e){
      e.preventDefault();
      try{
        const r = await fetch('/api/portal', { method:'POST', headers: { 'Authorization': 'Bearer '+apiKey } });
        const data = await r.json();
        if (data && data.portal_url) { location.href = data.portal_url; }
        else throw new Error(data && (data.error||data.message) || 'No URL');
      }catch(err){
        if (window.showToast) showToast('Portal failed: '+(err && err.message || 'unexpected'), 'error');
      }
    });
  }
  document.addEventListener('DOMContentLoaded', showManageBilling);
})();
