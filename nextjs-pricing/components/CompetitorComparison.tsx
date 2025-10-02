import React from 'react';

export default function CompetitorComparison() {
  const features = [
    {
      category: 'Verification Domains',
      items: [
        { name: 'Transaction Receipts', certnode: true, stripe: true, c2pa: false, auditLogs: false },
        { name: 'Content Certification', certnode: true, stripe: false, c2pa: true, auditLogs: false },
        { name: 'Operations Attestation', certnode: true, stripe: false, c2pa: false, auditLogs: true },
        { name: 'Unified Cross-Domain Graph', certnode: true, stripe: false, c2pa: false, auditLogs: false },
      ],
    },
    {
      category: 'Network Architecture',
      items: [
        { name: 'Cross-Merchant Network Effects', certnode: true, stripe: false, c2pa: false, auditLogs: false },
        { name: 'Network Trust Scores', certnode: true, stripe: false, c2pa: false, auditLogs: false },
        { name: 'Anonymous Fraud Pattern Sharing', certnode: true, stripe: false, c2pa: false, auditLogs: false },
        { name: 'Collective Defense (Network Learns)', certnode: true, stripe: false, c2pa: false, auditLogs: false },
      ],
    },
    {
      category: 'Cryptographic Infrastructure',
      items: [
        { name: 'Blockchain Time-Stamping', certnode: true, stripe: false, c2pa: false, auditLogs: false },
        { name: 'Public Verifiability (Trustless)', certnode: true, stripe: false, c2pa: true, auditLogs: false },
        { name: 'Global Merkle Root Publishing', certnode: true, stripe: false, c2pa: false, auditLogs: false },
        { name: 'Court-Admissible Evidence', certnode: true, stripe: false, c2pa: true, auditLogs: false },
      ],
    },
    {
      category: 'Trust & Compliance',
      items: [
        { name: 'Multi-Domain Verification', certnode: true, stripe: false, c2pa: false, auditLogs: false },
        { name: 'Auto-Compliance Mapping (PCI/SOX/GDPR)', certnode: true, stripe: false, c2pa: false, auditLogs: false },
        { name: 'Tamper-Evident Audit Trails', certnode: true, stripe: false, c2pa: false, auditLogs: true },
        { name: 'Public Verification APIs', certnode: true, stripe: false, c2pa: true, auditLogs: false },
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
                  <div className="font-semibold text-gray-700">Stripe</div>
                  <div className="text-xs text-gray-500 font-normal">Payments Only</div>
                </th>
                <th className="py-4 px-4 text-center">
                  <div className="font-semibold text-gray-700">C2PA</div>
                  <div className="text-xs text-gray-500 font-normal">Content Only</div>
                </th>
                <th className="py-4 px-4 text-center">
                  <div className="font-semibold text-gray-700">Audit Logs</div>
                  <div className="text-xs text-gray-500 font-normal">Operations Only</div>
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

        {/* Key Differentiator Callout */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🏆</div>
            <div>
              <h3 className="font-bold text-xl mb-2">Why CertNode Can't Be Replicated</h3>
              <p className="text-blue-100 leading-relaxed mb-4">
                While competitors offer isolated solutions, CertNode is the <strong>only platform</strong> with seven compounding architectural moats:
              </p>
              <ul className="space-y-2 text-blue-50">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300 font-bold">1.</span>
                  <span><strong>Cross-Domain Graph:</strong> Transactions, content, and operations cryptographically linked</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300 font-bold">2.</span>
                  <span><strong>Cross-Merchant Network:</strong> Each new merchant makes every receipt more trustworthy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300 font-bold">3.</span>
                  <span><strong>Blockchain Anchoring:</strong> Publicly verifiable, court-admissible evidence</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300 font-bold">4.</span>
                  <span><strong>Collective Fraud Defense:</strong> Network learns from every attack</span>
                </li>
              </ul>
              <p className="text-blue-100 mt-4 font-semibold">
                → Network effects make competition exponentially harder over time
              </p>
            </div>
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
