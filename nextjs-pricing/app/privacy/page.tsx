import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — CertNode',
  description: 'Privacy Policy for CertNode cryptographic receipt platform',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-lg text-gray-600 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
            <p className="text-gray-700 mb-6">
              CertNode collects information necessary to provide cryptographic receipt services. This includes transaction metadata, technical logs, and account information required for service delivery.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Information</h2>
            <p className="text-gray-700 mb-6">
              Information is used solely for providing cryptographic receipt generation, validation, and related technical services. We do not sell or share personal data with third parties except as required for service delivery.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
            <p className="text-gray-700 mb-6">
              CertNode implements enterprise-grade security measures to protect all data. Cryptographic receipts are generated using industry-standard protocols and stored with appropriate security controls.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <p className="text-gray-700">
              For privacy-related questions or requests, please contact us through our support channels. This is a technical research platform for cryptographic compliance infrastructure development and testing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}