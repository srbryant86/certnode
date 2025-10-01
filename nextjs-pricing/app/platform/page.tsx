import { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ReceiptGraph from '@/components/ReceiptGraph';
import PlatformPillars from '@/components/PlatformPillars';
import PlatformBenefits from '@/components/PlatformBenefits';
import PlatformStats from '@/components/PlatformStats';
import CompetitorComparison from '@/components/CompetitorComparison';

export const metadata: Metadata = {
  title: 'Platform — CertNode Cryptographic Receipt Infrastructure',
  description: 'Cryptographic verification infrastructure for transactions, content authenticity, and operational compliance. Cross-domain receipt graph with tamper-evident audit trails.',
  openGraph: {
    title: 'Platform — CertNode Cryptographic Receipt Infrastructure',
    description: 'Enterprise cryptographic receipt platform with cross-domain verification. Connect transactions, content, and operations in one system.',
    type: 'website',
    url: 'https://certnode.io/platform',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Platform — CertNode',
    description: 'Cryptographic verification infrastructure with cross-domain receipt graph.',
  },
};

export default function PlatformPage() {
  return (
    <>
      <Navigation />

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Cryptographic Receipt Platform
              </h1>

              <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto mb-8 leading-relaxed">
                Cryptographic verification infrastructure for transactions, content authenticity, and operational compliance
              </p>

              <div className="flex flex-wrap justify-center gap-4 mb-10">
                <div className="bg-blue-500/20 border border-blue-400/30 text-blue-100 px-6 py-3 rounded-full text-sm font-medium">
                  🔐 Transaction Receipts
                </div>
                <div className="bg-blue-500/20 border border-blue-400/30 text-blue-100 px-6 py-3 rounded-full text-sm font-medium">
                  📄 Content Certification
                </div>
                <div className="bg-blue-500/20 border border-blue-400/30 text-blue-100 px-6 py-3 rounded-full text-sm font-medium">
                  ✅ Operations Attestation
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <a
                  href="/pricing"
                  className="bg-white text-blue-700 hover:bg-gray-100 px-10 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-2xl inline-block"
                >
                  View Pricing →
                </a>
                <p className="text-blue-200 text-sm">
                  Cryptographic infrastructure for enterprise verification
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Pillars */}
        <PlatformPillars />

        {/* Benefits Section */}
        <PlatformBenefits />

        {/* Stats Section */}
        <PlatformStats />

        {/* Competitor Comparison */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <CompetitorComparison />
          </div>
        </section>

        {/* Receipt Graph */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <ReceiptGraph />
          </div>
        </section>

        {/* Technical Documentation CTA */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Technical Documentation
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Deep dive into the cryptographic architecture, API specifications, and implementation details of the Receipt Graph.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/pricing"
                className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-lg"
              >
                View Pricing
              </a>
              <a
                href="/"
                className="bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg font-semibold text-lg transition-all"
              >
                Read Documentation
              </a>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Cryptographic verification infrastructure for enterprise-grade transaction security and compliance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/pricing"
                className="bg-white text-blue-700 hover:bg-gray-100 px-10 py-4 rounded-lg font-bold text-lg transition-all shadow-2xl"
              >
                View Pricing
              </a>
              <a
                href="/"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-10 py-4 rounded-lg font-bold text-lg transition-all"
              >
                Documentation
              </a>
            </div>
            <p className="text-blue-200 text-sm mt-6">
              Enterprise infrastructure • Cryptographic security • SOC 2 ready
            </p>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}