'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { type Route } from 'next';
import pricingData from '@/app/(data)/pricing.json';
import { formatCurrency } from '@/lib/currency';
import { PricingAnalytics } from '@/lib/analytics';

const numberFormatter = new Intl.NumberFormat('en-US');
const formatUSD = (amount: number) => formatCurrency(amount, 'USD');

// Industry benchmarks and accuracy improvements
const FRAUD_DETECTION_BASELINE = 0.85; // 85% industry standard
const FRAUD_DETECTION_CERTNODE = 0.999; // 99.9% with UltraAccuracyEngine™

const FALSE_POSITIVE_BASELINE = 0.15; // 15% industry standard
const FALSE_POSITIVE_CERTNODE = 0.02; // 2% with statistical consensus

const COMPLIANCE_ACCURACY_BASELINE = 0.92; // 92% industry standard
const COMPLIANCE_ACCURACY_CERTNODE = 0.998; // 99.8% with mathematical validation

const CONTENT_DETECTION_BASELINE = 0.85; // 85% industry standard
const CONTENT_DETECTION_CERTNODE = 0.98; // 98% with advanced ensemble

const presets = [
  {
    id: 'fintech-startup',
    label: 'FinTech Startup',
    monthlyTransactionVolume: 10000000,
    operationsValidated: 2500,
    contentAnalyzed: 50000,
    avgFraudLoss: 25000,
    avgFalsePositiveCost: 500,
    avgComplianceFailure: 15000,
    avgContentReviewCost: 50,
  },
  {
    id: 'payment-processor',
    label: 'Payment Processor',
    monthlyTransactionVolume: 100000000,
    operationsValidated: 15000,
    contentAnalyzed: 500000,
    avgFraudLoss: 75000,
    avgFalsePositiveCost: 1000,
    avgComplianceFailure: 50000,
    avgContentReviewCost: 75,
  },
  {
    id: 'crypto-exchange',
    label: 'Crypto Exchange',
    monthlyTransactionVolume: 1000000000,
    operationsValidated: 50000,
    contentAnalyzed: 2000000,
    avgFraudLoss: 250000,
    avgFalsePositiveCost: 2500,
    avgComplianceFailure: 150000,
    avgContentReviewCost: 100,
  },
] as const;

interface TriPillarResults {
  // Current costs without CertNode
  fraudLossesBaseline: number;
  falsePositiveCostsBaseline: number;
  complianceFailuresBaseline: number;
  contentReviewCostsBaseline: number;
  totalBaselineCost: number;

  // With CertNode UltraAccuracyEngine™
  fraudLossesCertNode: number;
  falsePositiveCostsCertNode: number;
  complianceFailuresCertNode: number;
  contentReviewCostsCertNode: number;
  platformCost: number;
  totalCertNodeCost: number;

  // Savings breakdown
  transactionPillarSavings: number;
  operationsPillarSavings: number;
  contentPillarSavings: number;
  totalAnnualSavings: number;
  monthlyROI: number;
  paybackDays: number;

  recommendedTier: {
    id: string;
    name: string;
    monthlyPrice: number;
    annualPrice: number;
    maxTransactionVolume: string;
    maxOperations: number | string;
    maxContent: string;
  };
}

function chooseTier(monthlyVolume: number): TriPillarResults['recommendedTier'] {
  const tiers = pricingData.intelligenceTiers;

  const getVolumeNumber = (vol: string) => {
    if (vol === 'Unlimited') return Infinity;
    const num = parseFloat(vol.replace(/[^0-9.]/g, ''));
    if (vol.includes('B')) return num * 1000000000;
    if (vol.includes('M')) return num * 1000000;
    return num;
  };

  for (const tier of tiers) {
    const tierVolume = getVolumeNumber(tier.maxTransactionVolume);
    if (monthlyVolume <= tierVolume) {
      return {
        id: tier.id,
        name: tier.name,
        monthlyPrice: tier.priceMonthly,
        annualPrice: tier.priceMonthly * 12 * tier.annualDiscount,
        maxTransactionVolume: tier.maxTransactionVolume,
        maxOperations: tier.maxOperationsValidated,
        maxContent: tier.maxContentAnalyzed,
      };
    }
  }

  // Default to highest tier
  const highest = tiers[tiers.length - 1];
  return {
    id: highest.id,
    name: highest.name,
    monthlyPrice: highest.priceMonthly,
    annualPrice: highest.priceMonthly * 12 * highest.annualDiscount,
    maxTransactionVolume: highest.maxTransactionVolume,
    maxOperations: highest.maxOperationsValidated,
    maxContent: highest.maxContentAnalyzed,
  };
}

