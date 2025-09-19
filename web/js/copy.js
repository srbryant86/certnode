document.addEventListener('DOMContentLoaded', function(){
  const selector = 'code.code-snippet';
  document.querySelectorAll(selector).forEach((codeEl) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Copy to clipboard');
    btn.textContent = 'Copy';
    btn.style.marginLeft = '8px';
    btn.style.padding = '2px 6px';
    btn.style.border = '1px solid var(--border)';
    btn.style.borderRadius = '4px';
    btn.style.background = 'white';
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(codeEl.innerText);
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      } catch (_) {
        btn.textContent = 'Error';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      }
    });
    const wrapper = document.createElement('span');
    codeEl.parentNode.insertBefore(wrapper, codeEl.nextSibling);
    wrapper.appendChild(btn);
  });
});

