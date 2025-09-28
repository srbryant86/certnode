import { PricingAnalytics } from './analytics';

export interface ConversionMetrics {
  totalSessions: number;
  conversions: number;
  conversionRate: number;
  averageSessionDuration: number;
  roiCalculatorUsage: number;
  planRecommendationAccuracy: number;
}

export interface RevenueInsights {
  potentialMRR: number;
  averageTicketSize: number;
  highValueProspects: number;
  urgencyTriggerEffectiveness: number;
  socialProofImpact: number;
  riskReversalConversions: number;
}

export interface UserSegment {
  id: string;
  name: string;
  criteria: (analytics: any) => boolean;
  conversionRate: number;
  averageValue: number;
  count: number;
  recommendedPlan: string;
}

export class RevenueAnalytics {
  private static instance: RevenueAnalytics;
  private sessions: Map<string, any> = new Map();

  static getInstance(): RevenueAnalytics {
    if (!RevenueAnalytics.instance) {
      RevenueAnalytics.instance = new RevenueAnalytics();
    }
    return RevenueAnalytics.instance;
  }

  recordSession(sessionData: any) {
    this.sessions.set(sessionData.sessionId, {
      ...sessionData,
      recordedAt: Date.now()
    });

    // Keep only last 1000 sessions for demo
    if (this.sessions.size > 1000) {
      const oldestKey = Array.from(this.sessions.keys())[0];
      this.sessions.delete(oldestKey);
    }
  }

  generateConversionMetrics(): ConversionMetrics {
    const sessions = Array.from(this.sessions.values());
    const totalSessions = sessions.length;

    if (totalSessions === 0) {
      return {
        totalSessions: 0,
        conversions: 0,
        conversionRate: 0,
        averageSessionDuration: 0,
        roiCalculatorUsage: 0,
        planRecommendationAccuracy: 0
      };
    }

    const conversions = sessions.filter(s =>
      s.interactions?.some((i: any) => i.event === 'cta_click' || i.event === 'final_cta_clicked')
    ).length;

    const totalDuration = sessions.reduce((sum, s) =>
      sum + (s.interactions?.[s.interactions.length - 1]?.timestamp - s.startTime || 0), 0
    );

    const roiUsage = sessions.filter(s =>
      s.interactions?.some((i: any) => i.event === 'roi_calculation')
    ).length;

    // Simulate recommendation accuracy based on engagement
    const highEngagementSessions = sessions.filter(s =>
      s.interactions?.length >= 5
    ).length;

    const planRecommendationAccuracy = highEngagementSessions > 0 ?
      Math.min(95, 65 + (highEngagementSessions / totalSessions) * 30) : 65;

    return {
      totalSessions,
      conversions,
      conversionRate: (conversions / totalSessions) * 100,
      averageSessionDuration: totalDuration / totalSessions,
      roiCalculatorUsage: (roiUsage / totalSessions) * 100,
      planRecommendationAccuracy
    };
  }

  generateRevenueInsights(): RevenueInsights {
    const sessions = Array.from(this.sessions.values());

    // Calculate potential MRR based on calculator inputs and plan recommendations
    let potentialMRR = 0;
    let totalTicketSize = 0;
    let ticketCount = 0;
    let highValueProspects = 0;

    sessions.forEach(session => {
      if (session.calculatorInputs) {
        const { avgTicket = 0 } = session.calculatorInputs;
        if (avgTicket > 0) {
          totalTicketSize += avgTicket;
          ticketCount++;

          if (avgTicket >= 500) {
            highValueProspects++;
          }

          // Estimate potential MRR based on recommended plan
          const planPrices = { starter: 49, growth: 199, business: 499 };
          const recommendedPlan = session.recommendedPlan || 'growth';
          potentialMRR += planPrices[recommendedPlan as keyof typeof planPrices] || 199;
        }
      }
    });

    // Analyze trigger effectiveness
    const urgencyInteractions = sessions.filter(s =>
      s.interactions?.some((i: any) => i.event === 'urgency_cta_clicked')
    ).length;

    const socialProofViews = sessions.filter(s =>
      s.interactions?.some((i: any) => i.event === 'social_proof_view')
    ).length;

    const riskReversalClicks = sessions.filter(s =>
      s.interactions?.some((i: any) => i.event === 'risk_reversal_clicked')
    ).length;

    return {
      potentialMRR: Math.round(potentialMRR * 0.05), // 5% conversion estimate
      averageTicketSize: ticketCount > 0 ? Math.round(totalTicketSize / ticketCount) : 0,
      highValueProspects,
      urgencyTriggerEffectiveness: urgencyInteractions,
      socialProofImpact: socialProofViews,
      riskReversalConversions: riskReversalClicks
    };
  }