function calculateTriPillarROI(params: {
  monthlyTransactionVolume: number;
  operationsValidated: number;
  contentAnalyzed: number;
  avgFraudLoss: number;
  avgFalsePositiveCost: number;
  avgComplianceFailure: number;
  avgContentReviewCost: number;
}): TriPillarResults {
  const {
    monthlyTransactionVolume,
    operationsValidated,
    contentAnalyzed,
    avgFraudLoss,
    avgFalsePositiveCost,
    avgComplianceFailure,
    avgContentReviewCost
  } = params;

  const tier = chooseTier(monthlyTransactionVolume);

  // Calculate baseline costs (current industry standard)
  const fraudRate = 0.006; // 0.6% fraud rate
  const falsePositiveRate = 0.15; // 15% false positive rate
  const complianceFailureRate = 0.03; // 3% compliance failure rate
  const contentRiskRate = 0.08; // 8% content needs review

  // Annual baseline costs
  const fraudLossesBaseline = (monthlyTransactionVolume * fraudRate * (1 - FRAUD_DETECTION_BASELINE) * (avgFraudLoss / (monthlyTransactionVolume * fraudRate))) * 12;
  const falsePositiveCostsBaseline = (monthlyTransactionVolume * falsePositiveRate * avgFalsePositiveCost) * 12;
  const complianceFailuresBaseline = (operationsValidated * complianceFailureRate * avgComplianceFailure) * 12;
  const contentReviewCostsBaseline = (contentAnalyzed * contentRiskRate * avgContentReviewCost) * 12;
  const totalBaselineCost = fraudLossesBaseline + falsePositiveCostsBaseline + complianceFailuresBaseline + contentReviewCostsBaseline;

  // Annual costs with CertNode UltraAccuracyEngine™
  const fraudLossesCertNode = (monthlyTransactionVolume * fraudRate * (1 - FRAUD_DETECTION_CERTNODE) * (avgFraudLoss / (monthlyTransactionVolume * fraudRate))) * 12;
  const falsePositiveCostsCertNode = (monthlyTransactionVolume * FALSE_POSITIVE_CERTNODE * avgFalsePositiveCost) * 12;
  const complianceFailuresCertNode = (operationsValidated * (1 - COMPLIANCE_ACCURACY_CERTNODE) * avgComplianceFailure) * 12;
  const contentReviewCostsCertNode = (contentAnalyzed * (1 - CONTENT_DETECTION_CERTNODE) * avgContentReviewCost) * 12;
  const platformCost = tier.annualPrice;
  const totalCertNodeCost = fraudLossesCertNode + falsePositiveCostsCertNode + complianceFailuresCertNode + contentReviewCostsCertNode + platformCost;

  // Calculate savings by pillar
  const transactionPillarSavings = (fraudLossesBaseline - fraudLossesCertNode) + (falsePositiveCostsBaseline - falsePositiveCostsCertNode);
  const operationsPillarSavings = complianceFailuresBaseline - complianceFailuresCertNode;
  const contentPillarSavings = contentReviewCostsBaseline - contentReviewCostsCertNode;
  const totalAnnualSavings = totalBaselineCost - totalCertNodeCost;

  const monthlyROI = platformCost > 0 ? (totalAnnualSavings / platformCost) * 100 : 0;
  const paybackDays = totalAnnualSavings > 0 ? (platformCost / totalAnnualSavings) * 365 : Infinity;

  return {
    fraudLossesBaseline,
    falsePositiveCostsBaseline,
    complianceFailuresBaseline,
    contentReviewCostsBaseline,
    totalBaselineCost,
    fraudLossesCertNode,
    falsePositiveCostsCertNode,
    complianceFailuresCertNode,
    contentReviewCostsCertNode,
    platformCost,
    totalCertNodeCost,
    transactionPillarSavings,
    operationsPillarSavings,
    contentPillarSavings,
    totalAnnualSavings,
    monthlyROI,
    paybackDays,
    recommendedTier: tier,
  };
}

