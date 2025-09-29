/**
 * Professional Report Generator
 *
 * Creates comprehensive, professional-grade analysis reports
 * for content certification with detailed evidence and recommendations.
 */

import { ComprehensiveAnalysis } from './content-intelligence-engine'

export interface ReportConfig {
  includeRawData: boolean
  includeEvidence: boolean
  includeRecommendations: boolean
  professionalFormat: boolean
  detailLevel: 'summary' | 'detailed' | 'forensic'
}

export interface FormattedReport {
  executive: {
    summary: string
    confidence: string
    recommendation: string
    riskLevel: string
  }
  analysis: {
    overview: string
    detectorResults: string[]
    keyFindings: string[]
    evidence: string[]
  }
  technical: {
    processingTime: string
    detectorsUsed: string[]
    confidence: string
    analysisId: string
  }
  actionable: {
    recommendations: string[]
    nextSteps: string[]
    considerations: string[]
  }
  forensic?: {
    chainOfCustody: string[]
    evidence: Record<string, unknown>
    metadata: Record<string, unknown>
  }
}

/**
 * Generate professional analysis reports
 */
export class ReportGenerator {
  /**
   * Generate formatted report from analysis
   */
  generateReport(
    analysis: ComprehensiveAnalysis,
    config: Partial<ReportConfig> = {}
  ): FormattedReport {
    const reportConfig: ReportConfig = {
      includeRawData: false,
      includeEvidence: true,
      includeRecommendations: true,
      professionalFormat: true,
      detailLevel: 'detailed',
      ...config
    }

    const report: FormattedReport = {
      executive: this.generateExecutiveSummary(analysis),
      analysis: this.generateAnalysisSection(analysis),
      technical: this.generateTechnicalSection(analysis),
      actionable: this.generateActionableSection(analysis)
    }

    if (reportConfig.detailLevel === 'forensic' || reportConfig.includeEvidence) {
      report.forensic = this.generateForensicSection(analysis)
    }

    return report
  }

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(analysis: ComprehensiveAnalysis): FormattedReport['executive'] {
    const { authenticity, summary } = analysis

    return {
      summary: this.formatExecutiveSummary(authenticity, summary),
      confidence: `${authenticity.confidence}% authenticity confidence`,
      recommendation: authenticity.recommendation,
      riskLevel: this.formatRiskLevel(authenticity.riskLevel)
    }
  }

  /**
   * Generate detailed analysis section
   */
  private generateAnalysisSection(analysis: ComprehensiveAnalysis): FormattedReport['analysis'] {
    const detectorResults: string[] = []
    const keyFindings = [...analysis.summary.keyFindings]
    const evidence: string[] = []

    // Process detector results
    Object.entries(analysis.detectionResults).forEach(([type, result]) => {
      if (result) {
        detectorResults.push(
          `${result.detector}: ${result.confidence.toFixed(1)}% confidence - ${result.reasoning}`
        )

        if (result.indicators.length > 0) {
          evidence.push(`${result.detector} indicators: ${result.indicators.join(', ')}`)
        }
      }
    })

    return {
      overview: this.generateAnalysisOverview(analysis),
      detectorResults,
      keyFindings,
      evidence
    }
  }

  /**
   * Generate technical details section
   */
  private generateTechnicalSection(analysis: ComprehensiveAnalysis): FormattedReport['technical'] {
    const detectorsUsed = Object.entries(analysis.detectionResults)
      .filter(([_, result]) => result !== null)
      .map(([_, result]) => result!.detector)

    return {
      processingTime: `${analysis.summary.processingTime}ms`,
      detectorsUsed,
      confidence: `${analysis.authenticity.confidence}%`,
      analysisId: analysis.authenticity.analysisId
    }
  }

  /**
   * Generate actionable recommendations section
   */
  private generateActionableSection(analysis: ComprehensiveAnalysis): FormattedReport['actionable'] {
    const nextSteps = this.generateNextSteps(analysis)
    const considerations = this.generateConsiderations(analysis)

    return {
      recommendations: analysis.summary.recommendations,
      nextSteps,
      considerations
    }
  }

  /**
   * Generate forensic evidence section
   */
  private generateForensicSection(analysis: ComprehensiveAnalysis): FormattedReport['forensic'] {
    return {
      chainOfCustody: analysis.forensicEvidence.chainOfCustody,
      evidence: analysis.forensicEvidence.supportingData,
      metadata: analysis.forensicEvidence.analysisMetadata
    }
  }

  /**
   * Helper formatting methods
   */
  private formatExecutiveSummary(authenticity: any, summary: any): string {
    const confidenceDesc = this.getConfidenceDescription(authenticity.confidence)
    const detectorsRun = Object.keys(summary).length || 'multiple'

    return `Content analysis completed using ${detectorsRun} detection methods. ` +
           `${confidenceDesc} The content has been assessed as ${authenticity.riskLevel} risk ` +
           `with ${authenticity.confidence}% authenticity confidence.`
  }

