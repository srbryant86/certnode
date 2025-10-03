'use client';

import { useState } from 'react';

type BusinessMode = 'ecommerce' | 'digital' | 'services' | 'highticket' | 'content';

type ReceiptDomain = 'transaction' | 'content' | 'operations';

type Receipt = {
  id: string;
  domain: ReceiptDomain;
  type: string;
  label: string;
  status: 'pending' | 'created' | 'linked';
  data: any;
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
    receipts: [
      {
        domain: 'transaction' as ReceiptDomain,
        type: 'payment',
        label: 'Payment',
        icon: '💳',
        description: '$150 paid',
        domainLabel: 'Transaction'
      },
      {
        domain: 'content' as ReceiptDomain,
        type: 'shipping-label',
        label: 'Label + Photo',
        icon: '📦',
        description: 'Product documented',
        domainLabel: 'Content'
      },
      {
        domain: 'operations' as ReceiptDomain,
        type: 'tracking',
        label: 'FedEx Tracking',
        icon: '🚚',
        description: 'Delivery logged',
        domainLabel: 'Operations'
      },
      {
        domain: 'content' as ReceiptDomain,
        type: 'delivery-photo',
        label: 'Delivery Photo',
        icon: '📸',
        description: 'Signed package',
        domainLabel: 'Content'
      }
    ]
  },
  digital: {
    name: "Digital Products",
    icon: "💻",
    example: "Online course or software license",
    customerPurchase: "Customer buys $89 online course",
    productDelivered: "AI-generated course content delivered",
    deliveryConfirmed: "Customer completed 12 lessons (47 min watch time)",
    painPoint: "Chargeback filed",
    chargebackClaim: "60 days later: 'Never got access'",
    yourDefense: "Transaction + AI Content Receipt + Lesson Completion Logs",
    defenseAction: "Submit Receipt Graph",
    resolutionTitle: "Chargeback reversed",
    amountSaved: 89.00,
    color: "purple",
    receipts: [
      {
        domain: 'transaction' as ReceiptDomain,
        type: 'payment',
        label: 'Payment',
        icon: '💳',
        description: '$89 paid',
        domainLabel: 'Transaction'
      },
      {
        domain: 'content' as ReceiptDomain,
        type: 'ai-content',
        label: 'AI Course',
        icon: '🤖',
        description: 'Generated + delivered',
        domainLabel: 'Content'
      },
      {
        domain: 'operations' as ReceiptDomain,
        type: 'access-log',
        label: '12 Lessons',
        icon: '📊',
        description: '47 min watched',
        domainLabel: 'Operations'
      }
    ]
  },
  services: {
    name: "Professional Services",
    icon: "🎯",
    example: "Consulting, agency work, freelancing",
    customerPurchase: "Client pays $2,500 for website design",
    productDelivered: "Website files delivered via Dropbox",
    deliveryConfirmed: "Client downloaded files, site deployed live",
    painPoint: "Chargeback filed",
    chargebackClaim: "Claims 'work never completed' (site is live)",
    yourDefense: "Transaction + File Delivery + Download Logs + Live Site",
    defenseAction: "Submit Receipt Graph",
    resolutionTitle: "Chargeback reversed",
    amountSaved: 2500.00,
    color: "blue",
    receipts: [
      {
        domain: 'transaction' as ReceiptDomain,
        type: 'payment',
        label: 'Payment',
        icon: '💳',
        description: '$2,500 paid',
        domainLabel: 'Transaction'
      },
      {
        domain: 'content' as ReceiptDomain,
        type: 'file-delivery',
        label: 'Website Files',
        icon: '📁',
        description: 'Dropbox delivery',
        domainLabel: 'Content'
      },
      {
        domain: 'operations' as ReceiptDomain,
        type: 'download-log',
        label: 'Download Logs',
        icon: '📥',
        description: 'Client accessed',
        domainLabel: 'Operations'
      },
      {
        domain: 'content' as ReceiptDomain,
        type: 'screenshot',
        label: 'Live Site',
        icon: '🌐',
        description: 'Deployed + verified',
        domainLabel: 'Content'
      }
    ]
  },
  highticket: {
    name: "High-Ticket Sales",
    icon: "💎",
    example: "Coaching programs, masterminds, enterprise",
    customerPurchase: "Client pays $15,000 for coaching program (wire transfer)",
    productDelivered: "Course materials delivered, portal access granted",
    deliveryConfirmed: "8 sessions attended, 47 files downloaded",
    painPoint: "Payment dispute filed",
    chargebackClaim: "Claims 'services not delivered'",
    yourDefense: "Transaction + Course Materials + Attendance + Session Recordings",
    defenseAction: "Submit Receipt Graph",
    resolutionTitle: "Dispute resolved",
    amountSaved: 15000.00,
    color: "orange",
    receipts: [
      {
        domain: 'transaction' as ReceiptDomain,
        type: 'wire-payment',
        label: 'Wire Payment',
        icon: '💳',
        description: '$15K paid',
        domainLabel: 'Transaction'
      },
      {
        domain: 'content' as ReceiptDomain,
        type: 'materials',
        label: 'Course Materials',
        icon: '📚',
        description: '47 files delivered',
        domainLabel: 'Content'
      },
      {
        domain: 'operations' as ReceiptDomain,
        type: 'attendance',
        label: '8 Sessions',
        icon: '📊',
        description: 'Attended + logged',
        domainLabel: 'Operations'
      },
      {
        domain: 'content' as ReceiptDomain,
        type: 'recordings',
        label: 'Recordings',
        icon: '🎥',
        description: 'All sessions saved',
        domainLabel: 'Content'
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
    receipts: [
      {
        domain: 'content' as ReceiptDomain,
        type: 'original-hash',
        label: 'Original Hash',
        icon: '🎬',
        description: 'Video uploaded',
        domainLabel: 'Content'
      },
      {
        domain: 'operations' as ReceiptDomain,
        type: 'blockchain-anchor',
        label: 'Blockchain',
        icon: '⛓️',
        description: 'Immutably anchored',
        domainLabel: 'Operations'
      },
      {
        domain: 'operations' as ReceiptDomain,
        type: 'publish-log',
        label: 'Published',
        icon: '📤',
        description: 'Live on platform',
        domainLabel: 'Operations'
      },
      {
        domain: 'transaction' as ReceiptDomain,
        type: 'revenue',
        label: 'Revenue',
        icon: '💰',
        description: '$50K earned',
        domainLabel: 'Transaction'
      }
    ]
  }
};

export default function ReceiptGraphMultiMode() {
  const [mode, setMode] = useState<BusinessMode>('digital');
  const [step, setStep] = useState(0);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [showChargeback, setShowChargeback] = useState(false);

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
      setReceipts(prev => [...prev, {
        id: `rcpt_${receiptDef.type}_${Date.now()}`,
        domain: receiptDef.domain,
        type: receiptDef.type,
        label: receiptDef.label,
        status: step === 0 ? 'created' : 'linked',
        data: receiptDef
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
  };

  const handleModeChange = (newMode: BusinessMode) => {
    setMode(newMode);
    handleReset();
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200 p-8">
      {/* Header */}
      <div className="text-center mb-8">
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

      {/* Receipt Graph Visualization */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
        <h4 className="font-bold text-gray-900 mb-4 text-center">Cross-Domain Receipt Graph</h4>

        <div className="flex items-center justify-center gap-4 min-h-[200px] flex-wrap">
          {receipts.map((receipt, index) => {
            const colors = getDomainColor(receipt.domain);
            const receiptData = receipt.data as any;

            return (
              <div key={receipt.id} className="flex items-center">
                {index > 0 && (
                  <div className="flex-shrink-0 text-gray-400 font-bold text-3xl animate-pulse mx-2">→</div>
                )}

                <div className="transition-all duration-500 opacity-100 scale-100">
                  <div className={`w-36 h-36 ${colors.bg} border-4 ${colors.border} rounded-lg flex flex-col items-center justify-center p-2`}>
                    <div className="text-3xl mb-1">{receiptData.icon}</div>
                    <div className="font-bold text-sm text-center">{receipt.label}</div>
                    <div className={`text-xs ${colors.text} text-center mt-1`}>{receiptData.description}</div>
                    <div className={`text-[10px] ${colors.text} font-bold mt-2 uppercase`}>
                      {colors.emoji} {colors.label}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {receipts.length === 0 && (
            <div className="text-gray-400 text-center py-8">
              <p className="text-lg font-semibold">Click "Next" to start building the Receipt Graph</p>
            </div>
          )}
        </div>

        {receipts.length >= 3 && !showChargeback && (
          <div className="text-center mt-4">
            <div className="inline-block bg-gray-100 border border-gray-300 rounded-lg px-4 py-2">
              <div className="text-sm font-semibold text-gray-900">{receipts.length} receipts linked across {new Set(receipts.map(r => r.domain)).size} domains</div>
            </div>
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
                <div className="text-xs text-blue-100 mt-1">All three connected</div>
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