  generateUserSegments(): UserSegment[] {
    const sessions = Array.from(this.sessions.values());

    const segments: UserSegment[] = [
      {
        id: 'high_value',
        name: 'High-Value Prospects',
        criteria: (session) => session.calculatorInputs?.avgTicket >= 500,
        conversionRate: 15.2,
        averageValue: 499,
        count: 0,
        recommendedPlan: 'business'
      },
      {
        id: 'engaged_users',
        name: 'Highly Engaged Users',
        criteria: (session) => session.interactions?.length >= 8,
        conversionRate: 12.8,
        averageValue: 199,
        count: 0,
        recommendedPlan: 'growth'
      },
      {
        id: 'calculator_users',
        name: 'ROI Calculator Power Users',
        criteria: (session) => session.interactions?.filter((i: any) => i.event === 'roi_calculation').length >= 3,
        conversionRate: 18.4,
        averageValue: 299,
        count: 0,
        recommendedPlan: 'growth'
      },
      {
        id: 'quick_browsers',
        name: 'Quick Browsers',
        criteria: (session) => session.interactions?.length <= 3,
        conversionRate: 2.1,
        averageValue: 49,
        count: 0,
        recommendedPlan: 'starter'
      },
      {
        id: 'hesitant_buyers',
        name: 'Hesitant Buyers',
        criteria: (session) => {
          const sessionAge = Date.now() - session.startTime;
          return sessionAge > 5 * 60 * 1000 && session.interactions?.length >= 5;
        },
        conversionRate: 8.7,
        averageValue: 199,
        count: 0,
        recommendedPlan: 'growth'
      }
    ];

    // Count sessions for each segment
    segments.forEach(segment => {
      segment.count = sessions.filter(session => segment.criteria(session)).length;
    });

    return segments.sort((a, b) => b.count - a.count);
  }

  generateA11yTestResults(): Array<{
    testName: string;
    variant: string;
    sessions: number;
    conversions: number;
    conversionRate: number;
    confidence: number;
  }> {
    const sessions = Array.from(this.sessions.values());

    // Group sessions by A/B test variants
    const testResults = new Map();

    sessions.forEach(session => {
      session.interactions?.forEach((interaction: any) => {
        if (interaction.event === 'ab_test_assignment') {
          const key = `${interaction.data.testName}_${interaction.data.variant}`;
          if (!testResults.has(key)) {
            testResults.set(key, {
              testName: interaction.data.testName,
              variant: interaction.data.variant,
              sessions: 0,
              conversions: 0
            });
          }
          testResults.get(key).sessions++;

          // Check if this session converted
          const hasConversion = session.interactions?.some((i: any) =>
            i.event === 'cta_click' || i.event === 'final_cta_clicked'
          );
          if (hasConversion) {
            testResults.get(key).conversions++;
          }
        }
      });
    });

    return Array.from(testResults.values()).map(result => ({
      ...result,
      conversionRate: result.sessions > 0 ? (result.conversions / result.sessions) * 100 : 0,
      confidence: result.sessions >= 100 ? Math.min(95, 60 + (result.sessions / 10)) : Math.max(30, result.sessions * 0.6)
    }));
  }

  exportAnalyticsData(): {
    timestamp: string;
    metrics: ConversionMetrics;
    insights: RevenueInsights;
    segments: UserSegment[];
    abTests: any[];
  } {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.generateConversionMetrics(),
      insights: this.generateRevenueInsights(),
      segments: this.generateUserSegments(),
      abTests: this.generateA11yTestResults()
    };
  }
}