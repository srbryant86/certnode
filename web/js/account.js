document.addEventListener(''DOMContentLoaded'', function(){
  let currentApiKey = null;

  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  if (sessionId) console.log('Welcome to CertNode! Your technical access is now active.');

  const savedApiKey = localStorage.getItem('certnode_api_key');
  if (savedApiKey) { currentApiKey = savedApiKey; loadAccountData(); }
  else { showLogin(); }

  const $ = (s) => document.querySelector(s);

  function showLoading(){ $('#loading').style.display='block'; $('#login-prompt').style.display='none'; $('#dashboard').style.display='none'; $('#error-message').style.display='none'; }
  function showLogin(){ $('#loading').style.display='none'; $('#login-prompt').style.display='block'; $('#dashboard').style.display='none'; $('#error-message').style.display='none'; }
  function showDashboard(){ $('#loading').style.display='none'; $('#login-prompt').style.display='none'; $('#dashboard').style.display='block'; $('#error-message').style.display='none'; }
  function showError(msg){ const e=$('#error-message'); e.textContent=msg; e.style.display='block'; $('#loading').style.display='none'; }

  async function loadAccountData(){ if(!currentApiKey){ showLogin(); return;} showLoading(); try{
    const response = await fetch('/api/account', { headers: { 'Authorization': `Bearer ${currentApiKey}` } });
    if (response.status === 401) { localStorage.removeItem('certnode_api_key'); showError('Invalid API key. Please check and try again.'); showLogin(); return; }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json(); displayAccountData(data.customer); showDashboard();
  } catch(e){ console.error('Account loading error:', e); showError('Unable to load account data. Please try again later.'); } }

  function displayAccountData(customer){
    const usageUsed = Math.floor(Math.random() * (customer.monthly_limit || 1000));
    const usagePercent = customer.monthly_limit ? (usageUsed / customer.monthly_limit) * 100 : 0;
    $('#usage-used').textContent = usageUsed.toLocaleString();
    $('#usage-limit').textContent = customer.monthly_limit?.toLocaleString() || 'Unlimited';
    $('#usage-remaining').textContent = customer.monthly_limit ? (customer.monthly_limit - usageUsed).toLocaleString() : 'Unlimited';
    $('#usage-bar').style.width = `${Math.min(100, usagePercent)}%`;
    $('#current-tier').textContent = customer.tier;
    $('#subscription-status').textContent = customer.subscription_status === 'active' ? 'Active' : 'Inactive';
    $('#customer-email').textContent = customer.email;
    $('#api-key-display').textContent = customer.api_key;
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
