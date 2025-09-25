export interface UserInteraction {
  timestamp: number;
  event: 'roi_calculation' | 'currency_change' | 'billing_toggle' | 'plan_view' | 'cta_click' |
        'social_proof_view' | 'urgency_shown' | 'urgency_cta_clicked' | 'urgency_dismissed' |
        'risk_reversal_clicked' | 'final_cta_clicked' | 'recommendation_clicked' | 'recommendation_dismissed' |
        'ab_test_assignment';
  data?: Record<string, any>;
}

export interface UserSession {
  sessionId: string;
  startTime: number;
  interactions: UserInteraction[];
  calculatorInputs?: {
    avgTicket?: number;
    monthlySales?: number;
    disputeRate?: number;
  };
  viewedPlans: string[];
  recommendedPlan?: string;
}

export class PricingAnalytics {
  private static instance: PricingAnalytics;
  private session: UserSession;

  constructor() {
    this.session = this.initializeSession();
  }

  static getInstance(): PricingAnalytics {
    if (!PricingAnalytics.instance) {
      PricingAnalytics.instance = new PricingAnalytics();
    }
    return PricingAnalytics.instance;
  }

  private initializeSession(): UserSession {
    const sessionId = this.generateSessionId();
    const existingSession = this.loadSession();

    if (existingSession && this.isSessionValid(existingSession)) {
      return existingSession;
    }

    const newSession: UserSession = {
      sessionId,
      startTime: Date.now(),
      interactions: [],
      viewedPlans: [],
    };

    this.saveSession(newSession);
    return newSession;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadSession(): UserSession | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem('pricing_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private saveSession(session: UserSession): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('pricing_session', JSON.stringify(session));

      // Also send to revenue analytics for dashboard
      this.syncToRevenueAnalytics(session);
    } catch {
      // Handle storage errors silently
    }
  }

  private syncToRevenueAnalytics(session: UserSession): void {
    // Import dynamically to avoid circular dependency
    import('./revenueAnalytics').then(({ RevenueAnalytics }) => {
      const revenueAnalytics = RevenueAnalytics.getInstance();
      revenueAnalytics.recordSession(session);
    }).catch(() => {
      // Ignore import errors
    });
  }

  private isSessionValid(session: UserSession): boolean {
    const MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 hours
    return (Date.now() - session.startTime) < MAX_SESSION_AGE;
  }

  trackInteraction(event: UserInteraction['event'], data?: Record<string, any>): void {
    const interaction: UserInteraction = {
      timestamp: Date.now(),
      event,
      data,
    };

    this.session.interactions.push(interaction);

    // Update calculator inputs if relevant
    if (event === 'roi_calculation' && data) {
      this.session.calculatorInputs = {
        avgTicket: data.avgTicket,
        monthlySales: data.monthlySales,
        disputeRate: data.disputeRate,
      };
    }

    // Track plan views
    if (event === 'plan_view' && data?.planId) {
      if (!this.session.viewedPlans.includes(data.planId)) {
        this.session.viewedPlans.push(data.planId);
      }
    }

    this.saveSession(this.session);

    // Update recommendations based on new data
    this.updateRecommendation();
  }

  private updateRecommendation(): void {
    const recommendation = this.calculateSmartRecommendation();
    if (recommendation !== this.session.recommendedPlan) {
      this.session.recommendedPlan = recommendation;
      this.saveSession(this.session);

      // Trigger custom event for components to listen to
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('recommendationUpdate', {
          detail: { recommendedPlan: recommendation }
        }));
      }
    }
  }

  calculateSmartRecommendation(): string {
    const { calculatorInputs, interactions, viewedPlans } = this.session;

    // Base recommendation on ROI calculations
    if (calculatorInputs) {
      const { avgTicket = 0, monthlySales = 0 } = calculatorInputs;
      const monthlyVolume = monthlySales;
      const ticketSize = avgTicket;

      // High-ticket, high-volume → Business
      if (ticketSize >= 200 && monthlyVolume >= 1000) {
        return 'business';
      }

      // Medium-ticket, medium-volume → Growth
      if (ticketSize >= 50 && monthlyVolume >= 500) {
        return 'growth';
      }

      // High-ticket, lower-volume → Growth (dispute protection value)
      if (ticketSize >= 100) {
        return 'growth';
      }
    }

    // Behavioral indicators
    const hasMultipleCalculations = interactions.filter(i => i.event === 'roi_calculation').length >= 3;
    const hasViewedHigherPlans = viewedPlans.includes('business') || viewedPlans.includes('growth');
    const sessionDuration = Date.now() - this.session.startTime;
    const isEngaged = sessionDuration > 2 * 60 * 1000; // 2+ minutes

    // Engaged users likely need more than Starter
    if (isEngaged && hasMultipleCalculations) {
      return hasViewedHigherPlans ? 'business' : 'growth';
    }

    // Default recommendation
    return 'growth';
  }

  getRecommendation(): string {
    return this.session.recommendedPlan || this.calculateSmartRecommendation();
  }

  getSessionSummary(): {
    sessionAge: number;
    interactionCount: number;
    calculatorUsage: number;
    recommendedPlan: string;
    engagementLevel: 'low' | 'medium' | 'high';
  } {
    const sessionAge = Date.now() - this.session.startTime;
    const interactionCount = this.session.interactions.length;
    const calculatorUsage = this.session.interactions.filter(i => i.event === 'roi_calculation').length;

    let engagementLevel: 'low' | 'medium' | 'high' = 'low';
    if (sessionAge > 5 * 60 * 1000 && interactionCount >= 10) {
      engagementLevel = 'high';
    } else if (sessionAge > 2 * 60 * 1000 && interactionCount >= 5) {
      engagementLevel = 'medium';
    }

    return {
      sessionAge,
      interactionCount,
      calculatorUsage,
      recommendedPlan: this.getRecommendation(),
      engagementLevel,
    };
  }

  // A/B Testing Framework
  getVariant(testName: string, variants: string[]): string {
    if (variants.length === 0) return '';

    // Use session ID for consistent variant assignment
    const hash = this.hashString(this.session.sessionId + testName);
    const index = Math.abs(hash) % variants.length;

    // Track the variant assignment
    this.trackInteraction('ab_test_assignment', {
      testName,
      variant: variants[index],
      allVariants: variants
    });

    return variants[index];
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }
}