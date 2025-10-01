import { Metadata } from 'next';
import ReceiptGraphDemo from '@/components/ReceiptGraphDemo';

export const metadata: Metadata = {
  title: 'Platform — CertNode Receipt Graph',
  description: 'The only platform connecting transactions, content, and operations in one cryptographic graph',
};

export default function PlatformsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
            THE CERTNODE DIFFERENCE
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            The Only Platform That Connects Everything
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlike competitors who handle only transactions OR content OR operations,
            CertNode creates a cryptographically-linked graph connecting all three.
          </p>
        </div>

        {/* Receipt Graph Demo */}
        <div className="mb-20">
          <ReceiptGraphDemo />
        </div>

        {/* Additional Platform Features */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Enterprise-Ready Infrastructure</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Built for scale, security, and compliance from day one.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Custom Enterprise Solutions</h2>
            <ul className="space-y-3 text-gray-700 mb-6">
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span>Dedicated infrastructure and SLA guarantees</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span>Custom API integrations and white-label solutions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span>Advanced compliance reporting and audit trails</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span>24/7 enterprise support and technical assistance</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">High-Volume Processing</h2>
            <ul className="space-y-3 text-gray-700 mb-6">
              <li className="flex items-start gap-3">
                <span className="text-blue-500 text-xl">⚡</span>
                <span>Process millions of receipts per month</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500 text-xl">⚡</span>
                <span>Sub-second receipt generation and validation</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500 text-xl">⚡</span>
                <span>Horizontal scaling and load balancing</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500 text-xl">⚡</span>
                <span>Geographic distribution and data residency</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Enterprise Contact Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready for Enterprise-Grade Deterministic Proof?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              Contact our team to discuss Core Trust enterprise licensing, Platform editions for marketplaces, and optional Advisory Intelligence add-ons.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:contact@certnode.io"
                className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Contact Enterprise Sales
              </a>
              <a
                href="/pricing"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg font-semibold text-lg transition-all"
              >
                View Core Trust Plans
              </a>
            </div>
          </div>
        </section>

        <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready for Enterprise Scale?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Contact our enterprise team to discuss custom solutions, volume pricing, and implementation timelines for your organization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:enterprise@certnode.io"
              className="bg-white text-blue-700 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              Contact Enterprise Sales
            </a>
            <a
              href="/pricing"
              className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-lg font-semibold text-lg transition-all"
            >
              View Standard Plans
            </a>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600">
            Technical research platform for cryptographic compliance infrastructure development and testing.
          </p>
        </div>
      </div>
    </div>
  );
}