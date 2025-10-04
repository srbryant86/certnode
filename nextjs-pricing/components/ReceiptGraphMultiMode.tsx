'use client';

import { useState } from 'react';
import { generateCryptoFields, type CryptoFields } from '@/lib/demoCrypto';

type BusinessMode = 'ecommerce' | 'digital' | 'services' | 'highticket' | 'content';

type ReceiptDomain = 'transaction' | 'content' | 'operations';

type RelationType = 'evidences' | 'causes' | 'fulfills' | 'invalidates' | 'continues';

type Receipt = {
  id: string;
  domain: ReceiptDomain;
  type: string;
  label: string;
  status: 'pending' | 'created' | 'linked';
  data: any;
  parentIds?: string[]; // DAG: Multiple parents
  relationType?: RelationType; // Relationship to parents
  depth?: number; // Graph depth level
  crypto: CryptoFields; // Cryptographic fields
};

const scenarios = {
  ecommerce: {
    name: "E-Commerce Store",
    icon: "🛒",
    example: "Physical product shipped to customer",
    customerPurchase: "Customer orders $150 wireless headphones",
    productDelivered: "Shipping label + product photo generated",
    deliveryConfirmed: "FedEx tracking logged, delivery photo captured",
    painPoint: "Chargeback filed",
    chargebackClaim: "90 days later: 'Package never arrived'",
    yourDefense: "Transaction + Shipping Label + FedEx Tracking + Delivery Photo",
    defenseAction: "Submit Receipt Graph",
    resolutionTitle: "Chargeback reversed",
    amountSaved: 149.99,
    color: "green",
    cfoQuery: "Prove this chargeback defense is legitimate",
    queryPath: [0, 1, 2, 3], // Receipt indices that form the proof path
    receipts: [
      {
        domain: 'transaction' as ReceiptDomain,
        type: 'payment',
        label: 'Payment',
        icon: '💳',
        description: '$150 paid',
        domainLabel: 'Transaction',
        parentIds: [],
        relationType: undefined,
        depth: 0
      },
      {
        domain: 'content' as ReceiptDomain,
        type: 'shipping-label',
        label: 'Label + Photo',
        icon: '📦',
        description: 'Product documented',
        domainLabel: 'Content',
        parentIds: ['rcpt_0'],
        relationType: 'evidences' as RelationType,
        depth: 1
      },
      {
        domain: 'operations' as ReceiptDomain,
        type: 'tracking',
        label: 'FedEx Tracking',
        icon: '🚚',
        description: 'Delivery logged',
        domainLabel: 'Operations',
        parentIds: ['rcpt_1'],
        relationType: 'fulfills' as RelationType,
        depth: 2
      },
      {
        domain: 'content' as ReceiptDomain,
        type: 'delivery-photo',
        label: 'Delivery Photo',
        icon: '📸',
        description: 'Signed package',
        domainLabel: 'Content',
        parentIds: ['rcpt_2'],
        relationType: 'evidences' as RelationType,
        depth: 3
      }
    ]
  },
  digital: {
    name: "Digital Products",
    icon: "💻",
    example: "Online course with C2PA content certification",
    customerPurchase: "Customer buys $89 online course",
    productDelivered: "C2PA-certified video content delivered with access tracking",
    deliveryConfirmed: "Customer completed 12 lessons (47 min watch time)",
    painPoint: "Chargeback filed",
    chargebackClaim: "60 days later: 'Never got access' or 'content was AI-generated'",
    yourDefense: "Transaction + C2PA Content Receipt + Access Logs + Completion Tracking",
    defenseAction: "Submit Receipt Graph",
    resolutionTitle: "Chargeback reversed",
    amountSaved: 89.00,
    color: "purple",
    cfoQuery: "Prove customer had authentic content access",
    queryPath: [0, 1, 2, 3, 4],
    receipts: [
      {
        domain: 'transaction' as ReceiptDomain,
        type: 'payment',
        label: 'Payment',
        icon: '💳',
        description: '$89 paid',
        domainLabel: 'Transaction',
        parentIds: [],
        relationType: undefined,
        depth: 0
      },
      {
        domain: 'content' as ReceiptDomain,
        type: 'c2pa-cert',
        label: 'C2PA Receipt',
        icon: '🔐',
        description: 'Content certified',
        domainLabel: 'Content',
        parentIds: ['rcpt_0'],
        relationType: 'fulfills' as RelationType,
        depth: 1
      },
      {
        domain: 'operations' as ReceiptDomain,
        type: 'access-grant',
        label: 'Access Grant',
        icon: '🔑',
        description: 'License issued',
        domainLabel: 'Operations',
        parentIds: ['rcpt_1'],
        relationType: 'causes' as RelationType,
        depth: 2
      },
      {
        domain: 'operations' as ReceiptDomain,
        type: 'access-log',
        label: '47 Logins',
        icon: '📊',
        description: '12 lessons viewed',
        domainLabel: 'Operations',
        parentIds: ['rcpt_2'],
        relationType: 'evidences' as RelationType,
        depth: 3
      },
      {
        domain: 'content' as ReceiptDomain,
        type: 'completion',
        label: 'Completion',
        icon: '✅',
        description: 'Certificate issued',
        domainLabel: 'Content',
        parentIds: ['rcpt_3'],
        relationType: 'evidences' as RelationType,
        depth: 4
      }
    ]
  },
  services: {
    name: "Professional Services",
    icon: "🎯",
    example: "Consulting with contract signing and compliance",
    customerPurchase: "Client pays $2,500 for website design with SOW",
    productDelivered: "Contract signed, website delivered with compliance docs",
    deliveryConfirmed: "Client downloaded files, site deployed, compliance verified",
    painPoint: "Chargeback filed",
    chargebackClaim: "Claims 'work never completed' (site is live)",
    yourDefense: "Contract Signature + File Delivery + Compliance Docs + Live Site",
    defenseAction: "Submit Receipt Graph",
    resolutionTitle: "Chargeback reversed",
    amountSaved: 2500.00,
    color: "blue",
    cfoQuery: "Prove the website was fully delivered with compliance",
    queryPath: [0, 1, 2, 3, 4],
    receipts: [
      {
        domain: 'transaction' as ReceiptDomain,
        type: 'payment',
        label: 'Payment',
        icon: '💳',
        description: '$2,500 paid',
        domainLabel: 'Transaction',
        parentIds: [],
        relationType: undefined,
        depth: 0
      },
      {
        domain: 'content' as ReceiptDomain,
        type: 'contract-signature',
        label: 'SOW Signed',
        icon: '✍️',
        description: 'Contract executed',
        domainLabel: 'Content',
        parentIds: ['rcpt_0'],
        relationType: 'evidences' as RelationType,
        depth: 1
      },
      {
        domain: 'content' as ReceiptDomain,
        type: 'file-delivery',
        label: 'Website Files',
        icon: '📁',
        description: 'Deliverables sent',
        domainLabel: 'Content',
        parentIds: ['rcpt_1'],
        relationType: 'fulfills' as RelationType,
        depth: 2
      },
      {
        domain: 'operations' as ReceiptDomain,
        type: 'compliance-check',
        label: 'Compliance',
        icon: '✅',
        description: 'WCAG verified',
        domainLabel: 'Operations',
        parentIds: ['rcpt_2'],
        relationType: 'evidences' as RelationType,
        depth: 3
      },
      {
        domain: 'content' as ReceiptDomain,
        type: 'deployment',
        label: 'Live Site',
        icon: '🌐',
        description: 'Deployed + tested',
        domainLabel: 'Content',
        parentIds: ['rcpt_3'],
        relationType: 'evidences' as RelationType,
        depth: 4
      }
    ]
  },
  highticket: {
    name: "High-Ticket Sales",
    icon: "💎",
    example: "Coaching program with refund request (DAG demo)",
    customerPurchase: "Client pays $15,000 for coaching program",
    productDelivered: "Materials delivered, sessions attended",
    deliveryConfirmed: "Client requests refund citing dissatisfaction",
    painPoint: "CFO asks for proof",
    chargebackClaim: "CFO: 'Prove this $15K refund was legitimate'",
    yourDefense: "Full graph: Payment → Materials + Sessions → Complaint → Investigation → Refund",
    defenseAction: "Query Receipt Graph",
    resolutionTitle: "Refund justified & auditable",
    amountSaved: 15000.00,
    color: "orange",
    cfoQuery: "CFO: Prove this $15K refund was legitimate",
    queryPath: [0, 1, 2, 3, 4, 5, 6], // Full DAG path
    receipts: [
      {
        domain: 'transaction' as ReceiptDomain,
        type: 'wire-payment',
        label: 'Payment',
        icon: '💳',
        description: '$15K paid',
        domainLabel: 'Transaction',
        parentIds: [],
        relationType: undefined,
        depth: 0
      },
      {
        domain: 'content' as ReceiptDomain,
        type: 'materials',
        label: 'Materials',
        icon: '📚',
        description: '47 files',
        domainLabel: 'Content',
        parentIds: ['rcpt_0'],
        relationType: 'fulfills' as RelationType,
        depth: 1
      },
      {
        domain: 'operations' as ReceiptDomain,
        type: 'attendance',
        label: '8 Sessions',
        icon: '📊',
        description: 'Attended',
        domainLabel: 'Operations',
        parentIds: ['rcpt_0'],
        relationType: 'fulfills' as RelationType,
        depth: 1
      },
      {
        domain: 'operations' as ReceiptDomain,
        type: 'complaint',
        label: 'Complaint',
        icon: '⚠️',
        description: 'Dissatisfied',
        domainLabel: 'Operations',
        parentIds: ['rcpt_1', 'rcpt_2'],
        relationType: 'causes' as RelationType,
        depth: 2
      },
      {
        domain: 'content' as ReceiptDomain,
        type: 'investigation',
        label: 'Investigation',
        icon: '🔍',
        description: 'Review conducted',
        domainLabel: 'Content',
        parentIds: ['rcpt_3'],
        relationType: 'evidences' as RelationType,
        depth: 3
      },
      {
        domain: 'operations' as ReceiptDomain,
        type: 'approval',
        label: 'Approval',
        icon: '✅',
        description: 'Manager approved',
        domainLabel: 'Operations',
        parentIds: ['rcpt_4'],
        relationType: 'causes' as RelationType,
        depth: 4
      },
      {
        domain: 'transaction' as ReceiptDomain,
        type: 'refund',
        label: 'Refund',
        icon: '💰',
        description: '$15K refunded',
        domainLabel: 'Transaction',
        parentIds: ['rcpt_0', 'rcpt_3', 'rcpt_5'],
        relationType: 'invalidates' as RelationType,
        depth: 5
      }
    ]
  },
  content: {
    name: "Content Creators",
    icon: "🎬",
    example: "Videos, photos, digital media",
    customerPurchase: "Upload original bodycam footage to platform",
    productDelivered: "Cryptographic hash receipt created instantly",
    deliveryConfirmed: "Video published, monetized ($50K revenue)",
    painPoint: "Platform takedown notice",
    chargebackClaim: "Flagged as 'potentially AI-manipulated'",
    yourDefense: "Original Hash + Blockchain Timestamp + Publishing Log + Revenue",
    defenseAction: "Submit Receipt Graph",
    resolutionTitle: "Video restored",
    amountSaved: 50000.00,
    color: "indigo",
    cfoQuery: "Prove content is authentic and not AI-generated",
    queryPath: [0, 1, 2, 3],
    receipts: [
      {
        domain: 'content' as ReceiptDomain,
        type: 'original-hash',
        label: 'Original Hash',
        icon: '🎬',
        description: 'Video uploaded',
        domainLabel: 'Content',
        parentIds: [],
        relationType: undefined,
        depth: 0
      },
      {
        domain: 'operations' as ReceiptDomain,
        type: 'blockchain-anchor',
        label: 'Blockchain',
        icon: '⛓️',
        description: 'Immutably anchored',
        domainLabel: 'Operations',
        parentIds: ['rcpt_0'],
        relationType: 'evidences' as RelationType,
        depth: 1
      },
      {
        domain: 'operations' as ReceiptDomain,
        type: 'publish-log',
        label: 'Published',
        icon: '📤',
        description: 'Live on platform',
        domainLabel: 'Operations',
        parentIds: ['rcpt_1'],
        relationType: 'continues' as RelationType,
        depth: 2
      },
      {
        domain: 'transaction' as ReceiptDomain,
        type: 'revenue',
        label: 'Revenue',
        icon: '💰',
        description: '$50K earned',
        domainLabel: 'Transaction',
        parentIds: ['rcpt_2'],
        relationType: 'evidences' as RelationType,
        depth: 3
      }
    ]
  }
};

