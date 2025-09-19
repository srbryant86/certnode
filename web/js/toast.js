;(function(){
  function ensureContainer(){
    let c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      c.style.position = 'fixed';
      c.style.right = '16px';
      c.style.bottom = '16px';
      c.style.zIndex = '9999';
      document.body.appendChild(c);
    }
    return c;
  }
  window.showToast = function(msg, type){
    const c = ensureContainer();
    const t = document.createElement('div');
    t.textContent = msg;
    t.setAttribute('role','status');
    t.style.marginTop = '8px';
    t.style.padding = '10px 12px';
    t.style.borderRadius = '8px';
    t.style.background = (type === 'error') ? 'var(--error-bg, #fef2f2)' : 'var(--success-bg, #ecfdf5)';
    t.style.color = (type === 'error') ? 'var(--error, #b91c1c)' : 'var(--success, #065f46)';
    t.style.border = '1px solid ' + ((type === 'error') ? 'var(--error-border, #fecaca)' : 'var(--success-border, #a7f3d0)');
    c.appendChild(t);
    setTimeout(()=>{ t.remove(); }, 4000);
  }
})();

