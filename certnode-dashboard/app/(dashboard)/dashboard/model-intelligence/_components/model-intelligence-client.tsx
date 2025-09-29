"use client";

import { useState, useEffect } from "react";
import { formatNumber, formatPercentage } from "@/lib/format";
import { formatDistanceToNow } from "date-fns";

interface ModelDetection {
  id: string;
  contentHash: string;
  detectedModel: string;
  modelVersion?: string;
  confidence: number;
  legalGrade: 'A' | 'B' | 'C';
  marketShare: number;
  usagePattern: string;
  estimatedCost: number;
  timestamp: string;
  executiveSummary: string;
}

interface ModelAnalytics {
  totalDetections: number;
  modelDistribution: Record<string, {
    count: number;
    percentage: number;
    avgConfidence: number;
    totalCost: number;
  }>;
  competitiveIntelligence: {
    dominantModel: string;
    emergingTrends: string[];
    marketShifts: Array<{
      model: string;
      trend: 'rising' | 'declining' | 'stable';
      change: number;
    }>;
  };
  legalCompliance: {
    evidenceGradeA: number;
    evidenceGradeB: number;
    evidenceGradeC: number;
    courtAdmissible: number;
  };
  businessIntelligence: {
    totalSpend: number;
    averageCostPerGeneration: number;
    mostExpensiveModel: string;
    costOptimizationOpportunity: number;
  };
}

interface ModelIntelligenceClientProps {
  enterpriseId: string;
}

