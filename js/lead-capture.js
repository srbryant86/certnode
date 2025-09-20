// Lead capture and monetization tracking
document.addEventListener('DOMContentLoaded', () => {
  const enterpriseBtn = document.getElementById('enterprise-demo');
  const contactBtn = document.getElementById('contact-sales');
  const contactForm = document.getElementById('contact-form');
  const leadForm = document.getElementById('lead-form');
  const cancelBtn = document.getElementById('cancel-form');
  const statusDiv = document.getElementById('form-status');

  // Track button clicks for monetization intel
  function trackEvent(action, data = {}) {
    const event = {
      action: action,
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      ...data
    };

    // Send to backend for revenue tracking (with graceful fallback)
    if (typeof fetch !== 'undefined') {
      fetch('/api/track-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      }).catch(() => {
        // Graceful fallback - store locally for future sync
        console.log('Lead tracking endpoint unavailable, event logged locally:', event);
        localStorage.setItem('pending_lead_' + Date.now(), JSON.stringify(event));
      });
    }

    console.log('Lead Event:', event);
  }

  // Show contact form
  function showContactForm(source) {
    contactForm.style.display = 'block';
    contactForm.scrollIntoView({ behavior: 'smooth' });
    trackEvent('contact_form_opened', { source: source });
  }

  // Hide contact form
  function hideContactForm() {
    contactForm.style.display = 'none';
    statusDiv.className = 'status hidden';
    leadForm.reset();
  }

  // Event listeners
  enterpriseBtn?.addEventListener('click', () => {
    showContactForm('enterprise_demo');
  });

  contactBtn?.addEventListener('click', () => {
    showContactForm('contact_sales');
  });

  cancelBtn?.addEventListener('click', hideContactForm);

  // Handle form submission
  leadForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(leadForm);
    const leadData = {
      company: document.getElementById('company').value,
      email: document.getElementById('email').value,
      name: document.getElementById('name').value,
      useCase: document.getElementById('use-case').value,
      companySize: document.getElementById('company-size').value,
      urgency: document.getElementById('urgency').value,
      timestamp: new Date().toISOString(),
      source: 'website_form'
    };

    // Show loading state
    statusDiv.className = 'status';
    statusDiv.textContent = 'Submitting...';
    document.getElementById('submit-lead').disabled = true;

    try {
      // Track the lead submission
      trackEvent('lead_submitted', leadData);

      // Store lead data locally for now (works without backend)
      localStorage.setItem('lead_' + Date.now(), JSON.stringify(leadData));
      console.log('New Lead stored locally:', leadData);

      // Show success message with fallback information
      statusDiv.className = 'status ok';
      statusDiv.innerHTML = 'Thank you! Your information has been saved.<br><small>We\'ll contact you at: ' + leadData.email + '</small>';

      // Calculate potential deal value based on company size
      let potentialValue = 0;
      switch(leadData.companySize) {
        case 'startup': potentialValue = 5000; break;
        case 'smb': potentialValue = 25000; break;
        case 'mid-market': potentialValue = 100000; break;
        case 'enterprise': potentialValue = 500000; break;
        default: potentialValue = 25000;
      }

      trackEvent('potential_deal_created', {
        ...leadData,
        estimatedValue: potentialValue,
        priority: leadData.urgency === 'immediate' ? 'high' : 'medium'
      });

      // Reset form after delay
      setTimeout(() => {
        hideContactForm();
        document.getElementById('submit-lead').disabled = false;
      }, 3000);

    } catch (error) {
      statusDiv.className = 'status err';
      statusDiv.textContent = 'Error submitting form. Please try again.';
      document.getElementById('submit-lead').disabled = false;

      trackEvent('lead_submission_failed', { error: error.message });
    }
  });

  // Track page views for conversion funnel
  trackEvent('page_view', {
    referrer: document.referrer,
    utmSource: new URLSearchParams(window.location.search).get('utm_source')
  });
});