'use client';

import { useState } from 'react';

export default function ReceiptGraph() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const [animationStep, setAnimationStep] = useState<number>(0);

  const handleAnimate = () => {
    setIsAnimating(true);
    setAnimationStep(0);

    // Sequential animation: root → domains → receipts → cross-links
    setTimeout(() => setAnimationStep(1), 300);  // Root
    setTimeout(() => setAnimationStep(2), 800);  // Domains
    setTimeout(() => setAnimationStep(3), 1400); // Receipts
    setTimeout(() => setAnimationStep(4), 2000); // Cross-links
    setTimeout(() => {
      setIsAnimating(false);
      setAnimationStep(0);
    }, 3500);
  };

  const nodeInfo: Record<string, { title: string; subtitle: string; description: string }> = {
    root: {
      title: 'CertNode Root Trust',
      subtitle: 'Global Merkle Root',
      description: 'All receipts cryptographically linked to blockchain-anchored root'
    },
    transaction: {
      title: 'Transaction Domain',
      subtitle: 'Payment Verification',
      description: 'Stripe, PayPal, and custom payment processor integration'
    },
    content: {
      title: 'Content Domain',
      subtitle: 'AI Detection & Certification',
      description: 'Multi-model AI detection for documents, images, and text'
    },
    operations: {
      title: 'Operations Domain',
      subtitle: 'Compliance & Attestation',
      description: 'Deployments, incidents, and policy changes with cryptographic proof'
    },
    payment: {
      title: 'Payment Receipt',
      subtitle: '$1,249.00',
      description: 'Stripe payment with fraud analysis and compliance mapping'
    },
    refund: {
      title: 'Refund Receipt',
      subtitle: '-$234.00',
      description: 'Linked to original transaction for audit trail'
    },
    aicheck: {
      title: 'AI Content Check',
      subtitle: '92% AI-generated',
      description: 'Multi-model ensemble detection flagged this content'
    },
    imagecert: {
      title: 'Image Certification',
      subtitle: 'Authentic',
      description: 'Forensic analysis confirms image authenticity'
    },
    deploy: {
      title: 'Deployment Record',
      subtitle: 'v2.4.1',
      description: 'Build provenance and deployment attestation'
    },
    incident: {
      title: 'Incident Log',
      subtitle: 'INC-042',
      description: 'Security incident documentation with stakeholder sign-offs'
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
      <h3 className="text-3xl font-bold text-gray-900 mb-4 text-center">
        The CertNode Receipt Graph
      </h3>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-3xl mx-auto">
        Three verification domains unified in one cryptographic graph. Transaction receipts link to content certifications, which link to operational attestations.
      </p>

      {/* Animation Step Labels - Shows what's happening during animation */}
      <div className="h-24 mb-4">
        {isAnimating && animationStep > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 p-4 rounded-lg transition-all animate-pulse">
            <h4 className="font-bold text-gray-900 mb-1">
              {animationStep === 1 && "Step 1: Root Trust Established"}
              {animationStep === 2 && "Step 2: Domain Verification"}
              {animationStep === 3 && "Step 3: Receipt Generation"}
              {animationStep === 4 && "Step 4: Cross-Domain Linking (The Key Advantage)"}
            </h4>
            <p className="text-sm text-gray-700">
              {animationStep === 1 && "Global merkle root anchors to Bitcoin blockchain every 10 minutes"}
              {animationStep === 2 && "Transaction, Content, and Operations domains inherit cryptographic trust from root"}
              {animationStep === 3 && "Individual receipts generated and verified within each domain"}
              {animationStep === 4 && "Payment $1,249 links to AI Check 92% links to Deploy v2.4.1 — all three must be consistent to verify"}
            </p>
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
          <g className={animationStep === 4 ? 'opacity-100' : 'opacity-60'} style={{ transition: 'opacity 0.5s' }}>
            <path
              d="M 200 360 Q 350 420 500 360"
              stroke={animationStep === 4 ? '#fbbf24' : '#9f7aea'}
              strokeWidth={animationStep === 4 ? '5' : '3'}
              fill="none"
              strokeDasharray="8,4"
              className={animationStep === 4 ? 'animate-pulse' : ''}
            />
            <path
              d="M 500 360 Q 625 420 750 360"
              stroke={animationStep === 4 ? '#fbbf24' : '#9f7aea'}
              strokeWidth={animationStep === 4 ? '5' : '3'}
              fill="none"
              strokeDasharray="8,4"
              className={animationStep === 4 ? 'animate-pulse' : ''}
            />
            <path
              d="M 200 360 Q 475 440 750 360"
              stroke={animationStep === 4 ? '#fbbf24' : '#ec4899'}
              strokeWidth={animationStep === 4 ? '4' : '2'}
              fill="none"
              strokeDasharray="4,4"
              opacity={animationStep === 4 ? '1' : '0.4'}
              className={animationStep === 4 ? 'animate-pulse' : ''}
            />
          </g>

          {/* Root Node */}
          <g
            filter="url(#shadow)"
            onMouseEnter={() => setHoveredNode('root')}
            onMouseLeave={() => setHoveredNode(null)}
            className="cursor-pointer transition-all"
            style={{ opacity: hoveredNode === 'root' ? 1 : hoveredNode ? 0.7 : 1 }}
          >
            <rect
              x="440" y="50" width="120" height="60" rx="10"
              fill="url(#gradient-purple)"
              stroke={hoveredNode === 'root' ? '#4c51bf' : (animationStep === 1 ? '#fbbf24' : '#5a67d8')}
              strokeWidth={hoveredNode === 'root' ? '3' : (animationStep === 1 ? '4' : '2')}
              className={animationStep === 1 ? 'animate-pulse' : ''}
            />
            <text x="500" y="75" textAnchor="middle" className="fill-white font-bold pointer-events-none" fontSize="14">CertNode</text>
            <text x="500" y="93" textAnchor="middle" className="fill-white/80 pointer-events-none" fontSize="11">Root Trust</text>
          </g>

          {/* Domain Nodes */}
          <g
            filter="url(#shadow)"
            onMouseEnter={() => setHoveredNode('transaction')}
            onMouseLeave={() => setHoveredNode(null)}
            className="cursor-pointer"
            style={{ opacity: hoveredNode === 'transaction' ? 1 : hoveredNode ? 0.7 : 1 }}
          >
            <rect
              x="190" y="160" width="120" height="50" rx="8"
              fill="#f0fdf4"
              stroke={hoveredNode === 'transaction' ? '#16a34a' : (animationStep === 2 ? '#fbbf24' : '#22c55e')}
              strokeWidth={hoveredNode === 'transaction' ? '3.5' : (animationStep === 2 ? '4' : '2.5')}
              className={animationStep === 2 ? 'animate-pulse' : ''}
            />
            <text x="250" y="190" textAnchor="middle" className="fill-gray-800 font-semibold pointer-events-none" fontSize="13">Transaction</text>
          </g>

          <g
            filter="url(#shadow)"
            onMouseEnter={() => setHoveredNode('content')}
            onMouseLeave={() => setHoveredNode(null)}
            className="cursor-pointer"
            style={{ opacity: hoveredNode === 'content' ? 1 : hoveredNode ? 0.7 : 1 }}
          >
            <rect
              x="440" y="160" width="120" height="50" rx="8"
              fill="#faf5ff"
              stroke={hoveredNode === 'content' ? '#7c3aed' : (animationStep === 2 ? '#fbbf24' : '#8b5cf6')}
              strokeWidth={hoveredNode === 'content' ? '3.5' : (animationStep === 2 ? '4' : '2.5')}
              className={animationStep === 2 ? 'animate-pulse' : ''}
            />
            <text x="500" y="190" textAnchor="middle" className="fill-gray-800 font-semibold pointer-events-none" fontSize="13">Content</text>
          </g>

          <g
            filter="url(#shadow)"
            onMouseEnter={() => setHoveredNode('operations')}
            onMouseLeave={() => setHoveredNode(null)}
            className="cursor-pointer"
            style={{ opacity: hoveredNode === 'operations' ? 1 : hoveredNode ? 0.7 : 1 }}
          >
            <rect
              x="690" y="160" width="120" height="50" rx="8"
              fill="#fff7ed"
              stroke={hoveredNode === 'operations' ? '#ea580c' : (animationStep === 2 ? '#fbbf24' : '#f97316')}
              strokeWidth={hoveredNode === 'operations' ? '3.5' : (animationStep === 2 ? '4' : '2.5')}
              className={animationStep === 2 ? 'animate-pulse' : ''}
            />
            <text x="750" y="190" textAnchor="middle" className="fill-gray-800 font-semibold pointer-events-none" fontSize="13">Operations</text>
          </g>

          {/* Receipt Examples */}
          {/* Transaction Receipts */}
          <g
            filter="url(#shadow)"
            onMouseEnter={() => setHoveredNode('payment')}
            onMouseLeave={() => setHoveredNode(null)}
            className="cursor-pointer"
            style={{ opacity: hoveredNode === 'payment' ? 1 : hoveredNode ? 0.6 : 0.9, transition: 'opacity 0.3s' }}
          >
            <rect x="150" y="310" width="100" height="50" rx="6" fill="#dcfce7" stroke={hoveredNode === 'payment' ? '#16a34a' : (animationStep === 3 ? '#fbbf24' : '#22c55e')} strokeWidth={hoveredNode === 'payment' ? '3' : (animationStep === 3 ? '4' : '2')} className={animationStep === 3 ? 'animate-pulse' : ''} />
            <text x="200" y="332" textAnchor="middle" className="fill-gray-800 font-semibold pointer-events-none" fontSize="11">Payment</text>
            <text x="200" y="347" textAnchor="middle" className="fill-gray-600 pointer-events-none" fontSize="10">$1,249</text>
          </g>

          <g
            filter="url(#shadow)"
            onMouseEnter={() => setHoveredNode('refund')}
            onMouseLeave={() => setHoveredNode(null)}
            className="cursor-pointer"
            style={{ opacity: hoveredNode === 'refund' ? 1 : hoveredNode ? 0.6 : 0.9, transition: 'opacity 0.3s' }}
          >
            <rect x="250" y="310" width="100" height="50" rx="6" fill="#dcfce7" stroke={hoveredNode === 'refund' ? '#16a34a' : (animationStep === 3 ? '#fbbf24' : '#22c55e')} strokeWidth={hoveredNode === 'refund' ? '3' : (animationStep === 3 ? '4' : '2')} className={animationStep === 3 ? 'animate-pulse' : ''} />
            <text x="300" y="332" textAnchor="middle" className="fill-gray-800 font-semibold pointer-events-none" fontSize="11">Refund</text>
            <text x="300" y="347" textAnchor="middle" className="fill-gray-600 pointer-events-none" fontSize="10">-$234</text>
          </g>

          {/* Content Receipts */}
          <g
            filter="url(#shadow)"
            onMouseEnter={() => setHoveredNode('aicheck')}
            onMouseLeave={() => setHoveredNode(null)}
            className="cursor-pointer"
            style={{ opacity: hoveredNode === 'aicheck' ? 1 : hoveredNode ? 0.6 : 0.9, transition: 'opacity 0.3s' }}
          >
            <rect x="400" y="310" width="100" height="50" rx="6" fill="#f3e8ff" stroke={hoveredNode === 'aicheck' ? '#7c3aed' : (animationStep === 3 ? '#fbbf24' : '#8b5cf6')} strokeWidth={hoveredNode === 'aicheck' ? '3' : (animationStep === 3 ? '4' : '2')} className={animationStep === 3 ? 'animate-pulse' : ''} />
            <text x="450" y="332" textAnchor="middle" className="fill-gray-800 font-semibold pointer-events-none" fontSize="11">AI Check</text>
            <text x="450" y="347" textAnchor="middle" className="fill-gray-600 pointer-events-none" fontSize="10">92% AI</text>
          </g>

          <g
            filter="url(#shadow)"
            onMouseEnter={() => setHoveredNode('imagecert')}
            onMouseLeave={() => setHoveredNode(null)}
            className="cursor-pointer"
            style={{ opacity: hoveredNode === 'imagecert' ? 1 : hoveredNode ? 0.6 : 0.9, transition: 'opacity 0.3s' }}
          >
            <rect x="500" y="310" width="100" height="50" rx="6" fill="#f3e8ff" stroke={hoveredNode === 'imagecert' ? '#7c3aed' : (animationStep === 3 ? '#fbbf24' : '#8b5cf6')} strokeWidth={hoveredNode === 'imagecert' ? '3' : (animationStep === 3 ? '4' : '2')} className={animationStep === 3 ? 'animate-pulse' : ''} />
            <text x="550" y="332" textAnchor="middle" className="fill-gray-800 font-semibold pointer-events-none" fontSize="11">Image Cert</text>
            <text x="550" y="347" textAnchor="middle" className="fill-gray-600 pointer-events-none" fontSize="10">Authentic</text>
          </g>

          {/* Operations Receipts */}
          <g
            filter="url(#shadow)"
            onMouseEnter={() => setHoveredNode('deploy')}
            onMouseLeave={() => setHoveredNode(null)}
            className="cursor-pointer"
            style={{ opacity: hoveredNode === 'deploy' ? 1 : hoveredNode ? 0.6 : 0.9, transition: 'opacity 0.3s' }}
          >
            <rect x="650" y="310" width="100" height="50" rx="6" fill="#ffedd5" stroke={hoveredNode === 'deploy' ? '#ea580c' : (animationStep === 3 ? '#fbbf24' : '#f97316')} strokeWidth={hoveredNode === 'deploy' ? '3' : (animationStep === 3 ? '4' : '2')} className={animationStep === 3 ? 'animate-pulse' : ''} />
            <text x="700" y="332" textAnchor="middle" className="fill-gray-800 font-semibold pointer-events-none" fontSize="11">Deploy</text>
            <text x="700" y="347" textAnchor="middle" className="fill-gray-600 pointer-events-none" fontSize="10">v2.4.1</text>
          </g>

          <g
            filter="url(#shadow)"
            onMouseEnter={() => setHoveredNode('incident')}
            onMouseLeave={() => setHoveredNode(null)}
            className="cursor-pointer"
            style={{ opacity: hoveredNode === 'incident' ? 1 : hoveredNode ? 0.6 : 0.9, transition: 'opacity 0.3s' }}
          >
            <rect x="750" y="310" width="100" height="50" rx="6" fill="#ffedd5" stroke={hoveredNode === 'incident' ? '#ea580c' : (animationStep === 3 ? '#fbbf24' : '#f97316')} strokeWidth={hoveredNode === 'incident' ? '3' : (animationStep === 3 ? '4' : '2')} className={animationStep === 3 ? 'animate-pulse' : ''} />
            <text x="800" y="332" textAnchor="middle" className="fill-gray-800 font-semibold pointer-events-none" fontSize="11">Incident</text>
            <text x="800" y="347" textAnchor="middle" className="fill-gray-600 pointer-events-none" fontSize="10">INC-042</text>
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
