export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              CertNode
            </h3>
            <p className="text-gray-600 mb-4">
              The trust layer for digital transactions. Build confidence with customers,
              affiliates, and financial institutions through cryptographic receipts.
            </p>
            <div className="text-sm text-gray-500">
              <p>© 2024 CertNode — Technical research platform for cryptographic compliance infrastructure development and testing.</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="/privacy" className="text-gray-600 hover:text-gray-900">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-gray-600 hover:text-gray-900">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Platform</h4>
            <ul className="space-y-2">
              <li>
                <a href="/verify" className="text-gray-600 hover:text-gray-900">
                  Receipt Validator
                </a>
              </li>
              <li>
                <a href="/platform" className="text-gray-600 hover:text-gray-900">
                  Enterprise
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              Prices exclude taxes; VAT/GST may apply.
            </p>
            <p className="text-sm text-gray-500">
              Modeled savings are estimates; outcomes vary by acquirer and network policies.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}