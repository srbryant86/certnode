document.addEventListener('DOMContentLoaded', function(){
  let currentApiKey = null;

  // Handle successful subscription redirect
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  const isSuccess = urlParams.get('success') === 'true';

  if (sessionId || isSuccess) {
    // Show success notification
    showSuccessNotification('Welcome to CertNode! Your subscription is now active. API keys are delivered within 4 hours.');
    // Clean URL without refreshing
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const savedApiKey = localStorage.getItem('certnode_api_key') || sessionStorage.getItem('certnode_api_key');
  if (savedApiKey) {
    currentApiKey = savedApiKey;
    // Move from sessionStorage to localStorage for persistence
    if (sessionStorage.getItem('certnode_api_key')) {
      localStorage.setItem('certnode_api_key', savedApiKey);
      sessionStorage.removeItem('certnode_api_key');
    }
    loadAccountData();
  }
  else { showLogin(); }

  const $ = (s) => document.querySelector(s);

  function showLoading(){ $('#loading').style.display='block'; $('#login-prompt').style.display='none'; $('#dashboard').style.display='none'; $('#error-message').style.display='none'; }
  function showLogin(){ $('#loading').style.display='none'; $('#login-prompt').style.display='block'; $('#dashboard').style.display='none'; $('#error-message').style.display='none'; }
  function showDashboard(){ $('#loading').style.display='none'; $('#login-prompt').style.display='none'; $('#dashboard').style.display='block'; $('#error-message').style.display='none'; }
  function showError(msg){ const e=$('#error-message'); e.textContent=msg; e.style.display='block'; $('#loading').style.display='none'; }

  function showSuccessNotification(msg) {
    // Create success notification element if it doesn't exist
    let successEl = document.getElementById('success-notification');
    if (!successEl) {
      successEl = document.createElement('div');
      successEl.id = 'success-notification';
      successEl.className = 'success';
      successEl.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 1000; max-width: 400px; animation: slideIn 0.3s ease;';
      document.body.appendChild(successEl);
    }
    successEl.textContent = msg;
    successEl.style.display = 'block';

    // Auto-hide after 8 seconds
    setTimeout(() => {
      if (successEl) {
        successEl.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => successEl.remove(), 300);
      }
    }, 8000);
  }

  async function loadAccountData(){ if(!currentApiKey){ showLogin(); return;} showLoading(); try{
    const response = await fetch('/api/users/me', { headers: { 'Authorization': `Bearer ${currentApiKey}` } });
    if (response.status === 401) { localStorage.removeItem('certnode_api_key'); showError('Invalid API key. Please check and try again.'); showLogin(); return; }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json(); displayAccountData(data.user); showDashboard();
  } catch(e){ console.error('Account loading error:', e); showError('Unable to load account data. Please try again later.'); } }

  function displayAccountData(user){
    const usagePercent = user.limit ? (user.usage / user.limit) * 100 : 0;
    $('#usage-used').textContent = user.usage.toLocaleString();
    $('#usage-limit').textContent = user.limit?.toLocaleString() || 'Unlimited';
    $('#usage-remaining').textContent = user.limit ? (user.limit - user.usage).toLocaleString() : 'Unlimited';
    $('#usage-bar').style.width = `${Math.min(100, usagePercent)}%`;
    $('#current-tier').textContent = user.plan || 'Developer';
    $('#subscription-status').textContent = 'Active';
    $('#customer-email').textContent = user.email;
    $('#api-key-display').textContent = currentApiKey; // Show the current API key
  }

  function copyApiKey(){ const apiKey = $('#api-key-display').textContent; navigator.clipboard.writeText(apiKey).then(()=>{}).catch(()=>{}); }
  async function openCustomerPortal(){ if(!currentApiKey){ showError('API key required'); return;} try{
    const response = await fetch('/api/create-portal', { method:'POST', headers:{ 'Authorization': `Bearer ${currentApiKey}` } });
    const data = await response.json(); if (data.portal_url) { window.location.href = data.portal_url; } else { showError('Unable to open billing portal. Please try again.'); }
  }catch(e){ console.error('Portal error:', e); showError('Unable to open billing portal. Please try again.'); } }

  function loadAccount(){ const apiKey = $('#api-key-input').value.trim(); if(!apiKey){ showError('Please enter a valid API key'); return;} currentApiKey = apiKey; localStorage.setItem('certnode_api_key', apiKey); loadAccountData(); }

  const loadBtn = document.getElementById('load-account-btn'); if(loadBtn) loadBtn.addEventListener('click', loadAccount);
  const copyBtn = document.getElementById('copy-api-key-btn'); if(copyBtn) copyBtn.addEventListener('click', copyApiKey);
  const portalBtn = document.getElementById('open-portal-btn'); if(portalBtn) portalBtn.addEventListener('click', openCustomerPortal);
});
