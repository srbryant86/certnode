/**
 * Advanced Analytics Engine
 * Real-time analytics, reporting, and business intelligence for CertNode
 */

const { createContextLogger } = require('../middleware/logging');

class AnalyticsEngine {
  constructor(options = {}) {
    this.config = {
      retentionDays: options.retentionDays || 365,
      aggregationIntervals: options.aggregationIntervals || ['1m', '5m', '1h', '1d'],
      realtimeEnabled: options.realtimeEnabled !== false,
      exportFormats: options.exportFormats || ['json', 'csv', 'pdf'],
      ...options
    };

    this.metrics = new Map();
    this.aggregatedData = new Map();
    this.dashboards = new Map();
    this.reports = new Map();
    this.alerts = new Map();

    this.initialize();
  }

  async initialize() {
    // Initialize metric definitions
    this.defineMetrics();

    // Initialize dashboard configurations
    this.defineDashboards();

    // Start real-time aggregation if enabled
    if (this.config.realtimeEnabled) {
      this.startRealtimeAggregation();
    }

    console.log('Analytics engine initialized');
  }

  defineMetrics() {
    const metricDefinitions = [
      {
        id: 'receipt_verifications',
        name: 'Receipt Verifications',
        type: 'counter',
        description: 'Total number of receipt verifications',
        dimensions: ['status', 'tenant_id', 'user_id'],
        unit: 'count'
      },
      {
        id: 'api_requests',
        name: 'API Requests',
        type: 'counter',
        description: 'Total API requests',
        dimensions: ['endpoint', 'method', 'status_code', 'tenant_id'],
        unit: 'count'
      },
      {
        id: 'response_time',
        name: 'Response Time',
        type: 'histogram',
        description: 'API response time distribution',
        dimensions: ['endpoint', 'method', 'tenant_id'],
        unit: 'milliseconds',
        buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
      },
      {
        id: 'error_rate',
        name: 'Error Rate',
        type: 'gauge',
        description: 'Percentage of failed requests',
        dimensions: ['endpoint', 'error_type', 'tenant_id'],
        unit: 'percentage'
      },
      {
        id: 'batch_jobs',
        name: 'Batch Jobs',
        type: 'counter',
        description: 'Batch processing jobs',
        dimensions: ['status', 'job_type', 'tenant_id'],
        unit: 'count'
      },
      {
        id: 'webhook_deliveries',
        name: 'Webhook Deliveries',
        type: 'counter',
        description: 'Webhook delivery attempts',
        dimensions: ['status', 'event_type', 'tenant_id'],
        unit: 'count'
      },
      {
        id: 'active_users',
        name: 'Active Users',
        type: 'gauge',
        description: 'Number of active users',
        dimensions: ['tenant_id', 'time_window'],
        unit: 'count'
      },
      {
        id: 'data_volume',
        name: 'Data Volume',
        type: 'counter',
        description: 'Amount of data processed',
        dimensions: ['data_type', 'tenant_id'],
        unit: 'bytes'
      },
      {
        id: 'security_events',
        name: 'Security Events',
        type: 'counter',
        description: 'Security-related events',
        dimensions: ['event_type', 'severity', 'tenant_id'],
        unit: 'count'
      },
      {
        id: 'tenant_usage',
        name: 'Tenant Resource Usage',
        type: 'gauge',
        description: 'Resource utilization by tenant',
        dimensions: ['resource_type', 'tenant_id'],
        unit: 'percentage'
      }
    ];

    metricDefinitions.forEach(metric => {
      this.metrics.set(metric.id, {
        ...metric,
        data: new Map(),
        lastUpdated: new Date().toISOString()
      });
    });
  }

