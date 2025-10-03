'use client';

import { useState, useEffect } from 'react';

export default function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Don&apos;t show again if already dismissed
    if (hasShown || typeof window === 'undefined') return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Trigger when mouse moves toward top of viewport (likely closing tab)
      if (e.clientY <= 10 && !hasShown) {
        setIsVisible(true);
        setHasShown(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [hasShown]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg mx-4 p-8 relative animate-scale-in">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
          aria-label="Close"
        >
          ×
        </button>

        <div className="text-center">
          <div className="text-5xl mb-4">🛡️</div>
          <h3 className="text-3xl font-bold text-gray-900 mb-3">
            Try CertNode Risk-Free
          </h3>
          <p className="text-lg text-gray-600 mb-6">
            <strong className="text-green-600">60-day money-back guarantee</strong> on all plans
          </p>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
            <ul className="text-left space-y-3">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700"><strong>Full refund</strong> if you&apos;re not satisfied</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700"><strong>Cancel anytime</strong> with one click</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700"><strong>No questions asked</strong> if it doesn&apos;t work for you</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <a
              href="#pricing-table"
              onClick={() => setIsVisible(false)}
              className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105"
            >
              View Pricing Plans →
            </a>
            <button
              onClick={() => setIsVisible(false)}
              className="block w-full text-gray-500 hover:text-gray-700 text-sm"
            >
              Continue browsing
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            All plans include full platform access to all three verification domains
          </p>
        </div>
      </div>
    </div>
  );
}
