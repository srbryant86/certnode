import { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'CertNode — Cryptographic Receipt Infrastructure',
  description: 'Verify transactions, content, and operations with cryptographic receipts. Reduce disputes, automate compliance, and prove authenticity.',
};

export default function HomePage() {
  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Cryptographic Receipts for Transactions, Content, and Operations
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
                One platform to verify payments, prove content authenticity, and create tamper-proof operational logs. Reduce disputes, automate compliance, and protect your business.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/pricing"
                  className="bg-white text-blue-700 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-all text-center"
                >
                  View Pricing
                </Link>
                <Link
                  href="/platform"
                  className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-lg font-semibold text-lg transition-all text-center"
                >
                  See How It Works
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Three Products */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Three Products. One Platform.
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Cryptographic verification for every part of your business
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Transaction Receipts */}
              <div className="bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-blue-500 transition-all">
                <div className="text-4xl mb-4">💳</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Transaction Receipts
                </h3>
                <p className="text-gray-600 mb-6">
                  Cryptographic proof of payments, refunds, and financial transactions. Reduce chargebacks by 70% with verifiable evidence.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Payment verification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Chargeback defense</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Refund tracking</span>
                  </li>
                </ul>
              </div>

              {/* Content Receipts */}
              <div className="bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-blue-500 transition-all">
                <div className="text-4xl mb-4">📸</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Content Receipts
                </h3>
                <p className="text-gray-600 mb-6">
                  Prove content authenticity and detect AI manipulation. C2PA-based verification for images, videos, and documents.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>AI detection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Tamper verification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Content provenance</span>
                  </li>
                </ul>
              </div>

              {/* Operations Receipts */}
              <div className="bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-blue-500 transition-all">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Operations Receipts
                </h3>
                <p className="text-gray-600 mb-6">
                  Tamper-proof logs for compliance, audits, and security. Automate SOC 2, HIPAA, and SOX evidence collection.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Audit trails</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Compliance automation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Access logs</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Built for Modern Businesses
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 rounded-xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-3">E-Commerce & High-Ticket Sales</h3>
                <p className="text-gray-600">
                  Defend against chargebacks with linked payment, delivery, and confirmation receipts. Prove fulfillment with cryptographic evidence.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-3">SaaS & Platforms</h3>
                <p className="text-gray-600">
                  Automate SOC 2 and compliance evidence collection. Generate tamper-proof audit trails for every access and change.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Content Creators & Media</h3>
                <p className="text-gray-600">
                  Prove content is authentic and unedited. Defend against AI deepfake accusations with C2PA verification.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Healthcare & Finance</h3>
                <p className="text-gray-600">
                  Meet HIPAA and regulatory requirements with cryptographic audit logs. Immutable evidence for investigations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start Building with Cryptographic Receipts
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              All plans include access to all three products.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pricing"
                className="bg-white text-blue-700 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-all"
              >
                View Pricing
              </Link>
              <a
                href="mailto:contact@certnode.io"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-lg font-semibold text-lg transition-all"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
