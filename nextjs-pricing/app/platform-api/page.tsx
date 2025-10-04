import { Metadata } from 'next';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Platform API Documentation — CertNode',
  description: 'Content verification API for YouTube, Instagram, TikTok, Getty Images, and other platforms. Verify authenticity at scale.',
  keywords: 'content verification API, platform integration, YouTube verification, Instagram authenticity, C2PA API',
};

export default function PlatformAPIPage() {
  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Hero */}
        <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
                <span className="text-sm font-semibold">FOR PLATFORMS</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Content Verification API
              </h1>
              <p className="text-xl text-blue-100 mb-8">
                Verify content authenticity at scale. Simple REST API for YouTube, Instagram, TikTok, Getty Images, and more.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#quickstart"
                  className="bg-white text-blue-700 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-all text-center"
                >
                  Quick Start →
                </a>
                <a
                  href="mailto:contact@certnode.io?subject=Platform API Access"
                  className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-lg font-semibold text-lg transition-all text-center"
                >
                  Request API Key
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Start */}
        <section id="quickstart" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">Quick Start</h2>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">1. Get API Key</h3>
                <p className="text-gray-600 mb-4">
                  Contact us at <a href="mailto:contact@certnode.io" className="text-blue-600 hover:underline">contact@certnode.io</a> to request platform API access.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                  API-Key: certnode_live_xxxxx
                </div>
              </div>

              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">2. Make Request</h3>
                <p className="text-gray-600 mb-4">
                  Send content hash to verify authenticity.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  POST /api/verify-content
                </div>
              </div>
            </div>

            {/* API Request Example */}
            <div className="bg-gray-900 text-gray-100 rounded-xl p-8">
              <h3 className="text-xl font-bold mb-6 text-white">Request Example</h3>
              <pre className="overflow-x-auto text-sm">
{`curl -X POST https://certnode.io/api/verify-content \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer certnode_live_xxxxx" \\
  -d '{
    "content_hash": "sha256:abc123...",
    "platform": "youtube",
    "creator_id": "UC...",
    "metadata": {
      "video_id": "dQw4w9WgXcQ",
      "upload_time": "2025-10-03T12:00:00Z"
    }
  }'`}
              </pre>
            </div>
          </div>
        </section>

        {/* API Response */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">Response Format</h2>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Verified Content */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-green-600">✓</span> Verified Content
                </h3>
                <div className="bg-gray-900 text-gray-100 rounded-xl p-6">
                  <pre className="text-sm overflow-x-auto">
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
    "signature": "ES256:...",
    "c2pa_compliant": true,
    "platform_verified_at": "2025-10-03T14:30:00Z",
    "platform_id": "youtube"
  }
}`}
                  </pre>
                </div>
              </div>

              {/* Unverified Content */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-red-600">✗</span> Unverified Content
                </h3>
                <div className="bg-gray-900 text-gray-100 rounded-xl p-6">
                  <pre className="text-sm overflow-x-auto">
{`{
  "verified": false,
  "provenance": null,
  "error": "Content hash not found in CertNode verification database"
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Provenance Fields */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">Provenance Fields</h2>

            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Field</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Description</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-mono text-sm">device</td>
                    <td className="py-3 px-4">string</td>
                    <td className="py-3 px-4">Hardware device used to capture content (e.g., "Canon EOS R5")</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-mono text-sm">capture_time</td>
                    <td className="py-3 px-4">ISO 8601</td>
                    <td className="py-3 px-4">Timestamp when content was captured</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-mono text-sm">chain</td>
                    <td className="py-3 px-4">string[]</td>
                    <td className="py-3 px-4">Provenance chain events (e.g., ["capture", "upload", "publish"])</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-mono text-sm">tampered</td>
                    <td className="py-3 px-4">boolean</td>
                    <td className="py-3 px-4">Whether content has been modified after capture</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-mono text-sm">signature</td>
                    <td className="py-3 px-4">string</td>
                    <td className="py-3 px-4">Cryptographic signature (ES256 format)</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-mono text-sm">c2pa_compliant</td>
                    <td className="py-3 px-4">boolean</td>
                    <td className="py-3 px-4">Whether content follows C2PA standard</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">Platform Use Cases</h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-red-50 to-white rounded-xl p-8 border border-red-100">
                <div className="text-4xl mb-4">📹</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">YouTube</h3>
                <p className="text-gray-600 mb-4">
                  Badge verified creators. Show "Authentic" badge on videos with cryptographic proof of origin.
                </p>
                <div className="text-sm text-gray-500">
                  Volume: Billions of videos/month
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-8 border border-purple-100">
                <div className="text-4xl mb-4">📷</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Instagram / Meta</h3>
                <p className="text-gray-600 mb-4">
                  Verify influencer content. Combat deepfakes and AI-generated posts with real-time verification.
                </p>
                <div className="text-sm text-gray-500">
                  Volume: 100M+ posts/day
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-8 border border-orange-100">
                <div className="text-4xl mb-4">🖼️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Getty / Stock</h3>
                <p className="text-gray-600 mb-4">
                  Premium tier for verified content. Buyers pay 3-10x for CertNode-certified authentic photos.
                </p>
                <div className="text-sm text-gray-500">
                  Volume: Millions of assets
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">Platform Pricing</h2>

            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">$X per 1M</h3>
                  <p className="text-gray-600 mb-4">Volume-based pricing</p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>✓ API access</li>
                    <li>✓ Real-time verification</li>
                    <li>✓ 99.9% uptime SLA</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Pilot Program</h3>
                  <p className="text-gray-600 mb-4">Contact for pricing</p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>✓ Top 1,000 creators</li>
                    <li>✓ Dedicated support</li>
                    <li>✓ Custom integration</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                  <p className="text-gray-600 mb-4">Custom contracts</p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>✓ SLA guarantees</li>
                    <li>✓ Priority support</li>
                    <li>✓ Custom features</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <a
                href="mailto:contact@certnode.io?subject=Platform API Pilot"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all"
              >
                Request Pilot Access →
              </a>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Verify Content at Scale?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join YouTube, Instagram, and Getty Images in fighting AI-generated content fraud.
            </p>
            <a
              href="mailto:contact@certnode.io?subject=Platform Partnership"
              className="inline-flex bg-white text-blue-700 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-all"
            >
              Contact Partnerships Team
            </a>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
