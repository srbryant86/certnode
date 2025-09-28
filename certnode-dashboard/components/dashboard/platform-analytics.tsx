'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface PlatformAnalyticsProps {
  apiKey: string;
}

interface PlatformData {
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
}

export default function PlatformAnalytics({ apiKey }: PlatformAnalyticsProps) {
  const [data, setData] = useState<PlatformData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlatformData();
  }, []);

  const fetchPlatformData = async () => {
    try {
      const response = await fetch('/api/admin/platform-analytics', {
        headers: {
          'X-API-Key': apiKey
        }
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching platform data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading platform analytics...</div>;
  }

  if (!data) {
    return <div>Failed to load platform analytics</div>;
  }

  const tierColors = {
    FREE: 'bg-gray-100 text-gray-800',
    STARTER: 'bg-blue-100 text-blue-800',
    PRO: 'bg-purple-100 text-purple-800',
    ENTERPRISE: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enterprises</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalEnterprises}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg AI Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.globalAIMetrics.averageConfidence * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data.globalAIMetrics.processingTimeAvg.toFixed(0)}ms avg processing
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Enterprises by Revenue</CardTitle>
            <CardDescription>Highest revenue generating enterprises this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topEnterprises.map((enterprise, index) => (
                <div key={enterprise.enterpriseId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{enterprise.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {enterprise.requests.toLocaleString()} requests
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={tierColors[enterprise.tier as keyof typeof tierColors]}>
                      {enterprise.tier}
                    </Badge>
                    <span className="text-sm font-medium">
                      ${enterprise.revenue.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tier Distribution</CardTitle>
            <CardDescription>Enterprise distribution across tiers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.tierDistribution).map(([tier, count]) => {
                const percentage = (count / data.totalEnterprises) * 100;
                return (
                  <div key={tier} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Badge className={tierColors[tier as keyof typeof tierColors]}>
                          {tier}
                        </Badge>
                        <span className="text-sm">{count} enterprises</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top AI Models Detected</CardTitle>
          <CardDescription>Most frequently detected AI models across all enterprises</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.globalAIMetrics.topDetectedModels.map((model, index) => (
              <div key={model.model} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{model.model}</span>
                  <Badge variant="secondary">#{index + 1}</Badge>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {model.count.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">detections</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}