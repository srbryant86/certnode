/**
 * Professional Transaction Report Generator
 *
 * Creates comprehensive, compliance-ready transaction analysis reports
 * for financial institutions, enterprises, and regulatory authorities.
 */

import { ComprehensiveTransactionAnalysis } from './transaction-intelligence-engine'

export interface TransactionReportConfig {
  includeRawData: boolean
  includeForensicEvidence: boolean
  includeComplianceDetails: boolean
  auditFormat: boolean
  regulatoryFormat: boolean
  detailLevel: 'summary' | 'detailed' | 'forensic' | 'regulatory'
  framework: 'SOX' | 'AML' | 'BSA' | 'PCI-DSS' | 'GDPR' | 'ALL'
}

export interface FormattedTransactionReport {
  executive: {
    summary: string
    riskAssessment: string
    recommendation: string
    complianceStatus: string
    fraudAssessment: string
  }
  financial: {
    transactionDetails: string[]
    riskIndicators: string[]
    complianceFlags: string[]
    auditTrail: string[]
  }
  regulatory: {
    complianceScore: string
    regulatoryAlerts: string[]
    reportingRequirements: string[]
    filingRecommendations: string[]
  }
  technical: {
    validationLayers: string[]
    processingMetrics: string
    confidence: string
    analysisId: string
  }
  actionable: {
    immediateActions: string[]
    longTermRecommendations: string[]
    complianceRequirements: string[]
    riskMitigation: string[]
  }
  forensic?: {
    chainOfCustody: string[]
    evidence: Record<string, unknown>
    auditDocuments: Record<string, unknown>
    regulatoryEvidence: Record<string, unknown>
  }
}

/**
 * Generate professional transaction analysis reports
 */
export class TransactionReportGenerator {
  /**
   * Generate formatted report from transaction analysis
   */
  generateReport(
    analysis: ComprehensiveTransactionAnalysis,
    config: Partial<TransactionReportConfig> = {}
  ): FormattedTransactionReport {
    const reportConfig: TransactionReportConfig = {
      includeRawData: false,
      includeForensicEvidence: true,
      includeComplianceDetails: true,
      auditFormat: true,
      regulatoryFormat: true,
      detailLevel: 'detailed',
      framework: 'ALL',
      ...config
    }

    const report: FormattedTransactionReport = {
      executive: this.generateExecutiveSummary(analysis),
      financial: this.generateFinancialAnalysis(analysis),
      regulatory: this.generateRegulatorySection(analysis),
      technical: this.generateTechnicalSection(analysis),
      actionable: this.generateActionableSection(analysis)
    }

    if (reportConfig.detailLevel === 'forensic' || reportConfig.includeForensicEvidence) {
      report.forensic = this.generateForensicSection(analysis)
    }

    return report
  }

  /**
   * Generate executive summary for C-level stakeholders
   */
  private generateExecutiveSummary(analysis: ComprehensiveTransactionAnalysis): FormattedTransactionReport['executive'] {
    const { verification, summary } = analysis

    return {
      summary: this.formatExecutiveSummary(verification, summary),
      riskAssessment: this.formatRiskAssessment(verification),
      recommendation: verification.recommendation,
      complianceStatus: this.formatComplianceStatus(verification.complianceScore),
      fraudAssessment: this.formatFraudAssessment(verification.fraudProbability)
    }
  }

  /**
   * Generate financial analysis section
   */
  private generateFinancialAnalysis(analysis: ComprehensiveTransactionAnalysis): FormattedTransactionReport['financial'] {
    const transactionDetails: string[] = []
    const riskIndicators = [...analysis.summary.riskFactors]
    const complianceFlags = [...analysis.summary.complianceIssues]
    const auditTrail: string[] = []

    // Process validation results
    Object.entries(analysis.validationResults).forEach(([type, result]) => {
      if (result) {
        transactionDetails.push(
          `${result.detector}: ${result.confidence}% confidence, ${result.riskScore}% risk`
        )

        if (result.indicators.length > 0) {
          riskIndicators.push(`${result.detector}: ${result.indicators.join(', ')}`)
        }

        if (result.complianceStatus !== 'passed') {
          complianceFlags.push(`${result.detector}: ${result.complianceStatus}`)
        }
      }
    })

    // Audit trail from chain of custody
    auditTrail.push(...analysis.forensicEvidence.chainOfCustody)

    return {
      transactionDetails,
      riskIndicators,
      complianceFlags,
      auditTrail
    }
  }

