"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/format";

interface Integration {
  id: string;
  name: string;
  category: 'enterprise' | 'developer' | 'security' | 'analytics' | 'workflow';
  icon: string;
  description: string;
  provider: string;
  status: 'available' | 'beta' | 'coming_soon';
  pricing: string;
  features: string[];
  apiEndpoints: string[];
  documentation: string;
  setupComplexity: 'simple' | 'moderate' | 'advanced';
  usageStats?: {
    monthlyRequests: number;
    averageLatency: number;
    successRate: number;
  };
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'slack-enterprise',
    name: 'Slack Enterprise Grid',
    category: 'enterprise',
    icon: '💬',
    description: 'Real-time content intelligence notifications and workflow automation',
    provider: 'Slack Technologies',
    status: 'available',
    pricing: 'Free with Enterprise plan',
    features: [
      'Real-time AI detection alerts',
      'Content verification workflows',
      'Compliance notifications',
      'Team collaboration on findings'
    ],
    apiEndpoints: [
      'POST /api/v1/integrations/slack/webhook',
      'GET /api/v1/integrations/slack/channels',
      'POST /api/v1/integrations/slack/notify'
    ],
    documentation: '/docs/integrations/slack',
    setupComplexity: 'simple',
    usageStats: {
      monthlyRequests: 15420,
      averageLatency: 89,
      successRate: 0.998
    }
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    category: 'enterprise',
    icon: '🟦',
    description: 'Enterprise communication integration with tri-pillar intelligence',
    provider: 'Microsoft Corporation',
    status: 'available',
    pricing: 'Free with Enterprise plan',
    features: [
      'Intelligent content moderation',
      'Compliance workflow automation',
      'Real-time threat detection',
      'Enterprise-grade security'
    ],
    apiEndpoints: [
      'POST /api/v1/integrations/teams/webhook',
      'GET /api/v1/integrations/teams/channels',
      'POST /api/v1/integrations/teams/alert'
    ],
    documentation: '/docs/integrations/teams',
    setupComplexity: 'simple'
  },
  {
    id: 'zapier-enterprise',
    name: 'Zapier Enterprise',
    category: 'workflow',
    icon: '⚡',
    description: 'No-code workflow automation with 5000+ app integrations',
    provider: 'Zapier Inc.',
    status: 'available',
    pricing: 'Usage-based',
    features: [
      'Trigger workflows on AI detection',
      'Automate compliance processes',
      'Multi-app workflow creation',
      'Custom business logic'
    ],
    apiEndpoints: [
      'POST /api/v1/integrations/zapier/trigger',
      'GET /api/v1/integrations/zapier/workflows',
      'PUT /api/v1/integrations/zapier/update'
    ],
    documentation: '/docs/integrations/zapier',
    setupComplexity: 'simple',
    usageStats: {
      monthlyRequests: 8750,
      averageLatency: 156,
      successRate: 0.995
    }
  },
  {
    id: 'salesforce-cloud',
    name: 'Salesforce Sales Cloud',
    category: 'enterprise',
    icon: '☁️',
    description: 'CRM integration with customer data intelligence and verification',
    provider: 'Salesforce Inc.',
    status: 'available',
    pricing: 'Enterprise tier included',
    features: [
      'Customer data verification',
      'Lead authenticity validation',
      'Contract intelligence analysis',
      'Sales process compliance'
    ],
    apiEndpoints: [
      'POST /api/v1/integrations/salesforce/verify',
      'GET /api/v1/integrations/salesforce/leads',
      'PUT /api/v1/integrations/salesforce/update'
    ],
    documentation: '/docs/integrations/salesforce',
    setupComplexity: 'moderate'
  },
  {
    id: 'aws-lambda',
    name: 'AWS Lambda',
    category: 'developer',
    icon: '🔗',
    description: 'Serverless function integration for scalable intelligence processing',
    provider: 'Amazon Web Services',
    status: 'available',
    pricing: 'AWS pricing model',
    features: [
      'Serverless intelligence processing',
      'Auto-scaling based on demand',
      'Event-driven architectures',
      'Cost-optimized execution'
    ],
    apiEndpoints: [
      'POST /api/v1/integrations/aws/lambda/invoke',
      'GET /api/v1/integrations/aws/lambda/functions',
      'POST /api/v1/integrations/aws/lambda/deploy'
    ],
    documentation: '/docs/integrations/aws-lambda',
    setupComplexity: 'moderate',
    usageStats: {
      monthlyRequests: 45000,
      averageLatency: 234,
      successRate: 0.997
    }
  },
  {
    id: 'splunk-enterprise',
    name: 'Splunk Enterprise Security',
    category: 'security',
    icon: '🔍',
    description: 'SIEM integration for security intelligence and threat detection',
    provider: 'Splunk Inc.',
    status: 'available',
    pricing: 'Enterprise license required',
    features: [
      'Security event correlation',
      'Threat intelligence feeds',
      'Compliance monitoring',
      'Automated incident response'
    ],
    apiEndpoints: [
      'POST /api/v1/integrations/splunk/events',
      'GET /api/v1/integrations/splunk/searches',
      'POST /api/v1/integrations/splunk/alert'
    ],
    documentation: '/docs/integrations/splunk',
    setupComplexity: 'advanced'
  },
  {
    id: 'tableau-server',
    name: 'Tableau Server',
    category: 'analytics',
    icon: '📊',
    description: 'Advanced analytics and visualization for intelligence metrics',
    provider: 'Tableau Software',
    status: 'available',
    pricing: 'Server license required',
    features: [
      'Real-time intelligence dashboards',
      'Custom analytics workflows',
      'Executive reporting automation',
      'Predictive intelligence insights'
    ],
    apiEndpoints: [
      'POST /api/v1/integrations/tableau/datasource',
      'GET /api/v1/integrations/tableau/workbooks',
      'PUT /api/v1/integrations/tableau/refresh'
    ],
    documentation: '/docs/integrations/tableau',
    setupComplexity: 'advanced',
    usageStats: {
      monthlyRequests: 12300,
      averageLatency: 445,
      successRate: 0.992
    }
  },
  {
    id: 'power-bi',
    name: 'Microsoft Power BI',
    category: 'analytics',
    icon: '📈',
    description: 'Business intelligence integration with Microsoft ecosystem',
    provider: 'Microsoft Corporation',
    status: 'beta',
    pricing: 'Power BI Pro license',
    features: [
      'Tri-pillar intelligence reports',
      'Executive dashboard automation',
      'Compliance analytics',
      'Real-time monitoring widgets'
    ],
    apiEndpoints: [
      'POST /api/v1/integrations/powerbi/dataset',
      'GET /api/v1/integrations/powerbi/reports',
      'PUT /api/v1/integrations/powerbi/refresh'
    ],
    documentation: '/docs/integrations/power-bi',
    setupComplexity: 'moderate'
  },
  {
    id: 'servicenow-itsm',
    name: 'ServiceNow ITSM',
    category: 'enterprise',
    icon: '⚙️',
    description: 'IT service management with operations intelligence automation',
    provider: 'ServiceNow Inc.',
    status: 'beta',
    pricing: 'ServiceNow license required',
    features: [
      'Automated incident creation',
      'Change management intelligence',
      'Compliance workflow automation',
      'ITIL process enhancement'
    ],
    apiEndpoints: [
      'POST /api/v1/integrations/servicenow/incident',
      'GET /api/v1/integrations/servicenow/changes',
      'PUT /api/v1/integrations/servicenow/update'
    ],
    documentation: '/docs/integrations/servicenow',
    setupComplexity: 'advanced'
  },
  {
    id: 'github-enterprise',
    name: 'GitHub Enterprise Server',
    category: 'developer',
    icon: '🐙',
    description: 'Code intelligence and repository security for enterprise development',
    provider: 'GitHub Inc.',
    status: 'coming_soon',
    pricing: 'GitHub Enterprise license',
    features: [
      'Code authenticity verification',
      'Commit intelligence analysis',
      'Security compliance automation',
      'Developer workflow integration'
    ],
    apiEndpoints: [
      'POST /api/v1/integrations/github/webhook',
      'GET /api/v1/integrations/github/repositories',
      'POST /api/v1/integrations/github/scan'
    ],
    documentation: '/docs/integrations/github',
    setupComplexity: 'moderate'
  },
  {
    id: 'azure-sentinel',
    name: 'Microsoft Azure Sentinel',
    category: 'security',
    icon: '🛡️',
    description: 'Cloud-native SIEM with AI-powered threat detection',
    provider: 'Microsoft Corporation',
    status: 'coming_soon',
    pricing: 'Azure consumption-based',
    features: [
      'AI-powered threat hunting',
      'Security orchestration',
      'Compliance automation',
      'Incident response workflows'
    ],
    apiEndpoints: [
      'POST /api/v1/integrations/sentinel/incidents',
      'GET /api/v1/integrations/sentinel/workbooks',
      'POST /api/v1/integrations/sentinel/playbook'
    ],
    documentation: '/docs/integrations/azure-sentinel',
    setupComplexity: 'advanced'
  },
  {
    id: 'jira-enterprise',
    name: 'Atlassian Jira Enterprise',
    category: 'workflow',
    icon: '📋',
    description: 'Project management with intelligent workflow automation',
    provider: 'Atlassian Inc.',
    status: 'coming_soon',
    pricing: 'Jira Enterprise license',
    features: [
      'Intelligent ticket routing',
      'Compliance workflow tracking',
      'Automated quality assurance',
      'Project intelligence insights'
    ],
    apiEndpoints: [
      'POST /api/v1/integrations/jira/webhook',
      'GET /api/v1/integrations/jira/projects',
      'PUT /api/v1/integrations/jira/update'
    ],
    documentation: '/docs/integrations/jira',
    setupComplexity: 'moderate'
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All Integrations', count: INTEGRATIONS.length },
  { id: 'enterprise', label: 'Enterprise', count: INTEGRATIONS.filter(i => i.category === 'enterprise').length },
  { id: 'developer', label: 'Developer Tools', count: INTEGRATIONS.filter(i => i.category === 'developer').length },
  { id: 'security', label: 'Security', count: INTEGRATIONS.filter(i => i.category === 'security').length },
  { id: 'analytics', label: 'Analytics', count: INTEGRATIONS.filter(i => i.category === 'analytics').length },
  { id: 'workflow', label: 'Workflow', count: INTEGRATIONS.filter(i => i.category === 'workflow').length },
];

