import { prisma } from "@/lib/prisma";

export interface UsageMetrics {
  period: {
    start: Date;
    end: Date;
    type: 'daily' | 'weekly' | 'monthly';
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
    contentCertifications: number;
    verifications: number;
  };
  aiDetection: {
    averageConfidence: number;
    highConfidenceDetections: number; // > 0.8
    modelDistribution: Record<string, number>;
    processingTimeAvg: number;
  };
  billing: {
    currentTier: string;
    usage: number;
    limit: number;
    overage: number;
    estimatedCost: number;
  };
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
    uptime: number;
  };
}

export interface EnterpriseReport {
  enterpriseId: string;
  enterpriseName: string;
  reportPeriod: {
    start: Date;
    end: Date;
  };
  summary: {
    totalRequests: number;
    totalCost: number;
    aiDetectionsPerformed: number;
    averageConfidence: number;
  };
  usage: UsageMetrics;
  trends: {
    requestGrowth: number; // percentage
    confidenceChange: number;
    costProjection: number;
  };
  topContent: {
    mostAnalyzedTypes: Array<{ type: string; count: number }>;
    highestConfidenceDetections: Array<{
      contentHash: string;
      confidence: number;
      detectedModels: string[];
      createdAt: Date;
    }>;
  };
  recommendations: string[];
}

export class EnterpriseAnalyticsService {
  /**
   * Get current usage metrics for an enterprise
   */
  async getCurrentUsage(enterpriseId: string): Promise<UsageMetrics> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get enterprise tier for billing calculations
    const enterprise = await prisma.enterprise.findUnique({
      where: { id: enterpriseId },
      select: { tier: true, name: true }
    });

    if (!enterprise) {
      throw new Error('Enterprise not found');
    }