  /**
   * Generate regulatory compliance section
   */
  private generateRegulatorySection(analysis: ComprehensiveTransactionAnalysis): FormattedTransactionReport['regulatory'] {
    const reportingRequirements: string[] = []
    const filingRecommendations: string[] = []

    // Check for reporting thresholds
    const amount = Number(analysis.forensicEvidence.analysisMetadata.amount) || 0

    if (amount >= 10000) {
      reportingRequirements.push('CTR (Currency Transaction Report) filing required')
      filingRecommendations.push('File FinCEN Form 104 within 15 days')
    }

    if (analysis.verification.fraudProbability > 75) {
      reportingRequirements.push('SAR (Suspicious Activity Report) consideration required')
      filingRecommendations.push('Evaluate for FinCEN Form 111 filing')
    }

    if (analysis.summary.complianceIssues.some(issue => issue.includes('sanctions'))) {
      reportingRequirements.push('OFAC sanctions review required')
      filingRecommendations.push('Report to appropriate regulatory authorities')
    }

    return {
      complianceScore: `${analysis.verification.complianceScore}% compliant`,
      regulatoryAlerts: analysis.summary.regulatoryAlerts,
      reportingRequirements,
      filingRecommendations
    }
  }

  /**
   * Generate technical details section
   */
  private generateTechnicalSection(analysis: ComprehensiveTransactionAnalysis): FormattedTransactionReport['technical'] {
    const validationLayers = Object.entries(analysis.validationResults)
      .filter(([_, result]) => result !== null)
      .map(([layer, result]) => `${layer}: ${result!.detector}`)

    return {
      validationLayers,
      processingMetrics: `${analysis.summary.processingTime}ms (${validationLayers.length} layers)`,
      confidence: `${analysis.verification.confidence}% confidence`,
      analysisId: analysis.verification.analysisId
    }
  }

  /**
   * Generate actionable recommendations section
   */
  private generateActionableSection(analysis: ComprehensiveTransactionAnalysis): FormattedTransactionReport['actionable'] {
    const immediateActions = this.generateImmediateActions(analysis)
    const longTermRecommendations = this.generateLongTermRecommendations(analysis)
    const complianceRequirements = this.generateComplianceRequirements(analysis)
    const riskMitigation = this.generateRiskMitigation(analysis)

    return {
      immediateActions,
      longTermRecommendations,
      complianceRequirements,
      riskMitigation
    }
  }

  /**
   * Generate forensic evidence section
   */
  private generateForensicSection(analysis: ComprehensiveTransactionAnalysis): FormattedTransactionReport['forensic'] {
    return {
      chainOfCustody: analysis.forensicEvidence.chainOfCustody,
      evidence: {
        transactionHash: analysis.forensicEvidence.transactionHash,
        analysisMetadata: analysis.forensicEvidence.analysisMetadata,
        validationResults: analysis.validationResults
      },
      auditDocuments: analysis.forensicEvidence.complianceDocuments,
      regulatoryEvidence: analysis.forensicEvidence.regulatoryEvidence
    }
  }

  /**
   * Helper formatting methods
   */
  private formatExecutiveSummary(verification: any, summary: any): string {
    const confidenceDesc = this.getConfidenceDescription(verification.confidence)
    const riskDesc = this.getRiskDescription(verification.riskLevel)

    return `Transaction intelligence analysis completed using 10-layer validation system. ` +
           `${confidenceDesc} ${riskDesc} Fraud probability: ${verification.fraudProbability}%. ` +
           `Compliance score: ${verification.complianceScore}%.`
  }

