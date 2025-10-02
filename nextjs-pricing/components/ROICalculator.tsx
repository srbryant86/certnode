'use client';

import { useState } from 'react';

type CalculatorMode = 'disputes' | 'compliance' | 'content' | 'operations';

interface DisputeInputs {
  monthlyGMV: number;
  disputeRate: number;
  avgDisputeValue: number;
  hourlyRate: number;
  hoursPerDispute: number;
}

interface ComplianceInputs {
  annualRevenue: number;
  currentAuditCost: number;
  auditPrepWeeks: number;
  complianceFTEs: number;
}

interface ContentInputs {
  monthlyUploads: number;
  dmcaRate: number;
  legalCostPerDispute: number;
  moderationHoursPerIncident: number;
  moderationHourlyRate: number;
}

interface OperationsInputs {
  monthlyShipments: number;
  errorRate: number;
  failedDeliveryCost: number;
  supportHoursPerIssue: number;
  supportHourlyRate: number;
}

export default function ROICalculator() {
  const [mode, setMode] = useState<CalculatorMode>('disputes');

  const [disputeInputs, setDisputeInputs] = useState<DisputeInputs>({
    monthlyGMV: 100000,
    disputeRate: 1.8,
    avgDisputeValue: 120,
    hourlyRate: 60,
    hoursPerDispute: 3,
  });

  const [complianceInputs, setComplianceInputs] = useState<ComplianceInputs>({
    annualRevenue: 5000000,
    currentAuditCost: 150000,
    auditPrepWeeks: 8,
    complianceFTEs: 2,
  });

  const [contentInputs, setContentInputs] = useState<ContentInputs>({
    monthlyUploads: 5000,
    dmcaRate: 0.5,
    legalCostPerDispute: 5000,
    moderationHoursPerIncident: 4,
    moderationHourlyRate: 50,
  });

  const [operationsInputs, setOperationsInputs] = useState<OperationsInputs>({
    monthlyShipments: 10000,
    errorRate: 2.0,
    failedDeliveryCost: 200,
    supportHoursPerIssue: 2,
    supportHourlyRate: 45,
  });

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const modes = [
    { id: 'disputes' as CalculatorMode, icon: '🛒', label: 'Chargebacks & Disputes', subtitle: 'E-commerce, High-Ticket Sales' },
    { id: 'compliance' as CalculatorMode, icon: '📋', label: 'Compliance Costs', subtitle: 'SaaS, Healthcare, Finance' },
    { id: 'content' as CalculatorMode, icon: '🎨', label: 'Content Protection', subtitle: 'Platforms, Creators, Media' },
    { id: 'operations' as CalculatorMode, icon: '📦', label: 'Operations Verification', subtitle: 'Logistics, B2B, Supply Chain' },
  ];

  const disputePresets = [
    { id: 'small-ecommerce', label: 'Small Business', monthlyGMV: 25000, disputeRate: 2.5, avgDisputeValue: 75, hourlyRate: 40, hoursPerDispute: 4 },
    { id: 'high-ticket', label: 'High-Ticket Sales', monthlyGMV: 150000, disputeRate: 2.2, avgDisputeValue: 10000, hourlyRate: 85, hoursPerDispute: 5 },
    { id: 'mid-market', label: 'Growing Business', monthlyGMV: 250000, disputeRate: 1.5, avgDisputeValue: 150, hourlyRate: 75, hoursPerDispute: 3 },
    { id: 'enterprise', label: 'High-Volume', monthlyGMV: 2000000, disputeRate: 1.0, avgDisputeValue: 3500, hourlyRate: 100, hoursPerDispute: 4 },
  ];

  const compliancePresets = [
    { id: 'startup-saas', label: 'Startup SaaS', annualRevenue: 1000000, currentAuditCost: 80000, auditPrepWeeks: 6, complianceFTEs: 1 },
    { id: 'growth-saas', label: 'Growth SaaS', annualRevenue: 10000000, currentAuditCost: 150000, auditPrepWeeks: 8, complianceFTEs: 2 },
    { id: 'healthcare', label: 'Healthcare Provider', annualRevenue: 25000000, currentAuditCost: 250000, auditPrepWeeks: 12, complianceFTEs: 3 },
    { id: 'fintech', label: 'Fintech', annualRevenue: 50000000, currentAuditCost: 400000, auditPrepWeeks: 16, complianceFTEs: 4 },
  ];

  const contentPresets = [
    { id: 'small-platform', label: 'Small Platform', monthlyUploads: 1000, dmcaRate: 0.3, legalCostPerDispute: 3000, moderationHoursPerIncident: 3, moderationHourlyRate: 45 },
    { id: 'creator-platform', label: 'Creator Platform', monthlyUploads: 10000, dmcaRate: 0.5, legalCostPerDispute: 5000, moderationHoursPerIncident: 4, moderationHourlyRate: 50 },
    { id: 'media-company', label: 'Media Company', monthlyUploads: 50000, dmcaRate: 0.8, legalCostPerDispute: 8000, moderationHoursPerIncident: 5, moderationHourlyRate: 65 },
    { id: 'social-network', label: 'Social Network', monthlyUploads: 500000, dmcaRate: 0.4, legalCostPerDispute: 5000, moderationHoursPerIncident: 4, moderationHourlyRate: 55 },
  ];

  const operationsPresets = [
    { id: 'small-logistics', label: 'Small Logistics', monthlyShipments: 2000, errorRate: 3.0, failedDeliveryCost: 150, supportHoursPerIssue: 2, supportHourlyRate: 40 },
    { id: 'ecommerce-fulfillment', label: 'E-commerce Fulfillment', monthlyShipments: 10000, errorRate: 2.0, failedDeliveryCost: 200, supportHoursPerIssue: 2, supportHourlyRate: 45 },
    { id: 'b2b-supplier', label: 'B2B Supplier', monthlyShipments: 5000, errorRate: 1.5, failedDeliveryCost: 500, supportHoursPerIssue: 3, supportHourlyRate: 60 },
    { id: 'enterprise-logistics', label: 'Enterprise Logistics', monthlyShipments: 50000, errorRate: 1.0, failedDeliveryCost: 300, supportHoursPerIssue: 2.5, supportHourlyRate: 55 },
  ];

  const handleModeChange = (newMode: CalculatorMode) => {
    setMode(newMode);
    setSelectedPreset(null);
  };

  const handleDisputePreset = (preset: typeof disputePresets[0]) => {
    setDisputeInputs({
      monthlyGMV: preset.monthlyGMV,
      disputeRate: preset.disputeRate,
      avgDisputeValue: preset.avgDisputeValue,
      hourlyRate: preset.hourlyRate,
      hoursPerDispute: preset.hoursPerDispute,
    });
    setSelectedPreset(preset.id);
  };

  const handleCompliancePreset = (preset: typeof compliancePresets[0]) => {
    setComplianceInputs({
      annualRevenue: preset.annualRevenue,
      currentAuditCost: preset.currentAuditCost,
      auditPrepWeeks: preset.auditPrepWeeks,
      complianceFTEs: preset.complianceFTEs,
    });
    setSelectedPreset(preset.id);
  };

  const handleContentPreset = (preset: typeof contentPresets[0]) => {
    setContentInputs({
      monthlyUploads: preset.monthlyUploads,
      dmcaRate: preset.dmcaRate,
      legalCostPerDispute: preset.legalCostPerDispute,
      moderationHoursPerIncident: preset.moderationHoursPerIncident,
      moderationHourlyRate: preset.moderationHourlyRate,
    });
    setSelectedPreset(preset.id);
  };

  const handleOperationsPreset = (preset: typeof operationsPresets[0]) => {
    setOperationsInputs({
      monthlyShipments: preset.monthlyShipments,
      errorRate: preset.errorRate,
      failedDeliveryCost: preset.failedDeliveryCost,
      supportHoursPerIssue: preset.supportHoursPerIssue,
      supportHourlyRate: preset.supportHourlyRate,
    });
    setSelectedPreset(preset.id);
  };

  // Dispute Calculations
  const calculateDisputes = () => {
    const monthlyDisputes = (disputeInputs.monthlyGMV * disputeInputs.disputeRate) / 100;
    const monthlyDisputeCosts = monthlyDisputes * disputeInputs.avgDisputeValue;
    const monthlyLaborCosts = monthlyDisputes * disputeInputs.hoursPerDispute * disputeInputs.hourlyRate;

    const disputeReductionRate = 0.70;
    const laborReductionRate = 0.80;

    const monthlyDisputeSavings = monthlyDisputeCosts * disputeReductionRate;
    const monthlyLaborSavings = monthlyLaborCosts * laborReductionRate;
    const monthlyTotalSavings = monthlyDisputeSavings + monthlyLaborSavings;

    return {
      monthlyDisputes,
      monthlyDisputeSavings,
      monthlyLaborSavings,
      monthlyTotalSavings,
      annualTotalSavings: monthlyTotalSavings * 12,
      metric1: { label: 'Monthly Disputes', value: monthlyDisputes },
      metric2: { label: 'Dispute Cost Savings (70% reduction)', value: monthlyDisputeSavings },
      metric3: { label: 'Labor Cost Savings (80% reduction)', value: monthlyLaborSavings },
    };
  };

  // Compliance Calculations
  const calculateCompliance = () => {
    const auditPrepCostPerWeek = 15000;
    const fteCostPerYear = 120000;

    const currentAuditPrepCost = complianceInputs.auditPrepWeeks * auditPrepCostPerWeek;
    const currentFTECost = complianceInputs.complianceFTEs * fteCostPerYear;

    const auditPrepReduction = 0.875; // 8 weeks → 1 week
    const auditCostReduction = complianceInputs.currentAuditCost * 0.73; // $150K → $40K
    const fteReduction = 0.75; // 2 FTEs → 0.5 FTE

    const annualAuditPrepSavings = currentAuditPrepCost * auditPrepReduction;
    const annualAuditSavings = auditCostReduction;
    const annualFTESavings = currentFTECost * fteReduction;
    const annualTotalSavings = annualAuditPrepSavings + annualAuditSavings + annualFTESavings;

    return {
      annualAuditPrepSavings,
      annualAuditSavings,
      annualFTESavings,
      monthlyTotalSavings: annualTotalSavings / 12,
      annualTotalSavings,
      metric1: { label: 'Audit Prep Savings (87.5% reduction)', value: annualAuditPrepSavings },
      metric2: { label: 'External Auditor Savings', value: annualAuditSavings },
      metric3: { label: 'Compliance FTE Savings (75% reduction)', value: annualFTESavings },
    };
  };

  // Content Calculations
  const calculateContent = () => {
    const monthlyIncidents = (contentInputs.monthlyUploads * contentInputs.dmcaRate) / 100;
    const monthlyLegalCosts = monthlyIncidents * contentInputs.legalCostPerDispute;
    const monthlyModerationCosts = monthlyIncidents * contentInputs.moderationHoursPerIncident * contentInputs.moderationHourlyRate;

    const reductionRate = 0.90; // 90% fewer false claims with C2PA verification

    const monthlyLegalSavings = monthlyLegalCosts * reductionRate;
    const monthlyModerationSavings = monthlyModerationCosts * reductionRate;
    const monthlyTotalSavings = monthlyLegalSavings + monthlyModerationSavings;

    return {
      monthlyIncidents,
      monthlyLegalSavings,
      monthlyModerationSavings,
      monthlyTotalSavings,
      annualTotalSavings: monthlyTotalSavings * 12,
      metric1: { label: 'Monthly IP Incidents', value: monthlyIncidents },
      metric2: { label: 'Legal Cost Savings (90% reduction)', value: monthlyLegalSavings },
      metric3: { label: 'Moderation Savings (90% reduction)', value: monthlyModerationSavings },
    };
  };

  // Operations Calculations
  const calculateOperations = () => {
    const monthlyErrors = (operationsInputs.monthlyShipments * operationsInputs.errorRate) / 100;
    const monthlyFailedDeliveryCosts = monthlyErrors * 0.30 * operationsInputs.failedDeliveryCost; // 30% of errors become failed deliveries
    const monthlySupportCosts = monthlyErrors * operationsInputs.supportHoursPerIssue * operationsInputs.supportHourlyRate;

    const reductionRate = 0.95; // 95% fewer documentation disputes with cryptographic proof

    const monthlyDeliverySavings = monthlyFailedDeliveryCosts * reductionRate;
    const monthlySupportSavings = monthlySupportCosts * reductionRate;
    const monthlyTotalSavings = monthlyDeliverySavings + monthlySupportSavings;

    return {
      monthlyErrors,
      monthlyDeliverySavings,
      monthlySupportSavings,
      monthlyTotalSavings,
      annualTotalSavings: monthlyTotalSavings * 12,
      metric1: { label: 'Monthly Documentation Errors', value: monthlyErrors },
      metric2: { label: 'Failed Delivery Savings (95% reduction)', value: monthlyDeliverySavings },
      metric3: { label: 'Support Cost Savings (95% reduction)', value: monthlySupportSavings },
    };
  };

  const getResults = () => {
    switch (mode) {
      case 'disputes': return calculateDisputes();
      case 'compliance': return calculateCompliance();
      case 'content': return calculateContent();
      case 'operations': return calculateOperations();
    }
  };

  const results = getResults();

  const getRecommendedPrice = () => {
    if (mode === 'disputes') {
      return disputeInputs.monthlyGMV < 100000 ? 49 :
             disputeInputs.monthlyGMV < 300000 ? 199 :
             disputeInputs.monthlyGMV < 1000000 ? 499 : 1500;
    } else if (mode === 'compliance') {
      return complianceInputs.annualRevenue < 5000000 ? 199 :
             complianceInputs.annualRevenue < 20000000 ? 499 :
             complianceInputs.annualRevenue < 50000000 ? 999 : 2000;
    } else if (mode === 'content') {
      return contentInputs.monthlyUploads < 5000 ? 199 :
             contentInputs.monthlyUploads < 50000 ? 499 :
             contentInputs.monthlyUploads < 200000 ? 999 : 2000;
    } else {
      return operationsInputs.monthlyShipments < 5000 ? 199 :
             operationsInputs.monthlyShipments < 20000 ? 499 :
             operationsInputs.monthlyShipments < 100000 ? 999 : 2000;
    }
  };

  const recommendedPrice = getRecommendedPrice();
  const monthlyROI = ((results.monthlyTotalSavings - recommendedPrice) / recommendedPrice) * 100;
  const paybackDays = Math.ceil((recommendedPrice / results.monthlyTotalSavings) * 30);

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
          <p className="text-gray-700 text-base md:text-lg mb-6">
            Choose your biggest pain point to see customized ROI calculations
          </p>
        </div>

        {/* Mode Selector */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {modes.map((modeOption) => (
            <button
              key={modeOption.id}
              onClick={() => handleModeChange(modeOption.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                mode === modeOption.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-600'
              }`}
            >
              <div className="text-2xl mb-2">{modeOption.icon}</div>
              <div className={`font-bold text-sm mb-1 ${mode === modeOption.id ? 'text-white' : 'text-gray-900'}`}>
                {modeOption.label}
              </div>
              <div className={`text-xs ${mode === modeOption.id ? 'text-blue-100' : 'text-gray-500'}`}>
                {modeOption.subtitle}
              </div>
            </button>
          ))}
        </div>

        {/* Presets */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {mode === 'disputes' && disputePresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleDisputePreset(preset)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedPreset === preset.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-600'
              }`}
            >
              {preset.label}
            </button>
          ))}
          {mode === 'compliance' && compliancePresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleCompliancePreset(preset)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedPreset === preset.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-600'
              }`}
            >
              {preset.label}
            </button>
          ))}
          {mode === 'content' && contentPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleContentPreset(preset)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedPreset === preset.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-600'
              }`}
            >
              {preset.label}
            </button>
          ))}
          {mode === 'operations' && operationsPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleOperationsPreset(preset)}
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

        <DisputeCalculatorInputs
          mode={mode}
          disputeInputs={disputeInputs}
          setDisputeInputs={setDisputeInputs}
          complianceInputs={complianceInputs}
          setComplianceInputs={setComplianceInputs}
          contentInputs={contentInputs}
          setContentInputs={setContentInputs}
          operationsInputs={operationsInputs}
          setOperationsInputs={setOperationsInputs}
          setSelectedPreset={setSelectedPreset}
          results={results}
          formatCurrency={formatCurrency}
          formatNumber={formatNumber}
          monthlyROI={monthlyROI}
          paybackDays={paybackDays}
        />

        {/* CTA */}
        <div className="bg-blue-600 rounded-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-3">
            Start Saving {formatCurrency(results.monthlyTotalSavings)}/Month
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

        {/* Disclaimer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            *Calculations based on industry-standard reduction rates. Actual results may vary.
          </p>
        </div>
      </div>
    </div>
  );
}

// Input Components
function DisputeCalculatorInputs({
  mode,
  disputeInputs,
  setDisputeInputs,
  complianceInputs,
  setComplianceInputs,
  contentInputs,
  setContentInputs,
  operationsInputs,
  setOperationsInputs,
  setSelectedPreset,
  results,
  formatCurrency,
  formatNumber,
  monthlyROI,
  paybackDays
}: any) {
  return (
    <div className="grid md:grid-cols-2 gap-8 mb-8">
      {/* Left: Inputs */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4 text-lg">Your Business Metrics</h3>

        {mode === 'disputes' && (
          <DisputeInputFields
            inputs={disputeInputs}
            setInputs={setDisputeInputs}
            setSelectedPreset={setSelectedPreset}
          />
        )}

        {mode === 'compliance' && (
          <ComplianceInputFields
            inputs={complianceInputs}
            setInputs={setComplianceInputs}
            setSelectedPreset={setSelectedPreset}
          />
        )}

        {mode === 'content' && (
          <ContentInputFields
            inputs={contentInputs}
            setInputs={setContentInputs}
            setSelectedPreset={setSelectedPreset}
          />
        )}

        {mode === 'operations' && (
          <OperationsInputFields
            inputs={operationsInputs}
            setInputs={setOperationsInputs}
            setSelectedPreset={setSelectedPreset}
          />
        )}
      </div>

      {/* Right: Results */}
      <ResultsDisplay
        mode={mode}
        results={results}
        formatCurrency={formatCurrency}
        formatNumber={formatNumber}
        monthlyROI={monthlyROI}
        paybackDays={paybackDays}
      />
    </div>
  );
}