  private formatRiskLevel(riskLevel: string): string {
    const levelMap = {
      'low': 'Low Risk - Content appears authentic',
      'medium': 'Medium Risk - Some concerns identified',
      'high': 'High Risk - Significant concerns detected',
      'critical': 'Critical Risk - Content likely inauthentic'
    }
    return levelMap[riskLevel as keyof typeof levelMap] || riskLevel
  }

  private getConfidenceDescription(confidence: number): string {
    if (confidence >= 90) return 'High confidence in authenticity assessment.'
    if (confidence >= 70) return 'Good confidence in authenticity assessment.'
    if (confidence >= 50) return 'Moderate confidence in authenticity assessment.'
    return 'Low confidence in authenticity assessment.'
  }

  private generateAnalysisOverview(analysis: ComprehensiveAnalysis): string {
    const completedDetectors = Object.values(analysis.detectionResults)
      .filter(Boolean).length

    const avgConfidence = Object.values(analysis.detectionResults)
      .filter(Boolean)
      .reduce((sum, result) => sum + result!.confidence, 0) / completedDetectors || 0

    return `Comprehensive analysis conducted using ${completedDetectors} specialized detectors. ` +
           `Average detector confidence: ${avgConfidence.toFixed(1)}%. ` +
           `Analysis completed in ${analysis.summary.processingTime}ms.`
  }

  private generateNextSteps(analysis: ComprehensiveAnalysis): string[] {
    const steps: string[] = []

    switch (analysis.authenticity.riskLevel) {
      case 'low':
        steps.push('Content is approved for use')
        steps.push('Maintain audit trail for compliance')
        steps.push('No additional verification required')
        break

      case 'medium':
        steps.push('Review identified concerns before proceeding')
        steps.push('Consider additional verification methods')
        steps.push('Document decision rationale')
        break

      case 'high':
        steps.push('Manual review required before use')
        steps.push('Investigate specific risk factors')
        steps.push('Consider rejecting or flagging content')
        break

      case 'critical':
        steps.push('Do not use content without investigation')
        steps.push('Escalate to security team')
        steps.push('Implement additional verification measures')
        break
    }

    return steps
  }

  private generateConsiderations(analysis: ComprehensiveAnalysis): string[] {
    const considerations: string[] = []

    // Risk-based considerations
    if (analysis.summary.riskFactors.length > 0) {
      considerations.push('Multiple risk factors identified - proceed with caution')
    }

    // Detector-specific considerations
    if (analysis.detectionResults.aiGenerated?.confidence < 50) {
      considerations.push('High probability of AI-generated content')
    }

    if (analysis.detectionResults.metadata?.confidence < 60) {
      considerations.push('Metadata inconsistencies may indicate manipulation')
    }

    if (analysis.detectionResults.cryptographic?.confidence < 100) {
      considerations.push('Cryptographic validation concerns detected')
    }

    // General considerations
    considerations.push('Analysis based on available detection methods')
    considerations.push('Consider context and use case when making decisions')

    if (analysis.summary.processingTime > 5000) {
      considerations.push('Extended processing time may indicate complex content')
    }

    return considerations
  }

  /**
   * Generate customer-friendly summary
   */
  generateCustomerSummary(analysis: ComprehensiveAnalysis): {
    status: string
    confidence: string
    message: string
    details: string[]
  } {
    const { authenticity, summary } = analysis

    const statusMap = {
      'low': 'Verified',
      'medium': 'Review Required',
      'high': 'Caution Advised',
      'critical': 'Rejected'
    }

    return {
      status: statusMap[authenticity.riskLevel as keyof typeof statusMap] || 'Unknown',
      confidence: `${authenticity.confidence}%`,
      message: authenticity.recommendation,
      details: summary.keyFindings.slice(0, 3) // Top 3 findings
    }
  }

  /**
   * Generate technical audit report
   */
  generateAuditReport(analysis: ComprehensiveAnalysis): {
    analysisId: string
    timestamp: string
    contentHash: string
    detectors: string[]
    results: Record<string, any>
    chainOfCustody: string[]
  } {
    return {
      analysisId: analysis.authenticity.analysisId,
      timestamp: analysis.forensicEvidence.timestamp,
      contentHash: analysis.forensicEvidence.contentHash,
      detectors: Object.values(analysis.detectionResults)
        .filter(Boolean)
        .map(result => result!.detector),
      results: analysis.detectionResults,
      chainOfCustody: analysis.forensicEvidence.chainOfCustody
    }
  }
}

// Export singleton instance
export const reportGenerator = new ReportGenerator()