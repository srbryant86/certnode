'use client';

import { useState } from 'react';

export default function ReceiptGraph() {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleAnimate = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 3000);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
      <h3 className="text-3xl font-bold text-gray-900 mb-4 text-center">
        The CertNode Receipt Graph
      </h3>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-3xl mx-auto">
        Three verification domains unified in one cryptographic graph. Transaction receipts link to content certifications, which link to operational attestations.
      </p>

      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 mb-6" style={{ minHeight: '650px' }}>
        <svg viewBox="0 0 1000 650" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          {/* Connection Lines */}
          <g className="opacity-60">
            {/* Root to Three Domains */}
            <line x1="500" y1="80" x2="200" y2="180" stroke="#cbd5e0" strokeWidth="2" strokeDasharray="5,5" />
            <line x1="500" y1="80" x2="500" y2="180" stroke="#cbd5e0" strokeWidth="2" strokeDasharray="5,5" />
            <line x1="500" y1="80" x2="800" y2="180" stroke="#cbd5e0" strokeWidth="2" strokeDasharray="5,5" />

            {/* Domain to Receipt connections */}
            <line x1="200" y1="220" x2="150" y2="340" stroke="#48bb78" strokeWidth="3" className={isAnimating ? 'animate-pulse' : ''} />
            <line x1="200" y1="220" x2="250" y2="340" stroke="#48bb78" strokeWidth="3" className={isAnimating ? 'animate-pulse' : ''} />
            <line x1="500" y1="220" x2="450" y2="340" stroke="#667eea" strokeWidth="3" className={isAnimating ? 'animate-pulse' : ''} />
            <line x1="500" y1="220" x2="550" y2="340" stroke="#667eea" strokeWidth="3" className={isAnimating ? 'animate-pulse' : ''} />
            <line x1="800" y1="220" x2="750" y2="340" stroke="#ed8936" strokeWidth="3" className={isAnimating ? 'animate-pulse' : ''} />
            <line x1="800" y1="220" x2="850" y2="340" stroke="#ed8936" strokeWidth="3" className={isAnimating ? 'animate-pulse' : ''} />

            {/* Receipt to detailed records */}
            <line x1="150" y1="380" x2="100" y2="520" stroke="#48bb78" strokeWidth="2" className={isAnimating ? 'animate-pulse' : ''} />
            <line x1="150" y1="380" x2="200" y2="520" stroke="#48bb78" strokeWidth="2" className={isAnimating ? 'animate-pulse' : ''} />
            <line x1="250" y1="380" x2="250" y2="520" stroke="#48bb78" strokeWidth="2" className={isAnimating ? 'animate-pulse' : ''} />
            <line x1="450" y1="380" x2="400" y2="520" stroke="#667eea" strokeWidth="2" className={isAnimating ? 'animate-pulse' : ''} />
            <line x1="450" y1="380" x2="500" y2="520" stroke="#667eea" strokeWidth="2" className={isAnimating ? 'animate-pulse' : ''} />
            <line x1="550" y1="380" x2="550" y2="520" stroke="#667eea" strokeWidth="2" className={isAnimating ? 'animate-pulse' : ''} />
            <line x1="750" y1="380" x2="700" y2="520" stroke="#ed8936" strokeWidth="2" className={isAnimating ? 'animate-pulse' : ''} />
            <line x1="750" y1="380" x2="800" y2="520" stroke="#ed8936" strokeWidth="2" className={isAnimating ? 'animate-pulse' : ''} />
            <line x1="850" y1="380" x2="850" y2="520" stroke="#ed8936" strokeWidth="2" className={isAnimating ? 'animate-pulse' : ''} />

            {/* Cross-domain cryptographic links - THE MAGIC */}
            <line x1="200" y1="520" x2="500" y2="520" stroke="#9f7aea" strokeWidth="4" strokeDasharray="5,5" className={isAnimating ? 'animate-pulse' : ''} />
            <line x1="500" y1="520" x2="800" y2="520" stroke="#9f7aea" strokeWidth="4" strokeDasharray="5,5" className={isAnimating ? 'animate-pulse' : ''} />
            <line x1="200" y1="520" x2="800" y2="520" stroke="#f59e0b" strokeWidth="3" strokeDasharray="3,3" opacity="0.6" className={isAnimating ? 'animate-pulse' : ''} />
          </g>

          {/* Root Node */}
          <g className={isAnimating ? 'animate-pulse' : ''}>
            <rect x="450" y="50" width="100" height="60" rx="8" fill="url(#gradient-purple)" stroke="#667eea" strokeWidth="2" />
            <text x="500" y="75" textAnchor="middle" className="fill-white text-sm font-semibold">CertNode</text>
            <text x="500" y="92" textAnchor="middle" className="fill-white text-xs opacity-90">Root Trust</text>
          </g>

          {/* Three Domain Nodes */}
          <g className={isAnimating ? 'animate-pulse' : ''}>
            <rect x="150" y="180" width="100" height="40" rx="8" fill="#f0fff4" stroke="#48bb78" strokeWidth="2" />
            <text x="200" y="205" textAnchor="middle" className="fill-gray-800 text-sm font-semibold">Transaction</text>
          </g>

          <g className={isAnimating ? 'animate-pulse' : ''}>
            <rect x="450" y="180" width="100" height="40" rx="8" fill="#faf5ff" stroke="#667eea" strokeWidth="2" />
            <text x="500" y="205" textAnchor="middle" className="fill-gray-800 text-sm font-semibold">Content</text>
          </g>

          <g className={isAnimating ? 'animate-pulse' : ''}>
            <rect x="750" y="180" width="100" height="40" rx="8" fill="#fffaf0" stroke="#ed8936" strokeWidth="2" />
            <text x="800" y="205" textAnchor="middle" className="fill-gray-800 text-sm font-semibold">Operations</text>
          </g>

          {/* Receipt Type Nodes */}
          {/* Transaction Receipts */}
          <g className={isAnimating ? 'animate-pulse' : ''}>
            <rect x="100" y="340" width="100" height="40" rx="6" fill="#f0fff4" stroke="#48bb78" strokeWidth="2" />
            <text x="150" y="365" textAnchor="middle" className="fill-gray-800 text-xs font-semibold">Stripe Payment</text>
          </g>
          <g className={isAnimating ? 'animate-pulse' : ''}>
            <rect x="200" y="340" width="100" height="40" rx="6" fill="#f0fff4" stroke="#48bb78" strokeWidth="2" />
            <text x="250" y="365" textAnchor="middle" className="fill-gray-800 text-xs font-semibold">Refund Receipt</text>
          </g>

          {/* Content Receipts */}
          <g className={isAnimating ? 'animate-pulse' : ''}>
            <rect x="400" y="340" width="100" height="40" rx="6" fill="#faf5ff" stroke="#667eea" strokeWidth="2" />
            <text x="450" y="365" textAnchor="middle" className="fill-gray-800 text-xs font-semibold">AI Detection</text>
          </g>
          <g className={isAnimating ? 'animate-pulse' : ''}>
            <rect x="500" y="340" width="100" height="40" rx="6" fill="#faf5ff" stroke="#667eea" strokeWidth="2" />
            <text x="550" y="365" textAnchor="middle" className="fill-gray-800 text-xs font-semibold">Image Cert</text>
          </g>

          {/* Operations Receipts */}
          <g className={isAnimating ? 'animate-pulse' : ''}>
            <rect x="700" y="340" width="100" height="40" rx="6" fill="#fffaf0" stroke="#ed8936" strokeWidth="2" />
            <text x="750" y="365" textAnchor="middle" className="fill-gray-800 text-xs font-semibold">Deploy Record</text>
          </g>
          <g className={isAnimating ? 'animate-pulse' : ''}>
            <rect x="800" y="340" width="100" height="40" rx="6" fill="#fffaf0" stroke="#ed8936" strokeWidth="2" />
            <text x="850" y="365" textAnchor="middle" className="fill-gray-800 text-xs font-semibold">Incident Log</text>
          </g>

          {/* Detailed Records */}
          {/* Transaction details */}
          {[
            { x: 100, label: 'Txn #A84F', sub: '$1,249' },
            { x: 200, label: 'Txn #B2C3', sub: '$567' },
            { x: 250, label: 'Ref #D9E1', sub: '-$234' }
          ].map((item, i) => (
            <g key={`txn-${i}`} className={isAnimating ? 'animate-bounce' : ''}>
              <rect x={item.x - 35} y="500" width="70" height="50" rx="6" fill="#ecfdf5" stroke="#48bb78" strokeWidth="2" />
              <text x={item.x} y="520" textAnchor="middle" className="fill-gray-800 text-xs font-semibold">{item.label}</text>
              <text x={item.x} y="537" textAnchor="middle" className="fill-gray-600 text-xs">{item.sub}</text>
            </g>
          ))}

          {/* Content details */}
          {[
            { x: 400, label: 'Doc #3FA', sub: '92% AI' },
            { x: 500, label: 'Doc #7BC', sub: '18% AI' },
            { x: 550, label: 'Img #2D4', sub: 'Authentic' }
          ].map((item, i) => (
            <g key={`content-${i}`} className={isAnimating ? 'animate-bounce' : ''}>
              <rect x={item.x - 35} y="500" width="70" height="50" rx="6" fill="#f5f3ff" stroke="#667eea" strokeWidth="2" />
              <text x={item.x} y="520" textAnchor="middle" className="fill-gray-800 text-xs font-semibold">{item.label}</text>
              <text x={item.x} y="537" textAnchor="middle" className="fill-gray-600 text-xs">{item.sub}</text>
            </g>
          ))}

          {/* Operations details */}
          {[
            { x: 700, label: 'Deploy', sub: 'v2.4.1' },
            { x: 800, label: 'Incident', sub: 'INC-042' },
            { x: 850, label: 'Policy', sub: 'P-2024' }
          ].map((item, i) => (
            <g key={`ops-${i}`} className={isAnimating ? 'animate-bounce' : ''}>
              <rect x={item.x - 35} y="500" width="70" height="50" rx="6" fill="#fff7ed" stroke="#ed8936" strokeWidth="2" />
              <text x={item.x} y="520" textAnchor="middle" className="fill-gray-800 text-xs font-semibold">{item.label}</text>
              <text x={item.x} y="537" textAnchor="middle" className="fill-gray-600 text-xs">{item.sub}</text>
            </g>
          ))}

          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="gradient-purple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#667eea" />
              <stop offset="100%" stopColor="#764ba2" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-purple-700 border-2 border-purple-600"></div>
          <span className="text-gray-700">Root Trust Anchor</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-green-50 border-2 border-green-500"></div>
          <span className="text-gray-700">Domain Receipts</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-orange-50 border-2 border-orange-500"></div>
          <span className="text-gray-700">Merchant Accounts</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-purple-50 border-2 border-purple-500"></div>
          <span className="text-gray-700">Transaction Receipts</span>
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
            Global merkle roots published to Bitcoin blockchain every 10 minutes. Anyone can independently verify receipts without trusting CertNode. <strong>Court-admissible evidence</strong> that's cryptographically provable and legally recognized.
          </p>
        </div>

        <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-lg">
          <h4 className="font-bold text-gray-900 mb-2">🛡️ Collective Fraud Defense</h4>
          <p className="text-gray-700 leading-relaxed text-sm">
            Anonymous fraud patterns shared across the network. When one merchant detects fraud, all merchants are protected. <strong>Network learns from every attack,</strong> making fraud patterns immediately detectable network-wide.
          </p>
        </div>
      </div>

      {/* Verification Coverage Comparison */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 rounded-xl mb-6">
        <div className="text-center mb-2">
          <div className="inline-block bg-blue-500/20 border border-blue-400/30 text-blue-200 px-4 py-1.5 rounded-full text-xs font-bold mb-3">
            AVAILABLE ON ALL PLANS
          </div>
          <h4 className="text-2xl font-bold mb-2">Domain Coverage Levels</h4>
          <p className="text-gray-400 text-sm max-w-2xl mx-auto mb-6">
            All plans can link all three domains. More domains = stronger protection against fraud and disputes.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-700/50 p-6 rounded-lg border-2 border-gray-600">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-gray-400">1 Domain</div>
              <div className="text-sm text-gray-300 mt-1">Partial Coverage</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">Transaction verified</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-500">○</span>
                <span className="text-gray-400">No content certification</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-500">○</span>
                <span className="text-gray-400">No operations attestation</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-500">○</span>
                <span className="text-gray-400">Limited fraud protection</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-600/50 p-6 rounded-lg border-2 border-blue-400">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-blue-200">2 Domains</div>
              <div className="text-sm text-blue-100 mt-1">Multi-Domain</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-green-300">✓</span>
                <span className="text-white">Transaction + Content</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-300">✓</span>
                <span className="text-white">Cross-domain verification</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-300">✓</span>
                <span className="text-white">Better fraud protection</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-300">○</span>
                <span className="text-white">Incomplete workflow</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-lg border-2 border-purple-300 relative">
            <div className="absolute -top-3 right-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
              RECOMMENDED
            </div>
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-purple-100">3 Domains</div>
              <div className="text-sm text-purple-100 mt-1">Complete Coverage</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-green-200">✓</span>
                <span className="text-white font-semibold">All three domains linked</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-200">✓</span>
                <span className="text-white font-semibold">Full cryptographic proof</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-200">✓</span>
                <span className="text-white font-semibold">Network fraud defense</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-200">✓</span>
                <span className="text-white font-semibold">Strongest dispute protection</span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-gray-300 text-sm mt-6">
          More domains = exponentially harder to forge. Complete coverage provides the strongest protection against fraud and disputes.
        </p>
      </div>

      {/* Animate Button */}
      <div className="text-center">
        <button
          onClick={handleAnimate}
          className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          {isAnimating ? '↻ Replaying...' : '▶ Play Animation'}
        </button>
      </div>
    </div>
  );
}