// Dispute Input Fields
function DisputeInputFields({ inputs, setInputs, setSelectedPreset }: any) {
  return (
    <div className="space-y-6">
      <InputField
        label="Monthly Gross Merchandise Value (GMV)"
        type="currency"
        min={0}
        max={5000000}
        step={5000}
        value={inputs.monthlyGMV}
        onChange={(val: number) => { setInputs({ ...inputs, monthlyGMV: val }); setSelectedPreset(null); }}
      />

      <InputField
        label="Dispute/Chargeback Rate (%)"
        type="percentage"
        min={0}
        max={5}
        step={0.1}
        value={inputs.disputeRate}
        onChange={(val: number) => { setInputs({ ...inputs, disputeRate: val }); setSelectedPreset(null); }}
        helpText="Industry average: 1-2%"
      />

      <InputField
        label="Average Dispute Value"
        type="currency"
        min={0}
        max={25000}
        step={100}
        value={inputs.avgDisputeValue}
        onChange={(val: number) => { setInputs({ ...inputs, avgDisputeValue: val }); setSelectedPreset(null); }}
      />

      <InputField
        label="Average Hourly Rate (Staff Cost)"
        type="currency"
        min={0}
        max={200}
        step={5}
        value={inputs.hourlyRate}
        onChange={(val: number) => { setInputs({ ...inputs, hourlyRate: val }); setSelectedPreset(null); }}
      />

      <InputField
        label="Hours Spent Per Dispute"
        type="number"
        min={0}
        max={10}
        step={0.5}
        value={inputs.hoursPerDispute}
        onChange={(val: number) => { setInputs({ ...inputs, hoursPerDispute: val }); setSelectedPreset(null); }}
        helpText="Gathering evidence, responding, etc."
      />
    </div>
  );
}

