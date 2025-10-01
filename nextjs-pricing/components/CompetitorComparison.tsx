export default function CompetitorComparison() {
  const features = [
    {
      category: 'Receipt Types',
      items: [
        { name: 'Transaction Receipts', certnode: true, stripe: true, c2pa: false, auditLogs: false },
        { name: 'Content Certification', certnode: true, stripe: false, c2pa: true, auditLogs: false },
        { name: 'Operations Attestation', certnode: true, stripe: false, c2pa: false, auditLogs: true },
        { name: 'Receipt Graph (Cross-Domain Links)', certnode: true, stripe: false, c2pa: false, auditLogs: false },
      ],
    },
    {
      category: 'Technical Features',
      items: [
        { name: 'Cryptographic Signing (ES256)', certnode: true, stripe: true, c2pa: true, auditLogs: false },
        { name: 'Offline Verification', certnode: true, stripe: false, c2pa: true, auditLogs: false },
        { name: 'Open Standards (JWKS, JCS)', certnode: true, stripe: false, c2pa: true, auditLogs: false },
        { name: 'Cross-Domain Queries', certnode: true, stripe: false, c2pa: false, auditLogs: false },
      ],
    },
    {
      category: 'Enterprise Features',
      items: [
        { name: 'Compliance Reporting', certnode: true, stripe: true, c2pa: false, auditLogs: true },
        { name: '99.9% SLA', certnode: true, stripe: true, c2pa: false, auditLogs: true },
        { name: 'SSO Integration', certnode: true, stripe: true, c2pa: false, auditLogs: true },
        { name: 'Dedicated Support', certnode: true, stripe: true, c2pa: false, auditLogs: true },
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
                <>
                  {/* Category Header */}
                  <tr key={`cat-${categoryIdx}`} className="bg-gray-50">
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
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Key Differentiator Callout */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🏆</div>
            <div>
              <h3 className="font-bold text-xl mb-2">The CertNode Advantage</h3>
              <p className="text-blue-100 leading-relaxed">
                While competitors focus on a single domain, CertNode is the <strong>only platform</strong> that
                cryptographically links transactions, content, and operations in one unified graph.
                This enables queries and insights impossible with any other solution.
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
