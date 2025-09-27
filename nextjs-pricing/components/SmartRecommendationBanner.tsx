'use client';

import { useEffect, useState } from 'react';
import { PricingAnalytics } from '@/lib/analytics';

const ENTERPRISE_INTERACTION_KEY = 'certnode_enterprise_calc_interacted';
const LEGACY_INTERACTION_KEY = 'certnode_roi_interacted';

interface RecommendationData {
  planId: string;
  label: string;
  reason: string;
  confidence: number;
  urgency: 'low' | 'medium' | 'high';
  isEnterprise: boolean;
}

export default function SmartRecommendationBanner() {
  const [recommendation, setRecommendation] = useState<RecommendationData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [analytics] = useState(() => PricingAnalytics.getInstance());

  useEffect(() => {
    const updateRecommendation = () => {
      if (typeof window === 'undefined') return;

      const hasEnterpriseSignal = window.localStorage.getItem(ENTERPRISE_INTERACTION_KEY) === 'true';
      const hasLegacySignal = window.localStorage.getItem(LEGACY_INTERACTION_KEY) === 'true';
      if (!hasEnterpriseSignal && !hasLegacySignal) return;

      const summary = analytics.getSessionSummary();
      if (summary.interactionCount < 3) return;

      const planId = analytics.getRecommendation();
      const planNames: Record<string, string> = {
        starter: 'Starter',
        growth: 'Growth',
        business: 'Business',
        enterprise: 'Enterprise Custom'
      };

      const reasons: Record<string, string> = {
        starter: 'Best fit for getting an audit-ready foundation in place quickly.',
        growth: 'Transaction volume aligns with our Growth plan coverage and SLA.',
        business: 'High-volume operations need Business plan scale and dedicated support.',
        enterprise: 'Your volume belongs in our enterprise rollout — team will tailor pricing.'
      };

      setRecommendation({
        planId,
        label: planNames[planId] ?? 'Growth',
        reason: reasons[planId] ?? reasons.growth,
        confidence: summary.calculatorUsage >= 2 ? 85 : 65,
        urgency: summary.engagementLevel === 'high' ? 'high' : 'medium',
        isEnterprise: planId === 'enterprise'
      });
      setIsVisible(true);
    };

    updateRecommendation();

    const handler = () => updateRecommendation();
    window.addEventListener('recommendationUpdate', handler);
    const interval = setInterval(updateRecommendation, 10000);

    return () => {
      window.removeEventListener('recommendationUpdate', handler);
      clearInterval(interval);
    };
  }, [analytics]);

  const handleDismiss = () => {
    if (!recommendation) return;
    setIsVisible(false);
    analytics.trackInteraction('recommendation_dismissed', {
      planId: recommendation.planId,
      confidence: recommendation.confidence,
    });
  };

  const handleClick = () => {
    if (!recommendation) return;
    analytics.trackInteraction('recommendation_clicked', {
      planId: recommendation.planId,
      confidence: recommendation.confidence,
    });

    if (recommendation.isEnterprise) {
      window.location.href = 'mailto:contact@certnode.io?subject=CertNode%20Enterprise%20Rollout';
      return;
    }

    const calculatorSection = document.getElementById('enterprise-savings-calculator');
    if (calculatorSection) {
      calculatorSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      const pricingSection = document.getElementById('pricing-table');
      pricingSection?.scrollIntoView({ behavior: 'smooth' });
    }

    const planCard = document.querySelector(`[data-plan-id="${recommendation.planId}"]`);
    if (planCard) {
      planCard.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
      setTimeout(() => {
        planCard.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
      }, 3000);
    }
  };

  if (!isVisible || !recommendation) return null;

  const themes = {
    low: {
      container: 'bg-blue-50 border-blue-200 text-blue-900',
      badge: 'bg-blue-100 text-blue-700',
      badgeLabel: 'Low urgency',
      cta: 'bg-blue-600 hover:bg-blue-700'
    },
    medium: {
      container: 'bg-indigo-50 border-indigo-200 text-indigo-900',
      badge: 'bg-indigo-100 text-indigo-700',
      badgeLabel: 'Act soon',
      cta: 'bg-indigo-600 hover:bg-indigo-700'
    },
    high: {
      container: 'bg-purple-50 border-purple-200 text-purple-900',
      badge: 'bg-purple-100 text-purple-700',
      badgeLabel: 'Act now',
      cta: 'bg-purple-600 hover:bg-purple-700'
    }
  } as const;

  const theme = themes[recommendation.urgency];
  const urgencyLabel = recommendation.urgency === 'high' ? 'HIGH' : recommendation.urgency === 'medium' ? 'MED' : 'LOW';
  const confidenceLabel = recommendation.confidence >= 80 ? 'High confidence' : 'Working recommendation';

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm transform rounded-lg border-2 p-4 shadow-lg transition-all duration-500 ease-in-out ${theme.container}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-14 items-center justify-center rounded-full px-3 text-xs font-semibold uppercase ${theme.badge}`}>
          {urgencyLabel}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Recommended: {recommendation.label} Plan</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-current opacity-70">{confidenceLabel} • {theme.badgeLabel}</p>
            </div>
            <button
              onClick={handleDismiss}
              aria-label="Dismiss recommendation"
              className="text-sm font-semibold text-current opacity-60 hover:opacity-100"
            >
              ×
            </button>
          </div>
          <p className="mt-2 text-sm">{recommendation.reason}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={handleClick}
              className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-white transition ${theme.cta}`}>
              Review Recommendation
            </button>
            <button
              onClick={handleDismiss}
              className="inline-flex items-center rounded-md border border-current px-3 py-2 text-sm font-semibold text-current transition hover:bg-white/30"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