// Compliance Input Fields
function ComplianceInputFields({ inputs, setInputs, setSelectedPreset }: any) {
  return (
    <div className="space-y-6">
      <InputField
        label="Annual Revenue"
        type="currency"
        min={0}
        max={100000000}
        step={100000}
        value={inputs.annualRevenue}
        onChange={(val: number) => { setInputs({ ...inputs, annualRevenue: val }); setSelectedPreset(null); }}
      />

      <InputField
        label="Current Annual Audit Cost"
        type="currency"
        min={0}
        max={1000000}
        step={10000}
        value={inputs.currentAuditCost}
        onChange={(val: number) => { setInputs({ ...inputs, currentAuditCost: val }); setSelectedPreset(null); }}
        helpText="External auditor fees (SOC 2, HIPAA, etc.)"
      />

      <InputField
        label="Audit Prep Weeks Per Year"
        type="number"
        min={0}
        max={26}
        step={1}
        value={inputs.auditPrepWeeks}
        onChange={(val: number) => { setInputs({ ...inputs, auditPrepWeeks: val }); setSelectedPreset(null); }}
        helpText="Internal team time gathering evidence"
      />

      <InputField
        label="Compliance Team FTEs"
        type="number"
        min={0}
        max={10}
        step={0.5}
        value={inputs.complianceFTEs}
        onChange={(val: number) => { setInputs({ ...inputs, complianceFTEs: val }); setSelectedPreset(null); }}
        helpText="Full-time equivalents dedicated to compliance"
      />
    </div>
  );
}