    // Get all content receipts for the current month
    const receipts = await prisma.receipt.findMany({
      where: {
        enterpriseId,
        type: 'CONTENT',
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        }
      },
      select: {
        id: true,
        status: true,
        contentType: true,
        contentAiScores: true,
        createdAt: true
      }
    });

    // Calculate request metrics
    const totalRequests = receipts.length;
    const successful = receipts.filter(r => r.status === 'VERIFIED').length;
    const failed = receipts.filter(r => r.status === 'FAILED').length;

    // Calculate AI detection metrics
    const aiScores = receipts
      .map(r => r.contentAiScores as any)
      .filter(scores => scores && typeof scores.confidence === 'number');

    const averageConfidence = aiScores.length > 0
      ? aiScores.reduce((sum, scores) => sum + scores.confidence, 0) / aiScores.length
      : 0;

    const highConfidenceDetections = aiScores.filter(scores => scores.confidence > 0.8).length;

    // Model distribution
    const modelDistribution: Record<string, number> = {};
    aiScores.forEach(scores => {
      if (scores.modelSignatures) {
        scores.modelSignatures.forEach((model: string) => {
          modelDistribution[model] = (modelDistribution[model] || 0) + 1;
        });
      }
    });

    // Processing time average
    const processingTimes = aiScores
      .map(scores => scores.processingTime)
      .filter(time => typeof time === 'number');

    const processingTimeAvg = processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0;

    // Billing calculations
    const billing = this.calculateBilling(enterprise.tier, totalRequests);

    return {
      period: {
        start: monthStart,
        end: monthEnd,
        type: 'monthly'
      },
      requests: {
        total: totalRequests,
        successful,
        failed,
        contentCertifications: totalRequests, // All are certifications
        verifications: 0 // Would need separate tracking
      },
      aiDetection: {
        averageConfidence,
        highConfidenceDetections,
        modelDistribution,
        processingTimeAvg
      },
      billing,
      performance: {
        averageResponseTime: processingTimeAvg,
        p95ResponseTime: Math.max(...processingTimes) || 0,
        errorRate: totalRequests > 0 ? failed / totalRequests : 0,
        uptime: 0.999 // Would be tracked separately
      }
    };
  }

  /**
   * Generate comprehensive enterprise report
   */
  async generateReport(
    enterpriseId: string,
    startDate: Date,
    endDate: Date
  ): Promise<EnterpriseReport> {
    const enterprise = await prisma.enterprise.findUnique({
      where: { id: enterpriseId }
    });

    if (!enterprise) {
      throw new Error('Enterprise not found');
    }

    // Get usage metrics for the period
    const usage = await this.getUsageForPeriod(enterpriseId, startDate, endDate);

    // Calculate trends (compare with previous period)
    const previousPeriod = this.getPreviousPeriod(startDate, endDate);
    const previousUsage = await this.getUsageForPeriod(
      enterpriseId,
      previousPeriod.start,
      previousPeriod.end
    );

    const trends = {
      requestGrowth: this.calculateGrowth(usage.requests.total, previousUsage.requests.total),
      confidenceChange: usage.aiDetection.averageConfidence - previousUsage.aiDetection.averageConfidence,
      costProjection: this.projectMonthlyCost(usage.billing)
    };

    // Get top content insights
    const topContent = await this.getTopContentInsights(enterpriseId, startDate, endDate);

    // Generate recommendations
    const recommendations = this.generateRecommendations(usage, trends);

    return {
      enterpriseId,
      enterpriseName: enterprise.name,
      reportPeriod: { start: startDate, end: endDate },
      summary: {
        totalRequests: usage.requests.total,
        totalCost: usage.billing.estimatedCost,
        aiDetectionsPerformed: usage.requests.total,
        averageConfidence: usage.aiDetection.averageConfidence
      },
      usage,
      trends,
      topContent,
      recommendations
    };
  }

  /**
   * Get usage analytics for all enterprises (admin view)
   */
  async getPlatformAnalytics(): Promise<{
    totalEnterprises: number;
    totalRequests: number;
    totalRevenue: number;
    topEnterprises: Array<{
      enterpriseId: string;
      name: string;
      requests: number;
      revenue: number;
      tier: string;
    }>;
    tierDistribution: Record<string, number>;
    globalAIMetrics: {
      averageConfidence: number;
      topDetectedModels: Array<{ model: string; count: number }>;
      processingTimeAvg: number;
    };
  }> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all enterprises
    const enterprises = await prisma.enterprise.findMany({
      select: {
        id: true,
        name: true,
        tier: true,
        receipts: {
          where: {
            type: 'CONTENT',
            createdAt: { gte: monthStart }
          },
          select: {
            contentAiScores: true
          }
        }
      }
    });

    const totalEnterprises = enterprises.length;
    let totalRequests = 0;
    let totalRevenue = 0;
    const tierDistribution: Record<string, number> = {};

    const topEnterprises = enterprises.map(enterprise => {
      const requests = enterprise.receipts.length;
      const billing = this.calculateBilling(enterprise.tier, requests);
      const revenue = billing.estimatedCost;

      totalRequests += requests;
      totalRevenue += revenue;
      tierDistribution[enterprise.tier] = (tierDistribution[enterprise.tier] || 0) + 1;

      return {
        enterpriseId: enterprise.id,
        name: enterprise.name,
        requests,
        revenue,
        tier: enterprise.tier
      };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Calculate global AI metrics
    const allAIScores = enterprises.flatMap(e =>
      e.receipts.map(r => r.contentAiScores as any).filter(Boolean)
    );

    const globalAIMetrics = {
      averageConfidence: allAIScores.length > 0
        ? allAIScores.reduce((sum, scores) => sum + (scores.confidence || 0), 0) / allAIScores.length
        : 0,
      topDetectedModels: this.getTopDetectedModels(allAIScores),
      processingTimeAvg: allAIScores.length > 0
        ? allAIScores.reduce((sum, scores) => sum + (scores.processingTime || 0), 0) / allAIScores.length
        : 0
    };

    return {
      totalEnterprises,
      totalRequests,
      totalRevenue,
      topEnterprises,
      tierDistribution,
      globalAIMetrics
    };
  }

  private calculateBilling(tier: string, requests: number) {
    const tiers = {
      FREE: { limit: 1000, pricePerRequest: 0, monthlyFee: 0 },
      STARTER: { limit: 50000, pricePerRequest: 0.01, monthlyFee: 99 },
      PRO: { limit: 500000, pricePerRequest: 0.005, monthlyFee: 499 },
      ENTERPRISE: { limit: Infinity, pricePerRequest: 0.002, monthlyFee: 1999 }
    };

    const tierInfo = tiers[tier as keyof typeof tiers] || tiers.FREE;
    const overage = Math.max(0, requests - tierInfo.limit);
    const overageCost = overage * tierInfo.pricePerRequest;
    const estimatedCost = tierInfo.monthlyFee + overageCost;

    return {
      currentTier: tier,
      usage: requests,
      limit: tierInfo.limit,
      overage,
      estimatedCost
    };
  }

  private async getUsageForPeriod(enterpriseId: string, start: Date, end: Date): Promise<UsageMetrics> {
    // Similar to getCurrentUsage but for custom period
    // Implementation details...
    return this.getCurrentUsage(enterpriseId); // Simplified for now
  }

  private getPreviousPeriod(start: Date, end: Date) {
    const duration = end.getTime() - start.getTime();
    return {
      start: new Date(start.getTime() - duration),
      end: new Date(start.getTime())
    };
  }

  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private projectMonthlyCost(billing: any): number {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const dailyAverage = billing.estimatedCost / dayOfMonth;
    return dailyAverage * daysInMonth;
  }

  private async getTopContentInsights(enterpriseId: string, start: Date, end: Date) {
    const receipts = await prisma.receipt.findMany({
      where: {
        enterpriseId,
        type: 'CONTENT',
        createdAt: { gte: start, lte: end }
      },
      select: {
        contentType: true,
        contentHash: true,
        contentAiScores: true,
        createdAt: true
      }
    });

    // Content type distribution
    const typeCount: Record<string, number> = {};
    receipts.forEach(r => {
      typeCount[r.contentType || 'unknown'] = (typeCount[r.contentType || 'unknown'] || 0) + 1;
    });

    const mostAnalyzedTypes = Object.entries(typeCount)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Highest confidence detections
    const highestConfidenceDetections = receipts
      .map(r => ({
        contentHash: r.contentHash || '',
        confidence: (r.contentAiScores as any)?.confidence || 0,
        detectedModels: (r.contentAiScores as any)?.modelSignatures || [],
        createdAt: r.createdAt
      }))
      .filter(item => item.confidence > 0)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);

    return {
      mostAnalyzedTypes,
      highestConfidenceDetections
    };
  }

  private generateRecommendations(usage: UsageMetrics, trends: any): string[] {
    const recommendations: string[] = [];

    if (trends.requestGrowth > 50) {
      recommendations.push("Consider upgrading to a higher tier to optimize costs with volume discounts");
    }

    if (usage.aiDetection.averageConfidence > 0.7) {
      recommendations.push("High AI detection rates suggest implementing content review workflows");
    }

    if (usage.performance.errorRate > 0.05) {
      recommendations.push("Review API integration - elevated error rate detected");
    }

    if (usage.billing.overage > 0) {
      recommendations.push("Usage exceeded plan limits - consider upgrading or optimizing request patterns");
    }

    return recommendations;
  }

  private getTopDetectedModels(aiScores: any[]): Array<{ model: string; count: number }> {
    const modelCount: Record<string, number> = {};

    aiScores.forEach(scores => {
      if (scores.modelSignatures) {
        scores.modelSignatures.forEach((model: string) => {
          modelCount[model] = (modelCount[model] || 0) + 1;
        });
      }
    });

    return Object.entries(modelCount)
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}

export const enterpriseAnalytics = new EnterpriseAnalyticsService();