  defineDashboards() {
    const dashboardConfigs = [
      {
        id: 'overview',
        name: 'System Overview',
        description: 'High-level system metrics and KPIs',
        layout: {
          rows: 3,
          columns: 4
        },
        widgets: [
          {
            id: 'total_verifications',
            title: 'Total Verifications',
            type: 'stat',
            metric: 'receipt_verifications',
            timeRange: '24h',
            position: { row: 1, col: 1 }
          },
          {
            id: 'success_rate',
            title: 'Success Rate',
            type: 'stat',
            metric: 'receipt_verifications',
            filter: { status: 'success' },
            format: 'percentage',
            position: { row: 1, col: 2 }
          },
          {
            id: 'avg_response_time',
            title: 'Avg Response Time',
            type: 'stat',
            metric: 'response_time',
            aggregation: 'avg',
            format: 'duration',
            position: { row: 1, col: 3 }
          },
          {
            id: 'active_tenants',
            title: 'Active Tenants',
            type: 'stat',
            metric: 'tenant_usage',
            aggregation: 'count_distinct',
            dimension: 'tenant_id',
            position: { row: 1, col: 4 }
          },
          {
            id: 'verification_trends',
            title: 'Verification Trends',
            type: 'timeseries',
            metric: 'receipt_verifications',
            timeRange: '7d',
            groupBy: 'status',
            position: { row: 2, col: 1, width: 2 }
          },
          {
            id: 'response_time_distribution',
            title: 'Response Time Distribution',
            type: 'histogram',
            metric: 'response_time',
            timeRange: '24h',
            position: { row: 2, col: 3, width: 2 }
          },
          {
            id: 'top_endpoints',
            title: 'Top Endpoints',
            type: 'table',
            metric: 'api_requests',
            groupBy: 'endpoint',
            orderBy: 'count',
            limit: 10,
            position: { row: 3, col: 1, width: 2 }
          },
          {
            id: 'error_breakdown',
            title: 'Error Breakdown',
            type: 'pie',
            metric: 'api_requests',
            filter: { status_code: '>=400' },
            groupBy: 'status_code',
            position: { row: 3, col: 3, width: 2 }
          }
        ]
      },
      {
        id: 'performance',
        name: 'Performance Analytics',
        description: 'System performance and optimization metrics',
        widgets: [
          {
            id: 'response_time_trends',
            title: 'Response Time Trends',
            type: 'timeseries',
            metric: 'response_time',
            aggregations: ['p50', 'p95', 'p99'],
            timeRange: '24h'
          },
          {
            id: 'throughput',
            title: 'Request Throughput',
            type: 'timeseries',
            metric: 'api_requests',
            aggregation: 'rate',
            timeRange: '24h'
          },
          {
            id: 'batch_performance',
            title: 'Batch Job Performance',
            type: 'timeseries',
            metric: 'batch_jobs',
            groupBy: 'status',
            timeRange: '7d'
          },
          {
            id: 'webhook_reliability',
            title: 'Webhook Delivery Success Rate',
            type: 'stat',
            metric: 'webhook_deliveries',
            filter: { status: 'success' },
            format: 'percentage'
          }
        ]
      },
      {
        id: 'business',
        name: 'Business Intelligence',
        description: 'Business metrics and growth analytics',
        widgets: [
          {
            id: 'verification_volume',
            title: 'Daily Verification Volume',
            type: 'timeseries',
            metric: 'receipt_verifications',
            timeRange: '30d',
            aggregation: 'sum'
          },
          {
            id: 'tenant_growth',
            title: 'Tenant Growth',
            type: 'timeseries',
            metric: 'active_users',
            groupBy: 'tenant_id',
            timeRange: '90d'
          },
          {
            id: 'usage_by_tenant',
            title: 'Usage by Tenant',
            type: 'table',
            metric: 'api_requests',
            groupBy: 'tenant_id',
            aggregation: 'sum',
            orderBy: 'count'
          },
          {
            id: 'revenue_potential',
            title: 'Revenue Potential',
            type: 'stat',
            metric: 'receipt_verifications',
            calculation: 'custom',
            formula: 'count * 0.001' // Example pricing
          }
        ]
      },
      {
        id: 'security',
        name: 'Security Dashboard',
        description: 'Security events and threat monitoring',
        widgets: [
          {
            id: 'security_events_timeline',
            title: 'Security Events Timeline',
            type: 'timeseries',
            metric: 'security_events',
            groupBy: 'event_type',
            timeRange: '24h'
          },
          {
            id: 'threat_severity',
            title: 'Threat Severity Distribution',
            type: 'pie',
            metric: 'security_events',
            groupBy: 'severity'
          },
          {
            id: 'failed_authentications',
            title: 'Failed Authentication Attempts',
            type: 'stat',
            metric: 'security_events',
            filter: { event_type: 'authentication_failed' }
          },
          {
            id: 'suspicious_ips',
            title: 'Top Suspicious IPs',
            type: 'table',
            metric: 'security_events',
            groupBy: 'source_ip',
            limit: 20
          }
        ]
      }
    ];

    dashboardConfigs.forEach(dashboard => {
      this.dashboards.set(dashboard.id, dashboard);
    });
  }