// Content Input Fields
function ContentInputFields({ inputs, setInputs, setSelectedPreset }: any) {
  return (
    <div className="space-y-6">
      <InputField
        label="Monthly Content Uploads"
        type="number"
        min={0}
        max={1000000}
        step={1000}
        value={inputs.monthlyUploads}
        onChange={(val: number) => { setInputs({ ...inputs, monthlyUploads: val }); setSelectedPreset(null); }}
      />

      <InputField
        label="DMCA/IP Dispute Rate (%)"
        type="percentage"
        min={0}
        max={5}
        step={0.1}
        value={inputs.dmcaRate}
        onChange={(val: number) => { setInputs({ ...inputs, dmcaRate: val }); setSelectedPreset(null); }}
        helpText="Percentage of uploads disputed"
      />

      <InputField
        label="Legal Cost Per Dispute"
        type="currency"
        min={0}
        max={50000}
        step={500}
        value={inputs.legalCostPerDispute}
        onChange={(val: number) => { setInputs({ ...inputs, legalCostPerDispute: val }); setSelectedPreset(null); }}
      />

      <InputField
        label="Moderation Hours Per Incident"
        type="number"
        min={0}
        max={20}
        step={0.5}
        value={inputs.moderationHoursPerIncident}
        onChange={(val: number) => { setInputs({ ...inputs, moderationHoursPerIncident: val }); setSelectedPreset(null); }}
      />

      <InputField
        label="Moderation Hourly Rate"
        type="currency"
        min={0}
        max={150}
        step={5}
        value={inputs.moderationHourlyRate}
        onChange={(val: number) => { setInputs({ ...inputs, moderationHourlyRate: val }); setSelectedPreset(null); }}
      />
    </div>
  );
}

