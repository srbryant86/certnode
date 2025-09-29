/**
 * Transaction Intelligence Engine
 *
 * Export all components of the comprehensive transaction analysis system
 */

// Core engine
export {
  transactionIntelligenceEngine,
  type TransactionInput,
  type ComprehensiveTransactionAnalysis,
  type TransactionDetectorResult,
  type TransactionAnalysisConfig,
  TransactionIntelligenceEngine
} from './transaction-intelligence-engine'

// Professional reporting
export {
  transactionReportGenerator,
  type TransactionReportConfig,
  type FormattedTransactionReport,
  TransactionReportGenerator
} from './transaction-report-generator'

// Convenience exports for common use cases
export const TransactionIntelligence = {
  analyze: transactionIntelligenceEngine.analyzeTransaction.bind(transactionIntelligenceEngine),
  generateReport: transactionReportGenerator.generateReport.bind(transactionReportGenerator),
  getComplianceReport: transactionReportGenerator.generateComplianceReport.bind(transactionReportGenerator),
  getFraudReport: transactionReportGenerator.generateFraudReport.bind(transactionReportGenerator),
  getAuditReport: transactionReportGenerator.generateAuditReport.bind(transactionReportGenerator)
}

// System information
export const TRANSACTION_SYSTEM_INFO = {
  name: 'CertNode Transaction Intelligence Engine',
  version: '1.0.0',
  description: 'Comprehensive financial transaction analysis with 10-layer validation',
  capabilities: [
    'Fraud detection and prevention',
    'Regulatory compliance automation',
    'Risk assessment and scoring',
    'AML/BSA compliance monitoring',
    'Real-time transaction validation',
    'Professional compliance reporting',
    'Audit-ready documentation',
    'Forensic evidence compilation'
  ],
  validationLayers: [
    'Schema Validation',
    'Business Rules Validation',
    'Fraud Detection Engine',
    'Cryptographic Validation',
    'Regulatory Compliance Engine',
    'Authorization Validation',
    'Temporal Validation',
    'Cross-Reference Validation',
    'Risk Assessment Engine',
    'Audit Trail Validation'
  ],
  complianceFrameworks: [
    'AML (Anti-Money Laundering)',
    'BSA (Bank Secrecy Act)',
    'SOX (Sarbanes-Oxley)',
    'PCI-DSS (Payment Card Industry)',
    'GDPR (General Data Protection Regulation)',
    'OFAC (Office of Foreign Assets Control)'
  ]
}