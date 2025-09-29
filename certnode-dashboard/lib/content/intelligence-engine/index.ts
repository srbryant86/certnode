/**
 * Unified Content Intelligence Engine
 *
 * Export all components of the comprehensive content analysis system
 */

// Core engine
export {
  contentIntelligenceEngine,
  type ContentInput,
  type ComprehensiveAnalysis,
  type DetectorResult,
  type AnalysisConfig,
  ContentIntelligenceEngine
} from './content-intelligence-engine'

// Detector coordination
export {
  detectorCoordinator,
  type DetectorConfig,
  type DetectorExecution,
  type CoordinationResult,
  DetectorCoordinator
} from './detector-coordinator'

// Professional reporting
export {
  reportGenerator,
  type ReportConfig,
  type FormattedReport,
  ReportGenerator
} from './report-generator'

// Convenience exports for common use cases
export const IntelligenceEngine = {
  analyze: contentIntelligenceEngine.analyzeContent.bind(contentIntelligenceEngine),
  generateReport: reportGenerator.generateReport.bind(reportGenerator),
  getCustomerSummary: reportGenerator.generateCustomerSummary.bind(reportGenerator),
  getAuditReport: reportGenerator.generateAuditReport.bind(reportGenerator),
  getCoordinatorMetrics: detectorCoordinator.getMetrics.bind(detectorCoordinator)
}

// System information
export const SYSTEM_INFO = {
  name: 'CertNode Unified Content Intelligence Engine',
  version: '1.0.0',
  description: 'Comprehensive content analysis with multi-detector orchestration',
  capabilities: [
    'AI-generated content detection',
    'Image metadata analysis',
    'Manipulation detection',
    'Pattern analysis',
    'Cryptographic validation',
    'Forensic evidence compilation',
    'Professional reporting',
    'Risk assessment'
  ],
  detectors: [
    'Advanced Text AI Detection',
    'Image Metadata Analysis',
    'Content Manipulation Detection',
    'Pattern Analysis Engine'
  ]
}