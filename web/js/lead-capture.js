// Lead capture and monetization tracking
document.addEventListener('DOMContentLoaded', () => {
  const enterpriseBtn = document.getElementById('enterprise-demo');
  const contactBtn = document.getElementById('contact-sales');
  const contactForm = document.getElementById('contact-form');
  const enterpriseForm = document.getElementById('enterprise-demo-form');
  const leadForm = document.getElementById('lead-form');
  const demoForm = document.getElementById('demo-form');
  const cancelBtn = document.getElementById('cancel-form');
  const cancelDemoBtn = document.getElementById('cancel-demo-form');
  const statusDiv = document.getElementById('form-status');
  const demoStatusDiv = document.getElementById('demo-form-status');

  // Track button clicks for monetization intel
  function trackEvent(action, data = {}) {
    const event = {
      action: action,
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      ...data
    };

    // Send to backend for revenue tracking
    fetch('/api/track-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    }).catch(() => {}); // Don't break UX if tracking fails

    console.log('Lead Event:', event);
  }

  // Show contact form
  function showContactForm(source) {
    contactForm.style.display = 'block';
    enterpriseForm.style.display = 'none';
    contactForm.scrollIntoView({ behavior: 'smooth' });
    trackEvent('contact_form_opened', { source: source });
  }

  // Show enterprise demo form using new modal
  function showEnterpriseForm() {
    // Use the new modal system instead of the old form
    if (typeof openAccessModal === 'function') {
      openAccessModal('enterprise');
    } else {
      // Fallback to old form if modal not available
      enterpriseForm.style.display = 'block';
      contactForm.style.display = 'none';
      enterpriseForm.scrollIntoView({ behavior: 'smooth' });
    }
    trackEvent('enterprise_demo_opened', {
      source: 'homepage',
      lead_quality: 'high_value'
    });
  }

  // Hide contact form
  function hideContactForm() {
    contactForm.style.display = 'none';
    statusDiv.className = 'status hidden';
    leadForm.reset();
  }

  // Hide demo form
  function hideDemoForm() {
    enterpriseForm.style.display = 'none';
    demoStatusDiv.className = 'status hidden';
    demoForm.reset();
  }

  // Event listeners
  enterpriseBtn?.addEventListener('click', () => {
    showEnterpriseForm();
  });

  contactBtn?.addEventListener('click', () => {
    showContactForm('contact_sales');
  });

  cancelBtn?.addEventListener('click', hideContactForm);
  cancelDemoBtn?.addEventListener('click', hideDemoForm);

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

      // For now, just log it (later: integrate with CRM/email)
      console.log('New Lead:', leadData);

      // Show success message
      statusDiv.className = 'status ok';
      statusDiv.textContent = 'Thank you! We\'ll contact you within 24 hours.';

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

  // Handle enterprise demo form submission
  demoForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const demoData = {
      type: 'enterprise-demo',
      company: document.getElementById('demo-company').value,
      email: document.getElementById('demo-email').value,
      compliance_type: document.getElementById('compliance-type').value,
      audit_budget: document.getElementById('audit-budget').value,
      failure_cost: document.getElementById('failure-cost').value,
      timeline: document.getElementById('timeline').value,
      timestamp: new Date().toISOString(),
      source: 'enterprise_demo_form'
    };

    // Show loading state
    demoStatusDiv.className = 'status';
    demoStatusDiv.textContent = 'Submitting enterprise demo request...';
    document.getElementById('submit-demo').disabled = true;

    try {
      // Track the enterprise demo request
      trackEvent('enterprise_demo_requested', demoData);

      // Submit to backend
      const response = await fetch('/api/track-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoData)
      });

      if (response.ok) {
        demoStatusDiv.className = 'status ok';
        demoStatusDiv.textContent = 'Demo scheduled! Our enterprise team will contact you within 4 hours.';

        // Calculate potential enterprise deal value
        let dealValue = 50000; // Base enterprise deal
        switch(demoData.audit_budget) {
          case 'under-100k': dealValue = 25000; break;
          case '100k-500k': dealValue = 100000; break;
          case '500k-1m': dealValue = 250000; break;
          case 'over-1m': dealValue = 500000; break;
        }

        // Track high-value enterprise lead
        trackEvent('enterprise_qualified_lead', {
          ...demoData,
          estimatedValue: dealValue,
          priority: demoData.timeline === 'immediate' ? 'urgent' : 'high',
          leadScore: calculateEnterpriseLeadScore(demoData)
        });

        // Reset form after delay
        setTimeout(() => {
          hideDemoForm();
          document.getElementById('submit-demo').disabled = false;
        }, 4000);

      } else {
        throw new Error('Demo request failed');
      }

    } catch (error) {
      demoStatusDiv.className = 'status err';
      demoStatusDiv.textContent = 'Error scheduling demo. Please try again or email sales@certnode.io';
      document.getElementById('submit-demo').disabled = false;

      trackEvent('enterprise_demo_failed', { error: error.message });
    }
  });

  // Calculate enterprise lead score
  function calculateEnterpriseLeadScore(data) {
    let score = 0;

    // Budget scoring
    if (data.audit_budget === 'over-1m') score += 50;
    else if (data.audit_budget === '500k-1m') score += 40;
    else if (data.audit_budget === '100k-500k') score += 30;

    // Failure cost scoring
    if (data.failure_cost === 'over-10m') score += 40;
    else if (data.failure_cost === '5m-10m') score += 30;
    else if (data.failure_cost === '1m-5m') score += 20;

    // Timeline urgency
    if (data.timeline === 'immediate') score += 30;
    else if (data.timeline === 'quarter') score += 20;

    // Compliance type (SOX/HIPAA are highest value)
    if (data.compliance_type === 'sox' || data.compliance_type === 'hipaa') score += 20;

    return score;
  }

  // Track page views for conversion funnel
  trackEvent('page_view', {
    referrer: document.referrer,
    utmSource: new URLSearchParams(window.location.search).get('utm_source')
  });
});