type PricingTier = 'free' | 'starter' | 'professional' | 'business' | 'enterprise';

const tierLimits = {
  free: { depth: 3, name: 'FREE', color: 'gray' },
  starter: { depth: 5, name: 'STARTER', color: 'blue' },
  professional: { depth: 10, name: 'PROFESSIONAL', color: 'purple' },
  business: { depth: Infinity, name: 'BUSINESS', color: 'orange' },
  enterprise: { depth: Infinity, name: 'ENTERPRISE', color: 'green' }
};

export default function ReceiptGraphMultiMode() {
  const [mode, setMode] = useState<BusinessMode>('highticket'); // Start with DAG demo
  const [step, setStep] = useState(0);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [showChargeback, setShowChargeback] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PricingTier>('professional');
  const [cfoQueryMode, setCfoQueryMode] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  const scenario = scenarios[mode];

  const getDomainColor = (domain: ReceiptDomain) => {
    switch (domain) {
      case 'transaction':
        return {
          bg: 'bg-green-100',
          border: 'border-green-500',
          text: 'text-green-700',
          label: 'Transaction',
          emoji: '🟢'
        };
      case 'content':
        return {
          bg: 'bg-purple-100',
          border: 'border-purple-500',
          text: 'text-purple-700',
          label: 'Content',
          emoji: '🟣'
        };
      case 'operations':
        return {
          bg: 'bg-orange-100',
          border: 'border-orange-500',
          text: 'text-orange-700',
          label: 'Operations',
          emoji: '🟠'
        };
    }
  };

  const steps = [
    {
      title: scenario.customerPurchase,
      action: "Next",
      description: "Transaction processed, receipt generated"
    },
    {
      title: scenario.productDelivered,
      action: "Next",
      description: "Product/service delivered, linked to payment"
    },
    {
      title: scenario.deliveryConfirmed,
      action: "Next",
      description: "Delivery confirmed, chain complete"
    },
    {
      title: scenario.painPoint,
      action: "Next",
      description: scenario.chargebackClaim
    },
    {
      title: "Submit receipt graph",
      action: "Next",
      description: scenario.yourDefense
    },
    {
      title: scenario.resolutionTitle,
      action: "Reset",
      description: `$${scenario.amountSaved.toLocaleString()} saved`
    }
  ];

  const handleNext = () => {
    const scenarioReceipts = scenario.receipts || [];

    if (step < scenarioReceipts.length) {
      // Add the next receipt from the scenario
      const receiptDef = scenarioReceipts[step];
      const receiptId = `rcpt_${step}`;

      // Generate cryptographic fields with timestamp offset based on step
      const crypto = generateCryptoFields(
        receiptId,
        receiptDef.parentIds,
        step * -5 // Each receipt is 5 minutes older
      );

      setReceipts(prev => [...prev, {
        id: receiptId, // Consistent ID for DAG relationships
        domain: receiptDef.domain,
        type: receiptDef.type,
        label: receiptDef.label,
        status: step === 0 ? 'created' : 'linked',
        data: receiptDef,
        parentIds: receiptDef.parentIds || [],
        relationType: receiptDef.relationType,
        depth: receiptDef.depth || 0,
        crypto
      }]);
    } else if (step === scenarioReceipts.length) {
      // Show the dispute/chargeback
      setShowChargeback(true);
    }

    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handleReset = () => {
    setStep(0);
    setReceipts([]);
    setShowChargeback(false);
    setCfoQueryMode(false);
    setSelectedReceipt(null);
  };

  const handleModeChange = (newMode: BusinessMode) => {
    setMode(newMode);
    handleReset();
  };

  // Check if receipt is visible based on tier depth limit
  const isReceiptVisible = (receipt: Receipt) => {
    const depthLimit = tierLimits[selectedTier].depth;
    return (receipt.depth || 0) < depthLimit;
  };

  // Check if receipt is in the CFO query path
  const isInQueryPath = (index: number) => {
    if (!cfoQueryMode) return false;
    const queryPath = (scenario as any).queryPath || [];
    return queryPath.includes(index);
  };

  const handleExportJSON = () => {
    const graphData = {
      scenario: {
        name: scenario.name,
        mode: mode,
        tier: selectedTier
      },
      receipts: receipts.map(r => ({
        id: r.id,
        domain: r.domain,
        type: r.type,
        label: r.label,
        parentIds: r.parentIds,
        relationType: r.relationType,
        depth: r.depth,
        crypto: r.crypto
      }))
    };

    const dataStr = JSON.stringify(graphData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-graph-${mode}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200 p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 rounded-full px-4 py-1.5 mb-3 text-sm font-bold">
          ✓ CRYPTOGRAPHICALLY VERIFIABLE
        </div>
        <h3 className="text-3xl font-bold text-gray-900 mb-3">
          Cross-Domain Receipt Graph
        </h3>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          Link transactions, content, and operations into one verifiable chain.
        </p>
      </div>

      {/* Business Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {(Object.keys(scenarios) as BusinessMode[]).map((modeKey) => {
          const s = scenarios[modeKey];
          return (
            <button
              key={modeKey}
              onClick={() => handleModeChange(modeKey)}
              className={`p-4 rounded-lg border-2 transition-all ${
                mode === modeKey
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400'
              }`}
            >
              <div className="text-3xl mb-1">{s.icon}</div>
              <div className="font-bold text-sm">{s.name}</div>
            </button>
          );
        })}
      </div>

      {/* Current Scenario */}
      <div className="bg-white rounded-lg p-4 mb-6 border-2 border-blue-200">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{scenario.icon}</div>
          <div>
            <div className="font-bold text-gray-900">{scenario.name}</div>
            <div className="text-sm text-gray-600">{scenario.example}</div>
          </div>
        </div>
      </div>

      {/* Tier Selector, Export & CFO Query */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Tier Depth Limit Selector with Export */}
        <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-700">Simulate Pricing Tier (Graph Depth Limit)</div>
            {receipts.length > 0 && (
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all"
              >
                <span>📥</span>
                <span>Export JSON</span>
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(tierLimits) as PricingTier[]).map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedTier === tier
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tierLimits[tier].name} ({tierLimits[tier].depth === Infinity ? '∞' : tierLimits[tier].depth} levels)
              </button>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-600">
            Current tier shows up to <strong>{tierLimits[selectedTier].depth === Infinity ? 'unlimited' : tierLimits[selectedTier].depth} levels</strong> deep
          </div>
        </div>

        {/* CFO Query Mode */}
        {(scenario as any).cfoQuery && receipts.length >= (scenario.receipts?.length || 0) - 1 && (
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4 border-2 border-green-300">
            <div className="text-sm font-semibold text-gray-900 mb-2">Enterprise Use Case</div>
            <div className="text-xs text-gray-700 mb-3">"{(scenario as any).cfoQuery}"</div>
            <button
              onClick={() => setCfoQueryMode(!cfoQueryMode)}
              className={`w-full px-4 py-2 rounded-lg font-semibold transition-all ${
                cfoQueryMode
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-white text-green-700 border-2 border-green-600 hover:bg-green-50'
              }`}
            >
              {cfoQueryMode ? '✓ Showing Proof Path' : '🔍 Query Receipt Graph'}
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Step {step + 1} of {steps.length}</span>
          <span className="text-sm text-gray-500">{Math.round(((step + 1) / steps.length) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Step */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
            {step === 0 && '💳'}
            {step === 1 && '📦'}
            {step === 2 && '✅'}
            {step === 3 && '⚠️'}
            {step === 4 && '🛡️'}
            {step === 5 && '🎉'}
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-bold text-gray-900 mb-2">{steps[step].title}</h4>
            <p className="text-gray-700 mb-4">{steps[step].description}</p>

            {step < 5 && (
              <button
                onClick={handleNext}
                className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
              >
                {steps[step].action} →
              </button>
            )}

            {step === 5 && (
              <div className="space-y-3">
                <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-2xl">✓</div>
                    <div className="font-bold text-green-900 text-lg">{scenario.resolutionTitle}</div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    {scenario.yourDefense}
                  </p>
                  <div className="pt-3 border-t border-green-200">
                    <div className="font-bold text-green-700 text-2xl">${scenario.amountSaved.toLocaleString()} saved</div>
                    <div className="text-sm text-gray-600">
                      {mode === 'content' ? '(Reputation + legal costs avoided)' : '(Payment + fees avoided)'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleReset}
                    className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-6 py-3 rounded-lg font-semibold transition-all"
                  >
                    ↻ Try Again
                  </button>
                  <button
                    onClick={() => {
                      const modes: BusinessMode[] = ['ecommerce', 'digital', 'services', 'highticket', 'content'];
                      const currentIndex = modes.indexOf(mode);
                      const nextMode = modes[(currentIndex + 1) % modes.length];
                      handleModeChange(nextMode);
                    }}
                    className="bg-blue-100 text-blue-800 hover:bg-blue-200 px-6 py-3 rounded-lg font-semibold transition-all"
                  >
                    Try Different Business →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Graph Visualization - DAG Structure */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
        <h4 className="font-bold text-gray-900 mb-4 text-center">
          Cross-Domain Receipt Graph (DAG)
          {cfoQueryMode && <span className="text-green-600 ml-2">- Proof Path Highlighted</span>}
        </h4>

        <div className="relative min-h-[300px]">
          {/* DAG Visualization by Depth Level */}
          {receipts.length > 0 && (
            <div className="space-y-6">
              {Array.from(new Set(receipts.map(r => r.depth || 0))).sort((a, b) => a - b).map((depth) => {
                const receiptsAtDepth = receipts.filter(r => (r.depth || 0) === depth);

                return (
                  <div key={depth} className="relative">
                    {/* Depth Level Label */}
                    <div className="absolute -left-16 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                      L{depth}
                    </div>

                    {/* Receipts at this depth */}
                    <div className="flex items-center justify-center gap-6 flex-wrap">
                      {receiptsAtDepth.map((receipt, idx) => {
                        const colors = getDomainColor(receipt.domain);
                        const receiptData = receipt.data as any;
                        const isVisible = isReceiptVisible(receipt);
                        const receiptIndex = receipts.indexOf(receipt);
                        const inQueryPath = isInQueryPath(receiptIndex);
                        const hasMultipleParents = (receipt.parentIds?.length || 0) > 1;

                        return (
                          <div key={receipt.id} className="relative">
                            {/* Multi-parent indicator */}
                            {hasMultipleParents && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap z-10">
                                {receipt.parentIds?.length} PARENTS
                              </div>
                            )}

                            {/* Receipt Card */}
                            <div className={`transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-30'} ${inQueryPath ? 'ring-4 ring-green-500 scale-105' : ''}`}>
                              <div
                                onClick={() => setSelectedReceipt(receipt)}
                                className={`relative w-32 h-32 ${colors.bg} border-4 ${colors.border} rounded-lg flex flex-col items-center justify-center p-2 ${!isVisible ? 'grayscale' : ''} cursor-pointer hover:scale-105 transition-transform`}
                              >
                                {/* Query highlight */}
                                {inQueryPath && (
                                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                    ✓
                                  </div>
                                )}

                                <div className="text-2xl mb-1">{receiptData.icon}</div>
                                <div className="font-bold text-xs text-center">{receipt.label}</div>
                                <div className={`text-[10px] ${colors.text} text-center mt-1`}>{receiptData.description}</div>

                                {/* Relationship type label */}
                                {receipt.relationType && (
                                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                                    {receipt.relationType}
                                  </div>
                                )}

                                <div className={`text-[9px] ${colors.text} font-bold mt-1 uppercase`}>
                                  {colors.emoji} {colors.label}
                                </div>

                                {/* Depth limit indicator */}
                                {!isVisible && (
                                  <div className="absolute inset-0 bg-gray-900/60 rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                      <div className="text-white text-xs font-bold">🔒</div>
                                      <div className="text-white text-[9px]">Upgrade</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Connecting lines to children (simplified) */}
                    {depth < Math.max(...receipts.map(r => r.depth || 0)) && (
                      <div className="flex justify-center mt-2 mb-2">
                        <div className="text-gray-400 font-bold text-2xl">↓</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {receipts.length === 0 && (
            <div className="text-gray-400 text-center py-16">
              <p className="text-lg font-semibold">Click "Next" to start building the Receipt Graph</p>
              <p className="text-sm mt-2">Watch the DAG structure emerge with branching and merging</p>
            </div>
          )}
        </div>

        {/* Crypto Details Panel */}
        {selectedReceipt && (
          <div className="mt-6 bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h5 className="text-lg font-bold text-gray-900 mb-1">
                  Cryptographic Details
                </h5>
                <p className="text-sm text-gray-600">
                  Receipt: {selectedReceipt.label} ({selectedReceipt.id})
                </p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-xs font-semibold text-gray-600 mb-1">Hash</div>
                <code className="text-xs text-gray-900 break-all font-mono">
                  {selectedReceipt.crypto.hash}
                </code>
              </div>

              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-xs font-semibold text-gray-600 mb-1">Signature</div>
                <code className="text-xs text-gray-900 break-all font-mono">
                  {selectedReceipt.crypto.signature}
                </code>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Timestamp</div>
                  <code className="text-xs text-gray-900 font-mono">
                    {selectedReceipt.crypto.timestamp}
                  </code>
                </div>

                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Key ID</div>
                  <code className="text-xs text-gray-900 font-mono">
                    {selectedReceipt.crypto.jwksKeyId}
                  </code>
                </div>
              </div>

              {selectedReceipt.crypto.parentHash && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Parent Hash</div>
                  <code className="text-xs text-gray-900 break-all font-mono">
                    {selectedReceipt.crypto.parentHash}
                  </code>
                </div>
              )}

              <div className="pt-3 border-t border-gray-300">
                <p className="text-xs text-gray-600">
                  <strong>Domain:</strong> {selectedReceipt.domain} |
                  <strong className="ml-2">Type:</strong> {selectedReceipt.type} |
                  <strong className="ml-2">Depth:</strong> Level {selectedReceipt.depth}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Graph Stats */}
        {receipts.length >= 3 && (
          <div className="mt-6">
            <div className="flex justify-center gap-4 flex-wrap mb-4">
              <div className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2">
                <div className="text-xs font-semibold text-gray-900">
                  {receipts.length} receipts • {new Set(receipts.map(r => r.domain)).size} domains •
                  {Math.max(...receipts.map(r => r.depth || 0)) + 1} levels deep
                </div>
              </div>

              {receipts.some(r => !isReceiptVisible(r)) && (
                <div className="bg-orange-100 border border-orange-400 rounded-lg px-4 py-2">
                  <div className="text-xs font-bold text-orange-900">
                    ⚠️ {receipts.filter(r => !isReceiptVisible(r)).length} receipts hidden by {tierLimits[selectedTier].name} tier limit
                  </div>
                </div>
              )}
            </div>

            {/* Upgrade CTA when depth limit is hit */}
            {receipts.some(r => !isReceiptVisible(r)) && (
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 text-center">
                <div className="text-white font-bold mb-2">
                  🔓 Unlock Full Graph Visibility
                </div>
                <div className="text-blue-100 text-sm mb-3">
                  Your graph is {Math.max(...receipts.map(r => r.depth || 0)) + 1} levels deep,
                  but {tierLimits[selectedTier].name} tier only shows {tierLimits[selectedTier].depth} levels.
                </div>
                <div className="flex gap-2 justify-center flex-wrap">
                  {selectedTier === 'free' && (
                    <button
                      onClick={() => setSelectedTier('professional')}
                      className="bg-white text-blue-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-all"
                    >
                      Try PROFESSIONAL (10 levels) →
                    </button>
                  )}
                  {(selectedTier === 'free' || selectedTier === 'starter') && (
                    <button
                      onClick={() => setSelectedTier('enterprise')}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-green-600 transition-all"
                    >
                      Upgrade to ENTERPRISE (unlimited) →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {showChargeback && step < 5 && (
          <div className="text-center mt-4">
            <div className="inline-block bg-red-100 border-2 border-red-500 rounded-lg px-4 py-2 animate-pulse">
              <div className="text-sm font-bold text-red-900 uppercase">⚠️ {scenario.painPoint}</div>
              <div className="text-xs text-gray-700">{scenario.chargebackClaim}</div>
            </div>
          </div>
        )}
      </div>

      {/* Competitive Comparison */}
      {receipts.length >= 2 && (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">Cross-Domain Verification</h4>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-center">
                <div className="text-2xl mb-2">🟢</div>
                <div className="font-semibold text-gray-900 text-sm">Stripe</div>
                <div className="text-xs text-gray-600 mt-1">Transactions</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-center">
                <div className="text-2xl mb-2">🟣</div>
                <div className="font-semibold text-gray-900 text-sm">C2PA</div>
                <div className="text-xs text-gray-600 mt-1">Content</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-center">
                <div className="text-2xl mb-2">🟠</div>
                <div className="font-semibold text-gray-900 text-sm">Audit Logs</div>
                <div className="text-xs text-gray-600 mt-1">Operations</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg p-4 border-2 border-blue-700">
              <div className="text-center">
                <div className="text-2xl mb-2">🟢🟣🟠</div>
                <div className="font-semibold text-white text-sm">CertNode</div>
                <div className="text-xs text-blue-100 mt-1">Cryptographic cross-linking</div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Bottom CTA */}
      {step === 5 && (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center">
          <p className="text-gray-700 mb-4">See pricing and plans</p>
          <a
            href="/pricing"
            className="inline-block bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold transition-all"
          >
            View Pricing →
          </a>
        </div>
      )}
    </div>
  );
}
