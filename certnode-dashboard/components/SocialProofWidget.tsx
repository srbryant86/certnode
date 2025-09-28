'use client';

import { useState, useEffect } from 'react';
import { PricingAnalytics } from '@/lib/analytics';

interface SocialProofData {
  businessesProtected: number;
  disputesSaved: number;
  revenueProtected: string;
  recentSignups: string[];
  trustIndicators: string[];
}

export default function SocialProofWidget() {
  const [proofData, setProofData] = useState<SocialProofData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [analytics] = useState(() => PricingAnalytics.getInstance());

  useEffect(() => {
    // Generate dynamic social proof based on time and user behavior
    const generateProofData = (): SocialProofData => {
      const now = new Date();
      const hour = now.getHours();
      const dayOfWeek = now.getDay();
      const session = analytics.getSessionSummary();

      // Base numbers with time-based variation
      const baseBusinesses = 2847;
      const timeVariation = Math.floor(Math.sin(hour * Math.PI / 12) * 50);
      const businessesProtected = baseBusinesses + timeVariation + Math.floor(Math.random() * 20);

      const recentSignups = [
        "Sarah from Austin just upgraded to Business",
        "TechStart Inc. protected $2.4M in revenue",
        "Mike's coaching business prevented 12 disputes",
        "DigitalCorp just joined 3 minutes ago",
        "Emma saved $8,400 in her first month"
      ];

      // Shuffle based on session for consistency
      const shuffledSignups = [...recentSignups].sort(() =>
        Math.sin(session.sessionAge + session.interactionCount) - 0.5
      );

      return {
        businessesProtected,
        disputesSaved: Math.floor(businessesProtected * 4.2), // ~4.2 disputes per business
        revenueProtected: `$${Math.floor(businessesProtected * 1.2)}M`, // ~1.2M per business avg
        recentSignups: shuffledSignups,
        trustIndicators: [
          "Enterprise Security Standards",
          "99.9% Uptime SLA",
          "Trusted by 500+ Businesses",
          "Zero Data Breaches"
        ]
      };
    };

    setProofData(generateProofData());

    // Rotate recent signups every 4 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const newIndex = (prev + 1) % 5;

        // Track social proof views
        analytics.trackInteraction('social_proof_view', {
          type: 'recent_signup',
          index: newIndex
        });

        return newIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [analytics]);

  if (!proofData) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-6 mb-8">
      {/* Main Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {proofData.businessesProtected.toLocaleString()}+
          </div>
          <div className="text-sm text-gray-600">Businesses Protected</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {proofData.disputesSaved.toLocaleString()}+
          </div>
          <div className="text-sm text-gray-600">Disputes Deflected</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {proofData.revenueProtected}
          </div>
          <div className="text-sm text-gray-600">Revenue Protected</div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <div className="text-sm text-gray-700 transition-all duration-500">
            {proofData.recentSignups[currentIndex]}
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="flex flex-wrap gap-4 justify-center">
        {proofData.trustIndicators.map((indicator, index) => (
          <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
            <span className="text-green-500">✓</span>
            {indicator}
          </div>
        ))}
      </div>
    </div>
  );
}