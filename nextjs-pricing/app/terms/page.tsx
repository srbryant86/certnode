import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — CertNode',
  description: 'Terms of Service for CertNode cryptographic receipt platform',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-lg text-gray-600 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Service Description</h2>
            <p className="text-gray-700 mb-6">
              CertNode provides cryptographic receipt generation and validation services for digital transactions. This is a technical research platform for cryptographic compliance infrastructure development and testing.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acceptable Use</h2>
            <p className="text-gray-700 mb-6">
              Users must comply with all applicable laws and regulations. The service is intended for legitimate business purposes related to transaction verification and compliance documentation.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Service Availability</h2>
            <p className="text-gray-700 mb-6">
              CertNode strives to maintain high service availability but does not guarantee uninterrupted service. Planned maintenance will be communicated in advance when possible.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 mb-6">
              CertNode provides technical services as-is. Users are responsible for their own compliance requirements and should consult with legal and financial professionals as needed.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to Terms</h2>
            <p className="text-gray-700">
              These terms may be updated periodically. Continued use of the service constitutes acceptance of any changes. For questions about these terms, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}