export function ModelIntelligenceClient({ enterpriseId }: ModelIntelligenceClientProps) {
  const [analytics, setAnalytics] = useState<ModelAnalytics | null>(null);
  const [recentDetections, setRecentDetections] = useState<ModelDetection[]>([]);
  const [selectedDetection, setSelectedDetection] = useState<ModelDetection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);

        // Mock data for Model Intelligence (in production, fetch from APIs)
        const mockAnalytics: ModelAnalytics = {
          totalDetections: 2847,
          modelDistribution: {
            'GPT-4': {
              count: 1024,
              percentage: 0.36,
              avgConfidence: 0.89,
              totalCost: 1247.82
            },
            'GPT-5': {
              count: 512,
              percentage: 0.18,
              avgConfidence: 0.93,
              totalCost: 2048.32
            },
            'Claude-3': {
              count: 698,
              percentage: 0.25,
              avgConfidence: 0.87,
              totalCost: 876.45
            },
            'Gemini Pro': {
              count: 341,
              percentage: 0.12,
              avgConfidence: 0.84,
              totalCost: 234.56
            },
            'Claude-2': {
              count: 187,
              percentage: 0.07,
              avgConfidence: 0.81,
              totalCost: 123.78
            },
            'Generic AI': {
              count: 85,
              percentage: 0.03,
              avgConfidence: 0.72,
              totalCost: 89.32
            }
          },
          competitiveIntelligence: {
            dominantModel: 'GPT-4',
            emergingTrends: ['GPT-5 adoption increasing', 'Claude-3 enterprise growth', 'Cost optimization focus'],
            marketShifts: [
              { model: 'GPT-5', trend: 'rising', change: 0.15 },
              { model: 'GPT-4', trend: 'stable', change: -0.02 },
              { model: 'Claude-3', trend: 'rising', change: 0.08 },
              { model: 'GPT-3.5', trend: 'declining', change: -0.12 }
            ]
          },
          legalCompliance: {
            evidenceGradeA: 1847,
            evidenceGradeB: 756,
            evidenceGradeC: 244,
            courtAdmissible: 2245
          },
          businessIntelligence: {
            totalSpend: 4620.25,
            averageCostPerGeneration: 0.00162,
            mostExpensiveModel: 'GPT-5',
            costOptimizationOpportunity: 892.45
          }
        };

        const mockDetections: ModelDetection[] = Array.from({ length: 20 }, (_, i) => {
          const models = ['GPT-4', 'GPT-5', 'Claude-3', 'Claude-2', 'Gemini Pro'];
          const model = models[Math.floor(Math.random() * models.length)];
          const versions = {
            'GPT-4': ['4.0-turbo', '4.0-base'],
            'GPT-5': ['5.0-preview'],
            'Claude-3': ['3.0-opus', '3.0-sonnet'],
            'Claude-2': ['2.1'],
            'Gemini Pro': ['1.0']
          };
          const grades: Array<'A' | 'B' | 'C'> = ['A', 'B', 'C'];

          return {
            id: `det_${i + 1}`,
            contentHash: `hash_${Math.random().toString(36).substring(2, 10)}`,
            detectedModel: model,
            modelVersion: versions[model as keyof typeof versions]?.[0],
            confidence: 0.6 + Math.random() * 0.4,
            legalGrade: grades[Math.floor(Math.random() * grades.length)],
            marketShare: Math.random() * 0.4,
            usagePattern: ['Enterprise deployment', 'Cost-conscious use', 'Cutting-edge adoption', 'Professional workflow'][Math.floor(Math.random() * 4)],
            estimatedCost: Math.random() * 0.01,
            timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            executiveSummary: `Detected ${model} with high confidence. Analysis indicates professional enterprise usage with strong legal admissibility.`
          };
        });

        setAnalytics(mockAnalytics);
        setRecentDetections(mockDetections);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [enterpriseId]);

  const getModelColor = (model: string) => {
    const colors: Record<string, string> = {
      'GPT-4': 'text-green-400',
      'GPT-5': 'text-blue-400',
      'Claude-3': 'text-purple-400',
      'Claude-2': 'text-indigo-400',
      'Gemini Pro': 'text-yellow-400',
      'Generic AI': 'text-slate-400'
    };
    return colors[model] || 'text-slate-400';
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-400 bg-green-900/30 border-green-700/50';
      case 'B': return 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50';
      case 'C': return 'text-red-400 bg-red-900/30 border-red-700/50';
      default: return 'text-slate-400 bg-slate-900/30 border-slate-700/50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-white">Advanced Model Intelligence</h1>
        <div className="text-slate-400">Loading model intelligence analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-white">Advanced Model Intelligence</h1>
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Advanced Model Intelligence</h1>
          <p className="text-sm text-slate-400 mt-1">
            AI model detection, competitive analysis, and business intelligence
          </p>
        </div>
        <div className="text-xs text-slate-500">
          {formatNumber(analytics.totalDetections)} total detections analyzed
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="text-sm font-medium text-slate-400">Total AI Spend</div>
          <div className="text-2xl font-semibold text-purple-400">
            ${analytics.businessIntelligence.totalSpend.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Avg: ${analytics.businessIntelligence.averageCostPerGeneration.toFixed(5)}/gen
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="text-sm font-medium text-slate-400">Dominant Model</div>
          <div className="text-2xl font-semibold text-green-400">
            {analytics.competitiveIntelligence.dominantModel}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {formatPercentage(analytics.modelDistribution[analytics.competitiveIntelligence.dominantModel]?.percentage || 0)} market share
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="text-sm font-medium text-slate-400">Court Admissible</div>
          <div className="text-2xl font-semibold text-blue-400">
            {formatNumber(analytics.legalCompliance.courtAdmissible)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {formatPercentage(analytics.legalCompliance.courtAdmissible / analytics.totalDetections)} of detections
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="text-sm font-medium text-slate-400">Cost Optimization</div>
          <div className="text-2xl font-semibold text-yellow-400">
            ${analytics.businessIntelligence.costOptimizationOpportunity.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Potential savings identified</div>
        </div>
      </div>

      {/* Model Distribution and Competitive Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Distribution */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-white">Model Market Share</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(analytics.modelDistribution)
                .sort(([,a], [,b]) => b.percentage - a.percentage)
                .map(([model, data]) => (
                <div key={model} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`text-lg font-semibold ${getModelColor(model)}`}>
                      {model}
                    </div>
                    <div className="text-sm text-slate-400">
                      {formatNumber(data.count)} detections
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-white">
                      {formatPercentage(data.percentage)}
                    </div>
                    <div className="text-xs text-slate-500">
                      ${data.totalCost.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Market Trends */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-white">Market Trends</h2>
          </div>
          <div className="p-6 space-y-4">
            {analytics.competitiveIntelligence.marketShifts.map((shift, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-900/50 rounded">
                <div className="flex items-center space-x-3">
                  <div className="text-lg">{getTrendIcon(shift.trend)}</div>
                  <div>
                    <div className={`font-medium ${getModelColor(shift.model)}`}>
                      {shift.model}
                    </div>
                    <div className="text-xs text-slate-400 capitalize">{shift.trend}</div>
                  </div>
                </div>
                <div className={`text-sm font-medium ${
                  shift.change > 0 ? 'text-green-400' : shift.change < 0 ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {shift.change > 0 ? '+' : ''}{formatPercentage(Math.abs(shift.change))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legal Compliance Overview */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">Legal Compliance Overview</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getGradeColor('A').split(' ')[0]}`}>
                {formatNumber(analytics.legalCompliance.evidenceGradeA)}
              </div>
              <div className="text-sm text-slate-400 mt-1">Grade A Evidence</div>
              <div className="text-xs text-slate-500">Highest court admissibility</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getGradeColor('B').split(' ')[0]}`}>
                {formatNumber(analytics.legalCompliance.evidenceGradeB)}
              </div>
              <div className="text-sm text-slate-400 mt-1">Grade B Evidence</div>
              <div className="text-xs text-slate-500">Strong legal standing</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getGradeColor('C').split(' ')[0]}`}>
                {formatNumber(analytics.legalCompliance.evidenceGradeC)}
              </div>
              <div className="text-sm text-slate-400 mt-1">Grade C Evidence</div>
              <div className="text-xs text-slate-500">Basic detection confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {formatPercentage(analytics.legalCompliance.courtAdmissible / analytics.totalDetections)}
              </div>
              <div className="text-sm text-slate-400 mt-1">Court Admissible</div>
              <div className="text-xs text-slate-500">Legal proceedings ready</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Detections */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">Recent Model Detections</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Legal Grade
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Detected
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {recentDetections.slice(0, 10).map((detection) => (
                <tr
                  key={detection.id}
                  className="hover:bg-slate-700/25 cursor-pointer transition-colors"
                  onClick={() => setSelectedDetection(detection)}
                >
                  <td className="px-4 py-3">
                    <div className={`font-medium ${getModelColor(detection.detectedModel)}`}>
                      {detection.detectedModel}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {detection.modelVersion || 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-white">
                      {formatPercentage(detection.confidence)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full border ${getGradeColor(detection.legalGrade)}`}>
                      Grade {detection.legalGrade}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    ${detection.estimatedCost.toFixed(5)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {formatDistanceToNow(new Date(detection.timestamp), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detection Detail Modal */}
      {selectedDetection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Model Detection Report</h2>
                    <p className="text-slate-400">{selectedDetection.detectedModel} Analysis</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDetection(null)}
                  className="text-slate-400 hover:text-white text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400">Detection Confidence</div>
                  <div className="text-xl font-semibold text-white">
                    {formatPercentage(selectedDetection.confidence)}
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400">Legal Grade</div>
                  <div className={`text-xl font-semibold ${getGradeColor(selectedDetection.legalGrade).split(' ')[0]}`}>
                    Grade {selectedDetection.legalGrade}
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400">Estimated Cost</div>
                  <div className="text-xl font-semibold text-purple-400">
                    ${selectedDetection.estimatedCost.toFixed(5)}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Model Information</h3>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-slate-400">Model</div>
                        <div className={`font-medium ${getModelColor(selectedDetection.detectedModel)}`}>
                          {selectedDetection.detectedModel}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400">Version</div>
                        <div className="text-slate-300">{selectedDetection.modelVersion || 'Not specified'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400">Usage Pattern</div>
                        <div className="text-slate-300">{selectedDetection.usagePattern}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400">Market Share</div>
                        <div className="text-slate-300">{formatPercentage(selectedDetection.marketShare)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Executive Summary</h3>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-sm text-slate-300 whitespace-pre-wrap">
                      {selectedDetection.executiveSummary}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Content Hash</h3>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <code className="text-xs text-slate-400 font-mono">
                      {selectedDetection.contentHash}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}