'use client';

import { useState } from 'react';
import pricingData from '../app/(data)/pricing.json';

interface VolumeCalculation {
  plan: string;
  baseCost: number;
  includedReceipts: number;
  extraReceipts: number;
  overageCost: number;
  totalCost: number;
  annualCost: number;
  savings: number;
}

export default function EnterpriseVolumeCalculator() {
  const [monthlyVolume, setMonthlyVolume] = useState(10000);
  const [showAnnual, setShowAnnual] = useState(true);

  const calculateCosts = (volume: number): VolumeCalculation[] => {
    return pricingData.smbTiers.map(tier => {
      const baseCost = tier.priceMonthly;
      const includedReceipts = tier.includedReceipts;
      const extraReceipts = Math.max(0, volume - includedReceipts);
      const overageCost = extraReceipts * tier.overagePerReceipt;
      const totalCost = baseCost + overageCost;
      const annualCost = totalCost * 10; // Annual is 10x monthly (2 months free)
      const monthlySavings = totalCost * 2; // 2 months free

      return {
        plan: tier.name,
        baseCost,
        includedReceipts,
        extraReceipts,
        overageCost,
        totalCost,
        annualCost,
        savings: monthlySavings
      };
    });
  };

  const calculations = calculateCosts(monthlyVolume);
  const bestPlan = calculations.reduce((best, current) =>
    current.totalCost < best.totalCost ? current : best
  );

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMonthlyVolume(parseInt(e.target.value));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-200">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Enterprise Volume Calculator
        </h3>
        <p className="text-gray-600">
          Drag the slider to see real-time pricing for your monthly receipt volume
        </p>
      </div>

      {/* Volume Slider */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <label className="text-lg font-semibold text-gray-900">
            Monthly Receipt Volume
          </label>
          <div className="text-2xl font-bold text-blue-600">
            {formatNumber(monthlyVolume)} receipts
          </div>
        </div>

        <div className="relative">
          <input
            type="range"
            min="500"
            max="50000"
            step="500"
            value={monthlyVolume}
            onChange={handleVolumeChange}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((monthlyVolume - 500) / (50000 - 500)) * 100}%, #E5E7EB ${((monthlyVolume - 500) / (50000 - 500)) * 100}%, #E5E7EB 100%)`
            }}
          />
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>500</span>
            <span>10K</span>
            <span>25K</span>
            <span>50K</span>
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          <button
            onClick={() => setShowAnnual(false)}
            className={`px-4 py-2 rounded-l-lg font-medium transition-colors ${
              !showAnnual
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setShowAnnual(true)}
            className={`px-4 py-2 rounded-r-lg font-medium transition-colors relative ${
              showAnnual
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Annual
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              Save 2mo
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Results */}
      <div className="grid gap-4">
        {calculations.map((calc, index) => {
          const isBest = calc.plan === bestPlan.plan;
          const displayCost = showAnnual ? calc.annualCost : calc.totalCost;

          return (
            <div
              key={calc.plan}
              className={`p-6 rounded-lg border-2 transition-all ${
                isBest
                  ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h4 className="text-xl font-bold text-gray-900">
                    {calc.plan} Plan
                  </h4>
                  {isBest && (
                    <span className="bg-green-500 text-white text-sm px-2 py-1 rounded-full font-medium">
                      Best Value
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatCurrency(displayCost)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {showAnnual ? 'per year' : 'per month'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Base plan cost</div>
                  <div className="font-semibold">{formatCurrency(calc.baseCost)}/month</div>
                </div>
                <div>
                  <div className="text-gray-600">Included receipts</div>
                  <div className="font-semibold">{formatNumber(calc.includedReceipts)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Extra receipts</div>
                  <div className="font-semibold">{formatNumber(calc.extraReceipts)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Overage cost</div>
                  <div className="font-semibold">{formatCurrency(calc.overageCost)}/month</div>
                </div>
              </div>

              {showAnnual && calc.savings > 0 && (
                <div className="mt-4 p-3 bg-green-100 rounded-lg">
                  <div className="text-sm text-green-800">
                    💰 Annual savings: <span className="font-bold">{formatCurrency(calc.savings)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Enterprise Notice */}
      {monthlyVolume >= 25000 && (
        <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🚀</div>
            <div>
              <h4 className="font-bold text-purple-900 mb-2">
                Enterprise Volume Detected
              </h4>
              <p className="text-purple-800 mb-4">
                For {formatNumber(monthlyVolume)}+ receipts monthly, you may qualify for custom enterprise pricing with better rates and dedicated support.
              </p>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                Contact Enterprise Sales
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-sm text-gray-500">
        Pricing excludes taxes. Overage rates: Starter $0.10, Growth $0.05, Business $0.02 per receipt.
      </div>
    </div>
  );
}

<style jsx>{`
  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 24px;
    height: 24px;
    background: #3B82F6;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .slider::-moz-range-thumb {
    width: 24px;
    height: 24px;
    background: #3B82F6;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`}</style>