export default function TriPillarIntelligenceCalculator() {
  const [monthlyTransactionVolume, setMonthlyTransactionVolume] = useState(10000000);
  const [operationsValidated, setOperationsValidated] = useState(2500);
  const [contentAnalyzed, setContentAnalyzed] = useState(50000);
  const [avgFraudLoss, setAvgFraudLoss] = useState(25000);
  const [avgFalsePositiveCost, setAvgFalsePositiveCost] = useState(500);
  const [avgComplianceFailure, setAvgComplianceFailure] = useState(15000);
  const [avgContentReviewCost, setAvgContentReviewCost] = useState(50);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [analytics] = useState(() => PricingAnalytics.getInstance());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const results = useMemo(() => calculateTriPillarROI({
    monthlyTransactionVolume,
    operationsValidated,
    contentAnalyzed,
    avgFraudLoss,
    avgFalsePositiveCost,
    avgComplianceFailure,
    avgContentReviewCost
  }), [monthlyTransactionVolume, operationsValidated, contentAnalyzed, avgFraudLoss, avgFalsePositiveCost, avgComplianceFailure, avgContentReviewCost]);

  const applyPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;

    setMonthlyTransactionVolume(preset.monthlyTransactionVolume);
    setOperationsValidated(preset.operationsValidated);
    setContentAnalyzed(preset.contentAnalyzed);
    setAvgFraudLoss(preset.avgFraudLoss);
    setAvgFalsePositiveCost(preset.avgFalsePositiveCost);
    setAvgComplianceFailure(preset.avgComplianceFailure);
    setAvgContentReviewCost(preset.avgContentReviewCost);
    setSelectedPreset(presetId);

    analytics.trackInteraction('enterprise_calc_update', {
      presetId,
      presetLabel: preset.label,
    });
  };

  const handleContact = () => {
    const subject = encodeURIComponent('CertNode Tri-Pillar Intelligence ROI Discussion');
    const body = encodeURIComponent([
      'Hi CertNode Team,',
      '',
      'We just calculated our ROI with the Tri-Pillar Intelligence platform:',
      '',
      `Monthly transaction volume: ${formatUSD(monthlyTransactionVolume)}`,
      `Operations validated: ${numberFormatter.format(operationsValidated)}/month`,
      `Content analyzed: ${numberFormatter.format(contentAnalyzed)}/month`,
      `Projected annual savings: ${formatUSD(results.totalAnnualSavings)}`,
      `Recommended tier: ${results.recommendedTier.name}`,
      '',
      'Please contact us to discuss implementation.',
      '',
      '- '
    ].join('\n'));

    analytics.trackInteraction('checkout_start', {
      planId: results.recommendedTier.id,
      billing: 'enterprise',
      lead_type: 'tri_pillar_calculator',
      projectedAnnualSavings: results.totalAnnualSavings,
      monthlyVolume: monthlyTransactionVolume,
    });

    window.location.href = `mailto:contact@certnode.io?subject=${subject}&body=${body}`;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-blue-100 shadow-lg bg-white">
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-6 py-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs uppercase tracking-wide text-blue-100 font-semibold">Tri-Pillar Intelligence ROI</span>
          <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">99%+ Accuracy</span>
        </div>
        <h3 className="text-3xl font-bold text-white mb-2">
          Save {formatUSD(results.totalAnnualSavings)} annually
        </h3>
        <div className="flex items-center gap-4 text-sm text-blue-100">
          <span>ROI: {results.monthlyROI.toFixed(0)}%</span>
          <span>•</span>
          <span>Payback: {Math.round(results.paybackDays)} days</span>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                selectedPreset === preset.id
                  ? 'border-blue-600 bg-blue-100 text-blue-800'
                  : 'border-gray-300 text-gray-600 hover:border-blue-300 hover:text-blue-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Volume & Scale</h4>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Monthly transaction volume</span>
              <input
                type="number"
                min={0}
                step={1000000}
                value={monthlyTransactionVolume}
                onChange={(e) => setMonthlyTransactionVolume(Math.max(0, Number(e.target.value) || 0))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Operations validated/month</span>
              <input
                type="number"
                min={0}
                step={100}
                value={operationsValidated}
                onChange={(e) => setOperationsValidated(Math.max(0, Number(e.target.value) || 0))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Content items analyzed/month</span>
              <input
                type="number"
                min={0}
                step={1000}
                value={contentAnalyzed}
                onChange={(e) => setContentAnalyzed(Math.max(0, Number(e.target.value) || 0))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Cost Per Incident</h4>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Average fraud loss</span>
              <input
                type="number"
                min={0}
                step={1000}
                value={avgFraudLoss}
                onChange={(e) => setAvgFraudLoss(Math.max(0, Number(e.target.value) || 0))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">False positive handling cost</span>
              <input
                type="number"
                min={0}
                step={50}
                value={avgFalsePositiveCost}
                onChange={(e) => setAvgFalsePositiveCost(Math.max(0, Number(e.target.value) || 0))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Compliance failure cost</span>
              <input
                type="number"
                min={0}
                step={1000}
                value={avgComplianceFailure}
                onChange={(e) => setAvgComplianceFailure(Math.max(0, Number(e.target.value) || 0))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Content review cost per item</span>
              <input
                type="number"
                min={0}
                step={5}
                value={avgContentReviewCost}
                onChange={(e) => setAvgContentReviewCost(Math.max(0, Number(e.target.value) || 0))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
        </div>

        {/* Results by Pillar */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🧠</span>
              <h5 className="font-semibold text-green-900">Transaction Intelligence</h5>
            </div>
            <p className="text-2xl font-bold text-green-900">{formatUSD(results.transactionPillarSavings)}</p>
            <p className="text-sm text-green-700">99.9% fraud detection + 87% fewer false positives</p>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⚡</span>
              <h5 className="font-semibold text-blue-900">Operations Intelligence</h5>
            </div>
            <p className="text-2xl font-bold text-blue-900">{formatUSD(results.operationsPillarSavings)}</p>
            <p className="text-sm text-blue-700">99.8% compliance validation accuracy</p>
          </div>

          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔍</span>
              <h5 className="font-semibold text-purple-900">Content Intelligence</h5>
            </div>
            <p className="text-2xl font-bold text-purple-900">{formatUSD(results.contentPillarSavings)}</p>
            <p className="text-sm text-purple-700">98% AI/manipulation detection accuracy</p>
          </div>
        </div>

        {/* Recommended Tier */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5">
          <h4 className="font-semibold text-indigo-900 mb-3">Recommended Tier</h4>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xl font-bold text-indigo-900">{results.recommendedTier.name}</p>
              <p className="text-sm text-indigo-700 mt-1">
                Up to {results.recommendedTier.maxTransactionVolume} monthly volume
              </p>
              <p className="text-sm text-indigo-700">
                {typeof results.recommendedTier.maxOperations === 'number'
                  ? numberFormatter.format(results.recommendedTier.maxOperations)
                  : results.recommendedTier.maxOperations} operations • {results.recommendedTier.maxContent} content
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-indigo-900">{formatUSD(results.recommendedTier.monthlyPrice)}</p>
              <p className="text-sm text-indigo-700">per month</p>
              <p className="text-xs text-indigo-600">Save 17% annually</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleContact}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-purple-700"
          >
            Get Started with {results.recommendedTier.name}
          </button>

          <Link
            href={'/trust' as Route}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            View Technical Documentation
          </Link>
        </div>
      </div>
    </div>
  );
}