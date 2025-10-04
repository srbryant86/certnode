import { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import TrustBadges from '@/components/TrustBadges';
import ThreeProductShowcase from '@/components/ThreeProductShowcase';
import ReceiptGraphMultiMode from '@/components/ReceiptGraphMultiMode';

export const metadata: Metadata = {
  title: 'CertNode — Universal Receipt Protocol for Transactions, Content & Operations',
  description: 'The only platform that cryptographically links payments, content, and operations in one DAG. Turnkey integrations for Shopify, Stripe, Kajabi. <15 min setup. 60-day guarantee.',
  keywords: 'cryptographic receipts, chargeback defense, content authenticity, AI detection, compliance automation, SOC 2, HIPAA, receipt graph',
  openGraph: {
    title: 'CertNode — Universal Receipt Protocol',
    description: 'Prove what happened across payments, content, and operations with cryptographic receipts.',
    type: 'website',
    url: 'https://certnode.io',
  },
};

export default function HomePage() {
  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white py-24 md:py-32">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-5xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
                <span className="text-sm font-semibold text-white">🚀 NEW:</span>
                <span className="text-sm text-blue-100">Turnkey integrations for Shopify, Stripe, Kajabi • Setup in &lt;15 min</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                The Universal Receipt Protocol
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-4 leading-relaxed">
                Cryptographically link <span className="font-semibold text-white">payments</span>, <span className="font-semibold text-white">content</span>, and <span className="font-semibold text-white">operations</span> in one tamper-proof graph.
              </p>
              <p className="text-lg md:text-xl text-blue-200 mb-10 leading-relaxed">
                The only platform that connects all three domains. Win chargebacks, prove authenticity, automate compliance—all from a single API.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mb-10 max-w-2xl">
                <div>
                  <div className="text-4xl md:text-5xl font-bold mb-1">Crypto</div>
                  <div className="text-sm text-blue-200">Tamper-proof evidence</div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-bold mb-1">&lt;15min</div>
                  <div className="text-sm text-blue-200">Turnkey setup</div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-bold mb-1">100%</div>
                  <div className="text-sm text-blue-200">Compliance ready</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/pricing"
                  className="bg-white text-blue-700 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-all text-center shadow-xl"
                >
                  View Pricing →
                </Link>
                <Link
                  href="/platform"
                  className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-lg font-semibold text-lg transition-all text-center"
                >
                  See How It Works
                </Link>
              </div>

              {/* Integration Badges */}
              <div className="mt-12 pt-8 border-t border-white/20">
                <p className="text-sm text-blue-200 mb-4 uppercase tracking-wide font-semibold">Turnkey Integrations</p>
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-sm font-semibold">
                    🛒 Shopify
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-sm font-semibold">
                    💳 Stripe
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-sm font-semibold">
                    🎓 Kajabi
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-sm font-semibold">
                    📦 Shippo
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-sm font-semibold">
                    🔧 REST API
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-8 bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <TrustBadges />
          </div>
        </section>

        {/* Three Products Showcase */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <ThreeProductShowcase />
          </div>
        </section>

        {/* Receipt Graph Demo */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-2 mb-4 text-sm font-semibold">
                THE CERTNODE DIFFERENCE
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Cross-Domain Receipt Graph
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                No competitor links payments, content, and operations in one cryptographic DAG. This is your moat.
              </p>
            </div>
            <ReceiptGraphMultiMode />
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Real Businesses. Real Results.
              </h2>
              <p className="text-xl text-gray-600">
                See how CertNode protects revenue and automates compliance
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* E-Commerce */}
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 border border-blue-100 hover:shadow-xl transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">🛒</div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">E-Commerce</h3>
                    <p className="text-sm text-gray-600">Shopify • Stripe • Shippo</p>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="text-3xl font-bold text-blue-600 mb-1">&lt;30s</div>
                  <div className="text-sm text-gray-600">Evidence generation time</div>
                </div>
                <p className="text-gray-700 mb-6">
                  <strong>Before:</strong> Manual evidence gathering, $50K/month lost to chargebacks<br/>
                  <strong>After:</strong> Automatic receipt graph links orders {'→'} shipments {'→'} delivery. Chargeback defenses generate in {'<'}30 seconds.
                </p>
                <div className="bg-white rounded-lg p-4 border border-gray-200 font-mono text-xs">
                  Order #12345 ($199)<br/>
                  {'└─>'} Shippo Label<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;{'└─>'} FedEx Delivery<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{'└─>'} Photo Proof<br/>
                  <span className="text-green-600">✓ Chargeback denied</span>
                </div>
              </div>

              {/* High-Ticket Courses */}
              <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-8 border border-purple-100 hover:shadow-xl transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">🎓</div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">High-Ticket Courses</h3>
                    <p className="text-sm text-gray-600">Kajabi • Teachable</p>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="text-3xl font-bold text-purple-600 mb-1">$180K</div>
                  <div className="text-sm text-gray-600">Annual refund fraud prevented</div>
                </div>
                <p className="text-gray-700 mb-6">
                  <strong>Before:</strong> Students complete 90% of course, then claim "no value"<br/>
                  <strong>After:</strong> Purchase {'→'} 47 logins {'→'} 12 lessons {'→'} completion. Cryptographic proof of engagement defeats refund requests.
                </p>
                <div className="bg-white rounded-lg p-4 border border-gray-200 font-mono text-xs">
                  Payment ($5,000)<br/>
                  {'└─>'} 47 logins<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;{'└─>'} 12 lessons viewed<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;{'└─>'} Course completed<br/>
                  <span className="text-red-600">✗ Refund denied</span>
                </div>
              </div>

              {/* SaaS Compliance */}
              <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-8 border border-green-100 hover:shadow-xl transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">💻</div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">SaaS Compliance</h3>
                    <p className="text-sm text-gray-600">SOC 2 • ISO 27001 • GDPR</p>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="text-3xl font-bold text-green-600 mb-1">120 hrs</div>
                  <div className="text-sm text-gray-600">Saved per audit (annual)</div>
                </div>
                <p className="text-gray-700 mb-6">
                  <strong>Before:</strong> 3-week manual evidence gathering for SOC 2<br/>
                  <strong>After:</strong> Automatic audit trails for access, changes, deployments. Export compliance pack in 5 minutes.
                </p>
                <div className="bg-white rounded-lg p-4 border border-gray-200 text-sm">
                  <div className="font-semibold mb-2">Audit Trail (Last 90 days):</div>
                  <div className="space-y-1 text-xs font-mono">
                    <div>✓ 1,247 access logs</div>
                    <div>✓ 89 configuration changes</div>
                    <div>✓ 45 deployments</div>
                    <div className="text-green-600 font-bold">100% verifiable</div>
                  </div>
                </div>
              </div>

              {/* Content Creators */}
              <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-8 border border-orange-100 hover:shadow-xl transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">📸</div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Content Creators</h3>
                    <p className="text-sm text-gray-600">AI Detection • C2PA</p>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="text-3xl font-bold text-orange-600 mb-1">95%</div>
                  <div className="text-sm text-gray-600">AI detection accuracy</div>
                </div>
                <p className="text-gray-700 mb-6">
                  <strong>Before:</strong> DMCA takedown claims, "AI-generated" accusations<br/>
                  <strong>After:</strong> Upload {'→'} C2PA signature {'→'} Blockchain anchor. Prove authenticity with cryptographic timestamp.
                </p>
                <div className="bg-white rounded-lg p-4 border border-gray-200 text-sm">
                  <div className="font-semibold mb-2">Content Receipt:</div>
                  <div className="space-y-1 text-xs font-mono">
                    <div>📷 Original capture: Canon EOS R5</div>
                    <div>🔐 Hash: sha256:abc...</div>
                    <div>⏰ Timestamp: 2025-10-03</div>
                    <div className="text-green-600 font-bold">✓ Authentic, unedited</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/solutions"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all"
              >
                See All Use Cases →
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <span className="text-sm font-semibold">✓ 60-Day Money-Back Guarantee</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start Building with Cryptographic Receipts
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              All plans include access to all three products. 60-day money-back guarantee.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 pt-12 border-t border-white/20">
              <div>
                <div className="text-5xl font-bold mb-2">$0</div>
                <div className="text-blue-200">Setup cost • No credit card required</div>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2">&lt;15min</div>
                <div className="text-blue-200">Time to first receipt with turnkey integrations</div>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2">∞</div>
                <div className="text-blue-200">Receipt graph depth (Enterprise)</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
