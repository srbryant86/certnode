'use client';

import { useState, useEffect } from 'react';

export default function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Don't show again if already dismissed
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
          <div className="text-5xl mb-4">🎁</div>
          <h3 className="text-3xl font-bold text-gray-900 mb-3">
            Before You Go...
          </h3>
          <p className="text-lg text-gray-600 mb-6">
            Get <strong className="text-green-600">20% off</strong> your first month
          </p>

          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Use code at checkout:</p>
            <div className="flex items-center justify-center gap-2">
              <code className="bg-white px-4 py-2 rounded border-2 border-dashed border-blue-500 text-lg font-bold text-blue-600">
                SAVE20
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('SAVE20');
                  alert('Code copied!');
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href="#pricing-table"
              onClick={() => setIsVisible(false)}
              className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105"
            >
              Claim My Discount →
            </a>
            <button
              onClick={() => setIsVisible(false)}
              className="block w-full text-gray-500 hover:text-gray-700 text-sm"
            >
              No thanks, I'll pay full price
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            * Valid for first month only. Cannot be combined with other offers.
          </p>
        </div>
      </div>
    </div>
  );
}
