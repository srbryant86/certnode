'use client';

export default function ThreeProductShowcase() {
  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Three Products. One Platform. Complete Protection.
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Every CertNode tier includes all three cryptographic receipt products.
            <br />
            <span className="text-blue-600 font-semibold">Pay once. Get everything.</span>
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Transaction Receipts */}
          <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-blue-100 hover:border-blue-300 transition-all">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-6 mx-auto">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
              Transaction Receipts
            </h3>

            <p className="text-gray-600 mb-6 text-center">
              Cryptographic proof for every payment and financial transaction
            </p>

            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">✓</span>
                <span className="text-sm text-gray-700">Dispute & chargeback protection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">✓</span>
                <span className="text-sm text-gray-700">Tamper-evident payment records</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">✓</span>
                <span className="text-sm text-gray-700">Instant verification via JWKS</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">✓</span>
                <span className="text-sm text-gray-700">Audit-ready transaction logs</span>
              </li>
            </ul>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                <strong>Use cases:</strong> E-commerce, SaaS billing, subscription management, payment disputes
              </p>
            </div>
          </div>

          {/* Content Certification */}
          <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-purple-100 hover:border-purple-300 transition-all">
            <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-lg mb-6 mx-auto">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
              Content Certification
            </h3>

            <p className="text-gray-600 mb-6 text-center">
              Prove authenticity, ownership, and provenance of digital content
            </p>

            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">✓</span>
                <span className="text-sm text-gray-700">C2PA-compatible certification</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">✓</span>
                <span className="text-sm text-gray-700">Ownership & licensing proof</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">✓</span>
                <span className="text-sm text-gray-700">Delivery confirmation (images, documents)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">✓</span>
                <span className="text-sm text-gray-700">Manipulation detection alerts</span>
              </li>
            </ul>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                <strong>Use cases:</strong> Digital downloads, course delivery, NFTs, media licensing, IP protection
              </p>
            </div>
          </div>

          {/* Operations Trust */}
          <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-green-100 hover:border-green-300 transition-all">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-lg mb-6 mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
              Operations Trust
            </h3>

            <p className="text-gray-600 mb-6 text-center">
              Tamper-proof records of incidents, policies, and compliance events
            </p>

            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span className="text-sm text-gray-700">Security incident documentation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span className="text-sm text-gray-700">Policy version tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span className="text-sm text-gray-700">Compliance audit trails</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span className="text-sm text-gray-700">SLA & uptime proof</span>
              </li>
            </ul>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                <strong>Use cases:</strong> SOC 2, PCI compliance, incident response, change management, SLA monitoring
              </p>
            </div>
          </div>
        </div>

        {/* Receipt Graph Explanation */}
        <div className="mt-12 bg-white rounded-xl p-8 border-2 border-gray-200">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Connected by Receipt Graph
            </h3>
            <p className="text-gray-600">
              Link receipts across all three products to create complete evidence chains
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-900 mb-2">Example: E-Commerce</p>
              <p className="text-gray-600 text-xs">
                Transaction receipt ($500 payment) → Content receipt (delivery photo) → Operations receipt (delivery confirmation)
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-900 mb-2">Example: SaaS Security</p>
              <p className="text-gray-600 text-xs">
                Operations receipt (incident detected) → Content receipt (evidence collected) → Transaction receipt (credit issued)
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-900 mb-2">Example: Content Platform</p>
              <p className="text-gray-600 text-xs">
                Content receipt (original upload) → Transaction receipt (license sold) → Operations receipt (usage logged)
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            <strong>Remember:</strong> All three products are included in every tier.
            <br />
            No hidden fees. No add-ons. No surprises.
          </p>
        </div>
      </div>
    </section>
  );
}
