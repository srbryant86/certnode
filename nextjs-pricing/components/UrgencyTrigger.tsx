'use client';

import { useState, useEffect } from 'react';
import { PricingAnalytics } from '@/lib/analytics';

interface UrgencyData {
  type: 'discount' | 'scarcity' | 'time_limited' | 'risk_reversal';
  message: string;
  subtext?: string;
  urgencyLevel: 'low' | 'medium' | 'high';
  icon: string;
  ctaText: string;
  backgroundColor: string;
  textColor: string;
}

export default function UrgencyTrigger() {
  const [urgencyData, setUrgencyData] = useState<UrgencyData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const [analytics] = useState(() => PricingAnalytics.getInstance());

  useEffect(() => {
    const session = analytics.getSessionSummary();

    // Show urgency triggers based on engagement level
    if (session.engagementLevel === 'low') {
      return; // Don't show urgency for low engagement
    }

    const generateUrgencyData = (): UrgencyData => {
      const triggers: UrgencyData[] = [
        {
          type: 'time_limited',
          message: 'Limited Time: Save on Implementation',
          subtext: 'First 30 days of dispute protection included',
          urgencyLevel: 'medium',
          icon: '⏰',
          ctaText: 'Claim Offer',
          backgroundColor: 'bg-orange-50 border-orange-200',
          textColor: 'text-orange-800'
        },
        {
          type: 'value_focus',
          message: 'Start Protecting Revenue Today',
          subtext: 'Join businesses reducing chargebacks by 70%',
          urgencyLevel: 'medium',
          icon: '📈',
          ctaText: 'See Results',
          backgroundColor: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800'
        },
        {
          type: 'risk_reversal',
          message: '60-Day Money-Back Guarantee',
          subtext: 'If we don\'t deflect disputes, get a full refund',
          urgencyLevel: 'low',
          icon: '🛡️',
          ctaText: 'Start Risk-Free',
          backgroundColor: 'bg-green-50 border-green-200',
          textColor: 'text-green-800'
        },
        {
          type: 'discount',
          message: 'First Month 50% Off',
          subtext: 'New customer exclusive - expires soon',
          urgencyLevel: 'medium',
          icon: '💰',
          ctaText: 'Get Discount',
          backgroundColor: 'bg-purple-50 border-purple-200',
          textColor: 'text-purple-800'
        }
      ];

      // Select based on engagement and recommendation
      const recommended = session.recommendedPlan;
      const hasHighTicket = session.calculatorUsage >= 3;

      if (session.engagementLevel === 'high' && recommended === 'business') {
        return triggers[1]; // Value focus for high-value prospects
      }

      if (hasHighTicket && session.engagementLevel === 'medium') {
        return triggers[0]; // Time-limited for engaged users
      }

      if (session.sessionAge > 10 * 60 * 1000) { // 10+ minutes
        return triggers[2]; // Risk reversal for hesitant users
      }

      return triggers[3]; // Default discount
    };

    const urgencyData = generateUrgencyData();
    setUrgencyData(urgencyData);

    // Show after some engagement
    const showDelay = session.engagementLevel === 'high' ? 5000 : 15000;
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      analytics.trackInteraction('urgency_shown', {
        type: urgencyData.type,
        urgencyLevel: urgencyData.urgencyLevel,
        engagementLevel: session.engagementLevel
      });
    }, showDelay);

    return () => clearTimeout(showTimer);
  }, [analytics]);

  useEffect(() => {
    if (!urgencyData || urgencyData.type !== 'time_limited') return;

    // Countdown timer for time-limited offers
    const updateCountdown = () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const timeLeft = endOfDay.getTime() - now.getTime();
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

      setTimeRemaining(`${hours}h ${minutes}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [urgencyData]);

  const handleCTAClick = () => {
    if (!urgencyData) return;

    analytics.trackInteraction('urgency_cta_clicked', {
      type: urgencyData.type,
      urgencyLevel: urgencyData.urgencyLevel,
      message: urgencyData.message
    });

    // Scroll to pricing table
    const pricingSection = document.getElementById('pricing-table');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (urgencyData) {
      analytics.trackInteraction('urgency_dismissed', {
        type: urgencyData.type,
        urgencyLevel: urgencyData.urgencyLevel
      });
    }
  };

  if (!isVisible || !urgencyData) return null;

  return (
    <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm p-4 rounded-lg border-2 shadow-lg z-40 transform transition-all duration-500 ease-in-out ${urgencyData.backgroundColor} ${urgencyData.textColor}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">
          {urgencyData.icon}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">
              {urgencyData.message}
            </h4>
            <button
              onClick={handleDismiss}
              className="text-current opacity-60 hover:opacity-100 text-sm px-1"
              aria-label="Dismiss offer"
            >
              ✕
            </button>
          </div>

          {urgencyData.subtext && (
            <p className="text-sm opacity-80 mb-3">
              {urgencyData.subtext}
            </p>
          )}

          {urgencyData.type === 'time_limited' && timeRemaining && (
            <div className="bg-white bg-opacity-60 rounded px-2 py-1 text-xs font-mono mb-3 inline-block">
              Expires in: {timeRemaining}
            </div>
          )}

          <button
            onClick={handleCTAClick}
            className="w-full bg-white bg-opacity-90 hover:bg-opacity-100 text-current text-sm font-semibold py-2 px-4 rounded transition-all duration-200 shadow-sm hover:shadow"
          >
            {urgencyData.ctaText}
          </button>
        </div>
      </div>
    </div>
  );
}