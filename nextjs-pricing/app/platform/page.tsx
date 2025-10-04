import { Metadata } from 'next';
import Footer from '@/components/Footer';
import ReceiptGraphMultiMode from '@/components/ReceiptGraphMultiMode';
import PlatformPillars from '@/components/PlatformPillars';
import PlatformBenefits from '@/components/PlatformBenefits';
import PlatformStats from '@/components/PlatformStats';
import CompetitorComparison from '@/components/CompetitorComparison';

import { SLA_UPTIME } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Platform — CertNode Cryptographic Receipt Infrastructure',
  description: 'Cryptographic verification infrastructure for transactions, content authenticity, and operational compliance. Cross-domain receipt graph with tamper-evident audit trails. Content certification API for YouTube, Instagram, Getty Images.',
  keywords: 'cryptographic receipts, content certification, C2PA, provenance proof, platform API, YouTube verification, Instagram authenticity, cross-domain verification, tamper detection',
  openGraph: {
    title: 'Platform — CertNode Cryptographic Receipt Infrastructure',
    description: 'Enterprise cryptographic receipt platform with cross-domain verification. Connect transactions, content, and operations in one system. Platform API for content certification.',
    type: 'website',
    url: 'https://certnode.io/platform',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Platform — CertNode',
    description: 'Cryptographic verification infrastructure with cross-domain receipt graph and content certification API.',
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
                Four Compounding Advantages.<br/>One Verification Graph.
              </h1>

              <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto mb-8 leading-relaxed">
                Transaction receipts link to content certifications, which link to operational attestations. Cross-merchant network effects, blockchain anchoring, and collective fraud defense create compounding trust that&apos;s <strong>impossible to replicate.</strong>
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

        {/* Deterministic Verification Badge */}
        <section className="py-8 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 text-center">
              <div className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold mb-3">
                THE CERTNODE DIFFERENCE
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Deterministic by Design
              </h3>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
                Receipts <strong>verify or they don&apos;t</strong> — no scoring, no black boxes, no vendor round-trip.
                Cryptographic proof is binary and offline-verifiable. Unlike ML-based fraud detection (Stripe Radar),
                our verification is mathematically provable and doesn&apos;t require trusting CertNode&apos;s servers.
              </p>
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

        {/* Content Certification */}
        <section className="py-20 bg-gradient-to-br from-orange-50 to-purple-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 rounded-full px-4 py-2 mb-4 text-sm font-semibold">
                🚀 CONTENT CERTIFICATION
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Platform Verification API
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Cryptographic content verification for YouTube, Instagram, TikTok, Getty Images, and more. Prove provenance at scale.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Hardware-Backed Provenance Proof
                </h3>
                <p className="text-gray-700 mb-6">
                  As AI floods the internet with synthetic content, <strong>cryptographic proof of provenance</strong> becomes essential. Our Platform API verifies content authenticity via device signatures (C2PA), pixel-perfect tamper detection, and chain of custody tracking.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span className="text-gray-700">Device-level verification (Canon, Sony, iPhone)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span className="text-gray-700">Tamper detection (1 pixel change breaks signature)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span className="text-gray-700">C2PA standard compliance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span className="text-gray-700">Real-time verification at billions/month scale</span>
                  </li>
                </ul>
                <a
                  href="/platform-api"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                >
                  View API Documentation →
                </a>
              </div>
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
                <div className="text-xs text-gray-400 mb-2">API Response Example</div>
                <pre className="text-sm overflow-x-auto text-green-400">
{`{
  "verified": true,
  "provenance": {
    "device": "Canon EOS R5",
    "capture_time": "2025-10-03T12:00:00Z",
    "chain": [
      "capture",
      "upload",
      "publish"
    ],
    "tampered": false,
    "c2pa_compliant": true
  }
}`}
                </pre>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="text-3xl mb-3">📹</div>
                <h4 className="font-bold text-gray-900 mb-2">For Platforms</h4>
                <p className="text-sm text-gray-600">
                  YouTube, Instagram, TikTok verify content authenticity. Combat deepfakes and AI-generated fraud.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="text-3xl mb-3">👨‍🎨</div>
                <h4 className="font-bold text-gray-900 mb-2">For Creators</h4>
                <p className="text-sm text-gray-600">
                  Photographers and videographers prove authenticity. Command 3-10x premium for verified content.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="text-3xl mb-3">🖼️</div>
                <h4 className="font-bold text-gray-900 mb-2">For Marketplaces</h4>
                <p className="text-sm text-gray-600">
                  Getty Images, Shutterstock create premium tiers for CertNode-verified authentic content.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Receipt Graph */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <ReceiptGraphMultiMode />
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
            {/* Value Proposition */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8 mb-10">
              <h3 className="text-2xl font-bold text-white mb-4">Built for Engineering Teams</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-300 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <p className="text-white leading-relaxed">
                    <strong>One API</strong> instead of three separate vendors for transactions, content, and operations
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-300 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <p className="text-white leading-relaxed">
                    <strong>Compliance-ready</strong> with automated SOX/SOC 2/HIPAA evidence collection
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-300 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <p className="text-white leading-relaxed">
                    <strong>Cryptographically verifiable</strong> receipts that work offline without trusting CertNode
                  </p>
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
                Enterprise-ready infrastructure • SOC 2 readiness • {SLA_UPTIME} uptime SLA
              </p>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}