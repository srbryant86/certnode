'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, TrendingUp, TrendingDown, Download } from 'lucide-react';
import { format } from 'date-fns';
import { UsageMetrics, EnterpriseReport } from '@/lib/enterprise-analytics';

interface EnterpriseAnalyticsProps {
  enterpriseId: string;
  apiKey: string;
}

export default function EnterpriseAnalytics({ enterpriseId, apiKey }: EnterpriseAnalyticsProps) {
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [report, setReport] = useState<EnterpriseReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  useEffect(() => {
    fetchUsage();
  }, [enterpriseId]);

  const fetchUsage = async () => {
    try {
      const response = await fetch(`/api/enterprise/analytics?enterpriseId=${enterpriseId}`, {
        headers: {
          'X-API-Key': apiKey
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsage(data.data);
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setReportLoading(true);
    try {
      const response = await fetch('/api/enterprise/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({
          enterpriseId,
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setReport(data.data);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setReportLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enterprise-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="animate-pulse">Loading analytics...</div>;
  }

  if (!usage) {
    return <div>Failed to load analytics data</div>;
  }

  const usagePercentage = (usage.billing.usage / usage.billing.limit) * 100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.requests.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {usage.requests.successful} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Detection Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(usage.aiDetection.averageConfidence * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {usage.aiDetection.highConfidenceDetections} high confidence
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant="outline">{usage.billing.currentTier}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              ${usage.billing.estimatedCost.toFixed(2)} estimated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(usage.performance.errorRate * 100).toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {usage.performance.averageResponseTime}ms avg response
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage Limits</CardTitle>
          <CardDescription>
            Current usage: {usage.billing.usage.toLocaleString()} / {usage.billing.limit === Infinity ? '∞' : usage.billing.limit.toLocaleString()} requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={Math.min(usagePercentage, 100)} className="w-full" />
          {usage.billing.overage > 0 && (
            <p className="text-sm text-destructive mt-2">
              Overage: {usage.billing.overage.toLocaleString()} requests
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Model Detection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(usage.aiDetection.modelDistribution).map(([model, count]) => (
              <div key={model} className="flex justify-between items-center">
                <span className="text-sm font-medium">{model}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>
            Generate detailed analytics report for a custom date range
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium">From</label>
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                      disabled={(date) => date > new Date()}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">To</label>
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                      disabled={(date) => date > new Date() || date < dateRange.from}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              onClick={generateReport}
              disabled={reportLoading}
              className="w-full sm:w-auto"
            >
              {reportLoading ? 'Generating...' : 'Generate Report'}
            </Button>

            {report && (
              <Button
                onClick={downloadReport}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
          </div>

          {report && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{report.summary.totalRequests}</div>
                    <p className="text-sm text-muted-foreground">Total Requests</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">${report.summary.totalCost.toFixed(2)}</div>
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {(report.summary.averageConfidence * 100).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Avg Confidence</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Request Growth</span>
                      <div className="flex items-center space-x-2">
                        {report.trends.requestGrowth > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={report.trends.requestGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                          {report.trends.requestGrowth.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Cost Projection</span>
                      <span>${report.trends.costProjection.toFixed(2)}/month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {report.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {report.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm p-2 bg-muted rounded">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}