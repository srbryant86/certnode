'use client';

import { useState } from 'react';

export default function TamperDemo() {
  const [step, setStep] = useState<'original' | 'tampered' | 'validation'>('original');
  const [isAnimating, setIsAnimating] = useState(false);

  const originalReceipt = {
    id: 'rcpt_1A2B3C4D',
    amount: '$50,000.00',
    date: '2024-01-15T14:30:00Z',
    merchant: 'Acme Corp',
    status: 'refund_approved',
    signature: 'eyJhbGc...K5NiI',
    hash: 'a3f8c2e9d1b7f4a6...',
  };

  const tamperedReceipt = {
    ...originalReceipt,
    amount: '$5,000.00', // Attacker changed amount
    hash: 'a3f8c2e9d1b7f4a6...', // Hash stays the same (tampering attempt)
  };

  const handleTamper = () => {
    setIsAnimating(true);
    setStep('tampered');
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleValidate = () => {
    setIsAnimating(true);
    setStep('validation');
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleReset = () => {
    setStep('original');
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 md:p-10 shadow-lg">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
            TAMPER-PROOF SECURITY
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            See What Happens When Someone Tries to Tamper
          </h2>
          <p className="text-gray-700 text-base md:text-lg max-w-2xl mx-auto">
            Cryptographic signatures make receipts impossible to modify without detection.
            Try tampering with this receipt and watch it fail validation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Receipt Display */}
          <div>
            <div className={`bg-gradient-to-br ${
              step === 'original' ? 'from-green-50 to-blue-50 border-green-200' :
              step === 'tampered' ? 'from-red-50 to-orange-50 border-red-200' :
              'from-red-100 to-red-200 border-red-600'
            } border-2 rounded-lg p-6 transition-all duration-500 ${isAnimating ? 'scale-105' : 'scale-100'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Receipt Details</h3>
                {step === 'original' && (
                  <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                    ✓ VALID
                  </span>
                )}
                {step === 'tampered' && (
                  <span className="bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">
                    ⚠ MODIFIED
                  </span>
                )}
                {step === 'validation' && (
                  <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">
                    ✗ INVALID
                  </span>
                )}
              </div>

              <div className="space-y-3 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID:</span>
                  <span className="text-gray-900 font-semibold">{originalReceipt.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className={`font-semibold ${
                    step !== 'original' ? 'text-red-600 line-through' : 'text-gray-900'
                  }`}>
                    {originalReceipt.amount}
                  </span>
                </div>
                {step !== 'original' && (
                  <div className="flex justify-between -mt-1">
                    <span className="text-gray-600"></span>
                    <span className="text-red-600 font-bold">
                      → {tamperedReceipt.amount} (TAMPERED!)
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="text-gray-900 font-semibold">{originalReceipt.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Merchant:</span>
                  <span className="text-gray-900 font-semibold">{originalReceipt.merchant}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-gray-900 font-semibold">{originalReceipt.status}</span>
                </div>
                <div className="border-t border-gray-300 pt-3 mt-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Signature:</span>
                    <span className="text-gray-900 font-semibold text-xs">{originalReceipt.signature}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hash:</span>
                    <span className={`font-semibold text-xs ${
                      step === 'validation' ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {originalReceipt.hash}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-6 flex gap-3">
              {step === 'original' && (
                <button
                  onClick={handleTamper}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  🔓 Try to Tamper
                </button>
              )}
              {step === 'tampered' && (
                <button
                  onClick={handleValidate}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  🔍 Validate Receipt
                </button>
              )}
              {step === 'validation' && (
                <button
                  onClick={handleReset}
                  className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  ↻ Reset Demo
                </button>
              )}
            </div>
          </div>

          {/* Right: Explanation */}
          <div className="space-y-6">
            <div className={`p-6 rounded-lg border-2 transition-all ${
              step === 'original' ? 'bg-green-50 border-green-200' :
              step === 'tampered' ? 'bg-orange-50 border-orange-200' :
              'bg-red-50 border-red-600'
            }`}>
              {step === 'original' && (
                <>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">✓</span>
                    Step 1: Valid Receipt
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    This receipt was created by CertNode with a cryptographic signature.
                    The hash value is calculated from all the receipt data.
                  </p>
                  <div className="mt-4 p-3 bg-white rounded border border-green-300">
                    <code className="text-xs text-gray-700">
                      hash = SHA256(amount + date + merchant + status)
                    </code>
                  </div>
                </>
              )}
              {step === 'tampered' && (
                <>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">⚠️</span>
                    Step 2: Tampering Attempt
                  </h4>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    An attacker changed the amount from <strong>$50,000</strong> to <strong>$5,000</strong>
                    trying to steal money. But they couldn&apos;t change the cryptographic hash!
                  </p>
                  <div className="p-3 bg-white rounded border border-orange-300">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Original:</strong> $50,000.00<br/>
                      <strong>Tampered:</strong> <span className="text-red-600">$5,000.00</span><br/>
                      <strong>Hash:</strong> <span className="text-gray-600">(unchanged)</span>
                    </p>
                  </div>
                </>
              )}
              {step === 'validation' && (
                <>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">✗</span>
                    Step 3: Validation Failed!
                  </h4>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    When we validate the receipt, we recalculate the hash from the data.
                    The hashes don&apos;t match → <strong className="text-red-600">TAMPERING DETECTED!</strong>
                  </p>
                  <div className="p-3 bg-white rounded border border-red-600">
                    <code className="text-xs text-gray-700 block mb-2">
                      Expected hash: a3f8c2e9d1b7f4a6...
                    </code>
                    <code className="text-xs text-red-600 block">
                      Actual hash: b2e7d1c8f3a9e5b4... ✗
                    </code>
                  </div>
                  <p className="text-sm text-gray-700 mt-3">
                    The receipt is <strong>cryptographically invalid</strong> and automatically rejected.
                    No one can tamper with receipts without being caught.
                  </p>
                </>
              )}
            </div>

            {/* Security Features */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-4">Why This Matters</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-gray-700">
                    <strong>Tamper-proof:</strong> Any modification breaks the cryptographic signature
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-gray-700">
                    <strong>Instant detection:</strong> Validation happens in milliseconds
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-gray-700">
                    <strong>Offline verifiable:</strong> Anyone can verify without CertNode&apos;s servers
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-gray-700">
                    <strong>Court-admissible:</strong> Cryptographic proof stands up in legal proceedings
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
