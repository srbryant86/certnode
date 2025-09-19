document.addEventListener('DOMContentLoaded', function(){
  // Pricing CTA buttons
  document.querySelectorAll('button[data-tier]').forEach(function(btn){
    btn.addEventListener('click', async function(){
      const tier = btn.getAttribute('data-tier');
      if (tier === 'developer') {
        window.location.href = '/signup/developer';
        return;
      }
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Redirecting…¦';
      try{
        const res = await fetch('/api/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier })
        });
        const data = await res.json().catch(()=>({}));
        if (!res.ok) throw new Error((data && (data.message||data.error)) || ('HTTP '+res.status));
        if (data && data.checkout_url) {
          window.location.href = data.checkout_url;
        } else {
          throw new Error('No checkout URL returned');
        }
      } catch(e){
        (typeof showToast==='function'? showToast('Checkout failed: '+((e&&e.message)||'unexpected'),'error') : showPricingError('Checkout error: '+((e&&e.message)||'unexpected')));
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  });

  // Enterprise modal controls
  const modal = document.getElementById('enterpriseModal');
  const openBtn = document.getElementById('contact-sales-btn');
  const closeBtn = document.getElementById('enterpriseModalClose');
  if (openBtn && modal) openBtn.addEventListener('click', ()=> { modal.style.display = 'block'; });
  if (closeBtn && modal) closeBtn.addEventListener('click', ()=> { modal.style.display = 'none'; });
  window.addEventListener('click', (e)=>{ if (e.target === modal) modal.style.display = 'none'; });

  // Enterprise form submission -> leads endpoint
  const form = document.getElementById('enterpriseForm');
  if (form) {
    form.addEventListener('submit', async function(ev){
      ev.preventDefault();
      const status = document.getElementById('enterprise-status');
      function setStatus(txt, ok){ if(!status) return; status.textContent = txt; status.style.display='block'; status.style.color = ok ? 'var(--success)' : 'var(--error)'; }
      try{
        const payload = {
          action: 'enterprise_consultation',
          monthly_volume: document.getElementById('monthly-volume')?.value,
          company: document.getElementById('company')?.value,
          name: document.getElementById('name')?.value,
          email: document.getElementById('email')?.value,
          phone: document.getElementById('phone')?.value,
          volume: document.getElementById('volume')?.value,
          useCase: document.getElementById('useCase')?.value,
          timeline: document.getElementById('timeline')?.value,
          priority_slo: document.getElementById('opt-priority-slo')?.checked || false,
          managed_jwks: document.getElementById('opt-managed-jwks')?.checked || false
        };
        const res = await fetch('/api/leads', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
        const data = await res.json().catch(()=>({}));
        if (!res.ok) throw new Error((data && (data.message||data.error)) || ('HTTP '+res.status));
        setStatus('Request received. We will contact you shortly.', true);
      } catch(e){
        setStatus('Submit error: '+(e && e.message || 'invalid data'), false);
      }
    });
  }
});

function showPricingError(msg){
  let div = document.getElementById('pricing-status');
  if (!div) {
    div = document.createElement('div');
    div.id = 'pricing-status';
    div.style.margin = '16px 0';
    div.style.color = 'var(--error)';
    const container = document.querySelector('.pricing-container') || document.body;
    container.insertBefore(div, container.firstChild);
  }
  div.textContent = msg;
}
