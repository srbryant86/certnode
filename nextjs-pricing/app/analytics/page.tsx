'use client';

import { useState, useEffect } from 'react';
import { RevenueAnalytics, ConversionMetrics, RevenueInsights, UserSegment } from '@/lib/revenueAnalytics';
import { PricingAnalytics } from '@/lib/analytics';

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<ConversionMetrics | null>(null);
  const [insights, setInsights] = useState<RevenueInsights | null>(null);
  const [segments, setSegments] = useState<UserSegment[]>([]);
  const [abTests, setAbTests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revenueAnalytics] = useState(() => RevenueAnalytics.getInstance());

  useEffect(() => {
    // Simulate some session data for demonstration
    const generateDemoData = () => {
      const pricingAnalytics = PricingAnalytics.getInstance();

      // Generate sample sessions
      for (let i = 0; i < 50; i++) {
        const sessionId = `demo_session_${i}`;
        const startTime = Date.now() - Math.random() * 24 * 60 * 60 * 1000; // Last 24 hours

        const sampleSession = {
          sessionId,
          startTime,
          interactions: generateSampleInteractions(i),
          calculatorInputs: Math.random() > 0.3 ? {
            avgTicket: Math.floor(Math.random() * 2000) + 100,
            monthlySales: Math.floor(Math.random() * 500) + 10,
            disputeRate: Math.random() * 10 + 1
          } : undefined,
          recommendedPlan: ['starter', 'growth', 'business'][Math.floor(Math.random() * 3)]
        };

        revenueAnalytics.recordSession(sampleSession);
      }

      updateDashboard();
    };

    const generateSampleInteractions = (sessionIndex: number) => {
      const interactions = [];
      const interactionCount = Math.floor(Math.random() * 15) + 1;

      for (let j = 0; j < interactionCount; j++) {
        const events = [
          'roi_calculation', 'plan_view', 'currency_change', 'billing_toggle',
          'social_proof_view', 'urgency_shown', 'risk_reversal_clicked',
          'recommendation_clicked', 'cta_click', 'final_cta_clicked'
        ];

        interactions.push({
          timestamp: Date.now() - Math.random() * 60 * 60 * 1000,
          event: events[Math.floor(Math.random() * events.length)],
          data: { sessionIndex, interactionIndex: j }
        });
      }

      return interactions.sort((a, b) => a.timestamp - b.timestamp);
    };

    const updateDashboard = () => {
      const metricsData = revenueAnalytics.generateConversionMetrics();
      const insightsData = revenueAnalytics.generateRevenueInsights();
      const segmentsData = revenueAnalytics.generateUserSegments();
      const abTestsData = revenueAnalytics.generateA11yTestResults();

      setMetrics(metricsData);
      setInsights(insightsData);
      setSegments(segmentsData);
      setAbTests(abTestsData);
      setIsLoading(false);
    };

    generateDemoData();
  }, [revenueAnalytics]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Revenue Analytics</h1>
              <p className="text-gray-600">CertNode Pricing System Performance</p>
            </div>
            <button
              onClick={() => window.location.href = '/pricing'}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Pricing
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{metrics?.totalSessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">📈</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {metrics?.conversionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Potential MRR</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(insights?.potentialMRR || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <span className="text-2xl">⏱️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Avg. Session</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatDuration(metrics?.averageSessionDuration || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ROI Calculator Performance */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-xl font-bold mb-4">ROI Calculator Performance</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {metrics?.roiCalculatorUsage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Usage Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(insights?.averageTicketSize || 0)}
              </div>
              <div className="text-sm text-gray-600">Avg. Ticket Size</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {metrics?.planRecommendationAccuracy.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Recommendation Accuracy</div>
            </div>
          </div>
        </div>

        {/* User Segments */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-xl font-bold mb-4">User Segments</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Segment</th>
                  <th className="text-center py-2">Count</th>
                  <th className="text-center py-2">Conversion Rate</th>
                  <th className="text-center py-2">Avg. Value</th>
                  <th className="text-center py-2">Recommended Plan</th>
                </tr>
              </thead>
              <tbody>
                {segments.map((segment, index) => (
                  <tr key={segment.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-medium">{segment.name}</td>
                    <td className="text-center py-3">{segment.count}</td>
                    <td className="text-center py-3 text-green-600 font-semibold">
                      {segment.conversionRate}%
                    </td>
                    <td className="text-center py-3">{formatCurrency(segment.averageValue)}</td>
                    <td className="text-center py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {segment.recommendedPlan}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Psychology Trigger Performance */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Psychology Triggers</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Urgency Trigger Clicks</span>
                <span className="font-semibold">{insights?.urgencyTriggerEffectiveness}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Social Proof Views</span>
                <span className="font-semibold">{insights?.socialProofImpact}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Risk Reversal Clicks</span>
                <span className="font-semibold">{insights?.riskReversalConversions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">High-Value Prospects</span>
                <span className="font-semibold">{insights?.highValueProspects}</span>
              </div>
            </div>
          </div>

          {/* Export Actions */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Export Data</h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  const data = revenueAnalytics.exportAnalyticsData();
                  const blob = new Blob([JSON.stringify(data, null, 2)], {
                    type: 'application/json'
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `pricing-analytics-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Export Full Analytics (JSON)
              </button>

              <button
                onClick={() => {
                  const csvData = [
                    ['Metric', 'Value'],
                    ['Total Sessions', metrics?.totalSessions],
                    ['Conversion Rate', `${metrics?.conversionRate.toFixed(2)}%`],
                    ['Potential MRR', `$${insights?.potentialMRR}`],
                    ['ROI Calculator Usage', `${metrics?.roiCalculatorUsage.toFixed(1)}%`]
                  ].map(row => row.join(',')).join('\n');

                  const blob = new Blob([csvData], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `pricing-metrics-${Date.now()}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
              >
                Export Metrics (CSV)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}