interface IntegrationsClientProps {
  enterpriseId: string;
}

export function IntegrationsClient({ enterpriseId }: IntegrationsClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  const filteredIntegrations = selectedCategory === 'all'
    ? INTEGRATIONS
    : INTEGRATIONS.filter(integration => integration.category === selectedCategory);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-900/50 text-green-300 border-green-700/50';
      case 'beta': return 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50';
      case 'coming_soon': return 'bg-blue-900/50 text-blue-300 border-blue-700/50';
      default: return 'bg-slate-900/50 text-slate-300 border-slate-700/50';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'advanced': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Enterprise Integrations</h1>
          <p className="text-sm text-slate-400 mt-1">
            API marketplace with enterprise connectors for the tri-pillar intelligence platform
          </p>
        </div>
        <div className="text-xs text-slate-500">
          {INTEGRATIONS.length} integrations available
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {category.label} ({category.count})
          </button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration) => (
          <div
            key={integration.id}
            className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50 hover:border-slate-600/50 transition-colors cursor-pointer"
            onClick={() => setSelectedIntegration(integration)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{integration.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{integration.name}</h3>
                  <div className="text-xs text-slate-400">{integration.provider}</div>
                </div>
              </div>
              <div className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(integration.status)}`}>
                {integration.status.replace('_', ' ')}
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-4">{integration.description}</p>

            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <div>
                  <div className="text-slate-400">Setup</div>
                  <div className={`font-medium ${getComplexityColor(integration.setupComplexity)}`}>
                    {integration.setupComplexity}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400">Pricing</div>
                  <div className="text-slate-300 font-medium">{integration.pricing}</div>
                </div>
              </div>

              {integration.usageStats && (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-slate-400">Requests/mo</div>
                    <div className="text-blue-400 font-medium">{formatNumber(integration.usageStats.monthlyRequests)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Latency</div>
                    <div className="text-green-400 font-medium">{integration.usageStats.averageLatency}ms</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Success</div>
                    <div className="text-purple-400 font-medium">
                      {(integration.usageStats.successRate * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Integration Detail Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">{selectedIntegration.icon}</div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white">{selectedIntegration.name}</h2>
                    <p className="text-slate-400">{selectedIntegration.provider}</p>
                  </div>
                  <div className={`px-3 py-1 text-sm rounded-full border ${getStatusColor(selectedIntegration.status)}`}>
                    {selectedIntegration.status.replace('_', ' ')}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedIntegration(null)}
                  className="text-slate-400 hover:text-white text-xl"
                >
                  ✕
                </button>
              </div>

              <p className="text-slate-300 mb-6">{selectedIntegration.description}</p>

              {/* Usage Stats */}
              {selectedIntegration.usageStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400">Monthly Requests</div>
                    <div className="text-xl font-semibold text-blue-400">
                      {formatNumber(selectedIntegration.usageStats.monthlyRequests)}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400">Average Latency</div>
                    <div className="text-xl font-semibold text-green-400">
                      {selectedIntegration.usageStats.averageLatency}ms
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400">Success Rate</div>
                    <div className="text-xl font-semibold text-purple-400">
                      {(selectedIntegration.usageStats.successRate * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Features */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Features</h3>
                    <div className="space-y-2">
                      {selectedIntegration.features.map((feature, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="text-green-400 mt-1">✓</div>
                          <div className="text-sm text-slate-300">{feature}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Setup Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Setup Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-400">Complexity</span>
                        <span className={`text-sm font-medium ${getComplexityColor(selectedIntegration.setupComplexity)}`}>
                          {selectedIntegration.setupComplexity}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-400">Pricing</span>
                        <span className="text-sm text-slate-300">{selectedIntegration.pricing}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-400">Documentation</span>
                        <a
                          href={selectedIntegration.documentation}
                          className="text-sm text-blue-400 hover:text-blue-300"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Docs →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">API Endpoints</h3>
                  <div className="space-y-2">
                    {selectedIntegration.apiEndpoints.map((endpoint, index) => (
                      <div key={index} className="bg-slate-900/50 rounded p-3">
                        <code className="text-xs text-slate-300 font-mono">{endpoint}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-slate-900/50 rounded-lg">
                <div className="text-sm text-slate-400 mb-2">🚀 Enterprise Integration</div>
                <div className="text-sm text-slate-300">
                  This integration leverages the same 95%+ accurate tri-pillar intelligence platform APIs.
                  All enterprise connectors include dedicated support, SLA guarantees, and security compliance.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}