import { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import TechnicalSupportAgent from '@/components/TechnicalSupportAgent';

export const metadata: Metadata = {
  title: 'Support - CertNode',
  description: 'Get help with CertNode cryptographic receipts. Documentation, API references, and direct contact for technical support.',
};

export default function SupportPage() {
  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                How Can We Help?
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
                Get the support you need to integrate cryptographic receipts into your workflow.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Options */}

        <section className="py-16 bg-gray-50">

          <div className="max-w-7xl mx-auto px-6">

            <div className="grid md:grid-cols-3 gap-8">

              {/* Email Support */}

              <div className="bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-blue-500 transition-all">

                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-3">Direct support</p>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">

                  Email Support

                </h3>

                <p className="text-gray-600 mb-6">

                  Reach out for technical questions, billing inquiries, or general support.

                </p>

                <a

                  href="mailto:contact@certnode.io"

                  className="inline-block bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-all"

                >

                  contact@certnode.io

                </a>

              </div>

              {/* Sales Inquiries */}

              <div className="bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-blue-500 transition-all">

                <p className="text-xs font-semibold uppercase tracking-wide text-purple-600 mb-3">Enterprise sales</p>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">

                  Sales & Demos

                </h3>

                <p className="text-gray-600 mb-6">

                  Schedule a demo or discuss enterprise pricing for your team.

                </p>

                <a

                  href="mailto:contact@certnode.io?subject=Sales%20Inquiry"

                  className="inline-block bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-all"

                >

                  Schedule a Demo

                </a>

              </div>

              {/* Documentation */}

              <div className="bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-blue-500 transition-all">

                <p className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-3">Self-serve docs</p>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">

                  Documentation

                </h3>

                <p className="text-gray-600 mb-6">

                  API references, integration guides, and technical documentation.

                </p>

                <Link

                  href="/platform"

                  className="inline-block bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-all"

                >

                  View Platform Docs

                </Link>

              </div>

            </div>

          </div>

        </section>

        {/* Technical Support Agent */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 text-center md:text-left">
              Get Technical Support
            </h2>
            <p className="text-gray-600 text-base md:text-lg mb-10 text-center md:text-left">
              Ask about receipt creation, graph structures, API integration, troubleshooting, or any technical question. Our AI agent has deep knowledge of CertNode and can escalate to our support team when needed.
            </p>
            <TechnicalSupportAgent />
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              {/* Question 1 */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  What products does CertNode offer?
                </h3>
                <p className="text-gray-600">
                  CertNode provides three cryptographic receipt products: Transaction Receipts (payments, refunds), Content Receipts (AI detection, media verification), and Operations Receipts (audit logs, compliance). All plans include access to all three products.
                </p>
              </div>

              {/* Question 2 */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  How do cryptographic receipts work?
                </h3>
                <p className="text-gray-600">
                  Each receipt contains a cryptographic hash of your transaction, content, or operation. This hash is signed and can be verified offline without trusting CertNode&apos;s servers. Receipts can link to each other, creating a verifiable chain of events.
                </p>
              </div>

              {/* Question 3 */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  What&apos;s the difference between Core Trust and Platform Edition?
                </h3>
                <p className="text-gray-600">
                  Core Trust plans are designed for individual businesses to protect their own operations. Platform Edition is for platforms and marketplaces that need to provide cryptographic verification as a service to their merchants or users.
                </p>
              </div>

              {/* Question 4 */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Do you offer a free trial?
                </h3>
                <p className="text-gray-600">
                  We offer a 60-day money-back guarantee on all plans. If CertNode doesn&apos;t meet your needs, we&apos;ll refund your purchase in full.
                </p>
              </div>

              {/* Question 5 */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  How does pricing work?
                </h3>
                <p className="text-gray-600">
                  Core Trust plans are tiered based on monthly transaction volume (GMV). Platform Edition pricing is custom based on the number of merchants and total GMV. All pricing is transparent - see our <Link href="/pricing" className="text-blue-600 hover:underline">pricing page</Link> for details.
                </p>
              </div>

              {/* Question 6 */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Can I integrate CertNode with my existing systems?
                </h3>
                <p className="text-gray-600">
                  Yes. CertNode provides REST APIs and webhooks for integration with payment processors, content management systems, and audit log platforms. We also offer SDKs for common languages.
                </p>
              </div>

              {/* Question 7 */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Is CertNode SOC 2 compliant?
                </h3>
                <p className="text-gray-600">
                  CertNode is built to help you achieve SOC 2 compliance through automated audit trail collection. Our infrastructure follows SOC 2 best practices with 99.97% uptime SLA and enterprise-grade security.
                </p>
              </div>

              {/* Question 8 */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  What industries use CertNode?
                </h3>
                <p className="text-gray-600">
                  E-commerce, high-ticket sales, SaaS platforms, content creators, healthcare providers, financial services, and any business that needs verifiable proof of transactions, content authenticity, or operational compliance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Resources Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
              Additional Resources
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-8 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Platform Overview
                </h3>
                <p className="text-gray-600 mb-4">
                  Learn how CertNode&apos;s cross-domain receipt graph connects transactions, content, and operations.
                </p>
                <Link
                  href="/platform"
                  className="text-blue-600 hover:underline font-semibold"
                >
                  View Platform Details -&gt;
                </Link>
              </div>

              <div className="bg-white rounded-xl p-8 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Industry Solutions
                </h3>
                <p className="text-gray-600 mb-4">
                  See how cryptographic receipts solve problems in e-commerce, SaaS, content creation, and regulated industries.
                </p>
                <Link
                  href="/solutions"
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Explore Solutions -&gt;
                </Link>
              </div>

              <div className="bg-white rounded-xl p-8 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Security Practices
                </h3>
                <p className="text-gray-600 mb-4">
                  Review our security measures, data handling practices, and compliance certifications.
                </p>
                <Link
                  href="/security"
                  className="text-blue-600 hover:underline font-semibold"
                >
                  View Security -&gt;
                </Link>
              </div>

              <div className="bg-white rounded-xl p-8 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Pricing Calculator
                </h3>
                <p className="text-gray-600 mb-4">
                  Calculate potential savings from reduced chargebacks and labor costs with our ROI calculator.
                </p>
                <Link
                  href="/pricing"
                  className="text-blue-600 hover:underline font-semibold"
                >
                  View Pricing -&gt;
                </Link>
              </div>
            </div>
          </div>
        </section>
        {/* CTA */}
        <section className="py-16 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Still Have Questions?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              We&apos;re here to help. Reach out and we&apos;ll get back to you quickly.
            </p>
            <a
              href="mailto:contact@certnode.io"
              className="inline-block bg-white text-blue-700 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-all"
            >
              Contact Support
            </a>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
