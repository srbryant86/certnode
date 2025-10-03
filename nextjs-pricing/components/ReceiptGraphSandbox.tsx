'use client';

import { useState } from 'react';

type Receipt = {
  id: string;
  type: 'payment' | 'product' | 'delivery';
  status: 'pending' | 'created' | 'linked';
  data: any;
};

export default function ReceiptGraphSandbox() {
  const [step, setStep] = useState(0);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [showChargeback, setShowChargeback] = useState(false);

  const steps = [
    {
      title: "Customer purchases digital course",
      action: "Create Payment Receipt",
      description: "Customer pays $89.50 for your online course"
    },
    {
      title: "System delivers product",
      action: "Create Product Receipt (Linked)",
      description: "Course access granted, linked to payment receipt"
    },
    {
      title: "Confirm delivery",
      action: "Create Delivery Receipt (Linked)",
      description: "System confirms course was accessed, links to both receipts"
    },
    {
      title: "30 days later: Chargeback filed",
      action: "Simulate Chargeback",
      description: "Customer claims: 'I never received the product'"
    },
    {
      title: "You defend with Receipt Graph",
      action: "Submit Cryptographic Proof",
      description: "Complete chain: Payment → Product → Delivery"
    },
    {
      title: "Dispute won in 2 minutes",
      action: "See Results",
      description: "$104.50 saved, chargeback reversed"
    }
  ];

  const handleNext = () => {
    if (step === 0) {
      // Create payment receipt
      setReceipts([{
        id: 'rcpt_payment_' + Date.now(),
        type: 'payment',
        status: 'created',
        data: { amount: 89.50, customer: 'john@example.com' }
      }]);
    } else if (step === 1) {
      // Create product receipt linked to payment
      setReceipts(prev => [...prev, {
        id: 'rcpt_product_' + Date.now(),
        type: 'product',
        status: 'linked',
        data: { product: 'Digital Marketing Course', accessGranted: true }
      }]);
    } else if (step === 2) {
      // Create delivery receipt linked to both
      setReceipts(prev => [...prev, {
        id: 'rcpt_delivery_' + Date.now(),
        type: 'delivery',
        status: 'linked',
        data: { delivered: true, accessedAt: new Date().toISOString() }
      }]);
    } else if (step === 3) {
      // Show chargeback
      setShowChargeback(true);
    }

    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handleReset = () => {
    setStep(0);
    setReceipts([]);
    setShowChargeback(false);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200 p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-block bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
          🧪 INTERACTIVE DEMO
        </div>
        <h3 className="text-3xl font-bold text-gray-900 mb-3">
          Try Receipt Graph: Defend Against a Chargeback
        </h3>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          Walk through a real scenario: Create receipts, face a chargeback, defend with cryptographic proof.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Step {step + 1} of {steps.length}</span>
          <span className="text-sm text-gray-500">{Math.round(((step + 1) / steps.length) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Step */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
            {step === 0 && '💳'}
            {step === 1 && '📦'}
            {step === 2 && '✅'}
            {step === 3 && '⚠️'}
            {step === 4 && '🛡️'}
            {step === 5 && '🎉'}
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-bold text-gray-900 mb-2">{steps[step].title}</h4>
            <p className="text-gray-700 mb-4">{steps[step].description}</p>

            {step < 5 && (
              <button
                onClick={handleNext}
                className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
              >
                {steps[step].action} →
              </button>
            )}

            {step === 5 && (
              <div className="space-y-3">
                <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-2xl">✓</div>
                    <div className="font-bold text-green-900 text-lg">Chargeback Reversed!</div>
                  </div>
                  <p className="text-sm text-gray-700">
                    Bank accepted cryptographic proof. Complete chain validated: Payment → Product → Delivery.
                  </p>
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="font-bold text-green-700 text-lg">You saved: $104.50</div>
                    <div className="text-sm text-gray-600">($89.50 payment + $15 chargeback fee)</div>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-6 py-3 rounded-lg font-semibold transition-all w-full"
                >
                  ↻ Start Over
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Graph Visualization */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
        <h4 className="font-bold text-gray-900 mb-4 text-center">Receipt Graph</h4>

        <div className="flex items-center justify-center gap-4 min-h-[200px]">
          {/* Payment Receipt */}
          <div className={`transition-all duration-500 ${receipts.length >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <div className={`w-32 h-32 rounded-lg flex flex-col items-center justify-center ${
              receipts.length >= 1 ? 'bg-green-100 border-4 border-green-500' : 'bg-gray-100 border-4 border-gray-300'
            }`}>
              <div className="text-4xl mb-1">💳</div>
              <div className="font-bold text-sm">Payment</div>
              {receipts.length >= 1 && <div className="text-xs text-green-700">✓ Created</div>}
            </div>
          </div>

          {/* Arrow 1 */}
          {receipts.length >= 2 && (
            <div className="flex-shrink-0 text-purple-600 font-bold text-3xl animate-pulse">→</div>
          )}

          {/* Product Receipt */}
          {receipts.length >= 2 && (
            <div className="transition-all duration-500 opacity-100 scale-100">
              <div className="w-32 h-32 bg-purple-100 border-4 border-purple-500 rounded-lg flex flex-col items-center justify-center">
                <div className="text-4xl mb-1">📦</div>
                <div className="font-bold text-sm">Product</div>
                <div className="text-xs text-purple-700">✓ Linked</div>
              </div>
            </div>
          )}

          {/* Arrow 2 */}
          {receipts.length >= 3 && (
            <div className="flex-shrink-0 text-purple-600 font-bold text-3xl animate-pulse">→</div>
          )}

          {/* Delivery Receipt */}
          {receipts.length >= 3 && (
            <div className="transition-all duration-500 opacity-100 scale-100">
              <div className="w-32 h-32 bg-orange-100 border-4 border-orange-500 rounded-lg flex flex-col items-center justify-center">
                <div className="text-4xl mb-1">✅</div>
                <div className="font-bold text-sm">Delivered</div>
                <div className="text-xs text-orange-700">✓ Linked</div>
              </div>
            </div>
          )}
        </div>

        {receipts.length >= 3 && !showChargeback && (
          <div className="text-center mt-4">
            <div className="inline-block bg-green-100 border-2 border-green-500 rounded-lg px-4 py-2">
              <div className="text-sm font-bold text-green-900">🔒 Complete Chain Created</div>
              <div className="text-xs text-gray-700">All receipts cryptographically linked</div>
            </div>
          </div>
        )}

        {showChargeback && step < 5 && (
          <div className="text-center mt-4">
            <div className="inline-block bg-red-100 border-2 border-red-500 rounded-lg px-4 py-2 animate-pulse">
              <div className="text-sm font-bold text-red-900">⚠️ CHARGEBACK FILED</div>
              <div className="text-xs text-gray-700">Customer claims: "I never received the product"</div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      {step === 5 && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6 text-center">
          <h4 className="text-xl font-bold mb-2">Ready to protect your revenue?</h4>
          <p className="text-blue-100 mb-4">Start creating cryptographic receipt chains today</p>
          <a
            href="/pricing"
            className="inline-block bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-bold transition-all shadow-lg"
          >
            View Pricing Plans →
          </a>
        </div>
      )}
    </div>
  );
}
