'use client';

import { useState } from 'react';

export default function ReceiptGraph() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const [animationStep, setAnimationStep] = useState<number>(0);
  const stepHeadlines = [
    'Day 1, 2:34pm: Customer Purchases Product',
    'Day 1, 2:35pm: Product Delivered with AI-generated assets',
    'Day 1, 2:36pm: System Confirms Delivery',
    "Day 30: Customer Files Chargeback - 'Never received product'",
    'Merchant Defends: Graph Proves Complete Chain',
    'Victory: Chargeback Reversed in 2 Minutes',
  ];

  const stepDescriptions = [
    'Transaction receipt created: $89.50 payment processed through Stripe',
    'Content receipt links to transaction: product images verified 87% human-created',
    'Operations receipt links to both: delivery tracking confirms receipt',
    'Without the receipt graph the merchant loses $89.50 plus a $15 dispute fee. With CertNode the team responds with cryptographic proof',
    'Complete cryptographic chain: payment, product (verified authentic), and delivery confirmed. All three domains prove legitimacy',
    'Merchant saved $104.50 (payment plus fee). Automated defense took two minutes instead of two weeks',
  ];

  const activeHeadline = animationStep > 0 ? stepHeadlines[animationStep - 1] : null;
  const activeDescription = animationStep > 0 ? stepDescriptions[animationStep - 1] : null;

  const handleAnimate = () => {
    setIsAnimating(true);
    setAnimationStep(0);

    // Story-driven animation: real e-commerce scenario
    setTimeout(() => setAnimationStep(1), 500);   // Day 1: Customer purchases
    setTimeout(() => setAnimationStep(2), 1800);  // Day 1: Product delivered (with AI images)
    setTimeout(() => setAnimationStep(3), 3100);  // Day 1: Delivery confirmed
    setTimeout(() => setAnimationStep(4), 4400);  // Day 30: Customer files chargeback (THREAT)
    setTimeout(() => setAnimationStep(5), 6000);  // Merchant defends: Graph proves legitimacy
    setTimeout(() => setAnimationStep(6), 7500);  // VICTORY: Dispute won, money saved
    setTimeout(() => {
      setIsAnimating(false);
      setAnimationStep(0);
    }, 9500);
  };

  const nodeInfo: Record<string, { title: string; subtitle: string; description: string }> = {
    payment: {
      title: '💳 Payment Receipt',
      subtitle: 'Transaction: $89.50',
      description: 'Customer purchases product. Stripe payment processed and cryptographically signed. This is the first receipt in the chain.'
    },
    aicheck: {
      title: '🤖 AI Content Check',
      subtitle: 'Content Verification: 87% Human',
      description: 'Product images verified as 87% human-created. Links cryptographically to payment receipt, proving what was delivered.'
    },
    delivery: {
      title: '📦 Delivery Confirmation',
      subtitle: 'Operations: Confirmed',
      description: 'System confirms product delivery. Links to both payment and content receipts, completing the verification chain.'
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
      <h3 className="text-3xl font-bold text-gray-900 mb-4 text-center">
        See How Receipt Graph Defends Against Chargebacks
      </h3>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-3xl mx-auto">
        Watch a real-world e-commerce scenario: Customer purchases → Product delivered → Chargeback filed → Merchant wins with cryptographic proof.
        Click &quot;Play Animation&quot; to see the complete story.
      </p>

      {/* Animation Step Labels - Shows what&apos;s happening during animation */}
      <div className="h-24 mb-4">
        {isAnimating && animationStep > 0 && (
          <div className={`border-l-4 p-4 rounded-lg transition-all ${
            animationStep === 4 ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-500 animate-pulse' :
            animationStep === 6 ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-500' :
            'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-500'
          }`}>
            {activeHeadline && (
              <h4 className="font-bold text-gray-900 mb-1">{activeHeadline}</h4>
            )}
            {activeDescription && (
              <p className="text-sm text-gray-700">{activeDescription}</p>
            )}

          </div>
        )}
        {!isAnimating && hoveredNode && nodeInfo[hoveredNode] && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-4 rounded-lg transition-all">
            <h4 className="font-bold text-gray-900 mb-1">{nodeInfo[hoveredNode].title}</h4>
            <p className="text-sm text-blue-700 font-semibold mb-2">{nodeInfo[hoveredNode].subtitle}</p>
            <p className="text-sm text-gray-700">{nodeInfo[hoveredNode].description}</p>
          </div>
        )}
      </div>

      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 mb-6" style={{ minHeight: '500px' }}>
        <svg viewBox="0 0 1000 500" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="gradient-purple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#667eea" />
              <stop offset="100%" stopColor="#764ba2" />
            </linearGradient>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
              <feOffset dx="0" dy="2" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.2"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Connection Line: Payment to AI Check (appears in step 2) */}
          <g opacity={animationStep >= 2 ? (animationStep === 5 || animationStep === 6 ? 1 : 0.7) : 0} style={{ transition: 'opacity 0.5s' }}>
            <path
              d="M 200 360 Q 350 420 450 360"
              stroke={animationStep === 5 || animationStep === 6 ? '#10b981' : '#9f7aea'}
              strokeWidth={animationStep === 5 || animationStep === 6 ? '4' : '3'}
              fill="none"
              strokeDasharray="8,4"
              className={animationStep === 5 ? 'animate-pulse' : ''}
            />
          </g>

          {/* Connection Line: AI Check to Delivery (appears in step 3) */}
          <g opacity={animationStep >= 3 ? (animationStep === 5 || animationStep === 6 ? 1 : 0.7) : 0} style={{ transition: 'opacity 0.5s' }}>
            <path
              d="M 500 360 Q 600 420 700 360"
              stroke={animationStep === 5 || animationStep === 6 ? '#10b981' : '#9f7aea'}
              strokeWidth={animationStep === 5 || animationStep === 6 ? '4' : '3'}
              fill="none"
              strokeDasharray="8,4"
              className={animationStep === 5 ? 'animate-pulse' : ''}
            />
          </g>

          {/* Connection Line: Payment to Delivery (complete chain, appears in step 3) */}
          <g opacity={animationStep >= 3 ? (animationStep === 5 || animationStep === 6 ? 1 : 0.4) : 0} style={{ transition: 'opacity 0.5s' }}>
            <path
              d="M 200 360 Q 450 450 700 360"
              stroke={animationStep === 5 || animationStep === 6 ? '#10b981' : '#ec4899'}
              strokeWidth={animationStep === 5 || animationStep === 6 ? '3' : '2'}
              fill="none"
              strokeDasharray="4,4"
              className={animationStep === 5 ? 'animate-pulse' : ''}
            />
          </g>

          {/* Chargeback Threat Indicator (appears in step 4) */}
          {animationStep === 4 && (
            <g className="animate-pulse">
              <circle cx="450" cy="120" r="60" fill="#fee2e2" stroke="#dc2626" strokeWidth="3" opacity="0.9" />
              <text x="450" y="115" textAnchor="middle" className="fill-red-600 font-bold" fontSize="16">⚠️ THREAT</text>
              <text x="450" y="135" textAnchor="middle" className="fill-red-700 font-semibold" fontSize="12">Chargeback Filed</text>
            </g>
          )}

          {/* Timeline indicator */}
          <g>
            <text x="100" y="250" className="fill-gray-500 font-semibold" fontSize="11">Day 1</text>
            <text x="100" y="270" className="fill-gray-400" fontSize="9">Purchase</text>

            <text x="420" y="250" className="fill-gray-500 font-semibold" fontSize="11">Day 1</text>
            <text x="390" y="270" className="fill-gray-400" fontSize="9">Delivery + Check</text>

            <text x="720" y="250" className="fill-gray-500 font-semibold" fontSize="11">Day 1</text>
            <text x="690" y="270" className="fill-gray-400" fontSize="9">Confirmation</text>
          </g>

          {/* Receipt 1: Payment - Appears in step 1 */}
          {animationStep >= 1 && (
            <g
              filter="url(#shadow)"
              onMouseEnter={() => !isAnimating && setHoveredNode('payment')}
              onMouseLeave={() => setHoveredNode(null)}
              className="cursor-pointer"
              style={{
                opacity: animationStep === 1 ? 1 : (hoveredNode === 'payment' ? 1 : 0.9),
                transition: 'opacity 0.5s',
                transform: animationStep === 1 ? 'scale(1.1)' : 'scale(1)',
                transformOrigin: '200px 335px'
              }}
            >
              <rect
                x="150" y="310" width="100" height="50" rx="6"
                fill={animationStep === 6 ? '#d1fae5' : '#dcfce7'}
                stroke={animationStep === 6 ? '#10b981' : (animationStep === 1 ? '#fbbf24' : (hoveredNode === 'payment' ? '#16a34a' : '#22c55e'))}
                strokeWidth={animationStep === 1 || animationStep === 6 ? '4' : (hoveredNode === 'payment' ? '3' : '2')}
                className={animationStep === 1 || animationStep === 6 ? 'animate-pulse' : ''}
              />
              <text x="200" y="330" textAnchor="middle" className="fill-gray-800 font-bold pointer-events-none" fontSize="12">💳 Payment</text>
              <text x="200" y="350" textAnchor="middle" className="fill-gray-700 font-semibold pointer-events-none" fontSize="14">$89.50</text>
            </g>
          )}

          {/* Receipt 2: AI Check - Appears in step 2 */}
          {animationStep >= 2 && (
            <g
              filter="url(#shadow)"
              onMouseEnter={() => !isAnimating && setHoveredNode('aicheck')}
              onMouseLeave={() => setHoveredNode(null)}
              className="cursor-pointer"
              style={{
                opacity: animationStep === 2 ? 1 : (hoveredNode === 'aicheck' ? 1 : 0.9),
                transition: 'opacity 0.5s',
                transform: animationStep === 2 ? 'scale(1.1)' : 'scale(1)',
                transformOrigin: '450px 335px'
              }}
            >
              <rect
                x="400" y="310" width="100" height="50" rx="6"
                fill={animationStep === 6 ? '#e9d5ff' : '#f3e8ff'}
                stroke={animationStep === 6 ? '#10b981' : (animationStep === 2 ? '#fbbf24' : (hoveredNode === 'aicheck' ? '#7c3aed' : '#8b5cf6'))}
                strokeWidth={animationStep === 2 || animationStep === 6 ? '4' : (hoveredNode === 'aicheck' ? '3' : '2')}
                className={animationStep === 2 || animationStep === 6 ? 'animate-pulse' : ''}
              />
              <text x="450" y="330" textAnchor="middle" className="fill-gray-800 font-bold pointer-events-none" fontSize="12">🤖 AI Check</text>
              <text x="450" y="350" textAnchor="middle" className="fill-gray-700 font-semibold pointer-events-none" fontSize="13">87% Human</text>
            </g>
          )}

          {/* Receipt 3: Delivery - Appears in step 3 */}
          {animationStep >= 3 && (
            <g
              filter="url(#shadow)"
              onMouseEnter={() => !isAnimating && setHoveredNode('delivery')}
              onMouseLeave={() => setHoveredNode(null)}
              className="cursor-pointer"
              style={{
                opacity: animationStep === 3 ? 1 : (hoveredNode === 'delivery' ? 1 : 0.9),
                transition: 'opacity 0.5s',
                transform: animationStep === 3 ? 'scale(1.1)' : 'scale(1)',
                transformOrigin: '700px 335px'
              }}
            >
              <rect
                x="650" y="310" width="100" height="50" rx="6"
                fill={animationStep === 6 ? '#fed7aa' : '#ffedd5'}
                stroke={animationStep === 6 ? '#10b981' : (animationStep === 3 ? '#fbbf24' : (hoveredNode === 'delivery' ? '#ea580c' : '#f97316'))}
                strokeWidth={animationStep === 3 || animationStep === 6 ? '4' : (hoveredNode === 'delivery' ? '3' : '2')}
                className={animationStep === 3 || animationStep === 6 ? 'animate-pulse' : ''}
              />
              <text x="700" y="330" textAnchor="middle" className="fill-gray-800 font-bold pointer-events-none" fontSize="12">📦 Delivery</text>
              <text x="700" y="350" textAnchor="middle" className="fill-gray-700 font-semibold pointer-events-none" fontSize="13">Confirmed</text>
            </g>
          )}

          {/* Success Indicator (appears in step 6) */}
          {animationStep === 6 && (
            <g className="animate-bounce">
              <circle cx="450" cy="120" r="70" fill="#d1fae5" stroke="#10b981" strokeWidth="4" opacity="0.95" />
              <text x="450" y="105" textAnchor="middle" className="fill-green-700 font-bold" fontSize="32">✓</text>
              <text x="450" y="130" textAnchor="middle" className="fill-green-800 font-bold" fontSize="14">Dispute Won!</text>
              <text x="450" y="148" textAnchor="middle" className="fill-green-700 font-semibold" fontSize="12">Saved $104.50</text>
            </g>
          )}

          {/* Connection Labels */}
          {animationStep >= 3 && animationStep !== 4 && (
            <g opacity="0.8" style={{ transition: 'opacity 0.5s' }}>
              <text x="325" y="415" textAnchor="middle" className={animationStep === 5 || animationStep === 6 ? 'fill-green-600 font-bold' : 'fill-purple-600 font-semibold'} fontSize="10">
                Linked
              </text>
              <text x="575" y="415" textAnchor="middle" className={animationStep === 5 || animationStep === 6 ? 'fill-green-600 font-bold' : 'fill-purple-600 font-semibold'} fontSize="10">
                Linked
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-8 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-green-100 border-2 border-green-500 flex items-center justify-center">💳</div>
          <span className="text-gray-700 font-medium">Transaction Receipt</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-purple-100 border-2 border-purple-500 flex items-center justify-center">🤖</div>
          <span className="text-gray-700 font-medium">Content Receipt</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-orange-100 border-2 border-orange-500 flex items-center justify-center">📦</div>
          <span className="text-gray-700 font-medium">Operations Receipt</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-8 h-6" viewBox="0 0 32 24">
            <line x1="2" y1="12" x2="30" y2="12" stroke="#9f7aea" strokeWidth="2" strokeDasharray="6,3" />
          </svg>
          <span className="text-gray-700 font-medium">Cryptographic Link</span>
        </div>
      </div>

      {/* Explanation Boxes */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
          <h4 className="font-bold text-gray-900 mb-2">🔒 Cross-Domain Verification</h4>
          <p className="text-gray-700 leading-relaxed text-sm">
            Transaction receipts link to content certifications, which link to operational attestations. Each domain strengthens the others cryptographically. To forge a single transaction, attackers must compromise all three domains simultaneously and recalculate the global merkle root - <strong>exponentially harder</strong> than forging isolated records.
          </p>
        </div>

        <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-lg">
          <h4 className="font-bold text-gray-900 mb-2">🌐 Cross-Merchant Network</h4>
          <p className="text-gray-700 leading-relaxed text-sm">
            Receipts from different merchants verify each other through cryptographic hash linking. A customer with 15 verified purchases across 8 merchants has a network trust score that makes fraud nearly impossible. <strong>Each new merchant makes every receipt more trustworthy.</strong>
          </p>
        </div>

        <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
          <h4 className="font-bold text-gray-900 mb-2">⏱️ Trusted Time-Stamping</h4>
          <p className="text-gray-700 leading-relaxed text-sm">
            Global merkle roots published to Bitcoin blockchain every 10 minutes. Anyone can independently verify receipts without trusting CertNode. <strong>Court-admissible evidence</strong> that&apos;s cryptographically provable and legally recognized.
          </p>
        </div>

        <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-lg">
          <h4 className="font-bold text-gray-900 mb-2">🛡️ Collective Fraud Defense</h4>
          <p className="text-gray-700 leading-relaxed text-sm">
            Anonymous fraud patterns shared across the network. When one merchant detects fraud, all merchants are protected. <strong>Network learns from every attack,</strong> making fraud patterns immediately detectable network-wide.
          </p>
        </div>
      </div>

      {/* Animate Button */}
      <div className="text-center">
        <button
          onClick={handleAnimate}
          disabled={isAnimating}
          className="bg-blue-600 text-white hover:bg-blue-700 px-10 py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnimating ? '⏳ Playing Story...' : '▶️ Play: Customer Buys → Chargeback → Merchant Wins'}
        </button>
        <p className="text-gray-500 text-sm mt-3">
          Watch how cryptographic receipt linking saves $104.50 in 2 minutes
        </p>
      </div>
    </div>
  );
}
