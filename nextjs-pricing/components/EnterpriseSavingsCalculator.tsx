'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { type Route } from 'next';
import pricingData from '@/app/(data)/pricing.json';
import { formatCurrency } from '@/lib/currency';
import { PricingAnalytics } from '@/lib/analytics';

const BASE_DISPUTE_RATE = 0.012; // 1.2% default dispute rate for large processors
const DEFLECTION_MIN = 0.3;
const DEFLECTION_MAX = 0.8;
const DEFAULT_DEFLECTION = 0.5; // Conservative baseline until we have live data
const HANDLING_REDUCTION = 0.65; // Automation removes 65% of manual handling effort

const numberFormatter = new Intl.NumberFormat('en-US');
const formatUSD = (amount: number) => formatCurrency(amount, 'USD');

const presets = [
  {
    id: 'saas',
    label: 'SaaS (40k receipts)',
    monthlyReceipts: 40000,
    averageDisputeCost: 75,
    handlingCost: 0.85,
  },
  {
    id: 'highTicket',
    label: 'High-ticket (100 deals)',
    monthlyReceipts: 100,
    averageDisputeCost: 10000,
    handlingCost: 2.5,
  },
  {
    id: 'creator',
    label: 'Digital creator (2k sales)',
    monthlyReceipts: 2000,
    averageDisputeCost: 200,
    handlingCost: 1.1,
  },
] as const;

const tierById = new Map(pricingData.smbTiers.map((tier) => [tier.id, tier]));

interface SavingsResults {
  manualAnnualCost: number;
  certnodeAnnualCost: number;
  annualSavings: number;
  monthlySavings: number;
  paybackDays: number;
  effectiveROI: number;
  recommendedPlan: {
    planId: string;
    label: string;
    monthlyCost: number;
    annualCost: number;
    receiptsIncluded: number;
    isEnterprise: boolean;
  };
}

function choosePlan(monthlyReceipts: number) {
  const tiers = pricingData.smbTiers;
  const ordered = [...tiers].sort((a, b) => a.includedReceipts - b.includedReceipts);
  for (const tier of ordered) {
    if (monthlyReceipts <= tier.includedReceipts) {
      const overage = Math.max(0, monthlyReceipts - tier.includedReceipts);
      const monthlyCost = tier.priceMonthly + overage * tier.overagePerReceipt;
      return {
        planId: tier.id,
        label: `${tier.name} Plan`,
        monthlyCost,
        annualCost: monthlyCost * 12,
        receiptsIncluded: tier.includedReceipts,
        isEnterprise: false,
      };
    }
  }

  const business = ordered[ordered.length - 1];
  const overage = Math.max(0, monthlyReceipts - business.includedReceipts);
  const monthlyCost = business.priceMonthly + overage * business.overagePerReceipt;

  return {
    planId: 'enterprise',
    label: 'Enterprise Custom',
    monthlyCost,
    annualCost: monthlyCost * 12,
    receiptsIncluded: business.includedReceipts,
    isEnterprise: true,
  };
}

function computeSavings(params: { monthlyReceipts: number; averageDisputeCost: number; handlingCost: number; deflectionRate: number; }): SavingsResults {
  const { monthlyReceipts, averageDisputeCost, handlingCost, deflectionRate } = params;
  const plan = choosePlan(monthlyReceipts);

  const manualOpsAnnual = monthlyReceipts * handlingCost * 12;
  const manualDisputeAnnual = monthlyReceipts * BASE_DISPUTE_RATE * averageDisputeCost * 12;
  const manualAnnualCost = manualOpsAnnual + manualDisputeAnnual;

  const automatedHandlingCost = handlingCost * (1 - HANDLING_REDUCTION);
  const certnodeOpsAnnual = monthlyReceipts * automatedHandlingCost * 12;
  const certnodeDisputeAnnual = monthlyReceipts * BASE_DISPUTE_RATE * (1 - deflectionRate) * averageDisputeCost * 12;
  const certnodeAnnualCost = certnodeOpsAnnual + certnodeDisputeAnnual + plan.annualCost;

  const annualSavings = Math.max(0, manualAnnualCost - certnodeAnnualCost);
  const monthlySavings = annualSavings / 12;
  const paybackDays = annualSavings > 0 ? Math.max(0, (plan.annualCost / annualSavings) * 365) : Infinity;
  const effectiveROI = certnodeAnnualCost > 0 ? (annualSavings / certnodeAnnualCost) * 100 : 0;

  return {
    manualAnnualCost,
    certnodeAnnualCost,
    annualSavings,
    monthlySavings,
    paybackDays,
    effectiveROI,
    recommendedPlan: plan,
  };
}

