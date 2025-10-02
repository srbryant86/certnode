export default function PlatformBenefits() {
  const benefits = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" className="w-12 h-12">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="6"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>
      ),
      title: 'Cross-Domain Verification',
      description: 'Transaction receipts link to content certifications, which link to operational attestations. Forging a single receipt requires compromising all three domains - exponentially harder than isolated systems.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" className="w-12 h-12">
          <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
      ),
      title: 'Cross-Merchant Network',
      description: 'Receipts from different merchants cryptographically verify each other. Network trust scores make fraud nearly impossible. Each new merchant makes every receipt more trustworthy.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" className="w-12 h-12">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
      title: 'Blockchain Time-Stamping',
      description: 'Global merkle roots published to Bitcoin blockchain every 10 minutes. Publicly verifiable, court-admissible evidence that anyone can independently verify without trusting CertNode.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" className="w-12 h-12">
          <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
      ),
      title: 'Collective Fraud Defense',
      description: 'Anonymous fraud patterns shared across the network. When one merchant detects fraud, all merchants are protected. Network learns from every attack in real-time.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" className="w-12 h-12">
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
        </svg>
      ),
      title: 'Unified Platform Architecture',
      description: 'One platform handles transactions, content, and operations instead of three separate tools. Link receipts across all domains for complete workflow verification. Exponentially harder to forge than isolated systems.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" className="w-12 h-12">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
        </svg>
      ),
      title: 'Regulatory Auto-Compliance',
      description: 'Receipts automatically map to PCI-DSS, SOX, GDPR, ISO compliance requirements. Auto-generated audit reports save $100K+ per compliance cycle.'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why CertNode Is Impossible to Compete With</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Seven architectural moats create compounding network effects. Cross-domain linking, cross-merchant verification, blockchain anchoring, collective fraud defense, trust-level architecture, and regulatory auto-compliance work together to make each receipt exponentially more trustworthy.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="mb-4">{benefit.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
