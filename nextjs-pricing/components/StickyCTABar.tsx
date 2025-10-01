'use client';

import { useState, useEffect } from 'react';

export default function StickyCTABar() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 60% of the page
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      setIsVisible(scrollPercent > 60);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 shadow-2xl z-50 animate-slide-up">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <span className="font-bold text-lg">Ready to get started?</span>
          <p className="text-blue-100 text-sm">60-day money-back guarantee • Cancel anytime</p>
        </div>
        <div className="flex gap-3">
          <a
            href="#pricing-table"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
            onClick={() => setIsVisible(false)}
          >
            View Plans
          </a>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white hover:text-blue-200 text-sm px-3"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
