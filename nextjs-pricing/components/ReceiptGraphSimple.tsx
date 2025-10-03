'use client';

export default function ReceiptGraphSimple() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200 p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-block bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
          THE CERTNODE DIFFERENCE
        </div>
        <h3 className="text-3xl font-bold text-gray-900 mb-3">
          Receipt Graph: Link Payment to Delivery
        </h3>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          <strong>The Problem:</strong> Customer files chargeback saying "I never got my product." Stripe receipt only proves payment - not delivery.<br/>
          <strong>The Solution:</strong> Cryptographically link payment receipt → delivery confirmation. Prove the product was delivered.
        </p>
      </div>

      {/* Visual: Simple 3-node graph */}
      <div className="bg-white rounded-xl p-8 mb-8 shadow-lg">
        <div className="flex items-center justify-center gap-4 mb-6">
          {/* Node 1: Transaction */}
          <div className="flex-1 max-w-[200px]">
            <div className="bg-green-100 border-4 border-green-500 rounded-lg p-6 text-center">
              <div className="text-4xl mb-2">💳</div>
              <div className="font-bold text-gray-900 mb-1">Transaction</div>
              <div className="text-sm text-gray-700">Payment: $89.50</div>
              <div className="text-xs text-gray-500 mt-2">Stripe receipt</div>
            </div>
          </div>

          {/* Arrow 1 */}
          <div className="flex-shrink-0 text-purple-600 font-bold text-2xl">→</div>

          {/* Node 2: Product */}
          <div className="flex-1 max-w-[200px]">
            <div className="bg-purple-100 border-4 border-purple-500 rounded-lg p-6 text-center">
              <div className="text-4xl mb-2">📦</div>
              <div className="font-bold text-gray-900 mb-1">Product</div>
              <div className="text-sm text-gray-700">Digital Course</div>
              <div className="text-xs text-gray-500 mt-2">What they bought</div>
            </div>
          </div>

          {/* Arrow 2 */}
          <div className="flex-shrink-0 text-purple-600 font-bold text-2xl">→</div>

          {/* Node 3: Delivery */}
          <div className="flex-1 max-w-[200px]">
            <div className="bg-orange-100 border-4 border-orange-500 rounded-lg p-6 text-center">
              <div className="text-4xl mb-2">✅</div>
              <div className="font-bold text-gray-900 mb-1">Delivered</div>
              <div className="text-sm text-gray-700">Access Granted</div>
              <div className="text-xs text-gray-500 mt-2">System confirmed</div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="inline-block bg-purple-100 border-2 border-purple-500 rounded-lg px-6 py-3">
            <div className="text-sm font-bold text-purple-900">🔒 Cryptographically Linked Chain</div>
            <div className="text-xs text-gray-700 mt-1">Can&apos;t fake one without faking all three - exponentially harder to forge</div>
          </div>
        </div>
      </div>

      {/* The "Why This Matters" Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Without CertNode */}
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-2xl">❌</div>
            <h4 className="font-bold text-gray-900 text-lg">Without Receipt Graph</h4>
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span>•</span>
              <span>Customer: "I never received the course"</span>
            </div>
            <div className="flex items-start gap-2">
              <span>•</span>
              <span>You: "But we have a Stripe receipt!"</span>
            </div>
            <div className="flex items-start gap-2">
              <span>•</span>
              <span>Bank: "Receipt only proves payment, not delivery"</span>
            </div>
            <div className="flex items-start gap-2">
              <span>•</span>
              <span className="font-bold text-red-700">You lose: $89.50 + $15 fee = $104.50 gone</span>
            </div>
          </div>
        </div>

        {/* With CertNode */}
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-2xl">✅</div>
            <h4 className="font-bold text-gray-900 text-lg">With Receipt Graph</h4>
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span>•</span>
              <span>Customer: "I never received the course"</span>
            </div>
            <div className="flex items-start gap-2">
              <span>•</span>
              <span>You: "Here&apos;s cryptographic proof: Payment → Product → Access Granted"</span>
            </div>
            <div className="flex items-start gap-2">
              <span>•</span>
              <span>Bank: "Chain is unbreakable, chargeback reversed"</span>
            </div>
            <div className="flex items-start gap-2">
              <span>•</span>
              <span className="font-bold text-green-700">You win: Kept $104.50, case closed in 2 minutes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom stat */}
      <div className="mt-8 text-center">
        <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg px-8 py-4">
          <div className="text-3xl font-bold mb-1">$XXX,XXX+</div>
          <div className="text-sm">Saved in disputes by CertNode customers (2024)</div>
        </div>
      </div>
    </div>
  );
}
