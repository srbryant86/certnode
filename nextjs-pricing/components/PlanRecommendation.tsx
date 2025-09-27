'use client';

import { useState, useEffect } from 'react';

export default function PlanRecommendation() {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Get ROI settings from localStorage
    if (typeof window !== 'undefined') {
      const settings = localStorage.getItem('certnode_roi_settings');
      const hasInteracted = localStorage.getItem('certnode_roi_interacted');

      // Only show recommendations if user has actually interacted with the ROI widget
      if (settings && hasInteracted === 'true') {
        try {
          const { ticket, monthlySales } = JSON.parse(settings);
          const rec = getRecommendation(ticket || 0, monthlySales || 0);
          setRecommendation(rec);
          setIsVisible(!!rec);
        } catch (e) {
          console.warn('Failed to parse ROI settings:', e);
        }
      }
    }
  }, []);

  if (!isVisible || !recommendation) return null;

  return (
    <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-2xl">💡</span>
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Recommended Plan
          </h3>
          <p className="text-yellow-700">{recommendation}</p>
        </div>
      </div>
    </div>
  );
}

function getRecommendation(ticket: number, monthlySales: number): string | null {
  if (!ticket || !monthlySales) return null;

  // Recommendation rules from ChatGPT spec
  if (monthlySales <= 100 && ticket < 1000) {
    return "Based on your transaction volume, the Starter plan should cover your needs perfectly.";
  }

  if (monthlySales <= 600 || (ticket >= 1000 && ticket <= 5000)) {
    return "The Growth plan is ideal for your business size and transaction values.";
  }

  if (monthlySales >= 100 && ticket >= 5000) {
    return "Consider our High-Ticket Dispute Protection plans for maximum value with high-value transactions.";
  }

  return "The Business plan offers the best value for your transaction volume.";
}