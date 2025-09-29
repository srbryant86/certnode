/**
 * Operations Trust Intelligence Engine
 *
 * Export all components of the comprehensive operational analysis system
 */

// Core engine
export {
  operationsIntelligenceEngine,
  type OperationalInput,
  type ComprehensiveOperationalAnalysis,
  type OperationalDetectorResult,
  type OperationalAnalysisConfig,
  OperationsIntelligenceEngine
} from './operations-intelligence-engine'

// Professional reporting
export {
  operationsReportGenerator,
  type OperationsReportConfig,
  type FormattedOperationsReport,
  OperationsReportGenerator
} from './operations-report-generator'

// Convenience exports for common use cases
export const OperationsIntelligence = {
  analyze: operationsIntelligenceEngine.analyzeOperation.bind(operationsIntelligenceEngine),
  generateReport: operationsReportGenerator.generateReport.bind(operationsReportGenerator),
  getIncidentReport: operationsReportGenerator.generateIncidentReport.bind(operationsReportGenerator),
  getBuildProvenanceReport: operationsReportGenerator.generateBuildProvenanceReport.bind(operationsReportGenerator),
  getPolicyChangeReport: operationsReportGenerator.generatePolicyChangeReport.bind(operationsReportGenerator),
  getAuditReport: operationsReportGenerator.generateAuditReport.bind(operationsReportGenerator)
}

// System information
export const OPERATIONS_SYSTEM_INFO = {
  name: 'CertNode Operations Trust Intelligence Engine',
  version: '1.0.0',
  description: 'Comprehensive operational compliance analysis with 10-layer validation',
  capabilities: [
    'Incident management and attestation',
    'Build provenance validation',
    'Policy change compliance',
    'Operational risk assessment',
    'Regulatory compliance automation',
    'Professional audit documentation',
    'Stakeholder notification management',
    'Forensic evidence compilation'
  ],
  validationLayers: [
    'Process Validation',
    'Compliance Validation',
    'Security Validation',
    'Business Impact Assessment',
    'Audit Validation',
    'Governance Validation',
    'Risk Assessment',
    'Stakeholder Validation',
    'Documentation Validation',
    'Continuity Planning'
  ],
  operationTypes: [
    'incident',
    'build_provenance',
    'policy_change',
    'sla_breach',
    'compliance_report',
    'audit_event'
  ],
  complianceFrameworks: [
    'SOX (Sarbanes-Oxley)',
    'ISO 27001 (Information Security)',
    'NIST (Cybersecurity Framework)',
    'COBIT (IT Governance)',
    'ITIL (IT Service Management)',
    'PCI-DSS (Payment Security)',
    'HIPAA (Healthcare Privacy)',
    'GDPR (Data Protection)'
  ]
}