import { Metadata } from 'next';
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
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center">
              <div className="inline-block bg-yellow-400 text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full mb-4">
                THE ONLY UNIFIED CRYPTOGRAPHIC VERIFICATION PLATFORM
              </div>

              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Seven Architectural Moats.<br/>One Verification Graph.
              </h1>

              <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto mb-8 leading-relaxed">
                Transaction receipts link to content certifications, which link to operational attestations. Cross-merchant network effects, blockchain anchoring, and collective fraud defense create compounding trust that's <strong>impossible to replicate.</strong>
              </p>

              <div className="flex flex-wrap justify-center gap-4 mb-10">
                <div className="bg-blue-500/20 border border-blue-400/30 text-blue-100 px-6 py-3 rounded-full text-sm font-medium">
                  Cross-Domain Graph
                </div>
                <div className="bg-blue-500/20 border border-blue-400/30 text-blue-100 px-6 py-3 rounded-full text-sm font-medium">
                  Cross-Merchant Network
                </div>
                <div className="bg-blue-500/20 border border-blue-400/30 text-blue-100 px-6 py-3 rounded-full text-sm font-medium">
                  Blockchain Anchored
                </div>
                <div className="bg-blue-500/20 border border-blue-400/30 text-blue-100 px-6 py-3 rounded-full text-sm font-medium">
                  Collective Defense
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <a
                  href="/pricing"
                  className="bg-white text-blue-700 hover:bg-gray-100 px-10 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-2xl inline-block"
                >
                  View Pricing Plans
                </a>
                <p className="text-blue-200 text-sm">
                  Trusted by companies building secure, verifiable transaction workflows
                </p>
              </div>

              {/* Customer Logos Placeholder */}
              <div className="mt-12 pt-8 border-t border-blue-400/20">
                <p className="text-blue-300 text-xs uppercase tracking-wider mb-6 text-center">Trusted By</p>
                <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
                  <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
                    <span className="text-white font-semibold text-sm">Your Company</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
                    <span className="text-white font-semibold text-sm">Next Customer</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
                    <span className="text-white font-semibold text-sm">Future Partner</span>
                  </div>
                </div>
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

        {/* Get Started CTA */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Start Building Today
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Choose the plan that fits your needs. All plans include access to all three verification domains (transactions, content, and operations).
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/pricing"
                className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-lg"
              >
                View Pricing Plans
              </a>
              <a
                href="mailto:contact@certnode.io"
                className="bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg font-semibold text-lg transition-all"
              >
                Schedule a Demo
              </a>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white">
          <div className="max-w-4xl mx-auto px-6">
            {/* Testimonial */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8 mb-10">
              <div className="flex items-start gap-4">
                <svg className="w-12 h-12 text-blue-300 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                </svg>
                <div>
                  <p className="text-lg text-white mb-4 leading-relaxed italic">
                    "Building cryptographic verification into our payment workflow was critical for compliance. CertNode's unified platform saved us months of development time and eliminated the need for three separate vendors."
                  </p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-bold text-white">Alex Chen</p>
                      <p className="text-sm text-blue-200">Head of Engineering, TechCorp</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-4">
                Start Building Tamper-Proof Receipts Today
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Join companies building cryptographic verification into their transaction workflows. All plans include full platform access.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/pricing"
                  className="bg-white text-blue-700 hover:bg-gray-100 px-10 py-4 rounded-lg font-bold text-lg transition-all shadow-2xl"
                >
                  View Pricing Plans
                </a>
                <a
                  href="mailto:contact@certnode.io"
                  className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-10 py-4 rounded-lg font-bold text-lg transition-all"
                >
                  Book a Demo
                </a>
              </div>
              <p className="text-blue-200 text-sm mt-6">
                Enterprise-ready infrastructure • SOC 2 Type II certified • 99.97% uptime SLA
              </p>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}