  private formatRiskAssessment(verification: any): string {
    const riskMap = {
      'low': 'Low Risk - Transaction appears legitimate with minimal indicators',
      'medium': 'Medium Risk - Some risk factors identified, enhanced monitoring recommended',
      'high': 'High Risk - Significant risk factors detected, manual review required',
      'critical': 'Critical Risk - Multiple risk indicators, transaction should be blocked'
    }
    return riskMap[verification.riskLevel as keyof typeof riskMap] || verification.riskLevel
  }

  private formatComplianceStatus(score: number): string {
    if (score >= 90) return 'Fully Compliant - All regulatory requirements satisfied'
    if (score >= 75) return 'Mostly Compliant - Minor compliance gaps identified'
    if (score >= 50) return 'Partially Compliant - Significant compliance issues require attention'
    return 'Non-Compliant - Major regulatory violations detected'
  }

  private formatFraudAssessment(probability: number): string {
    if (probability <= 20) return 'Low Fraud Risk - Transaction patterns appear normal'
    if (probability <= 40) return 'Moderate Fraud Risk - Some suspicious indicators present'
    if (probability <= 70) return 'High Fraud Risk - Multiple fraud indicators detected'
    return 'Critical Fraud Risk - Strong indicators of fraudulent activity'
  }

  private getConfidenceDescription(confidence: number): string {
    if (confidence >= 90) return 'High confidence in transaction analysis.'
    if (confidence >= 70) return 'Good confidence in transaction analysis.'
    if (confidence >= 50) return 'Moderate confidence in transaction analysis.'
    return 'Low confidence in transaction analysis.'
  }

  private getRiskDescription(riskLevel: string): string {
    const descriptions = {
      'low': 'Transaction poses minimal risk to the organization.',
      'medium': 'Transaction requires standard risk management procedures.',
      'high': 'Transaction requires enhanced scrutiny and controls.',
      'critical': 'Transaction poses significant risk and requires immediate attention.'
    }
    return descriptions[riskLevel as keyof typeof descriptions] || ''
  }

  private generateImmediateActions(analysis: ComprehensiveTransactionAnalysis): string[] {
    const actions: string[] = []

    switch (analysis.verification.riskLevel) {
      case 'critical':
        actions.push('IMMEDIATE: Block transaction processing')
        actions.push('IMMEDIATE: Escalate to compliance team')
        actions.push('IMMEDIATE: Notify security operations center')
        break

      case 'high':
        actions.push('Hold transaction for manual review')
        actions.push('Contact customer for additional verification')
        actions.push('Enhanced due diligence procedures')
        break

      case 'medium':
        actions.push('Apply enhanced monitoring')
        actions.push('Document risk factors in customer file')
        actions.push('Review customer risk profile')
        break

      case 'low':
        actions.push('Process transaction normally')
        actions.push('Maintain standard audit records')
        break
    }

    // Compliance-specific actions
    if (analysis.verification.complianceScore < 70) {
      actions.push('Address identified compliance deficiencies')
    }

    if (analysis.summary.regulatoryAlerts.length > 0) {
      actions.push('Review regulatory alert notifications')
    }

    return actions
  }

  private generateLongTermRecommendations(analysis: ComprehensiveTransactionAnalysis): string[] {
    const recommendations: string[] = []

    // Risk-based recommendations
    if (analysis.verification.fraudProbability > 30) {
      recommendations.push('Review and enhance fraud detection algorithms')
      recommendations.push('Consider customer risk rating adjustment')
    }

    // Compliance recommendations
    if (analysis.verification.complianceScore < 85) {
      recommendations.push('Strengthen compliance monitoring procedures')
      recommendations.push('Enhanced staff training on regulatory requirements')
    }

    // System improvements
    if (analysis.summary.processingTime > 1000) {
      recommendations.push('Optimize transaction processing performance')
    }

    recommendations.push('Regular review of risk assessment parameters')
    recommendations.push('Periodic audit of transaction monitoring effectiveness')

    return recommendations
  }

