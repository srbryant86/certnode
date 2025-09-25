'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatPriceWithPeriod, calculateYearlyPrice } from '@/lib/currency';
import { PricingAnalytics } from '@/lib/analytics';

interface PricingTier {
  id: string;
  name: string;
  priceMonthly: number;
  includedReceipts: number;
  overagePerReceipt: number;
  tagline: string;
  features: string[];
}

interface PricingTableProps {
  tiers: PricingTier[];
  highlightTier?: string;
}

export default function PricingTable({ tiers, highlightTier = 'growth' }: PricingTableProps) {
  const [isYearly, setIsYearly] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [analytics] = useState(() => PricingAnalytics.getInstance());

  // Track billing toggle changes
  const handleBillingToggle = (yearly: boolean) => {
    setIsYearly(yearly);
    analytics.trackInteraction('billing_toggle', {
      billing: yearly ? 'yearly' : 'monthly',
      previousBilling: isYearly ? 'yearly' : 'monthly'
    });
  };

  // Track currency changes
  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    analytics.trackInteraction('currency_change', {
      currency: newCurrency,
      previousCurrency: currency
    });
  };

  // Handle checkout
  const handleCheckout = async (tierId: string) => {
    // Track the checkout attempt
    analytics.trackInteraction('checkout_start', {
      planId: tierId,
      billing: isYearly ? 'yearly' : 'monthly',
      currency
    });

    // Map display tier names to API tiers
    const tierMap: { [key: string]: string } = {
      'starter': 'starter',
      'growth': 'professional',
      'business': 'business'
    };

    const mappedTier = tierMap[tierId];
    if (!mappedTier) {
      console.error('Invalid tier:', tierId);
      return;
    }

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: mappedTier,
          email: null // Will be collected by Stripe
        })
      });

      if (!response.ok) {
        throw new Error('Checkout failed');
      }

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else if (data.payment_link) {
        // Use payment link if configured
        window.location.href = data.payment_link;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      analytics.trackInteraction('checkout_error', {
        planId: tierId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Could show a user-friendly error message here
    }
  };

  // Track when plans come into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const planId = (entry.target as HTMLElement).dataset.planId;
            if (planId) {
              analytics.trackInteraction('plan_view', {
                planId,
                viewDuration: Date.now()
              });
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const planCards = document.querySelectorAll('[data-plan-id]');
    planCards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [analytics]);

  return (
    <div className="space-y-8">
      {/* Toggle Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        {/* Monthly/Yearly Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => handleBillingToggle(false)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              !isYearly
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => handleBillingToggle(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isYearly
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            <span className="ml-1 text-green-600 text-xs">(2 months free)</span>
          </button>
        </div>

        {/* Currency Selector */}
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
        </select>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const isHighlighted = tier.id === highlightTier;
          const monthlyPrice = tier.priceMonthly;
          const yearlyPrice = calculateYearlyPrice(monthlyPrice);
          const displayPrice = isYearly ? yearlyPrice / 12 : monthlyPrice;

          return (
            <div
              key={tier.id}
              className={`relative rounded-2xl border-2 p-8 ${
                isHighlighted
                  ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } transition-all`}
            >
              {isHighlighted && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {tier.name}
                </h3>
                <p className="text-gray-600 mb-6">
                  {tier.tagline}
                </p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatCurrency(displayPrice, currency)}
                  </span>
                  <span className="text-gray-600 ml-1">
                    /{isYearly ? 'month' : 'month'}
                  </span>
                  {isYearly && (
                    <div className="text-sm text-green-600 mt-1">
                      Save {formatCurrency((monthlyPrice - yearlyPrice / 12) * 12, currency)} annually
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleCheckout(tier.id)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    isHighlighted
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                  data-analytics={`pricing-select-${tier.id}`}
                >
                  Get Started
                </button>
              </div>

              <div className="mt-8 space-y-3">
                <h4 className="font-semibold text-gray-900">
                  {tier.includedReceipts.toLocaleString()} receipts included
                </h4>
                <p className="text-sm text-gray-600">
                  {formatCurrency(tier.overagePerReceipt, currency)} per additional receipt
                </p>

                <ul className="space-y-2">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* VAT Note */}
      <p className="text-sm text-gray-500 text-center">
        Prices exclude taxes; VAT/GST may apply.
      </p>
    </div>
  );
}