  // Data Collection Methods
  async recordMetric(metricId, value, dimensions = {}, timestamp = null) {
    const metric = this.metrics.get(metricId);
    if (!metric) {
      throw new Error(`Unknown metric: ${metricId}`);
    }

    const recordTime = timestamp || new Date().toISOString();
    const key = this.generateMetricKey(dimensions);

    if (!metric.data.has(key)) {
      metric.data.set(key, []);
    }

    const dataPoint = {
      value,
      timestamp: recordTime,
      dimensions
    };

    metric.data.get(key).push(dataPoint);
    metric.lastUpdated = recordTime;

    // Trigger real-time aggregation
    if (this.config.realtimeEnabled) {
      await this.updateRealtimeAggregation(metricId, dataPoint);
    }

    return dataPoint;
  }

  generateMetricKey(dimensions) {
    return Object.entries(dimensions)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
  }

  // Analytics Queries
  async queryMetrics(query) {
    const {
      metric,
      timeRange,
      filters = {},
      groupBy = [],
      aggregation = 'sum',
      limit,
      orderBy
    } = query;

    const metricData = this.metrics.get(metric);
    if (!metricData) {
      throw new Error(`Unknown metric: ${metric}`);
    }

    // Parse time range
    const { startTime, endTime } = this.parseTimeRange(timeRange);

    // Collect all matching data points
    let dataPoints = [];
    for (const [key, points] of metricData.data) {
      const filteredPoints = points.filter(point => {
        const pointTime = new Date(point.timestamp);
        const timeMatch = pointTime >= startTime && pointTime <= endTime;
        const filterMatch = this.matchesFilters(point.dimensions, filters);
        return timeMatch && filterMatch;
      });

      dataPoints.push(...filteredPoints);
    }

    // Group data if requested
    if (groupBy.length > 0) {
      const grouped = this.groupDataPoints(dataPoints, groupBy);
      const aggregated = this.aggregateGroups(grouped, aggregation);
      return this.sortAndLimit(aggregated, orderBy, limit);
    }

    // Aggregate all data
    const aggregated = this.aggregateDataPoints(dataPoints, aggregation);
    return { value: aggregated, count: dataPoints.length };
  }

