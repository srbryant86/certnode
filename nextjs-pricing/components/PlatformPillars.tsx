export default function PlatformPillars() {
  const pillars = [
    {
      icon: (
        <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      ),
      title: 'Content Intelligence',
      description: 'Multi-model AI detection and forensic-grade evidence compilation with structured legal documentation output.',
      features: [
        'Multi-model AI detection (GPT-4, Claude, Gemini)',
        'Ensemble detector architecture',
        'Forensic-grade evidence compilation',
        'Structured legal documentation output',
        'In-house processing infrastructure'
      ],
      color: 'purple'
    },
    {
      icon: (
        <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="#48bb78" strokeWidth="2">
          <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3v-8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
        </svg>
      ),
      title: 'Transaction Intelligence',
      description: 'Comprehensive financial validation with pattern-based fraud detection and automated compliance frameworks.',
      features: [
        '10-layer financial validation pipeline',
        'Pattern-based fraud detection',
        'AML/BSA/SOX compliance frameworks',
        'Structured audit trail generation',
        'Real-time transaction analysis'
      ],
      color: 'green'
    },
    {
      icon: (
        <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="#ed8936" strokeWidth="2">
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
        </svg>
      ),
      title: 'Operations Trust',
      description: 'Intelligent operational compliance automation covering incident management, build provenance, and policy changes.',
      features: [
        '10-layer operational validation',
        'Multi-framework compliance (SOX, ISO, NIST)',
        'Professional attestation documentation',
        'Stakeholder management automation',
        'Complete audit trail generation'
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
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{pillar.title}</h3>
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
                See Pricing →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
