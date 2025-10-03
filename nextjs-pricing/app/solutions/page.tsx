import { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Solutions — CertNode',
  description: 'Cryptographic receipt solutions for e-commerce, SaaS platforms, content creators, and regulated industries. Reduce disputes, automate compliance, and prove authenticity.',
};

export default function SolutionsPage() {
  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Solutions for Every Business
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
                Cryptographic receipts adapt to your industry. From reducing chargebacks to automating compliance, see how CertNode fits your workflow.
              </p>
            </div>
          </div>
        </section>

        {/* E-Commerce & High-Ticket Sales */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  E-Commerce & High-Ticket Sales
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Defend Against Chargebacks with Verifiable Proof
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Link payment receipts to delivery confirmations and product photos. When disputes happen, submit cryptographic evidence proving fulfillment.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-xl">✓</span>
                    <div>
                      <strong className="text-gray-900">Transaction Receipts:</strong>
                      <span className="text-gray-600"> Cryptographic proof of payments and refunds</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-xl">✓</span>
                    <div>
                      <strong className="text-gray-900">Content Receipts:</strong>
                      <span className="text-gray-600"> Shipping labels, delivery photos, signed confirmations</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-xl">✓</span>
                    <div>
                      <strong className="text-gray-900">Operations Receipts:</strong>
                      <span className="text-gray-600"> Tracking logs, customer interactions, access records</span>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-xl p-8 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h3>
                <div className="space-y-4 text-gray-700">
                  <div>
                    <p className="font-semibold text-gray-900">Physical Products</p>
                    <p className="text-sm text-gray-600">Link payment → shipping label → delivery photo → signature</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Digital Products</p>
                    <p className="text-sm text-gray-600">Link payment → download confirmation → access logs → usage data</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">High-Ticket Services</p>
                    <p className="text-sm text-gray-600">Link payment → session recordings → file deliveries → completion confirmations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SaaS & Platforms */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="bg-white rounded-xl p-8 border-2 border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Compliance Benefits</h3>
                  <div className="space-y-4 text-gray-700">
                    <div>
                      <p className="font-semibold text-gray-900">SOC 2 Evidence</p>
                      <p className="text-sm text-gray-600">Automated audit trails for access controls and change management</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">HIPAA Logs</p>
                      <p className="text-sm text-gray-600">Tamper-proof records of who accessed what data and when</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">SOX Documentation</p>
                      <p className="text-sm text-gray-600">Financial transaction trails with cryptographic verification</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  SaaS & Platforms
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Automate Compliance Evidence Collection
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Generate tamper-proof audit trails for every access, change, and transaction. Reduce compliance audit time from weeks to days.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-xl">✓</span>
                    <div>
                      <strong className="text-gray-900">Operations Receipts:</strong>
                      <span className="text-gray-600"> Access logs, configuration changes, admin actions</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-xl">✓</span>
                    <div>
                      <strong className="text-gray-900">Transaction Receipts:</strong>
                      <span className="text-gray-600"> Billing events, subscription changes, payment processing</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-xl">✓</span>
                    <div>
                      <strong className="text-gray-900">Content Receipts:</strong>
                      <span className="text-gray-600"> User-generated content verification, document authenticity</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Content Creators & Media */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  Content Creators & Media
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Prove Content is Authentic and Unedited
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Defend against AI deepfake accusations with C2PA-based verification. Show exactly when content was created and if it's been altered.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-xl">✓</span>
                    <div>
                      <strong className="text-gray-900">Content Receipts:</strong>
                      <span className="text-gray-600"> AI detection, tamper verification, provenance tracking</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-xl">✓</span>
                    <div>
                      <strong className="text-gray-900">Operations Receipts:</strong>
                      <span className="text-gray-600"> Publishing timestamps, blockchain anchoring, distribution logs</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-xl">✓</span>
                    <div>
                      <strong className="text-gray-900">Transaction Receipts:</strong>
                      <span className="text-gray-600"> Monetization tracking, licensing verification, revenue proof</span>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-xl p-8 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Content Protection</h3>
                <div className="space-y-4 text-gray-700">
                  <div>
                    <p className="font-semibold text-gray-900">Bodycam Footage</p>
                    <p className="text-sm text-gray-600">Prove video hasn't been edited since capture</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Photography</p>
                    <p className="text-sm text-gray-600">Verify images are authentic and not AI-generated</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Journalism</p>
                    <p className="text-sm text-gray-600">Establish chain of custody for investigative materials</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Healthcare & Finance */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="bg-white rounded-xl p-8 border-2 border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Regulatory Requirements</h3>
                  <div className="space-y-4 text-gray-700">
                    <div>
                      <p className="font-semibold text-gray-900">HIPAA Compliance</p>
                      <p className="text-sm text-gray-600">Immutable logs of patient data access and modifications</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Financial Audits</p>
                      <p className="text-sm text-gray-600">Cryptographic proof of transactions and approvals</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Investigations</p>
                      <p className="text-sm text-gray-600">Tamper-evident evidence chains for legal proceedings</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="inline-block bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  Healthcare & Finance
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Meet Regulatory Requirements with Immutable Logs
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Create audit trails that regulators trust. Every access, transaction, and change is cryptographically verified and impossible to alter retroactively.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-xl">✓</span>
                    <div>
                      <strong className="text-gray-900">Operations Receipts:</strong>
                      <span className="text-gray-600"> Patient access logs, financial approvals, system changes</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-xl">✓</span>
                    <div>
                      <strong className="text-gray-900">Content Receipts:</strong>
                      <span className="text-gray-600"> Medical imaging verification, document authenticity</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-xl">✓</span>
                    <div>
                      <strong className="text-gray-900">Transaction Receipts:</strong>
                      <span className="text-gray-600"> Payment processing, insurance claims, billing records</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              All plans include access to transaction, content, and operations receipts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pricing"
                className="bg-white text-blue-700 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-all"
              >
                View Pricing
              </Link>
              <Link
                href="/platform"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-lg font-semibold text-lg transition-all"
              >
                See How It Works
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
