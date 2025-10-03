'use client';

import { useState, useEffect } from 'react';

interface Node {
  id: string;
  type: 'transaction' | 'content' | 'operations';
  label: string;
  description: string;
  step: number;
}

interface Edge {
  from: string;
  to: string;
  label: string;
}

interface Story {
  title: string;
  steps: string[];
}

export default function ReceiptGraphDemo() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Demo graph: E-commerce dispute resolution
  const nodes: Node[] = [
    { id: 'tx1', type: 'transaction', label: 'Payment\n$50,000', description: 'Original payment received from customer', step: 0 },
    { id: 'content1', type: 'content', label: 'Product\nDelivered', description: 'Product shipped and delivered to customer', step: 1 },
    { id: 'ops1', type: 'operations', label: 'Delivery\nConfirmed', description: 'Shipping carrier confirms delivery', step: 2 },
    { id: 'ops2', type: 'operations', label: 'Customer\nComplaint', description: 'Customer reports product defect', step: 3 },
    { id: 'content2', type: 'content', label: 'Defect\nEvidence', description: 'Customer submits photo evidence of defect', step: 4 },
    { id: 'ops3', type: 'operations', label: 'QA\nInvestigation', description: 'Quality team reviews defect claim', step: 5 },
    { id: 'ops4', type: 'operations', label: 'Refund\nApproved', description: 'Manager authorizes refund based on evidence', step: 6 },
    { id: 'tx2', type: 'transaction', label: 'Refund\n$50,000', description: 'Full refund processed to customer', step: 7 },
  ];

  const edges: Edge[] = [
    { from: 'tx1', to: 'content1', label: 'fulfills' },
    { from: 'content1', to: 'ops1', label: 'evidences' },
    { from: 'ops1', to: 'ops2', label: 'triggers' },
    { from: 'ops2', to: 'content2', label: 'requires' },
    { from: 'content2', to: 'ops3', label: 'supports' },
    { from: 'ops3', to: 'ops4', label: 'authorizes' },
    { from: 'ops4', to: 'tx2', label: 'executes' },
  ];

  const story: Story = {
    title: 'CFO asks: "Prove this $50,000 refund was legitimate"',
    steps: [
      '1. Original Payment: Customer paid $50,000 for product',
      '2. Product Delivered: Item shipped and received by customer',
      '3. Delivery Confirmed: Carrier verified successful delivery',
      '4. Customer Complaint: Defect reported 3 days after delivery',
      '5. Evidence Submitted: Customer provided photo proof of defect',
      '6. QA Investigation: Quality team confirmed manufacturing defect',
      '7. Refund Approved: Manager authorized full refund with evidence',
      '8. Refund Processed: $50,000 returned to customer account',
    ],
  };

  // Auto-play animation
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= 7) {
            setIsPlaying(false);
            return 7;
          }
          return prev + 1;
        });
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  const handlePlayPause = () => {
    if (currentStep >= 7 && !isPlaying) {
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'transaction': return { bg: '#3B82F6', border: '#2563EB', text: '#FFFFFF' };
      case 'content': return { bg: '#10B981', border: '#059669', text: '#FFFFFF' };
      case 'operations': return { bg: '#8B5CF6', border: '#7C3AED', text: '#FFFFFF' };
      default: return { bg: '#6B7280', border: '#4B5563', text: '#FFFFFF' };
    }
  };

  const isNodeActive = (node: Node) => node.step <= currentStep;
  const isEdgeActive = (edge: Edge) => {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode = nodes.find(n => n.id === edge.to);
    return fromNode && toNode && fromNode.step <= currentStep && toNode.step <= currentStep;
  };

  // Clean vertical flow positioning - no overlaps
  const getNodePosition = (step: number) => {
    const positions = [
      { x: 75, y: 40 },     // Payment
      { x: 75, y: 100 },    // Product Delivered
      { x: 75, y: 160 },    // Delivery Confirmed
      { x: 75, y: 220 },    // Customer Complaint
      { x: 75, y: 280 },    // Defect Evidence
      { x: 75, y: 340 },    // QA Investigation
      { x: 75, y: 400 },    // Refund Approved
      { x: 75, y: 460 },    // Refund
    ];
    return positions[step] || { x: 0, y: 0 };
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 p-6 md:p-10 shadow-xl">
      {/* Introduction */}
      <div className="max-w-4xl mx-auto mb-10">
        <div className="text-center mb-6">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Receipt Graph: The Only Platform That Connects Everything
          </h3>
          <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-4">
            Unlike competitors who only handle transactions OR content OR operations,
            CertNode creates a <strong>cryptographically-linked graph</strong> connecting all three.
            Every receipt can reference other receipts, creating an unbreakable chain of proof.
          </p>
        </div>

        {/* Use Case Setup */}
        <div className="bg-white rounded-lg border-2 border-blue-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">💼</div>
            <div>
              <h4 className="font-bold text-gray-900 text-lg mb-2">Real-World Scenario</h4>
              <p className="text-gray-700 mb-3">
                <strong className="text-blue-600">CFO asks:</strong> "Prove this $50,000 refund was legitimate and not fraud."
              </p>
              <p className="text-sm text-gray-600">
                <strong>Without CertNode:</strong> Hunt through payment logs, support tickets, emails, approvals.
                Hope everything matches. No cryptographic proof.<br/>
                <strong className="text-blue-600">With CertNode Receipt Graph:</strong> One query shows the complete chain.
                Every step cryptographically verified. Independent audit possible.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Title */}
      <div className="text-center mb-6">
        <h4 className="text-xl font-bold text-gray-900 mb-2">
          Interactive Demo: Click Play to See How It Works
        </h4>

        {/* Controls */}
        <div className="flex justify-center gap-3 mb-4">
          <button
            onClick={handlePlayPause}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            {isPlaying ? '⏸ Pause' : currentStep >= 7 ? '🔄 Replay' : '▶ Play Story'}
          </button>
          <button
            onClick={handleReset}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            ↻ Reset
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-1 mb-2">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((step) => (
            <button
              key={step}
              onClick={() => { setCurrentStep(step); setIsPlaying(false); }}
              className={`w-8 h-8 rounded-full text-xs font-semibold transition-all ${
                step <= currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 md:gap-6 mb-6 text-xs md:text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-600 rounded"></div>
          <span>Transaction</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 md:w-4 md:h-4 bg-green-600 rounded"></div>
          <span>Content</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 md:w-4 md:h-4 bg-purple-600 rounded"></div>
          <span>Operations</span>
        </div>
      </div>

      {/* Graph Visualization - Clean Vertical Layout */}
      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Left: Graph Visualization */}
        <div className="relative w-full bg-white rounded-lg border-2 border-gray-200 p-6 overflow-hidden">
          <h5 className="text-sm font-bold text-gray-500 uppercase mb-4 text-center">Receipt Chain</h5>
          <svg viewBox="0 0 300 520" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          {/* Draw edges - vertical arrows */}
          {edges.map((edge, idx) => {
            const fromNode = nodes.find(n => n.id === edge.from);
            const toNode = nodes.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return null;

            const fromPos = getNodePosition(fromNode.step);
            const toPos = getNodePosition(toNode.step);
            const isActive = isEdgeActive(edge);

            return (
              <g key={idx}>
                {/* Vertical line from node to node */}
                <line
                  x1={fromPos.x + 75}
                  y1={fromPos.y + 45}
                  x2={toPos.x + 75}
                  y2={toPos.y}
                  stroke={isActive ? '#3B82F6' : '#E5E7EB'}
                  strokeWidth={isActive ? 3 : 2}
                  markerEnd={isActive ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                  className="transition-all duration-500"
                  opacity={isActive ? 1 : 0.4}
                />
                {/* Relationship label - positioned to the right side */}
                {isActive && (
                  <text
                    x={fromPos.x + 185}
                    y={(fromPos.y + toPos.y) / 2 + 25}
                    fontSize="10"
                    fill="#3B82F6"
                    fontWeight="600"
                    className="pointer-events-none select-none"
                    textAnchor="start"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Arrow marker definitions and filters */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#E5E7EB" />
            </marker>
            <marker
              id="arrowhead-active"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#3B82F6" />
            </marker>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
              <feOffset dx="0" dy="2" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Draw nodes - larger, clearer */}
          {nodes.map((node) => {
            const colors = getNodeColor(node.type);
            const isActive = isNodeActive(node);
            const isCurrent = node.step === currentStep;
            const pos = getNodePosition(node.step);

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => { setCurrentStep(node.step); setIsPlaying(false); }}
                className="cursor-pointer transition-all duration-500"
              >
                {/* Glow effect for current step */}
                {isCurrent && (
                  <circle
                    cx="75"
                    cy="22.5"
                    r="55"
                    fill={colors.bg}
                    opacity="0.15"
                    className="animate-pulse"
                  />
                )}
                {/* Step number badge */}
                <circle
                  cx="10"
                  cy="10"
                  r="10"
                  fill={isActive ? colors.bg : '#E5E7EB'}
                  className="transition-all duration-500"
                />
                <text
                  x="10"
                  y="15"
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill="white"
                  className="pointer-events-none"
                >
                  {node.step + 1}
                </text>
                {/* Node rectangle */}
                <rect
                  x="0"
                  y="0"
                  width="150"
                  height="45"
                  rx="8"
                  fill={isActive ? colors.bg : '#F9FAFB'}
                  stroke={isCurrent ? colors.border : isActive ? colors.border : '#E5E7EB'}
                  strokeWidth={isCurrent ? 3 : 2}
                  opacity={isActive ? 1 : 0.5}
                  className="transition-all duration-500"
                  filter={isCurrent ? "url(#shadow)" : "none"}
                />
                <text
                  x="75"
                  y="18"
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill={isActive ? colors.text : '#9CA3AF'}
                  className="pointer-events-none select-none"
                >
                  {node.label.split('\n').map((line, i) => (
                    <tspan key={i} x="75" dy={i === 0 ? 0 : 13}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </svg>
        </div>

        {/* Right: Story Explanation */}
        <div className="space-y-4">
          <h5 className="text-sm font-bold text-gray-500 uppercase mb-4">Live Story Walkthrough</h5>

          {/* Current Step Highlight */}
          <div className="p-5 bg-blue-600 text-white rounded-lg shadow-lg">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold text-sm">
                {currentStep + 1}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg mb-2">
                  {story.steps[currentStep].split(': ')[1]}
                </h4>
                <p className="text-blue-100 text-sm leading-relaxed">
                  {nodes[currentStep].description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-200 border-t border-blue-500 pt-3">
              <span>✓ Cryptographically signed</span>
              <span>•</span>
              <span>✓ Independently verifiable</span>
              <span>•</span>
              <span>✓ Immutable</span>
            </div>
          </div>

          {/* All Steps List */}
          <div className="space-y-2">
            {story.steps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => { setCurrentStep(idx); setIsPlaying(false); }}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  idx === currentStep
                    ? 'bg-blue-50 border-2 border-blue-600 shadow-md'
                    : idx < currentStep
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === currentStep
                      ? 'bg-blue-600 text-white'
                      : idx < currentStep
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {idx < currentStep ? '✓' : idx + 1}
                  </div>
                  <span className={`text-sm font-medium ${
                    idx <= currentStep ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.split(': ')[1] || step}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Takeaways */}
      <div className="mt-8 pt-8 border-t-2 border-blue-200">
        <h4 className="text-xl font-bold text-gray-900 mb-6 text-center">
          Why This Changes Everything
        </h4>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-lg border-2 border-green-200">
            <div className="text-3xl mb-3">🔗</div>
            <h5 className="font-bold text-gray-900 mb-2">Cryptographically Linked</h5>
            <p className="text-sm text-gray-700 leading-relaxed">
              Each receipt references parent receipts with cryptographic hashes. Tampering with one receipt breaks the entire chain.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg border-2 border-blue-200">
            <div className="text-3xl mb-3">🎯</div>
            <h5 className="font-bold text-gray-900 mb-2">Query Across Domains</h5>
            <p className="text-sm text-gray-700 leading-relaxed">
              Find all refunds over $10K with photo evidence of defects and manager approval — one query, instant results.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg border-2 border-purple-200">
            <div className="text-3xl mb-3">🏆</div>
            <h5 className="font-bold text-gray-900 mb-2">No Competitor Has This</h5>
            <p className="text-sm text-gray-700 leading-relaxed">
              Requires all three products: transactions, content, and operations. Only CertNode connects them all in one cryptographic graph.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
