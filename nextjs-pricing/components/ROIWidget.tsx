'use client';

import { useState, useEffect } from 'react';
import { calculateROI, getROIRecommendation, formatCurrency, formatPercentage } from '@/lib/roi';
import { PricingAnalytics } from '@/lib/analytics';

interface ROIWidgetProps {
  isAlwaysVisible?: boolean;
  defaultPlanPrice?: number;
}

export default function ROIWidget({
  isAlwaysVisible = false,
  defaultPlanPrice = 199
}: ROIWidgetProps) {
  const [isOpen, setIsOpen] = useState(isAlwaysVisible);
  const [isHydrated, setIsHydrated] = useState(false);
  const [analytics] = useState(() => PricingAnalytics.getInstance());

  // ROI Calculator inputs
  const [ticket, setTicket] = useState(2500);
  const [monthlySales, setMonthlySales] = useState(50);
  const [disputeRatePct, setDisputeRatePct] = useState(5);
  const [deflectionRatePct, setDeflectionRatePct] = useState(35);
  const [planPrice, setPlanPrice] = useState(defaultPlanPrice);

  // Hydration and localStorage
  useEffect(() => {
    setIsHydrated(true);

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('certnode_roi_settings');
      if (saved) {
        try {
          const settings = JSON.parse(saved);
          setTicket(settings.ticket || 2500);
          setMonthlySales(settings.monthlySales || 50);
          setDisputeRatePct(settings.disputeRatePct || 5);
          setDeflectionRatePct(settings.deflectionRatePct || 35);
        } catch (e) {
          console.warn('Failed to load ROI settings:', e);
        }
      }
    }
  }, []);

  // Save settings to localStorage and track analytics
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      const settings = {
        ticket,
        monthlySales,
        disputeRatePct,
        deflectionRatePct
      };
      localStorage.setItem('certnode_roi_settings', JSON.stringify(settings));

      // Track ROI calculation with analytics
      analytics.trackInteraction('roi_calculation', {
        avgTicket: ticket,
        monthlySales,
        disputeRate: disputeRatePct,
        deflectionRate: deflectionRatePct,
        planPrice
      });
    }
  }, [ticket, monthlySales, disputeRatePct, deflectionRatePct, isHydrated, analytics, planPrice]);

  const roi = calculateROI({
    ticket,
    monthlySales,
    disputeRatePct,
    deflectionRatePct,
    planPriceMonthly: planPrice
  });

  const recommendation = getROIRecommendation(roi, 'This plan');

  const handleOpenCalculator = () => {
    setIsOpen(true);
    // Analytics event (only if consent given)
    if (typeof window !== 'undefined' && (window as any).consentGiven) {
      // Track calculator open event
      console.log('ROI Calculator opened');
    }
  };

  if (!isHydrated) {
    return (
      <div className="bg-white rounded-lg shadow-lg border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!isOpen && !isAlwaysVisible) {
    return (
      <div className="bg-white rounded-lg shadow-lg border p-6">
        <h3 className="text-lg font-semibold mb-2">See Your Savings</h3>
        <p className="text-gray-600 mb-4">
          Calculate how much you could save from dispute protection
        </p>
        <button
          onClick={handleOpenCalculator}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          data-analytics="roi-calculator-open"
        >
          Open ROI Calculator
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">ROI Calculator</h3>
        {!isAlwaysVisible && (
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Average Ticket */}
        <div>
          <label htmlFor="ticket" className="block text-sm font-medium text-gray-700 mb-1">
            Average Ticket ($)
          </label>
          <input
            type="number"
            id="ticket"
            value={ticket}
            onChange={(e) => setTicket(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-describedby="ticket-help"
          />
          <p id="ticket-help" className="text-xs text-gray-500 mt-1">
            Average transaction value
          </p>
        </div>

        {/* Monthly Sales */}
        <div>
          <label htmlFor="monthlySales" className="block text-sm font-medium text-gray-700 mb-1">
            Monthly Sales (count)
          </label>
          <input
            type="number"
            id="monthlySales"
            value={monthlySales}
            onChange={(e) => setMonthlySales(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-describedby="sales-help"
          />
          <p id="sales-help" className="text-xs text-gray-500 mt-1">
            Number of transactions per month
          </p>
        </div>

        {/* Dispute Rate */}
        <div>
          <label htmlFor="disputeRate" className="block text-sm font-medium text-gray-700 mb-1">
            Dispute Rate ({formatPercentage(disputeRatePct)})
          </label>
          <input
            type="range"
            id="disputeRate"
            min="0"
            max="20"
            step="0.5"
            value={disputeRatePct}
            onChange={(e) => setDisputeRatePct(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            aria-describedby="dispute-help"
          />
          <p id="dispute-help" className="text-xs text-gray-500 mt-1">
            Percentage of sales that become disputes
          </p>
        </div>

        {/* Deflection Rate */}
        <div>
          <label htmlFor="deflectionRate" className="block text-sm font-medium text-gray-700 mb-1">
            Deflection Rate ({formatPercentage(deflectionRatePct)})
          </label>
          <input
            type="range"
            id="deflectionRate"
            min="10"
            max="60"
            step="5"
            value={deflectionRatePct}
            onChange={(e) => setDeflectionRatePct(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            aria-describedby="deflection-help"
          />
          <p id="deflection-help" className="text-xs text-gray-500 mt-1">
            Percentage of disputes CertNode can deflect
          </p>
        </div>

        {/* Results */}
        <div className="bg-blue-50 p-4 rounded-lg mt-6" role="region" aria-live="polite">
          <h4 className="font-semibold text-blue-900 mb-3">Your Potential Savings</h4>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Monthly Disputes:</span>
              <div className="font-semibold">{roi.monthlyDisputes.toFixed(1)}</div>
            </div>
            <div>
              <span className="text-blue-700">Deflected:</span>
              <div className="font-semibold">{roi.deflectedDisputes.toFixed(1)}</div>
            </div>
            <div>
              <span className="text-blue-700">Monthly Savings:</span>
              <div className="font-semibold">{formatCurrency(roi.monthlySavings)}</div>
            </div>
            <div>
              <span className="text-blue-700">Annual Savings:</span>
              <div className="font-semibold text-green-600">{formatCurrency(roi.annualSavings)}</div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-white rounded border-l-4 border-blue-500">
            <div className="text-sm text-gray-700">
              <strong>Plan pays for itself in {roi.disputesToPayPlan} prevented disputes</strong>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              ROI: {formatPercentage(roi.effectiveROI)}
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
          <p className="text-sm text-yellow-800">{recommendation}</p>
        </div>

        {/* Low ticket warning */}
        {ticket < 100 && (
          <div className="bg-orange-50 p-3 rounded border-l-4 border-orange-400">
            <p className="text-sm text-orange-800">
              Calculator is tuned for high-ticket offers. Results may be more favorable with larger transaction values.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}