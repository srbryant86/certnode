import { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Security — CertNode',
  description: 'CertNode security practices, data handling, cryptographic verification, and compliance certifications. Enterprise-grade infrastructure with 99.97% uptime.',
};

export default function SecurityPage() {
  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Security & Trust
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
                Enterprise-grade security designed for businesses that require cryptographic proof and compliance-ready infrastructure.
              </p>
            </div>
          </div>
        </section>

        {/* Core Security Principles */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Security by Design
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                CertNode is built on cryptographic principles that ensure receipts are verifiable, tamper-evident, and trustless.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-8 border-2 border-gray-200">
                <div className="text-4xl mb-4">🔐</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Cryptographic Verification
                </h3>
                <p className="text-gray-600">
                  Every receipt contains a cryptographic hash that can be verified offline. No need to trust CertNode&apos;s servers—verification is mathematically provable.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 border-2 border-gray-200">
                <div className="text-4xl mb-4">🛡️</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Tamper-Evident Logs
                </h3>
                <p className="text-gray-600">
                  Receipts are immutable once created. Any attempt to alter a receipt breaks its cryptographic signature, making tampering immediately detectable.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 border-2 border-gray-200">
                <div className="text-4xl mb-4">⚓</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Blockchain Anchoring
                </h3>
                <p className="text-gray-600">
                  Critical receipts can be anchored to public blockchains, providing independent third-party verification that&apos;s auditable by anyone.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Infrastructure Security */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
              Infrastructure & Operations
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Data Encryption
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>TLS 1.3 for all data in transit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>AES-256 encryption for data at rest</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>End-to-end encryption for sensitive operations</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Access Controls
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Multi-factor authentication (MFA) required</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Role-based access control (RBAC)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Audit logs for all access and changes</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Infrastructure Reliability
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>99.97% uptime SLA</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Multi-region redundancy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Automated backups and disaster recovery</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Security Monitoring
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>24/7 security monitoring and alerting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Regular penetration testing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Incident response procedures</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Compliance */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
              Compliance & Certifications
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-8 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  SOC 2 Ready
                </h3>
                <p className="text-gray-600">
                  Our infrastructure follows SOC 2 Type II requirements for security, availability, and confidentiality. We help you meet your compliance goals.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  GDPR Compliant
                </h3>
                <p className="text-gray-600">
                  Data processing agreements, right to deletion, data portability, and privacy-by-design principles built into our platform.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  HIPAA Support
                </h3>
                <p className="text-gray-600">
                  Business Associate Agreements (BAA) available for healthcare customers. Encrypted storage and audit trails for PHI.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  PCI DSS
                </h3>
                <p className="text-gray-600">
                  We never store payment card data. All payment processing integrations follow PCI DSS requirements.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  C2PA Standard
                </h3>
                <p className="text-gray-600">
                  Content receipts follow Coalition for Content Provenance and Authenticity (C2PA) standards for media verification.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  SOX Controls
                </h3>
                <p className="text-gray-600">
                  Tamper-proof financial transaction logs and automated evidence collection for Sarbanes-Oxley compliance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Data Handling */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
              Data Handling & Privacy
            </h2>

            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  What Data We Collect
                </h3>
                <p className="text-gray-600">
                  CertNode collects only the data necessary to generate cryptographic receipts: transaction metadata, content hashes, and operational event logs. We do not collect or store payment card information or sensitive personal data unless required for your specific use case.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Data Retention
                </h3>
                <p className="text-gray-600">
                  Receipts are retained according to your plan&apos;s retention policy (typically 7 years for compliance). You can export or delete your data at any time. Blockchain-anchored receipts remain permanently verifiable.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Data Location
                </h3>
                <p className="text-gray-600">
                  Data is stored in enterprise-grade data centers with geographic redundancy. Enterprise customers can specify data residency requirements (US, EU, or other regions).
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Data Access
                </h3>
                <p className="text-gray-600">
                  You own your data. CertNode employees have limited access only for support purposes, and all access is logged. You can export your full dataset in standard formats at any time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Deterministic Verification */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-8 text-center">
              <div className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold mb-3">
                THE CERTNODE DIFFERENCE
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Trustless Verification
              </h3>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
                Unlike fraud detection systems that require trusting a vendor&apos;s scoring algorithm, CertNode receipts are <strong>mathematically verifiable</strong>. You don&apos;t have to trust us—cryptographic proof either verifies or it doesn&apos;t. No black boxes, no vendor lock-in.
              </p>
            </div>
          </div>
        </section>

        {/* Vulnerability Reporting */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 text-center">
              Security Disclosure
            </h2>
            <div className="bg-gray-50 rounded-xl p-8 border-2 border-gray-200">
              <p className="text-gray-600 mb-4">
                If you discover a security vulnerability in CertNode, we encourage responsible disclosure. Please report security issues directly to our team.
              </p>
              <div className="bg-white rounded-lg p-6 border border-gray-300">
                <p className="text-gray-900 font-semibold mb-2">Report Security Issues:</p>
                <a
                  href="mailto:contact@certnode.io?subject=Security%20Disclosure"
                  className="text-blue-600 hover:underline font-semibold"
                >
                  contact@certnode.io
                </a>
                <p className="text-sm text-gray-500 mt-2">
                  Subject: &quot;Security Disclosure&quot;
                </p>
              </div>
              <p className="text-gray-600 mt-4 text-sm">
                We&apos;ll acknowledge your report within 24 hours and provide a detailed response within 5 business days. We appreciate the security research community&apos;s efforts to keep our platform secure.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Questions About Security?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Our team is available to discuss your security requirements and compliance needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:contact@certnode.io"
                className="bg-white text-blue-700 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-all"
              >
                Contact Security Team
              </a>
              <Link
                href="/support"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-lg font-semibold text-lg transition-all"
              >
                Visit Support Center
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