// Operations Input Fields
function OperationsInputFields({ inputs, setInputs, setSelectedPreset }: any) {
  return (
    <div className="space-y-6">
      <InputField
        label="Monthly Shipments/Transactions"
        type="number"
        min={0}
        max={1000000}
        step={1000}
        value={inputs.monthlyShipments}
        onChange={(val: number) => { setInputs({ ...inputs, monthlyShipments: val }); setSelectedPreset(null); }}
      />

      <InputField
        label="Documentation Error Rate (%)"
        type="percentage"
        min={0}
        max={10}
        step={0.1}
        value={inputs.errorRate}
        onChange={(val: number) => { setInputs({ ...inputs, errorRate: val }); setSelectedPreset(null); }}
        helpText="Percentage with missing/incorrect docs"
      />

      <InputField
        label="Failed Delivery Cost Per Incident"
        type="currency"
        min={0}
        max={2000}
        step={50}
        value={inputs.failedDeliveryCost}
        onChange={(val: number) => { setInputs({ ...inputs, failedDeliveryCost: val }); setSelectedPreset(null); }}
      />

      <InputField
        label="Support Hours Per Issue"
        type="number"
        min={0}
        max={10}
        step={0.5}
        value={inputs.supportHoursPerIssue}
        onChange={(val: number) => { setInputs({ ...inputs, supportHoursPerIssue: val }); setSelectedPreset(null); }}
      />

      <InputField
        label="Support Hourly Rate"
        type="currency"
        min={0}
        max={150}
        step={5}
        value={inputs.supportHourlyRate}
        onChange={(val: number) => { setInputs({ ...inputs, supportHourlyRate: val }); setSelectedPreset(null); }}
      />
    </div>
  );
}

