"use client";

import { useState, useEffect } from "react";
import { formatNumber, formatPercentage } from "@/lib/format";
import { formatDistanceToNow } from "date-fns";

interface IntelligenceMetrics {
  triPillarMetrics: {
    contentIntelligence: {
      totalAnalyzed: number;
      accuracyRate: number;
      aiDetectionRate: number;
      modalityBreakdown: Record<string, number>;
      averageConfidence: number;
      processingTimeMs: number;
    };
    transactionIntelligence: {
      totalValidated: number;
      fraudDetectionRate: number;
      complianceRate: number;
      averageRiskScore: number;
      processingTimeMs: number;
      volumeUsd: number;
    };
    operationsIntelligence: {
      totalOperations: number;
      complianceRate: number;
      incidentResponse: number;
      automationRate: number;
      processingTimeMs: number;
      policiesEnforced: number;
    };
  };
  platformMetrics: {
    totalRequests: number;
    successRate: number;
    averageLatency: number;
    dailyActiveUsers: number;
    systemUptime: number;
    costSavings: number;
  };
  realTimeAlerts: Array<{
    id: string;
    type: 'content' | 'transaction' | 'operations' | 'system';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
    status: 'active' | 'acknowledged' | 'resolved';
  }>;
  trends: {
    daily: Array<{
      date: string;
      contentRequests: number;
      transactionVolume: number;
      operationsCompleted: number;
      accuracy: number;
    }>;
  };
}

interface IntelligenceClientProps {
  enterpriseId: string;
}

