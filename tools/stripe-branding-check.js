#!/usr/bin/env node
/**
 * Prints Stripe account branding/public name to verify Checkout shows "CertNode".
 * Usage: STRIPE_SECRET_KEY=sk_live_... node tools/stripe-branding-check.js
 */
(async () => {
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.error('Missing STRIPE_SECRET_KEY');
      process.exit(1);
    }
    const stripe = require('stripe')(key);
    const acct = await stripe.accounts.retrieve();
    const out = {
      account_id: acct.id,
      business_type: acct.business_type,
      business_profile: {
        name: acct.business_profile?.name || null,
        support_email: acct.business_profile?.support_email || null,
        support_url: acct.business_profile?.support_url || null,
        url: acct.business_profile?.url || null,
        product_description: acct.business_profile?.product_description || null,
      },
      branding: {
        display_name: acct.settings?.branding?.display_name || null,
        primary_color: acct.settings?.branding?.primary_color || null,
        secondary_color: acct.settings?.branding?.secondary_color || null,
        logo: acct.settings?.branding?.logo || null,
        icon: acct.settings?.branding?.icon || null,
      },
      public_details: {
        // In most regions, Checkout uses settings.branding.display_name and public business name
        // Public business name is not directly exposed via Accounts API; rely on branding.display_name
      },
      statement_descriptor: acct.settings?.payments?.statement_descriptor || null
    };
    console.log(JSON.stringify(out, null, 2));
    if (!out.branding.display_name || !/certnode/i.test(out.branding.display_name)) {
      console.warn('Note: Branding display_name does not contain "CertNode". Update Dashboard → Settings → Branding (both Test and Live).');
    }
  } catch (e) {
    console.error('Stripe check failed:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();

