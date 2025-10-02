export default function PlatformPillars() {
  const pillars = [
    {
      icon: (
        <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      ),
      title: 'Content Verification',
      metric: 'Verify documents, images, and text in seconds',
      description: 'Multi-model AI detection ensures content authenticity. Forensic-grade evidence compilation with court-admissible documentation.',
      features: [
        'Multi-model AI detection with ensemble architecture',
        'Cryptographic content fingerprinting',
        'Tamper-evident modification tracking',
        'Structured legal documentation output',
        'API-first integration for any workflow'
      ],
      color: 'purple'
    },
    {
      icon: (
        <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="#48bb78" strokeWidth="2">
          <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3v-8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
        </svg>
      ),
      title: 'Payment Security',
      metric: 'Cryptographic proof for every transaction',
      description: 'Real-time fraud detection with pattern analysis across the merchant network. Automatic compliance mapping for PCI, SOX, and AML.',
      features: [
        'Cross-merchant fraud pattern detection',
        'Automatic PCI/SOX/AML compliance mapping',
        'Cryptographic transaction receipts',
        'Tamper-evident audit trails',
        'Integration with Stripe, PayPal, and custom payment processors'
      ],
      color: 'green'
    },
    {
      icon: (
        <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="#ed8936" strokeWidth="2">
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
        </svg>
      ),
      title: 'Operational Compliance',
      metric: 'Automate SOX/ISO/NIST compliance reporting',
      description: 'Track deployments, incidents, and policy changes with cryptographic attestations. Generate compliance reports automatically.',
      features: [
        'Multi-framework compliance (SOX, ISO 27001, NIST)',
        'Automated incident documentation',
        'Build and deployment provenance tracking',
        'Professional attestation generation',
        'Complete audit trail with cryptographic proof'
      ],
      color: 'orange'
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8">
          {pillars.map((pillar, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="mb-4">{pillar.icon}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{pillar.title}</h3>
              <div className="mb-4 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm font-semibold text-blue-700">{pillar.metric}</p>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">{pillar.description}</p>
              <ul className="space-y-3">
                {pillar.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <a
                href="/pricing"
                className="mt-6 inline-block text-blue-600 font-semibold hover:text-blue-700 transition-colors"
              >
                View Plans →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
