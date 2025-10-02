'use client';

import { useState } from 'react';

export default function ReceiptGraph() {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleAnimate = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
      <h3 className="text-3xl font-bold text-gray-900 mb-4 text-center">
        The CertNode Receipt Graph
      </h3>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-3xl mx-auto">
        Three verification domains unified in one cryptographic graph. Transaction receipts link to content certifications, which link to operational attestations.
      </p>

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

          {/* Hierarchical Connection Lines */}
          <g opacity="0.5">
            {/* Root to Domains */}
            <line x1="500" y1="80" x2="250" y2="160" stroke="#94a3b8" strokeWidth="2" />
            <line x1="500" y1="80" x2="500" y2="160" stroke="#94a3b8" strokeWidth="2" />
            <line x1="500" y1="80" x2="750" y2="160" stroke="#94a3b8" strokeWidth="2" />

            {/* Domains to Receipts */}
            <line x1="250" y1="210" x2="200" y2="310" stroke="#48bb78" strokeWidth="2" />
            <line x1="250" y1="210" x2="300" y2="310" stroke="#48bb78" strokeWidth="2" />

            <line x1="500" y1="210" x2="450" y2="310" stroke="#667eea" strokeWidth="2" />
            <line x1="500" y1="210" x2="550" y2="310" stroke="#667eea" strokeWidth="2" />

            <line x1="750" y1="210" x2="700" y2="310" stroke="#ed8936" strokeWidth="2" />
            <line x1="750" y1="210" x2="800" y2="310" stroke="#ed8936" strokeWidth="2" />
          </g>

          {/* Cross-Domain Links (THE MOAT) */}
          <g className={isAnimating ? 'opacity-100' : 'opacity-60'} style={{ transition: 'opacity 0.5s' }}>
            <path
              d="M 200 360 Q 350 420 500 360"
              stroke="#9f7aea"
              strokeWidth="3"
              fill="none"
              strokeDasharray="8,4"
              className={isAnimating ? 'animate-pulse' : ''}
            />
            <path
              d="M 500 360 Q 625 420 750 360"
              stroke="#9f7aea"
              strokeWidth="3"
              fill="none"
              strokeDasharray="8,4"
              className={isAnimating ? 'animate-pulse' : ''}
            />
            <path
              d="M 200 360 Q 475 440 750 360"
              stroke="#ec4899"
              strokeWidth="2"
              fill="none"
              strokeDasharray="4,4"
              opacity="0.4"
              className={isAnimating ? 'animate-pulse' : ''}
            />
          </g>

          {/* Root Node */}
          <g filter="url(#shadow)">
            <rect x="440" y="50" width="120" height="60" rx="10" fill="url(#gradient-purple)" stroke="#5a67d8" strokeWidth="2" />
            <text x="500" y="75" textAnchor="middle" className="fill-white font-bold" fontSize="14">CertNode</text>
            <text x="500" y="93" textAnchor="middle" className="fill-white/80" fontSize="11">Root Trust</text>
          </g>

          {/* Domain Nodes */}
          <g filter="url(#shadow)">
            <rect x="190" y="160" width="120" height="50" rx="8" fill="#f0fdf4" stroke="#22c55e" strokeWidth="2.5" />
            <text x="250" y="190" textAnchor="middle" className="fill-gray-800 font-semibold" fontSize="13">Transaction</text>
          </g>

          <g filter="url(#shadow)">
            <rect x="440" y="160" width="120" height="50" rx="8" fill="#faf5ff" stroke="#8b5cf6" strokeWidth="2.5" />
            <text x="500" y="190" textAnchor="middle" className="fill-gray-800 font-semibold" fontSize="13">Content</text>
          </g>

          <g filter="url(#shadow)">
            <rect x="690" y="160" width="120" height="50" rx="8" fill="#fff7ed" stroke="#f97316" strokeWidth="2.5" />
            <text x="750" y="190" textAnchor="middle" className="fill-gray-800 font-semibold" fontSize="13">Operations</text>
          </g>

          {/* Receipt Examples */}
          {/* Transaction Receipts */}
          <g filter="url(#shadow)" className={isAnimating ? 'opacity-100' : 'opacity-90'} style={{ transition: 'opacity 0.3s' }}>
            <rect x="150" y="310" width="100" height="50" rx="6" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
            <text x="200" y="332" textAnchor="middle" className="fill-gray-800 font-semibold" fontSize="11">Payment</text>
            <text x="200" y="347" textAnchor="middle" className="fill-gray-600" fontSize="10">$1,249</text>
          </g>

          <g filter="url(#shadow)" className={isAnimating ? 'opacity-100' : 'opacity-90'} style={{ transition: 'opacity 0.3s' }}>
            <rect x="250" y="310" width="100" height="50" rx="6" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
            <text x="300" y="332" textAnchor="middle" className="fill-gray-800 font-semibold" fontSize="11">Refund</text>
            <text x="300" y="347" textAnchor="middle" className="fill-gray-600" fontSize="10">-$234</text>
          </g>

          {/* Content Receipts */}
          <g filter="url(#shadow)" className={isAnimating ? 'opacity-100' : 'opacity-90'} style={{ transition: 'opacity 0.3s' }}>
            <rect x="400" y="310" width="100" height="50" rx="6" fill="#f3e8ff" stroke="#8b5cf6" strokeWidth="2" />
            <text x="450" y="332" textAnchor="middle" className="fill-gray-800 font-semibold" fontSize="11">AI Check</text>
            <text x="450" y="347" textAnchor="middle" className="fill-gray-600" fontSize="10">92% AI</text>
          </g>

          <g filter="url(#shadow)" className={isAnimating ? 'opacity-100' : 'opacity-90'} style={{ transition: 'opacity 0.3s' }}>
            <rect x="500" y="310" width="100" height="50" rx="6" fill="#f3e8ff" stroke="#8b5cf6" strokeWidth="2" />
            <text x="550" y="332" textAnchor="middle" className="fill-gray-800 font-semibold" fontSize="11">Image Cert</text>
            <text x="550" y="347" textAnchor="middle" className="fill-gray-600" fontSize="10">Authentic</text>
          </g>

          {/* Operations Receipts */}
          <g filter="url(#shadow)" className={isAnimating ? 'opacity-100' : 'opacity-90'} style={{ transition: 'opacity 0.3s' }}>
            <rect x="650" y="310" width="100" height="50" rx="6" fill="#ffedd5" stroke="#f97316" strokeWidth="2" />
            <text x="700" y="332" textAnchor="middle" className="fill-gray-800 font-semibold" fontSize="11">Deploy</text>
            <text x="700" y="347" textAnchor="middle" className="fill-gray-600" fontSize="10">v2.4.1</text>
          </g>

          <g filter="url(#shadow)" className={isAnimating ? 'opacity-100' : 'opacity-90'} style={{ transition: 'opacity 0.3s' }}>
            <rect x="750" y="310" width="100" height="50" rx="6" fill="#ffedd5" stroke="#f97316" strokeWidth="2" />
            <text x="800" y="332" textAnchor="middle" className="fill-gray-800 font-semibold" fontSize="11">Incident</text>
            <text x="800" y="347" textAnchor="middle" className="fill-gray-600" fontSize="10">INC-042</text>
          </g>

          {/* Cross-Domain Link Labels */}
          <g className={isAnimating ? 'opacity-100' : 'opacity-70'} style={{ transition: 'opacity 0.5s' }}>
            <text x="350" y="410" textAnchor="middle" className="fill-purple-600 font-semibold" fontSize="10">Cryptographic Link</text>
            <text x="625" y="410" textAnchor="middle" className="fill-purple-600 font-semibold" fontSize="10">Cryptographic Link</text>
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-purple-700 border-2 border-purple-600"></div>
          <span className="text-gray-700">Root Trust</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-green-100 border-2 border-green-500"></div>
          <span className="text-gray-700">Transactions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-purple-100 border-2 border-purple-500"></div>
          <span className="text-gray-700">Content</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-orange-100 border-2 border-orange-500"></div>
          <span className="text-gray-700">Operations</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <line x1="2" y1="12" x2="22" y2="12" stroke="#9f7aea" strokeWidth="2" strokeDasharray="4,2" />
          </svg>
          <span className="text-gray-700">Cryptographic Links</span>
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
