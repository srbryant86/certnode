document.addEventListener('DOMContentLoaded', () => {
  const demo = new DemoController();
  demo.init();

  const monitor = new ConnectionMonitor();
  monitor.init();
});

class DemoController {
  init() {
    this.step1 = document.getElementById('step1');
    this.step2 = document.getElementById('step2');
    this.step3 = document.getElementById('step3');
    this.progressBar = document.getElementById('progress-bar');
    this.signingAnimation = document.getElementById('signing-animation');
    this.signatureResult = document.getElementById('signature-result');
    this.documentContent = document.getElementById('document-content');
    this.tamperResult = document.getElementById('tamper-result');

    this.originalContent = this.documentContent ? this.documentContent.value : '';

    const chooseFileBtn = document.getElementById('choose-file-btn');
    const fileInput = document.getElementById('demo-file');
    const useSampleBtn = document.getElementById('use-sample');
    const proceedTamperBtn = document.getElementById('proceed-tamper');
    const verifyIntegrityBtn = document.getElementById('verify-integrity');
    const requestImpl = document.getElementById('request-implementation');
    const cancelForm = document.getElementById('cancel-demo-form');

    if (chooseFileBtn && fileInput) {
      chooseFileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
      });
      fileInput.addEventListener('change', () => this.startSignFlow());
    }

    if (useSampleBtn) {
      useSampleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.startSignFlow();
      });
    }

    if (proceedTamperBtn) {
      proceedTamperBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showStep(3);
        // Capture pristine content at the start of step 3
        if (this.documentContent) this.originalContent = this.documentContent.value;
      });
    }

    if (verifyIntegrityBtn) {
      verifyIntegrityBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.checkIntegrity();
      });
    }

    if (this.documentContent) {
      this.documentContent.addEventListener('input', () => {
        if (this.documentContent.value !== this.originalContent) {
          this.documentContent.style.borderColor = 'var(--warning)';
          this.documentContent.style.background = 'var(--warning-bg)';
        } else {
          this.documentContent.style.borderColor = 'var(--border)';
          this.documentContent.style.background = 'white';
        }
      });
    }

    if (requestImpl) {
      requestImpl.addEventListener('click', (e) => {
        e.preventDefault();
        const form = document.getElementById('enterprise-demo-form');
        if (form) {
          form.style.display = 'block';
          form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    if (cancelForm) {
      cancelForm.addEventListener('click', (e) => {
        e.preventDefault();
        const form = document.getElementById('enterprise-demo-form');
        if (form) form.style.display = 'none';
      });
    }
  }

  startSignFlow() {
    this.showStep(2);
    // animate progress
    requestAnimationFrame(() => {
      if (this.progressBar) this.progressBar.style.width = '100%';
    });
    // reveal result after a short delay
    setTimeout(() => {
      if (this.signingAnimation) this.signingAnimation.style.display = 'none';
      if (this.signatureResult) this.signatureResult.style.display = 'block';
    }, 2000);
  }

  showStep(n) {
    if (this.step1) this.step1.style.display = n === 1 ? 'block' : 'none';
    if (this.step2) this.step2.style.display = n === 2 ? 'block' : 'none';
    if (this.step3) this.step3.style.display = n === 3 ? 'block' : 'none';
  }

  checkIntegrity() {
    if (!this.tamperResult || !this.documentContent) return;
    const changed = this.documentContent.value !== this.originalContent;
    this.tamperResult.style.display = 'block';
    if (changed) {
      this.tamperResult.innerHTML = `
        <div style="background: var(--error-bg); border: 1px solid var(--error-border); border-radius: 8px; padding: 16px;">
          <strong style="color: var(--error);">Tamper detected</strong>
          <p style="margin: 8px 0 0 0; font-size: 14px;">Document has been modified since signing. Hash mismatch detected.</p>
        </div>
      `;
    } else {
      this.tamperResult.innerHTML = `
        <div style="background: var(--success-bg); border: 1px solid var(--success-border); border-radius: 8px; padding: 16px;">
          <strong style="color: var(--success);">Integrity verified</strong>
          <p style="margin: 8px 0 0 0; font-size: 14px;">Document has not been modified since signing.</p>
        </div>
      `;
    }
  }
}

// Connection status indicator
class ConnectionMonitor {
  init() {
    this.live = document.getElementById('live-region');
    if (!this.live) return;
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }
  handleOnline() {
    if (this.live) this.live.textContent = '';
  }
  handleOffline() {
    if (this.live) this.live.textContent = 'Connection lost. Some features may be unavailable.';
  }
}

