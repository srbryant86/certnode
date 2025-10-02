import React from 'react';

export default function CompetitorComparison() {
  const features = [
    {
      category: 'Platform Coverage',
      items: [
        { name: 'Transaction Verification', certnode: true, stripe: true, c2pa: false, auditLogs: false },
        { name: 'Content Authenticity', certnode: true, stripe: false, c2pa: true, auditLogs: false },
        { name: 'Operational Compliance', certnode: true, stripe: false, c2pa: false, auditLogs: true },
        { name: 'Unified Cross-Domain Platform', certnode: true, stripe: false, c2pa: false, auditLogs: false },
      ],
    },
    {
      category: 'Cryptographic Security',
      items: [
        { name: 'Tamper-Evident Receipts', certnode: true, stripe: false, c2pa: true, auditLogs: true },
        { name: 'Blockchain Anchoring', certnode: true, stripe: false, c2pa: false, auditLogs: false },
        { name: 'Public Verifiability', certnode: true, stripe: false, c2pa: true, auditLogs: false },
        { name: 'Cross-Domain Cryptographic Links', certnode: true, stripe: false, c2pa: false, auditLogs: false },
      ],
    },
    {
      category: 'Fraud Detection',
      items: [
        { name: 'Real-Time Transaction Monitoring', certnode: true, stripe: true, c2pa: false, auditLogs: false },
        { name: 'Cross-Merchant Pattern Detection', certnode: true, stripe: false, c2pa: false, auditLogs: false },
        { name: 'Network Fraud Defense', certnode: true, stripe: false, c2pa: false, auditLogs: false },
        { name: 'AI Content Detection', certnode: true, stripe: false, c2pa: false, auditLogs: false },
      ],
    },
    {
      category: 'Compliance & Audit',
      items: [
        { name: 'PCI/SOX/GDPR Mapping', certnode: true, stripe: false, c2pa: false, auditLogs: false },
        { name: 'Audit Trail Generation', certnode: true, stripe: false, c2pa: false, auditLogs: true },
        { name: 'Compliance Report Export', certnode: true, stripe: false, c2pa: false, auditLogs: true },
        { name: 'Court-Admissible Evidence', certnode: true, stripe: false, c2pa: true, auditLogs: false },
      ],
    },
  ];

  const Check = () => (
    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );

  const Cross = () => (
    <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 md:p-10 shadow-lg">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
            COMPETITIVE ADVANTAGE
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            How CertNode Compares
          </h2>
          <p className="text-gray-700 text-base md:text-lg max-w-2xl mx-auto">
            The only platform that handles transactions, content, AND operations in one cryptographic graph.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Table Header */}
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Feature</th>
                <th className="py-4 px-4 text-center">
                  <div className="font-bold text-blue-600 text-lg">CertNode</div>
                  <div className="text-xs text-gray-500 font-normal">Full Platform</div>
                </th>
                <th className="py-4 px-4 text-center">
                  <div className="font-semibold text-gray-700">Stripe Radar</div>
                  <div className="text-xs text-gray-500 font-normal">Payment Fraud</div>
                </th>
                <th className="py-4 px-4 text-center">
                  <div className="font-semibold text-gray-700">C2PA</div>
                  <div className="text-xs text-gray-500 font-normal">Content Auth</div>
                </th>
                <th className="py-4 px-4 text-center">
                  <div className="font-semibold text-gray-700">DataDog</div>
                  <div className="text-xs text-gray-500 font-normal">Audit Logs</div>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {features.map((category, categoryIdx) => (
                <React.Fragment key={`category-${categoryIdx}`}>
                  {/* Category Header */}
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="py-3 px-4 font-bold text-gray-900 text-sm uppercase tracking-wide">
                      {category.category}
                    </td>
                  </tr>

                  {/* Category Items */}
                  {category.items.map((item, itemIdx) => (
                    <tr
                      key={`${categoryIdx}-${itemIdx}`}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4 text-gray-700">{item.name}</td>
                      <td className="py-4 px-4 text-center bg-blue-50">
                        {item.certnode ? <Check /> : <Cross />}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {item.stripe ? <Check /> : <Cross />}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {item.c2pa ? <Check /> : <Cross />}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {item.auditLogs ? <Check /> : <Cross />}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Value Proposition Callout */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
          <div>
            <h3 className="font-bold text-2xl mb-4 text-center">One Platform vs. Three Separate Tools</h3>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <h4 className="font-bold text-lg mb-3">❌ Traditional Approach</h4>
                <ul className="space-y-2 text-sm text-blue-50">
                  <li>• Stripe Radar: $0.05 per transaction</li>
                  <li>• C2PA integration: Custom development</li>
                  <li>• DataDog logs: $15/host/month</li>
                  <li>• Manual cross-referencing between systems</li>
                  <li>• Siloed data, no unified verification</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-white/30">
                  <p className="font-bold text-yellow-300">Estimated cost: $500-2,000/month</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border-2 border-yellow-400">
                <h4 className="font-bold text-lg mb-3">✅ CertNode Platform</h4>
                <ul className="space-y-2 text-sm text-white">
                  <li>• Transaction + Content + Operations verification</li>
                  <li>• Cryptographically linked across all domains</li>
                  <li>• Automatic compliance reporting</li>
                  <li>• Network fraud defense included</li>
                  <li>• One unified API, one dashboard</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-white/30">
                  <p className="font-bold text-yellow-300">Starting at $49/month</p>
                </div>
              </div>
            </div>
            <p className="text-center text-blue-100 text-sm">
              <strong className="text-white">The CertNode Advantage:</strong> Save time, reduce costs, and get stronger security with unified cross-domain verification
            </p>
          </div>
        </div>

        {/* Footnote */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Comparison based on publicly available information as of {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
            Contact us for detailed competitive analysis specific to your use case.
          </p>
        </div>
      </div>
    </div>
  );
}