export function IntelligenceClient({ enterpriseId }: IntelligenceClientProps) {
  const [metrics, setMetrics] = useState<IntelligenceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchMetrics = async () => {
      try {
        setError(null);

        // Simulate real-time intelligence metrics (in production, this would fetch from APIs)
        const mockMetrics: IntelligenceMetrics = {
          triPillarMetrics: {
            contentIntelligence: {
              totalAnalyzed: 45687 + Math.floor(Math.random() * 100),
              accuracyRate: 0.953 + Math.random() * 0.02,
              aiDetectionRate: 0.89 + Math.random() * 0.05,
              modalityBreakdown: {
                text: 0.45,
                image: 0.28,
                video: 0.15,
                audio: 0.08,
                document: 0.04
              },
              averageConfidence: 0.87 + Math.random() * 0.1,
              processingTimeMs: 245 + Math.floor(Math.random() * 50)
            },
            transactionIntelligence: {
              totalValidated: 123456 + Math.floor(Math.random() * 1000),
              fraudDetectionRate: 0.98 + Math.random() * 0.015,
              complianceRate: 0.997 + Math.random() * 0.003,
              averageRiskScore: 0.12 + Math.random() * 0.08,
              processingTimeMs: 89 + Math.floor(Math.random() * 20),
              volumeUsd: 50000000 + Math.floor(Math.random() * 5000000)
            },
            operationsIntelligence: {
              totalOperations: 78923 + Math.floor(Math.random() * 500),
              complianceRate: 0.994 + Math.random() * 0.005,
              incidentResponse: 234 + Math.floor(Math.random() * 20),
              automationRate: 0.92 + Math.random() * 0.05,
              processingTimeMs: 156 + Math.floor(Math.random() * 30),
              policiesEnforced: 1245 + Math.floor(Math.random() * 100)
            }
          },
          platformMetrics: {
            totalRequests: 567890 + Math.floor(Math.random() * 10000),
            successRate: 0.9987 + Math.random() * 0.0010,
            averageLatency: 125 + Math.floor(Math.random() * 25),
            dailyActiveUsers: 1234 + Math.floor(Math.random() * 100),
            systemUptime: 0.9999 + Math.random() * 0.0001,
            costSavings: 2500000 + Math.floor(Math.random() * 500000)
          },
          realTimeAlerts: [
            {
              id: '1',
              type: 'content',
              severity: 'medium',
              message: 'High AI detection rate in recent image uploads',
              timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
              status: 'active'
            },
            {
              id: '2',
              type: 'transaction',
              severity: 'low',
              message: 'Transaction volume spike detected',
              timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
              status: 'acknowledged'
            },
            {
              id: '3',
              type: 'system',
              severity: 'low',
              message: 'Multi-modal detector performance optimized',
              timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
              status: 'resolved'
            }
          ],
          trends: {
            daily: Array.from({ length: 7 }, (_, i) => ({
              date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              contentRequests: 5000 + Math.floor(Math.random() * 2000),
              transactionVolume: 15000 + Math.floor(Math.random() * 8000),
              operationsCompleted: 800 + Math.floor(Math.random() * 400),
              accuracy: 0.95 + Math.random() * 0.03
            })).reverse()
          }
        };

        setMetrics(mockMetrics);
        setLastUpdated(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [enterpriseId]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-900/50 text-red-300 border-red-700/50';
      case 'high': return 'bg-orange-900/50 text-orange-300 border-orange-700/50';
      case 'medium': return 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50';
      case 'low': return 'bg-blue-900/50 text-blue-300 border-blue-700/50';
      default: return 'bg-slate-900/50 text-slate-300 border-slate-700/50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-900/50 text-red-300';
      case 'acknowledged': return 'bg-yellow-900/50 text-yellow-300';
      case 'resolved': return 'bg-green-900/50 text-green-300';
      default: return 'bg-slate-900/50 text-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-white">Tri-Pillar Intelligence</h1>
        <div className="text-slate-400">Loading real-time intelligence metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-white">Tri-Pillar Intelligence</h1>
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Tri-Pillar Intelligence</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time monitoring across content, transaction, and operations intelligence systems
          </p>
        </div>
        <div className="text-xs text-slate-500">
          Last updated: {formatDistanceToNow(lastUpdated, { addSuffix: true })}
        </div>
      </div>

      {/* Platform Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="text-sm font-medium text-slate-400">Total Requests</div>
          <div className="text-2xl font-semibold text-white">
            {formatNumber(metrics.platformMetrics.totalRequests)}
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="text-sm font-medium text-slate-400">Success Rate</div>
          <div className="text-2xl font-semibold text-green-400">
            {formatPercentage(metrics.platformMetrics.successRate)}
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="text-sm font-medium text-slate-400">Avg Latency</div>
          <div className="text-2xl font-semibold text-blue-400">
            {metrics.platformMetrics.averageLatency}ms
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="text-sm font-medium text-slate-400">Active Users</div>
          <div className="text-2xl font-semibold text-white">
            {formatNumber(metrics.platformMetrics.dailyActiveUsers)}
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="text-sm font-medium text-slate-400">Uptime</div>
          <div className="text-2xl font-semibold text-green-400">
            {formatPercentage(metrics.platformMetrics.systemUptime)}
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="text-sm font-medium text-slate-400">Cost Savings</div>
          <div className="text-2xl font-semibold text-purple-400">
            ${formatNumber(metrics.platformMetrics.costSavings)}
          </div>
        </div>
      </div>

      {/* Tri-Pillar Intelligence Systems */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Intelligence */}
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">🎨 Content Intelligence</h2>
            <span className="px-2 py-1 text-xs rounded-full bg-green-900/50 text-green-300">
              {formatPercentage(metrics.triPillarMetrics.contentIntelligence.accuracyRate)} Accuracy
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Total Analyzed</span>
              <span className="text-sm text-white">
                {formatNumber(metrics.triPillarMetrics.contentIntelligence.totalAnalyzed)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">AI Detection Rate</span>
              <span className="text-sm text-red-400">
                {formatPercentage(metrics.triPillarMetrics.contentIntelligence.aiDetectionRate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Avg Confidence</span>
              <span className="text-sm text-yellow-400">
                {formatPercentage(metrics.triPillarMetrics.contentIntelligence.averageConfidence)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Processing Time</span>
              <span className="text-sm text-blue-400">
                {metrics.triPillarMetrics.contentIntelligence.processingTimeMs}ms
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="text-xs font-medium text-slate-400 mb-2">Multi-Modal Breakdown</div>
            {Object.entries(metrics.triPillarMetrics.contentIntelligence.modalityBreakdown).map(([type, percentage]) => (
              <div key={type} className="flex justify-between text-xs mb-1">
                <span className="text-slate-500 capitalize">{type}</span>
                <span className="text-slate-400">{formatPercentage(percentage)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Intelligence */}
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">💰 Transaction Intelligence</h2>
            <span className="px-2 py-1 text-xs rounded-full bg-green-900/50 text-green-300">
              {formatPercentage(metrics.triPillarMetrics.transactionIntelligence.fraudDetectionRate)} Fraud Detection
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Total Validated</span>
              <span className="text-sm text-white">
                {formatNumber(metrics.triPillarMetrics.transactionIntelligence.totalValidated)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Compliance Rate</span>
              <span className="text-sm text-green-400">
                {formatPercentage(metrics.triPillarMetrics.transactionIntelligence.complianceRate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Avg Risk Score</span>
              <span className="text-sm text-yellow-400">
                {formatPercentage(metrics.triPillarMetrics.transactionIntelligence.averageRiskScore)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Volume (USD)</span>
              <span className="text-sm text-purple-400">
                ${formatNumber(metrics.triPillarMetrics.transactionIntelligence.volumeUsd)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Processing Time</span>
              <span className="text-sm text-blue-400">
                {metrics.triPillarMetrics.transactionIntelligence.processingTimeMs}ms
              </span>
            </div>
          </div>
        </div>

        {/* Operations Intelligence */}
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">🔧 Operations Intelligence</h2>
            <span className="px-2 py-1 text-xs rounded-full bg-green-900/50 text-green-300">
              {formatPercentage(metrics.triPillarMetrics.operationsIntelligence.complianceRate)} Compliance
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Total Operations</span>
              <span className="text-sm text-white">
                {formatNumber(metrics.triPillarMetrics.operationsIntelligence.totalOperations)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Incident Response</span>
              <span className="text-sm text-orange-400">
                {formatNumber(metrics.triPillarMetrics.operationsIntelligence.incidentResponse)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Automation Rate</span>
              <span className="text-sm text-green-400">
                {formatPercentage(metrics.triPillarMetrics.operationsIntelligence.automationRate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Policies Enforced</span>
              <span className="text-sm text-blue-400">
                {formatNumber(metrics.triPillarMetrics.operationsIntelligence.policiesEnforced)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Processing Time</span>
              <span className="text-sm text-blue-400">
                {metrics.triPillarMetrics.operationsIntelligence.processingTimeMs}ms
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Alerts */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">🚨 Real-Time Alerts</h2>
        </div>
        <div className="p-6">
          {metrics.realTimeAlerts.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No active alerts - all systems operating normally
            </div>
          ) : (
            <div className="space-y-4">
              {metrics.realTimeAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-4 p-4 rounded-lg bg-slate-900/50">
                  <div className={`px-2 py-1 text-xs rounded-full border ${getSeverityColor(alert.severity)}`}>
                    {alert.severity.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white font-medium">{alert.message}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })} • {alert.type}
                    </div>
                  </div>
                  <div className={`px-2 py-1 text-xs rounded-full ${getStatusColor(alert.status)}`}>
                    {alert.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trends Chart */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">📈 7-Day Trends</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {metrics.trends.daily.map((day, index) => (
              <div key={day.date} className="text-center">
                <div className="text-xs text-slate-400 mb-2">{day.date}</div>
                <div className="space-y-1">
                  <div className="text-sm text-blue-400">{formatNumber(day.contentRequests)} content</div>
                  <div className="text-sm text-purple-400">{formatNumber(day.transactionVolume)} transactions</div>
                  <div className="text-sm text-green-400">{formatNumber(day.operationsCompleted)} operations</div>
                  <div className="text-sm text-yellow-400">{formatPercentage(day.accuracy)} accuracy</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}