export default function EnterpriseSavingsCalculator() {
  const [monthlyReceipts, setMonthlyReceipts] = useState(750);
  const [averageDisputeCost, setAverageDisputeCost] = useState(150);
  const [handlingCost, setHandlingCost] = useState(1.25);
  const [deflectionRate, setDeflectionRate] = useState(DEFAULT_DEFLECTION);
  const [analytics] = useState(() => PricingAnalytics.getInstance());
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  useEffect(() => {
    setIsHydrated(true);
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('certnode_enterprise_calc');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.monthlyReceipts === 'number') setMonthlyReceipts(parsed.monthlyReceipts);
        if (typeof parsed.averageDisputeCost === 'number') setAverageDisputeCost(parsed.averageDisputeCost);
        if (typeof parsed.handlingCost === 'number') setHandlingCost(parsed.handlingCost);
        if (typeof parsed.deflectionRate === 'number') setDeflectionRate(parsed.deflectionRate);
      }
    } catch (error) {
      console.warn('Failed to restore enterprise calculator settings', error);
    }
  }, []);

  const results = useMemo(() => computeSavings({ monthlyReceipts, averageDisputeCost, handlingCost, deflectionRate }), [monthlyReceipts, averageDisputeCost, handlingCost, deflectionRate]);

  useEffect(() => {
    if (!isHydrated) return;
    if (typeof window === 'undefined') return;

    const payload = {
      monthlyReceipts,
      averageDisputeCost,
      handlingCost,
      deflectionRate,
      projectedAnnualSavings: results.annualSavings,
      planId: results.recommendedPlan.planId,
    };

    try {
      localStorage.setItem('certnode_enterprise_calc', JSON.stringify(payload));
      localStorage.setItem('certnode_enterprise_calc_interacted', 'true');
    } catch (error) {
      console.warn('Failed to persist enterprise calculator state', error);
    }

    analytics.trackInteraction('enterprise_calc_update', payload);
  }, [analytics, averageDisputeCost, handlingCost, isHydrated, monthlyReceipts, results.annualSavings, results.recommendedPlan.planId]);

  const handleEnterpriseContact = () => {
    const subject = encodeURIComponent('CertNode Enterprise Savings Inquiry');
    const body = encodeURIComponent([
      'Hi CertNode Team,',
      '',
      'We just ran the enterprise savings calculator and would like to discuss next steps.',
      '',
      `Monthly receipts: ${numberFormatter.format(monthlyReceipts)}`,
      `Average dispute cost: ${formatUSD(averageDisputeCost)}`,
      `Manual handling cost per receipt: ${formatUSD(handlingCost)}`,
      `Projected annual savings: ${formatUSD(results.annualSavings)}`,
      '',
      'Please reach out so we can align on enterprise rollout.',
      '',
      '- '
    ].join('\n'));

    analytics.trackInteraction('checkout_start', {
      planId: 'enterprise',
      billing: 'enterprise',
      lead_type: 'calculator',
      projectedAnnualSavings: results.annualSavings,
      monthlyReceipts,
    });

    window.location.href = `mailto:contact@certnode.io?subject=${subject}&body=${body}`;
  };

  const handleCheckout = async () => {
    const planId = results.recommendedPlan.planId;
    if (planId === 'enterprise') {
      handleEnterpriseContact();
      return;
    }

    analytics.trackInteraction('checkout_start', {
      planId,
      billing: 'enterprise',
      lead_type: 'calculator',
      projectedAnnualSavings: results.annualSavings,
      monthlyReceipts,
    });

    const tierMap: Record<string, string> = {
      starter: 'starter',
      growth: 'professional',
      business: 'business',
    };

    const mappedTier = tierMap[planId] ?? 'business';

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: mappedTier,
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
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Enterprise calculator checkout error:', error);
    }
  };

  const plan = results.recommendedPlan;
  const planTier = tierById.get(plan.planId);
  const planCoverageText = plan.isEnterprise
    ? 'Custom enterprise rollout'
    : `${numberFormatter.format(plan.receiptsIncluded)} receipts included`;
  const deflectionPercentage = Math.round(deflectionRate * 100);

  const applyPreset = (presetId: string) => {
    const preset = presets.find((item) => item.id === presetId);
    if (!preset) return;
    setMonthlyReceipts(preset.monthlyReceipts);
    setAverageDisputeCost(preset.averageDisputeCost);
    setHandlingCost(preset.handlingCost);
    setSelectedPreset(presetId);

    analytics.trackInteraction('enterprise_calc_update', {
      presetId,
      presetLabel: preset.label,
    });
  };

  return (
    <div id="enterprise-savings-calculator" className="overflow-hidden rounded-2xl border border-blue-100 shadow-lg bg-white">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5">
        <p className="text-sm uppercase tracking-wide text-blue-100">Enterprise Savings</p>
        <h3 className="text-2xl font-semibold text-white">You save {formatUSD(results.annualSavings)} per year</h3>
        <p className="mt-2 text-sm text-blue-100">
          Based on {numberFormatter.format(monthlyReceipts)} receipts/month and dispute automation performance.
        </p>
      </div>

      <div className="px-6 py-6 space-y-6">
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                selectedPreset === preset.id
                  ? 'border-blue-600 bg-blue-100 text-blue-800'
                  : 'border-gray-300 text-gray-600 hover:border-blue-300 hover:text-blue-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>


        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Monthly receipts processed</span>
            <input
              type="number"
              min={0}
              step={100}
              value={monthlyReceipts}
              onChange={(event) => setMonthlyReceipts(Math.max(0, Number(event.target.value) || 0))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Average dispute cost</span>
            <input
              type="number"
              min={0}
              step={5}
              value={averageDisputeCost}
              onChange={(event) => setAverageDisputeCost(Math.max(0, Number(event.target.value) || 0))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Manual handling cost per receipt</span>
            <input
              type="number"
              min={0}
              step={0.1}
              value={handlingCost}
              onChange={(event) => setHandlingCost(Math.max(0, Number(event.target.value) || 0))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
        </div>

        <div className="space-y-6">
          <label className="block rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Evidence acceptance rate</span>
              <span className="text-xs text-gray-500">{deflectionPercentage}%</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="range"
                min={DEFLECTION_MIN}
                max={DEFLECTION_MAX}
                step={0.05}
                value={deflectionRate}
                onChange={(event) => setDeflectionRate(Number(event.target.value))}
                className="flex-1"
                aria-describedby="deflection-help"
              />
              <span className="w-14 text-right text-xs text-gray-600">{deflectionPercentage}%</span>
            </div>
            <p id="deflection-help" className="mt-2 text-xs text-gray-500">
              Higher percentages assume CertNode evidence wins more disputes or audit challenges. Start conservative, then model best-case outcomes.
            </p>
          </label>

          <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700">Annual manual cost</span>
              <span className="font-semibold text-blue-900">{formatUSD(results.manualAnnualCost)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700">Annual with CertNode</span>
              <span className="font-semibold text-blue-900">{formatUSD(results.certnodeAnnualCost)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700">Monthly savings</span>
              <span className="font-semibold text-green-700">{formatUSD(results.monthlySavings)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700">ROI</span>
              <span className="font-semibold text-green-700">{results.effectiveROI.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700">Plan covers itself in</span>
              <span className="font-semibold text-blue-900">{Number.isFinite(results.paybackDays) ? `${Math.max(0, Math.round(results.paybackDays))} days` : 'N/A'}</span>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
          <p className="text-sm font-semibold text-purple-900">Suggested Plan</p>
          <p className="mt-1 text-lg font-bold text-purple-900">{plan.label}</p>
          <p className="mt-1 text-sm text-purple-800">{planCoverageText}</p>
          <p className="mt-3 text-sm text-purple-700">Estimated platform cost: {formatUSD(plan.monthlyCost)} / month</p>

          {planTier && !plan.isEnterprise && (
            <p className="mt-2 text-xs text-purple-600">Includes {numberFormatter.format(planTier.includedReceipts)} receipts. Overage priced at {formatUSD(planTier.overagePerReceipt)} per receipt.</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={plan.isEnterprise ? handleEnterpriseContact : handleCheckout}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            data-analytics="enterprise-calc-primary-cta"
          >
            {plan.isEnterprise ? 'Contact Enterprise' : `Start ${plan.label}`}
          </button>

          <a
            href="mailto:contact@certnode.io"
            onClick={() => analytics.trackInteraction('cta_click', { source: 'enterprise_calculator_email' })}
            className="inline-flex items-center justify-center rounded-lg border border-blue-300 px-6 py-3 text-sm font-semibold text-blue-700 transition hover:border-blue-400 hover:bg-blue-50"
          >
            Email contact@certnode.io
          </a>

          <Link
            href={'/trust' as Route}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            Review our Trust Center
          </Link>
        </div>
      </div>
    </div>
  );
}
