"use client";

import { useState } from "react";
import { formatNumber, formatPercentage } from "@/lib/format";

interface IndustrySolution {
  id: string;
  name: string;
  icon: string;
  description: string;
  keyBenefits: string[];
  useCases: string[];
  integrations: string[];
  metrics: {
    accuracy: number;
    processingTime: string;
    costSavings: string;
    compliance: string[];
  };
  features: {
    contentIntelligence: string[];
    transactionIntelligence: string[];
    operationsIntelligence: string[];
  };
}

const INDUSTRY_SOLUTIONS: IndustrySolution[] = [
  {
    id: 'media-entertainment',
    name: 'Media & Entertainment',
    icon: '🎬',
    description: 'Comprehensive content authenticity and IP protection for media companies',
    keyBenefits: [
      'Protect original content from AI-generated deepfakes',
      'Verify user-generated content authenticity',
      'Automated copyright compliance monitoring',
      'Real-time content moderation intelligence'
    ],
    useCases: [
      'Social media content verification',
      'News and journalism authenticity',
      'Entertainment content protection',
      'Influencer content validation',
      'Documentary evidence verification'
    ],
    integrations: [
      'YouTube Creator Studio',
      'TikTok Business',
      'Instagram Business API',
      'Twitter Media APIs',
      'Vimeo Enterprise'
    ],
    metrics: {
      accuracy: 0.97,
      processingTime: '< 200ms',
      costSavings: '$500K annually',
      compliance: ['DMCA', 'EU Copyright Directive', 'Fair Use Guidelines']
    },
    features: {
      contentIntelligence: [
        'Multi-modal deepfake detection',
        'Video frame authenticity analysis',
        'Audio manipulation detection',
        'Image provenance tracking'
      ],
      transactionIntelligence: [
        'Creator payment verification',
        'Licensing transaction validation',
        'Royalty distribution compliance',
        'Advertising revenue authentication'
      ],
      operationsIntelligence: [
        'Content moderation workflows',
        'Copyright enforcement automation',
        'Creator onboarding compliance',
        'Platform policy enforcement'
      ]
    }
  },
  {
    id: 'financial-services',
    name: 'Financial Services',
    icon: '🏦',
    description: 'Enterprise-grade fraud detection and regulatory compliance automation',
    keyBenefits: [
      'Real-time transaction fraud detection',
      'Automated AML/BSA compliance monitoring',
      'Document authenticity verification',
      'Operational risk management'
    ],
    useCases: [
      'Wire transfer fraud prevention',
      'KYC document verification',
      'Loan application authenticity',
      'Trading compliance monitoring',
      'Regulatory reporting automation'
    ],
    integrations: [
      'SWIFT Network',
      'ACH Processing Systems',
      'Core Banking Platforms',
      'Trading Systems',
      'Regulatory Reporting Tools'
    ],
    metrics: {
      accuracy: 0.98,
      processingTime: '< 50ms',
      costSavings: '$2M annually',
      compliance: ['AML/BSA', 'SOX', 'PCI-DSS', 'GDPR', 'OFAC']
    },
    features: {
      contentIntelligence: [
        'Document forgery detection',
        'ID verification analysis',
        'Financial statement validation',
        'Contract authenticity checking'
      ],
      transactionIntelligence: [
        '10-layer fraud detection',
        'Real-time risk scoring',
        'AML pattern recognition',
        'Sanctions screening automation'
      ],
      operationsIntelligence: [
        'Regulatory compliance automation',
        'Audit trail management',
        'Incident response workflows',
        'Policy enforcement monitoring'
      ]
    }
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Life Sciences',
    icon: '🏥',
    description: 'Medical data integrity and pharmaceutical supply chain verification',
    keyBenefits: [
      'Clinical trial data verification',
      'Medical imaging authenticity',
      'Pharmaceutical supply chain tracking',
      'HIPAA compliance automation'
    ],
    useCases: [
      'Medical record authenticity',
      'Clinical trial data validation',
      'Drug supply chain verification',
      'Medical imaging analysis',
      'Research data integrity'
    ],
    integrations: [
      'Epic Systems',
      'Cerner Healthcare',
      'MEDITECH',
      'Allscripts',
      'Laboratory Information Systems'
    ],
    metrics: {
      accuracy: 0.99,
      processingTime: '< 100ms',
      costSavings: '$1.5M annually',
      compliance: ['HIPAA', 'FDA CFR 21 Part 11', 'GxP', 'SOX']
    },
    features: {
      contentIntelligence: [
        'Medical image authenticity',
        'Clinical document verification',
        'Research data validation',
        'Patient record integrity'
      ],
      transactionIntelligence: [
        'Pharmaceutical payment validation',
        'Insurance claim verification',
        'Clinical trial funding tracking',
        'Supply chain transaction monitoring'
      ],
      operationsIntelligence: [
        'Clinical workflow compliance',
        'Regulatory submission tracking',
        'Quality management systems',
        'Adverse event reporting'
      ]
    }
  },
  {
    id: 'legal-government',
    name: 'Legal & Government',
    icon: '⚖️',
    description: 'Evidence authenticity and legal document verification for courts and agencies',
    keyBenefits: [
      'Digital evidence authentication',
      'Legal document verification',
      'Court filing integrity',
      'Government compliance automation'
    ],
    useCases: [
      'Court evidence verification',
      'Legal document authenticity',
      'Government filing validation',
      'Regulatory compliance tracking',
      'Public record integrity'
    ],
    integrations: [
      'Court Management Systems',
      'Legal Case Management',
      'Government Filing Systems',
      'Document Management Platforms',
      'E-Discovery Tools'
    ],
    metrics: {
      accuracy: 0.995,
      processingTime: '< 150ms',
      costSavings: '$800K annually',
      compliance: ['Federal Rules of Evidence', 'FOIA', 'Records Management', 'Security Clearance']
    },
    features: {
      contentIntelligence: [
        'Digital evidence authentication',
        'Document tampering detection',
        'Chain of custody verification',
        'Forensic analysis tools'
      ],
      transactionIntelligence: [
        'Government payment validation',
        'Contract compliance monitoring',
        'Procurement fraud detection',
        'Public fund tracking'
      ],
      operationsIntelligence: [
        'Legal process automation',
        'Compliance workflow management',
        'Case management integration',
        'Regulatory filing automation'
      ]
    }
  },
  {
    id: 'insurance',
    name: 'Insurance',
    icon: '🛡️',
    description: 'Claims fraud detection and policy compliance automation',
    keyBenefits: [
      'Automated claims fraud detection',
      'Document authenticity verification',
      'Policy compliance monitoring',
      'Risk assessment automation'
    ],
    useCases: [
      'Claims document verification',
      'Fraud investigation support',
      'Policy application validation',
      'Underwriting risk assessment',
      'Regulatory compliance tracking'
    ],
    integrations: [
      'Claims Management Systems',
      'Policy Administration Platforms',
      'Underwriting Tools',
      'Fraud Detection Systems',
      'Regulatory Reporting Tools'
    ],
    metrics: {
      accuracy: 0.96,
      processingTime: '< 300ms',
      costSavings: '$3M annually',
      compliance: ['State Insurance Regulations', 'NAIC Guidelines', 'SOX', 'Anti-Fraud Laws']
    },
    features: {
      contentIntelligence: [
        'Claims photo authenticity',
        'Medical record verification',
        'Document fraud detection',
        'Video evidence analysis'
      ],
      transactionIntelligence: [
        'Premium payment validation',
        'Claims payout verification',
        'Policy transaction monitoring',
        'Reinsurance tracking'
      ],
      operationsIntelligence: [
        'Claims processing workflows',
        'Underwriting compliance',
        'Regulatory reporting automation',
        'Risk management processes'
      ]
    }
  },
  {
    id: 'education',
    name: 'Education',
    icon: '🎓',
    description: 'Academic integrity and credential verification for educational institutions',
    keyBenefits: [
      'Student work authenticity verification',
      'Credential and diploma validation',
      'Academic integrity monitoring',
      'Research data verification'
    ],
    useCases: [
      'Assignment plagiarism detection',
      'Diploma and certificate verification',
      'Research data integrity',
      'Online exam proctoring',
      'Academic record validation'
    ],
    integrations: [
      'Learning Management Systems',
      'Student Information Systems',
      'Gradebook Platforms',
      'Research Databases',
      'Credentialing Systems'
    ],
    metrics: {
      accuracy: 0.94,
      processingTime: '< 250ms',
      costSavings: '$400K annually',
      compliance: ['FERPA', 'Academic Standards', 'Accreditation Requirements']
    },
    features: {
      contentIntelligence: [
        'AI-generated content detection',
        'Plagiarism analysis',
        'Document authenticity verification',
        'Research integrity validation'
      ],
      transactionIntelligence: [
        'Tuition payment verification',
        'Financial aid validation',
        'Scholarship transaction monitoring',
        'Research funding tracking'
      ],
      operationsIntelligence: [
        'Academic process automation',
        'Compliance monitoring',
        'Student lifecycle management',
        'Institutional reporting'
      ]
    }
  }
];