// Generic Input Field Component
function InputField({ label, type, min, max, step, value, onChange, helpText }: any) {
  const displayValue = type === 'percentage' ? value : value;
  const prefix = type === 'currency' ? '$' : '';
  const suffix = type === 'percentage' ? '%' : '';

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-3">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider mb-3"
        style={{
          background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(value / max) * 100}%, #E5E7EB ${(value / max) * 100}%, #E5E7EB 100%)`
        }}
      />
      <div className="relative">
        {prefix && <span className="absolute left-3 top-3 text-gray-500">{prefix}</span>}
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`w-full py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none ${prefix ? 'pl-7 pr-3' : suffix ? 'pr-8 pl-3' : 'px-3'}`}
        />
        {suffix && <span className="absolute right-3 top-3 text-gray-500">{suffix}</span>}
      </div>
      {helpText && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
    </div>
  );
}

// Results Display
function ResultsDisplay({ mode, results, formatCurrency, formatNumber, monthlyROI, paybackDays }: any) {
  const getSavingsMessage = () => {
    switch (mode) {
      case 'disputes': return 'Cryptographic receipts reduce disputes by 70% and automate 80% of manual work.';
      case 'compliance': return 'Automated evidence collection reduces audit prep by 87.5% and external auditor costs by 73%.';
      case 'content': return 'C2PA verification reduces false IP claims by 90% and automates moderation.';
      case 'operations': return 'Cryptographic proof reduces documentation disputes by 95% and support costs.';
    }
  };

  const getTimeframe = () => mode === 'compliance' ? 'year' : 'month';

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg p-6">
      <h3 className="font-bold mb-2 text-lg">Your Estimated Savings with CertNode</h3>
      <p className="text-blue-100 text-sm mb-6">{getSavingsMessage()}</p>

      {/* Key Metrics */}
      <div className="space-y-4 mb-6">
        <div className="bg-white/10 rounded-lg p-4">
          <div className="text-blue-200 text-sm mb-1">{results.metric1.label}</div>
          <div className="text-2xl font-bold">
            {typeof results.metric1.value === 'number' && results.metric1.value < 100
              ? formatNumber(results.metric1.value)
              : formatCurrency(results.metric1.value)}
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-4">
          <div className="text-blue-200 text-sm mb-1">{results.metric2.label}</div>
          <div className="text-2xl font-bold">{formatCurrency(results.metric2.value)}/{getTimeframe()}</div>
        </div>

        <div className="bg-white/10 rounded-lg p-4">
          <div className="text-blue-200 text-sm mb-1">{results.metric3.label}</div>
          <div className="text-2xl font-bold">{formatCurrency(results.metric3.value)}/{getTimeframe()}</div>
        </div>
      </div>

      {/* Total Savings */}
      <div className="bg-white rounded-lg p-6 text-gray-900 mb-6">
        <div className="text-sm text-gray-600 mb-2">Total {mode === 'compliance' ? 'Annual' : 'Annual'} Savings</div>
        <div className="text-4xl font-bold text-green-600 mb-1">
          {formatCurrency(results.annualTotalSavings)}
        </div>
        <div className="text-sm text-gray-600">
          {formatCurrency(results.monthlyTotalSavings)}/month saved
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
  );
}
