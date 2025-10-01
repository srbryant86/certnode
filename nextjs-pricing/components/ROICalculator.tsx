'use client';

import { useState } from 'react';

interface CalculatorInputs {
  monthlyGMV: number;
  disputeRate: number;
  avgDisputeValue: number;
  hourlyRate: number;
  hoursPerDispute: number;
}

export default function ROICalculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    monthlyGMV: 500000,
    disputeRate: 1.5,
    avgDisputeValue: 150,
    hourlyRate: 75,
    hoursPerDispute: 3,
  });

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const presets = [
    {
      id: 'small-ecommerce',
      label: 'Small E-Commerce',
      monthlyGMV: 100000,
      disputeRate: 2.0,
      avgDisputeValue: 85,
      hourlyRate: 50,
      hoursPerDispute: 4,
    },
    {
      id: 'mid-market',
      label: 'Mid-Market SaaS',
      monthlyGMV: 500000,
      disputeRate: 1.5,
      avgDisputeValue: 150,
      hourlyRate: 75,
      hoursPerDispute: 3,
    },
    {
      id: 'enterprise',
      label: 'Enterprise Platform',
      monthlyGMV: 5000000,
      disputeRate: 1.0,
      avgDisputeValue: 500,
      hourlyRate: 125,
      hoursPerDispute: 5,
    },
  ];

  const handlePreset = (preset: typeof presets[0]) => {
    setInputs({
      monthlyGMV: preset.monthlyGMV,
      disputeRate: preset.disputeRate,
      avgDisputeValue: preset.avgDisputeValue,
      hourlyRate: preset.hourlyRate,
      hoursPerDispute: preset.hoursPerDispute,
    });
    setSelectedPreset(preset.id);
  };

  // Calculations
  const monthlyDisputes = (inputs.monthlyGMV * inputs.disputeRate) / 100;
  const monthlyDisputeCosts = monthlyDisputes * inputs.avgDisputeValue;
  const monthlyLaborCosts = monthlyDisputes * inputs.hoursPerDispute * inputs.hourlyRate;

  // CertNode reduces disputes by 70% (cryptographic proof prevents most chargebacks)
  const disputeReductionRate = 0.70;
  const monthlyDisputeSavings = monthlyDisputeCosts * disputeReductionRate;

  // CertNode reduces labor by 80% (automated evidence gathering)
  const laborReductionRate = 0.80;
  const monthlyLaborSavings = monthlyLaborCosts * laborReductionRate;

  const monthlyTotalSavings = monthlyDisputeSavings + monthlyLaborSavings;
  const annualTotalSavings = monthlyTotalSavings * 12;

  // Recommended tier based on GMV
  const recommendedMonthlyPrice =
    inputs.monthlyGMV < 200000 ? 199 :
    inputs.monthlyGMV < 1000000 ? 499 :
    1500; // Enterprise estimate

  const monthlyROI = ((monthlyTotalSavings - recommendedMonthlyPrice) / recommendedMonthlyPrice) * 100;
  const paybackDays = Math.ceil((recommendedMonthlyPrice / monthlyTotalSavings) * 30);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(num);
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border-2 border-green-200 p-6 md:p-10 shadow-xl">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
            CALCULATE YOUR SAVINGS
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            See How Much CertNode Saves Your Business
          </h2>
          <p className="text-gray-700 text-base md:text-lg">
            Cryptographic receipts reduce disputes by 70% and automate 80% of manual work.
          </p>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePreset(preset)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedPreset === preset.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-600'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Input Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Left: Inputs */}
          <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Your Business Metrics</h3>
            <div className="space-y-4">
              {/* Monthly GMV */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Monthly Gross Merchandise Value (GMV)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input
                    type="number"
                    value={inputs.monthlyGMV}
                    onChange={(e) => {
                      setInputs({ ...inputs, monthlyGMV: Number(e.target.value) });
                      setSelectedPreset(null);
                    }}
                    className="w-full pl-7 pr-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dispute Rate */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dispute/Chargeback Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={inputs.disputeRate}
                    onChange={(e) => {
                      setInputs({ ...inputs, disputeRate: Number(e.target.value) });
                      setSelectedPreset(null);
                    }}
                    className="w-full pr-8 pl-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  />
                  <span className="absolute right-3 top-3 text-gray-500">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Industry average: 1-2%</p>
              </div>

              {/* Average Dispute Value */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Average Dispute Value
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input
                    type="number"
                    value={inputs.avgDisputeValue}
                    onChange={(e) => {
                      setInputs({ ...inputs, avgDisputeValue: Number(e.target.value) });
                      setSelectedPreset(null);
                    }}
                    className="w-full pl-7 pr-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Hourly Rate */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Average Hourly Rate (Staff Cost)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input
                    type="number"
                    value={inputs.hourlyRate}
                    onChange={(e) => {
                      setInputs({ ...inputs, hourlyRate: Number(e.target.value) });
                      setSelectedPreset(null);
                    }}
                    className="w-full pl-7 pr-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Hours per Dispute */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hours Spent Per Dispute
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={inputs.hoursPerDispute}
                  onChange={(e) => {
                    setInputs({ ...inputs, hoursPerDispute: Number(e.target.value) });
                    setSelectedPreset(null);
                  }}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Gathering evidence, responding, etc.</p>
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg p-6">
            <h3 className="font-bold mb-6 text-lg">Your Estimated Savings with CertNode</h3>

            {/* Key Metrics */}
            <div className="space-y-4 mb-6">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-blue-200 text-sm mb-1">Monthly Disputes</div>
                <div className="text-2xl font-bold">{formatNumber(monthlyDisputes)}</div>
              </div>

              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-blue-200 text-sm mb-1">Dispute Cost Savings (70% reduction)</div>
                <div className="text-2xl font-bold">{formatCurrency(monthlyDisputeSavings)}/mo</div>
              </div>

              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-blue-200 text-sm mb-1">Labor Cost Savings (80% reduction)</div>
                <div className="text-2xl font-bold">{formatCurrency(monthlyLaborSavings)}/mo</div>
              </div>
            </div>

            {/* Total Savings */}
            <div className="bg-white rounded-lg p-6 text-gray-900 mb-6">
              <div className="text-sm text-gray-600 mb-2">Total Annual Savings</div>
              <div className="text-4xl font-bold text-green-600 mb-1">
                {formatCurrency(annualTotalSavings)}
              </div>
              <div className="text-sm text-gray-600">
                {formatCurrency(monthlyTotalSavings)}/month saved
              </div>
            </div>

            {/* ROI Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-blue-200 text-xs mb-1">Monthly ROI</div>
                <div className="text-xl font-bold">{formatNumber(monthlyROI)}%</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-blue-200 text-xs mb-1">Payback Period</div>
                <div className="text-xl font-bold">{paybackDays} days</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-blue-600 rounded-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-3">
            Start Saving {formatCurrency(monthlyTotalSavings)}/Month
          </h3>
          <p className="text-blue-100 mb-6">
            Get started risk-free with our 60-day money-back guarantee.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#pricing-table"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              View Pricing Plans
            </a>
            <a
              href="mailto:contact@certnode.io"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors"
            >
              Talk to Sales
            </a>
          </div>
        </div>

        {/* Assumptions */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            *Calculations based on CertNode reducing disputes by 70% through cryptographic proof
            and automating 80% of manual dispute work through automated evidence gathering.
            Actual results may vary.
          </p>
        </div>
      </div>
    </div>
  );
}
