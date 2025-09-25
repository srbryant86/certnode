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

  function showLoading(){ $('#loading').style.display='block'; $('#login-prompt').style.display='none'; $('#signup-form').style.display='none'; $('#dashboard').style.display='none'; $('#error-message').style.display='none'; }
  function showLogin(){ $('#loading').style.display='none'; $('#login-prompt').style.display='block'; $('#signup-form').style.display='none'; $('#dashboard').style.display='none'; $('#error-message').style.display='none'; }
  function showSignup(){ $('#loading').style.display='none'; $('#login-prompt').style.display='none'; $('#signup-form').style.display='block'; $('#dashboard').style.display='none'; $('#error-message').style.display='none'; }
  function showDashboard(){ $('#loading').style.display='none'; $('#login-prompt').style.display='none'; $('#signup-form').style.display='none'; $('#dashboard').style.display='block'; $('#error-message').style.display='none'; }
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
    console.log('Displaying account data:', user);
    console.log('Current API key:', currentApiKey);

    const usagePercent = user.limit ? (user.usage / user.limit) * 100 : 0;
    $('#usage-used').textContent = user.usage.toLocaleString();
    $('#usage-limit').textContent = user.limit ? user.limit.toLocaleString() : 'Unlimited';
    $('#usage-remaining').textContent = user.limit ? (user.limit - user.usage).toLocaleString() : 'Unlimited';
    $('#usage-bar').style.width = Math.min(100, usagePercent) + '%';
    $('#current-tier').textContent = user.plan || 'Developer';
    $('#subscription-status').textContent = 'Active';
    $('#customer-email').textContent = user.email;

    // Show the current API key
    const apiKeyElement = $('#api-key-display');
    if (apiKeyElement) {
      apiKeyElement.textContent = currentApiKey || 'undefined';
    } else {
      console.error('API key display element not found');
    }
  }

  function copyApiKey(){ const apiKey = $('#api-key-display').textContent; navigator.clipboard.writeText(apiKey).then(()=>{}).catch(()=>{}); }
  async function openCustomerPortal(){ if(!currentApiKey){ showError('API key required'); return;} try{
    const response = await fetch('/api/create-portal', { method:'POST', headers:{ 'Authorization': `Bearer ${currentApiKey}` } });
    const data = await response.json(); if (data.portal_url) { window.location.href = data.portal_url; } else { showError('Unable to open billing portal. Please try again.'); }
  }catch(e){ console.error('Portal error:', e); showError('Unable to open billing portal. Please try again.'); } }

  function loadAccount(){ const apiKey = $('#api-key-input').value.trim(); if(!apiKey){ showError('Please enter a valid API key'); return;} currentApiKey = apiKey; localStorage.setItem('certnode_api_key', apiKey); loadAccountData(); }

  // Registration functionality
  async function registerAccount() {
    const email = $('#signup-email').value.trim();
    const company = $('#signup-company').value.trim();

    if (!email) {
      showError('Please enter your email address');
      return;
    }

    const registerBtn = $('#register-btn');
    const originalText = registerBtn.textContent;
    registerBtn.textContent = 'Creating Account...';
    registerBtn.disabled = true;

    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, company })
      });

      const data = await response.json();
      console.log('Registration response:', data);

      if (response.ok && data.success) {
        // Store API key and redirect to dashboard
        currentApiKey = data.apiKey;

        if (!data.apiKey) {
          console.error('API key is missing from response:', data);
          alert('Account created but API key is missing. Response: ' + JSON.stringify(data));
          showError('Account created but API key is missing. Please contact support.');
          return;
        }

        // Store in localStorage
        try {
          localStorage.setItem('certnode_api_key', data.apiKey);
        } catch(e) {
          console.warn('LocalStorage not available:', e);
        }

        // Show success with fallback alert
        try {
          showSuccessNotification('Account created successfully! Your API key is: ' + data.apiKey);
        } catch(e) {
          alert('Account created successfully! Your API key is: ' + data.apiKey);
        }

        // Redirect to account dashboard instead of causing 404
        setTimeout(function() {
          loadAccountData();
        }, 1000);
      } else {
        console.error('Registration failed:', data);
        var errorMsg = (data && data.message) ? data.message : 'Account creation failed. Please try again.';
        alert('Registration failed: ' + errorMsg);
        showError(errorMsg);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Network error during registration: ' + error.message);
      showError('Account creation failed. Please check your connection and try again.');
    }

    registerBtn.textContent = originalText;
    registerBtn.disabled = false;
  }

  const loadBtn = document.getElementById('load-account-btn'); if(loadBtn) loadBtn.addEventListener('click', loadAccount);
  const copyBtn = document.getElementById('copy-api-key-btn'); if(copyBtn) copyBtn.addEventListener('click', copyApiKey);
  const portalBtn = document.getElementById('open-portal-btn'); if(portalBtn) portalBtn.addEventListener('click', openCustomerPortal);

  // Registration form handlers
  const showSignupBtn = document.getElementById('show-signup-btn'); if(showSignupBtn) showSignupBtn.addEventListener('click', showSignup);
  const backToLoginBtn = document.getElementById('back-to-login-btn'); if(backToLoginBtn) backToLoginBtn.addEventListener('click', showLogin);
  const registrationForm = document.getElementById('registration-form'); if(registrationForm) registrationForm.addEventListener('submit', (e) => { e.preventDefault(); registerAccount(); });
});
