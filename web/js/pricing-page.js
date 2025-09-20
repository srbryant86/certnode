    <script>
        // Quote calculator helpers
        function computeEstimate(vol, opts){
            let base = 0;
            if (vol <= 2000000) base = 499;
            else if (vol <= 10000000) base = 1500;
            else base = 5000 + Math.ceil((vol - 10000000) / 5000000) * 1000;
            if (opts && opts.priority) base += 500;
            if (opts && opts.managed) base += 199;
            return base;
        }

        function updateEstimate(){
            const vol = parseInt(document.getElementById('monthly-volume')?.value || '0', 10);
            const priority = !!document.getElementById('opt-priority-slo')?.checked;
            const managed = !!document.getElementById('opt-managed-jwks')?.checked;
            const el = document.getElementById('est-price');
            if (!el) return;
            if (!vol || vol < 100000) { el.textContent = '—'; return; }
            el.textContent = `$${computeEstimate(vol, { priority, managed }).toLocaleString()}/month`;
        }

        document.addEventListener('input', (e) => {
            if (['monthly-volume','opt-priority-slo','opt-managed-jwks'].includes(e.target?.id)) updateEstimate();
        });

        // Stripe Checkout Integration
        async function startCheckout(tier) {
            // For developer tier (free), just redirect to signup/onboarding
            if (tier === 'developer') {
                // Redirect to developer signup/onboarding
                try { window.location.href = '/signup/developer'; } catch(_) {}
                return;
            }

            try {
                // Call the checkout API. When Payment Links are configured, email is not required.
                let response = await fetch('/api/create-checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tier })
                });

                // If server requires email (Stripe Checkout path), prompt and retry once
                if (!response.ok) {
                    let msg = 'Error creating checkout session';
                    try { const j = await response.json(); msg = j.message || msg; } catch {}
                    if (response.status === 400 && /email is required/i.test(msg)) {
                        const email = prompt('Enter your email address to continue:');
                        if (!email || !email.includes('@')) return alert('Please enter a valid email address.');
                        response = await fetch('/api/create-checkout', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ tier, email })
                        });
                    } else {
                        return alert(msg);
                    }
                }

                const data = await response.json();
                if (data && data.checkout_url) return window.location.href = data.checkout_url;
                alert('Error creating checkout session. Please try again.');
            } catch (error) {
                console.error('Checkout error:', error);
                alert('Error creating checkout session. Please try again.');
            }
        }

        // Show enterprise form
        function showEnterpriseForm() {
            document.getElementById('enterpriseModal').style.display = 'block';
            document.body.style.overflow = 'hidden';
        }

        // Close enterprise form
        function closeEnterpriseForm() {
            document.getElementById('enterpriseModal').style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('enterpriseModal');
            if (event.target === modal) {
                closeEnterpriseForm();
            }
        }

        // Submit enterprise form
        function submitEnterpriseForm(event) {
            event.preventDefault();

            const formData = new FormData(event.target);
            const data = Object.fromEntries(formData);
            const vol = parseInt(document.getElementById('monthly-volume').value || '0', 10);
            const priority = document.getElementById('opt-priority-slo').checked;
            const managed = document.getElementById('opt-managed-jwks').checked;
            const estimate = computeEstimate(vol, { priority, managed });

            // Create email body with form data
            const emailBody = `
Enterprise Consultation Request

Company: ${data.company}
Contact: ${data.name}
Email: ${data.email}
Phone: ${data.phone || 'Not provided'}

Expected Volume: ${data.volume}
Use Case: ${data.useCase}
Timeline: ${data.timeline}

Special Requirements:
${data.requirements || 'None specified'}

Estimated Monthly Receipts: ${vol.toLocaleString()}
Priority SLO: ${priority ? "Yes" : "No"}
Managed JWKS: ${managed ? "Yes" : "No"}
Estimated Price: ${estimate}/month

Please schedule an enterprise consultation to discuss CertNode implementation for our organization.
            `.trim();

            // Open email client with pre-filled data
            const subject = `Enterprise Consultation Request - ${data.company}`;
            const mailto = `mailto:contact@certnode.io?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
            window.location.href = mailto;

            // Show success message
            alert('Thank you! Your consultation request has been prepared. Please send the email to complete your request.');
            closeEnterpriseForm();

            // Reset form
            event.target.reset();
        }

        // Escape key closes modal
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeEnterpriseForm();
            }
        });
  </script>