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
        Our cross-domain verification network creates an immutable trust graph. Each receipt cryptographically links to others, creating a tamper-evident web.
      </p>

      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 mb-6" style={{ minHeight: '600px' }}>
        <svg viewBox="0 0 1000 600" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          {/* Connection Lines */}
          <g className="opacity-60">
            {/* Root to Domains */}
            <line x1="500" y1="80" x2="250" y2="200" stroke="#cbd5e0" strokeWidth="2" strokeDasharray="5,5" />
            <line x1="500" y1="80" x2="750" y2="200" stroke="#cbd5e0" strokeWidth="2" strokeDasharray="5,5" />

            {/* Domains to Merchants */}
            <line x1="250" y1="200" x2="150" y2="320" stroke="#cbd5e0" strokeWidth="2" strokeDasharray="5,5" />
            <line x1="250" y1="200" x2="350" y2="320" stroke="#cbd5e0" strokeWidth="2" strokeDasharray="5,5" />
            <line x1="750" y1="200" x2="650" y2="320" stroke="#cbd5e0" strokeWidth="2" strokeDasharray="5,5" />
            <line x1="750" y1="200" x2="850" y2="320" stroke="#cbd5e0" strokeWidth="2" strokeDasharray="5,5" />

            {/* Merchants to Receipts */}
            <line x1="150" y1="320" x2="100" y2="480" stroke="#3b82f6" strokeWidth="3" className={isAnimating ? 'animate-pulse' : ''} />
            <line x1="150" y1="320" x2="200" y2="480" stroke="#3b82f6" strokeWidth="3" className={isAnimating ? 'animate-pulse' : ''} />
            <line x1="350" y1="320" x2="300" y2="480" stroke="#3b82f6" strokeWidth="3" className={isAnimating ? 'animate-pulse' : ''} />
            <line x1="350" y1="320" x2="400" y2="480" stroke="#3b82f6" strokeWidth="3" className={isAnimating ? 'animate-pulse' : ''} />
            <line x1="650" y1="320" x2="600" y2="480" stroke="#3b82f6" strokeWidth="3" className={isAnimating ? 'animate-pulse' : ''} />
            <line x1="650" y1="320" x2="700" y2="480" stroke="#3b82f6" strokeWidth="3" className={isAnimating ? 'animate-pulse' : ''} />
            <line x1="850" y1="320" x2="800" y2="480" stroke="#3b82f6" strokeWidth="3" className={isAnimating ? 'animate-pulse' : ''} />
            <line x1="850" y1="320" x2="900" y2="480" stroke="#3b82f6" strokeWidth="3" className={isAnimating ? 'animate-pulse' : ''} />

            {/* Cross-domain connections - THE MAGIC */}
            <line x1="200" y1="480" x2="600" y2="480" stroke="#9f7aea" strokeWidth="3" strokeDasharray="3,3" className={isAnimating ? 'animate-pulse' : ''} />
            <line x1="400" y1="480" x2="800" y2="480" stroke="#9f7aea" strokeWidth="3" strokeDasharray="3,3" className={isAnimating ? 'animate-pulse' : ''} />
          </g>

          {/* Root Node */}
          <g className={isAnimating ? 'animate-pulse' : ''}>
            <rect x="450" y="50" width="100" height="60" rx="8" fill="url(#gradient-purple)" stroke="#667eea" strokeWidth="2" />
            <text x="500" y="75" textAnchor="middle" className="fill-white text-sm font-semibold">CertNode</text>
            <text x="500" y="92" textAnchor="middle" className="fill-white text-xs opacity-90">Root</text>
          </g>

          {/* Domain Nodes */}
          <g className={isAnimating ? 'animate-pulse' : ''}>
            <rect x="200" y="170" width="100" height="60" rx="8" fill="#f0fff4" stroke="#48bb78" strokeWidth="2" />
            <text x="250" y="195" textAnchor="middle" className="fill-gray-800 text-sm font-semibold">stripe.com</text>
            <text x="250" y="212" textAnchor="middle" className="fill-gray-600 text-xs">Domain</text>
          </g>

          <g className={isAnimating ? 'animate-pulse' : ''}>
            <rect x="700" y="170" width="100" height="60" rx="8" fill="#f0fff4" stroke="#48bb78" strokeWidth="2" />
            <text x="750" y="195" textAnchor="middle" className="fill-gray-800 text-sm font-semibold">shopify.com</text>
            <text x="750" y="212" textAnchor="middle" className="fill-gray-600 text-xs">Domain</text>
          </g>

          {/* Merchant Nodes */}
          {[
            { x: 100, label: 'Merchant A', sub: 'Stripe' },
            { x: 300, label: 'Merchant B', sub: 'Stripe' },
            { x: 600, label: 'Merchant C', sub: 'Shopify' },
            { x: 800, label: 'Merchant D', sub: 'Shopify' }
          ].map((merchant, i) => (
            <g key={i} className={isAnimating ? 'animate-pulse' : ''}>
              <rect x={merchant.x - 50} y="290" width="100" height="60" rx="8" fill="#fffaf0" stroke="#ed8936" strokeWidth="2" />
              <text x={merchant.x} y="315" textAnchor="middle" className="fill-gray-800 text-sm font-semibold">{merchant.label}</text>
              <text x={merchant.x} y="332" textAnchor="middle" className="fill-gray-600 text-xs">{merchant.sub}</text>
            </g>
          ))}

          {/* Transaction Receipt Nodes */}
          {[
            { x: 100, txn: '#1', amt: '$1.2K' },
            { x: 200, txn: '#2', amt: '$567' },
            { x: 300, txn: '#3', amt: '$890' },
            { x: 400, txn: '#4', amt: '$234' },
            { x: 600, txn: '#5', amt: '$456' },
            { x: 700, txn: '#6', amt: '$789' },
            { x: 800, txn: '#7', amt: '$123' },
            { x: 900, txn: '#8', amt: '$345' }
          ].map((receipt, i) => (
            <g key={i} className={isAnimating ? 'animate-bounce' : ''}>
              <rect x={receipt.x - 35} y="450" width="70" height="50" rx="6" fill="#faf5ff" stroke="#9f7aea" strokeWidth="2" />
              <text x={receipt.x} y="470" textAnchor="middle" className="fill-gray-800 text-xs font-semibold">Txn {receipt.txn}</text>
              <text x={receipt.x} y="487" textAnchor="middle" className="fill-gray-600 text-xs">{receipt.amt}</text>
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

      {/* Explanation Box */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-6">
        <h4 className="font-bold text-gray-900 mb-2">🔒 Why This Graph Is Unique</h4>
        <p className="text-gray-700 leading-relaxed">
          <strong>Cross-Domain Verification:</strong> Unlike traditional systems where each merchant operates in isolation, our Receipt Graph cryptographically links transactions across different domains and platforms. When Txn #2 references Txn #5, it creates tamper-evident proof that both transactions existed at the same point in time - even though they're from different payment processors. This makes fraud exponentially harder: attackers would need to compromise multiple independent systems simultaneously to forge a single receipt.
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
