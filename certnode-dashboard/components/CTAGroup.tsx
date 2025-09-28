'use client';

import { useState } from 'react';

const STARTER_TIER = 'starter';
const BUSINESS_TIER = 'business';

async function launchCheckout(tier: string) {
  try {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tier,
        billing: 'monthly',
        email: null,
      }),
    });

    if (!response.ok) {
      throw new Error('Checkout request failed');
    }

    const data = await response.json();
    const checkoutUrl = data.url || data.checkout_url || data.payment_link;
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  } catch (error) {
    console.error('CTA checkout error:', error);
  }
}

function highlightPlan(planId: string) {
  const pricingSection = document.getElementById('pricing-table');
  pricingSection?.scrollIntoView({ behavior: 'smooth' });

  setTimeout(() => {
    const card = document.querySelector(`[data-plan-id="${planId}"]`);
    if (card) {
      card.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
      setTimeout(() => {
        card.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
      }, 3000);
    }
  }, 400);
}

export default function CTAGroup() {
  const [isLaunching, setIsLaunching] = useState(false);

  const handleSandboxClick = async () => {
    if (isLaunching) return;
    setIsLaunching(true);
    highlightPlan(STARTER_TIER);
    await launchCheckout(STARTER_TIER);
    setIsLaunching(false);
  };

  const handleSalesClick = () => {
    highlightPlan(BUSINESS_TIER);
    window.location.href = 'mailto:contact@certnode.io?subject=Talk%20to%20CertNode%20Sales&body=Hi%20CertNode%20team,%20we%20would%20like%20to%20discuss%20enterprise%20options.';
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <button
        onClick={handleSandboxClick}
        disabled={isLaunching}
        className="bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-70"
        data-analytics="cta-sandbox"
      >
        {isLaunching ? 'Launching...' : 'Start Free Sandbox'}
      </button>
      <button
        onClick={handleSalesClick}
        className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors"
        data-analytics="cta-sales"
      >
        Talk to Sales
      </button>
    </div>
  );
}
