'use client';

import { useState, useEffect } from 'react';
import { PricingAnalytics } from '@/lib/analytics';

interface RecommendationData {
  planId: string;
  reason: string;
  confidence: number;
  urgency: 'low' | 'medium' | 'high';
}

export default function SmartRecommendationBanner() {
  const [recommendation, setRecommendation] = useState<RecommendationData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [analytics] = useState(() => PricingAnalytics.getInstance());

  useEffect(() => {
    const updateRecommendation = () => {
      // Check if user has actually interacted with the ROI calculator
      if (typeof window !== 'undefined') {
        const hasInteracted = localStorage.getItem('certnode_roi_interacted');
        if (!hasInteracted) return;
      }

      const summary = analytics.getSessionSummary();
      const recommendedPlan = analytics.getRecommendation();

      // Only show recommendations after some engagement
      if (summary.interactionCount < 3) return;

      const planNames = {
        starter: 'Starter',
        growth: 'Growth',
        business: 'Business'
      };

      const reasons = {
        starter: 'Perfect for getting started with cryptographic receipts',
        growth: 'Recommended based on your transaction volume and dispute risk',
        business: 'Ideal for your high-volume business needs'
      };

      setRecommendation({
        planId: recommendedPlan,
        reason: reasons[recommendedPlan as keyof typeof reasons] || reasons.growth,
        confidence: summary.calculatorUsage >= 2 ? 85 : 65,
        urgency: summary.engagementLevel === 'high' ? 'high' : 'medium'
      });

      setIsVisible(true);
    };

    // Initial check
    updateRecommendation();

    // Listen for recommendation updates
    const handleRecommendationUpdate = () => {
      updateRecommendation();
    };

    window.addEventListener('recommendationUpdate', handleRecommendationUpdate);

    // Periodic updates
    const interval = setInterval(updateRecommendation, 10000); // Every 10 seconds

    return () => {
      window.removeEventListener('recommendationUpdate', handleRecommendationUpdate);
      clearInterval(interval);
    };
  }, [analytics]);

  const handleDismiss = () => {
    setIsVisible(false);
    analytics.trackInteraction('recommendation_dismissed', {
      planId: recommendation?.planId,
      confidence: recommendation?.confidence
    });
  };

  const handleClick = () => {
    analytics.trackInteraction('recommendation_clicked', {
      planId: recommendation?.planId,
      confidence: recommendation?.confidence
    });

    // Scroll to pricing table
    const pricingSection = document.getElementById('pricing-table');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });

      // Highlight the recommended plan
      const planCard = document.querySelector(`[data-plan-id="${recommendation?.planId}"]`);
      if (planCard) {
        planCard.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
        setTimeout(() => {
          planCard.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
        }, 3000);
      }
    }
  };

  if (!isVisible || !recommendation) return null;

  const urgencyColors = {
    low: 'bg-blue-50 border-blue-200 text-blue-800',
    medium: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    high: 'bg-purple-50 border-purple-200 text-purple-800'
  };

  const urgencyIcons = {
    low: '💡',
    medium: '🎯',
    high: '⚡'
  };

  return (
    <div className={`fixed top-4 right-4 max-w-sm p-4 rounded-lg border-2 shadow-lg z-50 transform transition-all duration-500 ease-in-out ${urgencyColors[recommendation.urgency]}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">
          {urgencyIcons[recommendation.urgency]}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm">
              Smart Recommendation
            </h4>
            <span className="text-xs bg-white bg-opacity-60 px-1.5 py-0.5 rounded-full">
              {recommendation.confidence}% match
            </span>
          </div>

          <p className="text-sm mb-3">
            <span className="font-medium">{recommendation.planId.charAt(0).toUpperCase() + recommendation.planId.slice(1)} Plan</span> — {recommendation.reason}
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleClick}
              className="flex-1 bg-white bg-opacity-80 hover:bg-opacity-100 text-current text-xs font-medium py-2 px-3 rounded transition-colors"
            >
              View Plan
            </button>
            <button
              onClick={handleDismiss}
              className="text-current text-xs px-2 py-2 hover:bg-white hover:bg-opacity-40 rounded transition-colors"
              aria-label="Dismiss recommendation"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}