interface SolutionsClientProps {
  enterpriseId: string;
}

export function SolutionsClient({ enterpriseId }: SolutionsClientProps) {
  const [selectedSolution, setSelectedSolution] = useState<IndustrySolution | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Industry Solutions</h1>
          <p className="text-sm text-slate-400 mt-1">
            Specialized intelligence solutions powered by the same 95%+ accurate tri-pillar platform
          </p>
        </div>
        <div className="text-xs text-slate-500">
          {INDUSTRY_SOLUTIONS.length} industry packages available
        </div>
      </div>

      {/* Solutions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {INDUSTRY_SOLUTIONS.map((solution) => (
          <div
            key={solution.id}
            className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50 hover:border-slate-600/50 transition-colors cursor-pointer"
            onClick={() => setSelectedSolution(solution)}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="text-2xl">{solution.icon}</div>
              <div>
                <h3 className="text-lg font-semibold text-white">{solution.name}</h3>
                <div className="text-xs text-slate-400">
                  {formatPercentage(solution.metrics.accuracy)} accuracy • {solution.metrics.processingTime}
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-4">{solution.description}</p>

            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium text-slate-400 mb-1">Key Benefits</div>
                <div className="space-y-1">
                  {solution.keyBenefits.slice(0, 2).map((benefit, index) => (
                    <div key={index} className="text-xs text-slate-500">
                      • {benefit}
                    </div>
                  ))}
                  {solution.keyBenefits.length > 2 && (
                    <div className="text-xs text-slate-600">
                      +{solution.keyBenefits.length - 2} more benefits
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between text-xs">
                <div>
                  <div className="text-slate-400">Cost Savings</div>
                  <div className="text-green-400 font-medium">{solution.metrics.costSavings}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400">Compliance</div>
                  <div className="text-blue-400 font-medium">{solution.metrics.compliance.length} frameworks</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Solution Detail Modal */}
      {selectedSolution && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">{selectedSolution.icon}</div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white">{selectedSolution.name}</h2>
                    <p className="text-slate-400">{selectedSolution.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSolution(null)}
                  className="text-slate-400 hover:text-white text-xl"
                >
                  ✕
                </button>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400">Accuracy</div>
                  <div className="text-xl font-semibold text-green-400">
                    {formatPercentage(selectedSolution.metrics.accuracy)}
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400">Processing Time</div>
                  <div className="text-xl font-semibold text-blue-400">
                    {selectedSolution.metrics.processingTime}
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400">Cost Savings</div>
                  <div className="text-xl font-semibold text-purple-400">
                    {selectedSolution.metrics.costSavings}
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400">Compliance</div>
                  <div className="text-xl font-semibold text-yellow-400">
                    {selectedSolution.metrics.compliance.length} frameworks
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Key Benefits */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Key Benefits</h3>
                    <div className="space-y-2">
                      {selectedSolution.keyBenefits.map((benefit, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="text-green-400 mt-1">✓</div>
                          <div className="text-sm text-slate-300">{benefit}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Use Cases */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Use Cases</h3>
                    <div className="space-y-2">
                      {selectedSolution.useCases.map((useCase, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="text-blue-400 mt-1">•</div>
                          <div className="text-sm text-slate-300">{useCase}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Compliance Frameworks */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Compliance Frameworks</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedSolution.metrics.compliance.map((framework, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs rounded-full bg-yellow-900/50 text-yellow-300 border border-yellow-700/50"
                        >
                          {framework}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Tri-Pillar Features */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">🎨 Content Intelligence Features</h3>
                    <div className="space-y-1">
                      {selectedSolution.features.contentIntelligence.map((feature, index) => (
                        <div key={index} className="text-sm text-slate-300">• {feature}</div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">💰 Transaction Intelligence Features</h3>
                    <div className="space-y-1">
                      {selectedSolution.features.transactionIntelligence.map((feature, index) => (
                        <div key={index} className="text-sm text-slate-300">• {feature}</div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">🔧 Operations Intelligence Features</h3>
                    <div className="space-y-1">
                      {selectedSolution.features.operationsIntelligence.map((feature, index) => (
                        <div key={index} className="text-sm text-slate-300">• {feature}</div>
                      ))}
                    </div>
                  </div>

                  {/* Integrations */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Platform Integrations</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedSolution.integrations.map((integration, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs rounded-full bg-slate-700 text-slate-300"
                        >
                          {integration}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-slate-900/50 rounded-lg">
                <div className="text-sm text-slate-400 mb-2">💡 Implementation Note</div>
                <div className="text-sm text-slate-300">
                  This industry solution uses the same 95%+ accurate tri-pillar intelligence platform with specialized
                  configurations and industry-specific integrations. No additional development required -
                  instant deployment with zero extra cost.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}