  private generateComplianceRequirements(analysis: ComprehensiveTransactionAnalysis): string[] {
    const requirements: string[] = []

    // Based on amount thresholds
    const amount = Number(analysis.forensicEvidence.analysisMetadata.amount) || 0

    if (amount >= 10000) {
      requirements.push('BSA/AML: Currency Transaction Report (CTR) filing')
      requirements.push('Record retention: 5-year requirement for transaction records')
    }

    if (analysis.verification.fraudProbability > 50) {
      requirements.push('BSA/AML: Consider Suspicious Activity Report (SAR) filing')
      requirements.push('Enhanced customer due diligence documentation')
    }

    // General compliance requirements
    requirements.push('SOX: Maintain adequate internal controls documentation')
    requirements.push('Audit: Ensure complete transaction audit trail')

    if (analysis.summary.complianceIssues.length > 0) {
      requirements.push('Remediate identified compliance deficiencies')
    }

    return requirements
  }

  private generateRiskMitigation(analysis: ComprehensiveTransactionAnalysis): string[] {
    const mitigation: string[] = []

    // Risk-specific mitigation
    analysis.summary.riskFactors.forEach(factor => {
      if (factor.includes('velocity')) {
        mitigation.push('Implement transaction velocity controls')
      }
      if (factor.includes('amount')) {
        mitigation.push('Review transaction amount thresholds')
      }
      if (factor.includes('location')) {
        mitigation.push('Enhance geographic risk monitoring')
      }
      if (factor.includes('payment')) {
        mitigation.push('Strengthen payment method validation')
      }
    })

    // General mitigation strategies
    mitigation.push('Regular risk assessment model calibration')
    mitigation.push('Continuous monitoring system enhancement')
    mitigation.push('Staff training on emerging risk patterns')

    return [...new Set(mitigation)] // Remove duplicates
  }

  /**
   * Generate regulatory-specific reports
   */
  generateComplianceReport(analysis: ComprehensiveTransactionAnalysis): {
    summary: string
    violations: string[]
    recommendations: string[]
    filingRequirements: string[]
  } {
    return {
      summary: `Compliance analysis: ${analysis.verification.complianceScore}% compliant`,
      violations: analysis.summary.complianceIssues,
      recommendations: this.generateComplianceRequirements(analysis),
      filingRequirements: this.generateRegulatorySection(analysis).reportingRequirements
    }
  }

  /**
   * Generate fraud assessment report
   */
  generateFraudReport(analysis: ComprehensiveTransactionAnalysis): {
    riskScore: number
    indicators: string[]
    recommendation: string
    actions: string[]
  } {
    return {
      riskScore: analysis.verification.fraudProbability,
      indicators: analysis.summary.riskFactors,
      recommendation: analysis.verification.recommendation,
      actions: this.generateImmediateActions(analysis)
    }
  }

  /**
   * Generate audit-ready documentation
   */
  generateAuditReport(analysis: ComprehensiveTransactionAnalysis): {
    analysisId: string
    timestamp: string
    transactionHash: string
    validationLayers: string[]
    evidence: Record<string, any>
    chainOfCustody: string[]
    complianceStatus: string
  } {
    return {
      analysisId: analysis.verification.analysisId,
      timestamp: analysis.forensicEvidence.timestamp,
      transactionHash: analysis.forensicEvidence.transactionHash,
      validationLayers: Object.values(analysis.validationResults)
        .filter(Boolean)
        .map(result => result!.detector),
      evidence: analysis.validationResults,
      chainOfCustody: analysis.forensicEvidence.chainOfCustody,
      complianceStatus: this.formatComplianceStatus(analysis.verification.complianceScore)
    }
  }
}

// Export singleton instance
export const transactionReportGenerator = new TransactionReportGenerator()