  parseTimeRange(timeRange) {
    const now = new Date();
    let startTime, endTime = now;

    if (typeof timeRange === 'string') {
      const match = timeRange.match(/^(\d+)([mhd])$/);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2];

        switch (unit) {
          case 'm':
            startTime = new Date(now.getTime() - value * 60 * 1000);
            break;
          case 'h':
            startTime = new Date(now.getTime() - value * 60 * 60 * 1000);
            break;
          case 'd':
            startTime = new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
            break;
        }
      }
    } else if (timeRange.start && timeRange.end) {
      startTime = new Date(timeRange.start);
      endTime = new Date(timeRange.end);
    }

    return { startTime: startTime || new Date(0), endTime };
  }

  matchesFilters(dimensions, filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (Array.isArray(value)) {
        if (!value.includes(dimensions[key])) return false;
      } else if (typeof value === 'object' && value.operator) {
        if (!this.applyOperatorFilter(dimensions[key], value)) return false;
      } else {
        if (dimensions[key] !== value) return false;
      }
    }
    return true;
  }

  applyOperatorFilter(actualValue, filterConfig) {
    const { operator, value } = filterConfig;

    switch (operator) {
      case 'eq': return actualValue === value;
      case 'ne': return actualValue !== value;
      case 'gt': return actualValue > value;
      case 'gte': return actualValue >= value;
      case 'lt': return actualValue < value;
      case 'lte': return actualValue <= value;
      case 'in': return Array.isArray(value) && value.includes(actualValue);
      case 'contains': return typeof actualValue === 'string' && actualValue.includes(value);
      default: return false;
    }
  }

  groupDataPoints(dataPoints, groupBy) {
    const groups = new Map();

    dataPoints.forEach(point => {
      const groupKey = groupBy.map(dim => point.dimensions[dim] || 'unknown').join('|');

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }

      groups.get(groupKey).push(point);
    });

    return groups;
  }

  aggregateGroups(groups, aggregation) {
    const result = [];

    for (const [groupKey, points] of groups) {
      const aggregated = this.aggregateDataPoints(points, aggregation);
      result.push({
        group: groupKey,
        value: aggregated,
        count: points.length
      });
    }

    return result;
  }

  aggregateDataPoints(dataPoints, aggregation) {
    if (dataPoints.length === 0) return 0;

    const values = dataPoints.map(p => p.value);

    switch (aggregation) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return values.length;
      case 'count_distinct':
        return new Set(values).size;
      case 'p50':
        return this.percentile(values, 0.5);
      case 'p95':
        return this.percentile(values, 0.95);
      case 'p99':
        return this.percentile(values, 0.99);
      default:
        return values.reduce((a, b) => a + b, 0);
    }
  }

  percentile(values, p) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  sortAndLimit(data, orderBy, limit) {
    if (orderBy) {
      data.sort((a, b) => {
        const aVal = orderBy === 'group' ? a.group : a.value;
        const bVal = orderBy === 'group' ? b.group : b.value;
        return typeof aVal === 'string' ? aVal.localeCompare(bVal) : bVal - aVal;
      });
    }

    if (limit && limit > 0) {
      data = data.slice(0, limit);
    }

    return data;
  }

  // Dashboard Generation
  async generateDashboard(dashboardId, timeRange = '24h', filters = {}) {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Unknown dashboard: ${dashboardId}`);
    }

    const widgets = await Promise.all(
      dashboard.widgets.map(async (widget) => {
        try {
          const data = await this.generateWidget(widget, timeRange, filters);
          return {
            ...widget,
            data,
            status: 'success'
          };
        } catch (error) {
          return {
            ...widget,
            error: error.message,
            status: 'error'
          };
        }
      })
    );

    return {
      ...dashboard,
      widgets,
      generatedAt: new Date().toISOString(),
      timeRange,
      filters
    };
  }

  async generateWidget(widget, timeRange, globalFilters) {
    const query = {
      metric: widget.metric,
      timeRange: widget.timeRange || timeRange,
      filters: { ...globalFilters, ...widget.filter },
      groupBy: widget.groupBy ? [widget.groupBy] : [],
      aggregation: widget.aggregation || 'sum',
      limit: widget.limit,
      orderBy: widget.orderBy
    };

    const result = await this.queryMetrics(query);

    // Format based on widget type
    switch (widget.type) {
      case 'stat':
        return this.formatStatWidget(result, widget);
      case 'timeseries':
        return this.formatTimeseriesWidget(result, widget);
      case 'table':
        return this.formatTableWidget(result, widget);
      case 'pie':
        return this.formatPieWidget(result, widget);
      case 'histogram':
        return this.formatHistogramWidget(result, widget);
      default:
        return result;
    }
  }

  formatStatWidget(result, widget) {
    const value = Array.isArray(result) ? result.reduce((sum, item) => sum + item.value, 0) : result.value;

    let formattedValue = value;
    if (widget.format === 'percentage') {
      formattedValue = `${(value * 100).toFixed(1)}%`;
    } else if (widget.format === 'duration') {
      formattedValue = `${value.toFixed(1)}ms`;
    } else if (widget.format === 'bytes') {
      formattedValue = this.formatBytes(value);
    }

    return {
      value: formattedValue,
      rawValue: value,
      change: null // Would calculate from previous period
    };
  }

  formatTimeseriesWidget(result, widget) {
    // This would generate time-series data points
    // For now, return placeholder structure
    return {
      series: [{
        name: widget.title,
        data: [] // Would contain [{timestamp, value}] points
      }],
      timeRange: widget.timeRange
    };
  }

  formatTableWidget(result, widget) {
    if (!Array.isArray(result)) {
      return { rows: [], total: 0 };
    }

    return {
      headers: ['Group', 'Value', 'Count'],
      rows: result.map(item => [item.group, item.value, item.count]),
      total: result.length
    };
  }

  formatPieWidget(result, widget) {
    if (!Array.isArray(result)) {
      return { segments: [] };
    }

    const total = result.reduce((sum, item) => sum + item.value, 0);

    return {
      segments: result.map(item => ({
        label: item.group,
        value: item.value,
        percentage: total > 0 ? (item.value / total) * 100 : 0
      }))
    };
  }

  formatHistogramWidget(result, widget) {
    // This would generate histogram buckets
    return {
      buckets: [],
      total: 0
    };
  }

  // Report Generation
  async generateReport(reportConfig) {
    const {
      title,
      description,
      timeRange,
      metrics,
      format = 'json',
      includeCharts = false
    } = reportConfig;

    const report = {
      title,
      description,
      timeRange,
      generatedAt: new Date().toISOString(),
      format,
      sections: []
    };

    // Generate each metric section
    for (const metricConfig of metrics) {
      const data = await this.queryMetrics(metricConfig);

      report.sections.push({
        title: metricConfig.title || metricConfig.metric,
        metric: metricConfig.metric,
        data,
        summary: this.generateSummary(data, metricConfig)
      });
    }

    // Format report based on requested format
    switch (format) {
      case 'csv':
        return this.exportToCSV(report);
      case 'pdf':
        return this.exportToPDF(report);
      default:
        return report;
    }
  }

  generateSummary(data, metricConfig) {
    // Generate summary statistics and insights
    return {
      totalRecords: Array.isArray(data) ? data.length : 1,
      keyInsights: [],
      recommendations: []
    };
  }

  // Real-time Aggregation
  startRealtimeAggregation() {
    setInterval(() => {
      this.performAggregation();
    }, 60000); // Every minute
  }

  async performAggregation() {
    // Aggregate data for different time windows
    for (const interval of this.config.aggregationIntervals) {
      await this.aggregateInterval(interval);
    }
  }

  async aggregateInterval(interval) {
    // Implementation would aggregate raw metrics into time buckets
    // Store aggregated data for faster querying
  }

  async updateRealtimeAggregation(metricId, dataPoint) {
    // Update real-time aggregations when new data arrives
  }

  // Utility Methods
  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  exportToCSV(report) {
    // CSV export implementation
    return 'CSV data';
  }

  exportToPDF(report) {
    // PDF export implementation
    return 'PDF data';
  }

  // Health Check
  async healthCheck() {
    return {
      status: 'healthy',
      metrics: {
        totalMetrics: this.metrics.size,
        dashboards: this.dashboards.size,
        realtimeEnabled: this.config.realtimeEnabled
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = AnalyticsEngine;