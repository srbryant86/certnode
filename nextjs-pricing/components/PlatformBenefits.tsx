export default function PlatformBenefits() {
  const benefits = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" className="w-16 h-16">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="6"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>
      ),
      title: 'Cross-Domain Verification',
      tagline: 'Exponentially Harder to Forge',
      description: 'Transaction receipts cryptographically link to content certifications, which link to operational attestations. Forging a single receipt requires compromising all three domains simultaneously and recalculating the global merkle root.',
      example: 'A $50K payment links to an invoice (AI-verified) which links to delivery confirmation (GPS-verified). All three must be consistent.',
      color: 'blue',
      gradient: 'from-blue-500 to-blue-700'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" className="w-16 h-16">
          <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
      ),
      title: 'Cross-Merchant Network',
      tagline: 'Each Merchant Strengthens the Network',
      description: 'Receipts from different merchants cryptographically verify each other through hash linking. A customer with verified purchases across multiple merchants has a network trust score that makes fraud nearly impossible.',
      example: 'Customer with 15 verified purchases across 8 merchants has stronger trust than isolated single-merchant verification.',
      color: 'green',
      gradient: 'from-green-500 to-green-700'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" className="w-16 h-16">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
      title: 'Blockchain Anchoring',
      tagline: 'Publicly Verifiable Evidence',
      description: 'Global merkle roots published to Bitcoin blockchain every 10 minutes. Anyone can independently verify receipts without trusting CertNode. Court-admissible evidence that is cryptographically provable and legally recognized.',
      example: 'Prove a transaction occurred at a specific time without relying on CertNode database - verify directly on the blockchain.',
      color: 'orange',
      gradient: 'from-orange-500 to-orange-700'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" className="w-16 h-16">
          <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
      ),
      title: 'Collective Fraud Defense',
      tagline: 'Network Learns from Every Attack',
      description: 'Anonymous fraud patterns automatically shared across the merchant network. When one merchant detects fraud, all merchants are immediately protected. Network effect makes fraud detection exponentially better over time.',
      example: 'Refund abuse pattern detected at Merchant A automatically triggers alerts for Merchants B, C, and D.',
      color: 'purple',
      gradient: 'from-purple-500 to-purple-700'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-block bg-purple-100 text-purple-800 text-xs font-bold px-4 py-1.5 rounded-full mb-4">
            COMPETITIVE MOATS
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Four Architectural Advantages Competitors Can't Replicate</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            These four moats create compounding network effects that get stronger over time, making CertNode exponentially harder to compete with.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow border-l-4 border-transparent hover:border-blue-500">
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${benefit.gradient}`}>
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{benefit.title}</h3>
                  <p className={`text-sm font-semibold text-${benefit.color}-600`}>{benefit.tagline}</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">{benefit.description}</p>
              <div className="bg-gray-50 border-l-4 border-gray-300 p-4 rounded">
                <p className="text-sm text-gray-600 italic">
                  <strong className="text-gray-800">Example:</strong> {benefit.example}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
