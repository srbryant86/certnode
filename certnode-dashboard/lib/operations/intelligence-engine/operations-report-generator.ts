/**
 * Professional Operations Report Generator
 *
 * Creates comprehensive, compliance-ready operational analysis reports
 * for enterprises, auditors, and regulatory authorities covering
 * incident management, build provenance, and policy compliance.
 */

import { ComprehensiveOperationalAnalysis } from './operations-intelligence-engine'

export interface OperationsReportConfig {
  includeRawData: boolean
  includeForensicEvidence: boolean
  includeComplianceDetails: boolean
  auditFormat: boolean
  regulatoryFormat: boolean
  detailLevel: 'summary' | 'detailed' | 'forensic' | 'regulatory'
  framework: 'SOX' | 'ISO27001' | 'NIST' | 'COBIT' | 'ITIL' | 'ALL'
  operationType: 'incident' | 'build_provenance' | 'policy_change' | 'sla_breach' | 'compliance_report' | 'audit_event'
}

export interface FormattedOperationsReport {
  executive: {
    summary: string
    operationalAssessment: string
    recommendation: string
    complianceStatus: string
    businessImpact: string
    escalationRequired: boolean
  }
  operational: {
    processDetails: string[]
    riskIndicators: string[]
    complianceFindings: string[]
    auditTrail: string[]
    stakeholderActions: string[]
  }
  compliance: {
    frameworkCompliance: string
    regulatoryAlerts: string[]
    reportingRequirements: string[]
    governanceRecommendations: string[]
    auditRequirements: string[]
  }
  technical: {
    validationLayers: string[]
    processingMetrics: string
    confidence: string
    analysisId: string
    systemReliability: string
  }
  actionable: {
    immediateActions: string[]
    longTermRecommendations: string[]
    complianceRequirements: string[]
    riskMitigation: string[]
    stakeholderNotifications: string[]
  }
  attestation?: {
    chainOfCustody: string[]
    evidence: Record<string, unknown>
    auditDocuments: Record<string, unknown>
    governanceEvidence: Record<string, unknown>
    stakeholderApprovals: Array<{
      stakeholder: string
      approval: string
      timestamp: string
      evidence: string
    }>
  }
}

/**
 * Generate professional operational analysis reports
 */
export class OperationsReportGenerator {
  /**
   * Generate formatted report from operational analysis
   */
  generateReport(
    analysis: ComprehensiveOperationalAnalysis,
    config: Partial<OperationsReportConfig> = {}
  ): FormattedOperationsReport {
    const reportConfig: OperationsReportConfig = {
      includeRawData: false,
      includeForensicEvidence: true,
      includeComplianceDetails: true,
      auditFormat: true,
      regulatoryFormat: true,
      detailLevel: 'detailed',
      framework: 'ALL',
      operationType: 'incident', // Default, should be overridden
      ...config
    }

    const report: FormattedOperationsReport = {
      executive: this.generateExecutiveSummary(analysis),
      operational: this.generateOperationalAnalysis(analysis),
      compliance: this.generateComplianceSection(analysis, reportConfig.framework),
      technical: this.generateTechnicalSection(analysis),
      actionable: this.generateActionableSection(analysis)
    }

    if (reportConfig.detailLevel === 'forensic' || reportConfig.includeForensicEvidence) {
      report.attestation = this.generateAttestationSection(analysis)
    }

    return report
  }

  /**
   * Generate executive summary for C-level stakeholders
   */
  private generateExecutiveSummary(analysis: ComprehensiveOperationalAnalysis): FormattedOperationsReport['executive'] {
    const { verification, summary } = analysis

    return {
      summary: this.formatExecutiveSummary(verification, summary),
      operationalAssessment: this.formatOperationalAssessment(verification),
      recommendation: verification.recommendation,
      complianceStatus: this.formatComplianceStatus(verification.complianceScore),
      businessImpact: verification.businessImpact,
      escalationRequired: verification.requiresEscalation
    }
  }

  /**
   * Generate operational analysis section
   */
  private generateOperationalAnalysis(analysis: ComprehensiveOperationalAnalysis): FormattedOperationsReport['operational'] {
    const processDetails: string[] = []
    const riskIndicators = [...analysis.summary.operationalRisks]
    const complianceFindings = [...analysis.summary.complianceGaps]
    const auditTrail = [...analysis.verification.auditTrail]
    const stakeholderActions: string[] = []

    // Process validation results
    Object.entries(analysis.validationResults).forEach(([type, result]) => {
      if (result) {
        processDetails.push(
          `${result.detector}: ${result.confidence}% confidence, ${result.riskScore}% risk, ${result.complianceScore}% compliance`
        )

        if (result.indicators.length > 0) {
          riskIndicators.push(`${result.detector}: ${result.indicators.join(', ')}`)
        }

        if (result.complianceStatus !== 'passed') {
          complianceFindings.push(`${result.detector}: ${result.complianceStatus}`)
        }
      }
    })

    // Extract stakeholder actions from attestation evidence
    if (analysis.attestationEvidence.stakeholderApprovals.length > 0) {
      analysis.attestationEvidence.stakeholderApprovals.forEach(approval => {
        stakeholderActions.push(`${approval.stakeholder}: ${approval.approval} (${approval.timestamp})`)
      })
    }

    return {
      processDetails,
      riskIndicators: [...new Set(riskIndicators)],
      complianceFindings: [...new Set(complianceFindings)],
      auditTrail,
      stakeholderActions
    }
  }

  /**
   * Generate compliance section
   */
  private generateComplianceSection(
    analysis: ComprehensiveOperationalAnalysis,
    framework: string
  ): FormattedOperationsReport['compliance'] {
    const reportingRequirements: string[] = []
    const governanceRecommendations: string[] = []
    const auditRequirements: string[] = []

    // Framework-specific compliance analysis
    if (framework === 'SOX' || framework === 'ALL') {
      if (analysis.verification.riskLevel === 'high' || analysis.verification.riskLevel === 'critical') {
        reportingRequirements.push('SOX: Document financial impact assessment and controls testing')
        governanceRecommendations.push('SOX: Ensure segregation of duties in operational processes')
      }
    }

    if (framework === 'ISO27001' || framework === 'ALL') {
      reportingRequirements.push('ISO 27001: Maintain incident management documentation')
      governanceRecommendations.push('ISO 27001: Conduct business impact analysis for security events')
    }

    if (framework === 'NIST' || framework === 'ALL') {
      if (analysis.verification.operationalRisk > 50) {
        reportingRequirements.push('NIST: Document risk assessment and mitigation strategies')
        governanceRecommendations.push('NIST: Implement continuous monitoring procedures')
      }
    }

    // General audit requirements
    auditRequirements.push('Maintain complete operational audit trail')
    auditRequirements.push('Document all stakeholder approvals and decisions')
    auditRequirements.push('Preserve evidence for regulatory compliance validation')

    if (analysis.verification.requiresEscalation) {
      auditRequirements.push('Document escalation procedures and management approval')
    }

    return {
      frameworkCompliance: `${analysis.verification.complianceScore}% compliant across ${framework} framework(s)`,
      regulatoryAlerts: analysis.summary.criticalFindings,
      reportingRequirements: [...new Set(reportingRequirements)],
      governanceRecommendations: [...new Set(governanceRecommendations)],
      auditRequirements: [...new Set(auditRequirements)]
    }
  }

  /**
   * Generate technical details section
   */
  private generateTechnicalSection(analysis: ComprehensiveOperationalAnalysis): FormattedOperationsReport['technical'] {
    const validationLayers = Object.entries(analysis.validationResults)
      .filter(([_, result]) => result !== null)
      .map(([layer, result]) => `${layer}: ${result!.detector}`)

    const systemReliability = this.calculateSystemReliability(analysis)

    return {
      validationLayers,
      processingMetrics: `${analysis.summary.processingTime}ms (${validationLayers.length} layers)`,
      confidence: `${analysis.verification.confidence}% confidence`,
      analysisId: analysis.verification.analysisId,
      systemReliability
    }
  }

  /**
   * Generate actionable recommendations section
   */
  private generateActionableSection(analysis: ComprehensiveOperationalAnalysis): FormattedOperationsReport['actionable'] {
    const immediateActions = this.generateImmediateActions(analysis)
    const longTermRecommendations = this.generateLongTermRecommendations(analysis)
    const complianceRequirements = this.generateComplianceRequirements(analysis)
    const riskMitigation = this.generateRiskMitigation(analysis)
    const stakeholderNotifications = this.generateStakeholderNotifications(analysis)

    return {
      immediateActions,
      longTermRecommendations,
      complianceRequirements,
      riskMitigation,
      stakeholderNotifications
    }
  }

  /**
   * Generate attestation evidence section
   */
  private generateAttestationSection(analysis: ComprehensiveOperationalAnalysis): FormattedOperationsReport['attestation'] {
    return {
      chainOfCustody: analysis.attestationEvidence.chainOfCustody,
      evidence: {
        operationalHash: analysis.attestationEvidence.operationalHash,
        analysisMetadata: analysis.attestationEvidence.analysisMetadata,
        validationResults: analysis.validationResults
      },
      auditDocuments: analysis.attestationEvidence.auditEvidence,
      governanceEvidence: analysis.attestationEvidence.governanceEvidence,
      stakeholderApprovals: analysis.attestationEvidence.stakeholderApprovals
    }
  }

  /**
   * Helper formatting methods
   */
  private formatExecutiveSummary(verification: any, summary: any): string {
    const confidenceDesc = this.getConfidenceDescription(verification.confidence)
    const riskDesc = this.getRiskDescription(verification.riskLevel)

    return `Operational intelligence analysis completed using 10-layer validation system. ` +
           `${confidenceDesc} ${riskDesc} Operational risk: ${verification.operationalRisk}%. ` +
           `Compliance score: ${verification.complianceScore}%. ` +
           `${verification.requiresEscalation ? 'Management escalation required.' : 'Standard procedures apply.'}`
  }

  private formatOperationalAssessment(verification: any): string {
    const riskMap = {
      'low': 'Low Risk - Operation follows standard procedures with minimal oversight required',
      'medium': 'Medium Risk - Enhanced monitoring and documentation recommended',
      'high': 'High Risk - Management approval and enhanced controls required',
      'critical': 'Critical Risk - Immediate escalation and comprehensive risk mitigation required'
    }
    return riskMap[verification.riskLevel as keyof typeof riskMap] || verification.riskLevel
  }

  private formatComplianceStatus(score: number): string {
    if (score >= 90) return 'Fully Compliant - All operational requirements satisfied'
    if (score >= 75) return 'Mostly Compliant - Minor operational gaps identified'
    if (score >= 50) return 'Partially Compliant - Significant operational issues require attention'
    return 'Non-Compliant - Major operational violations detected'
  }

  private getConfidenceDescription(confidence: number): string {
    if (confidence >= 90) return 'High confidence in operational analysis.'
    if (confidence >= 70) return 'Good confidence in operational analysis.'
    if (confidence >= 50) return 'Moderate confidence in operational analysis.'
    return 'Low confidence in operational analysis.'
  }

  private getRiskDescription(riskLevel: string): string {
    const descriptions = {
      'low': 'Operation poses minimal risk to the organization.',
      'medium': 'Operation requires standard risk management procedures.',
      'high': 'Operation requires enhanced scrutiny and management oversight.',
      'critical': 'Operation poses significant risk and requires immediate attention.'
    }
    return descriptions[riskLevel as keyof typeof descriptions] || ''
  }

  private calculateSystemReliability(analysis: ComprehensiveOperationalAnalysis): string {
    const passedLayers = analysis.summary.passedLayers
    const totalLayers = analysis.summary.totalLayers
    const reliability = totalLayers > 0 ? (passedLayers / totalLayers) * 100 : 0

    if (reliability >= 95) return 'Excellent - All operational systems functioning optimally'
    if (reliability >= 85) return 'Good - Minor operational adjustments may be beneficial'
    if (reliability >= 70) return 'Adequate - Some operational improvements recommended'
    return 'Poor - Significant operational system improvements required'
  }

  private generateImmediateActions(analysis: ComprehensiveOperationalAnalysis): string[] {
    const actions: string[] = []

    switch (analysis.verification.riskLevel) {
      case 'critical':
        actions.push('IMMEDIATE: Halt operation pending senior management review')
        actions.push('IMMEDIATE: Escalate to C-level executive team')
        actions.push('IMMEDIATE: Activate incident response procedures')
        actions.push('IMMEDIATE: Notify all affected stakeholders')
        break

      case 'high':
        actions.push('Hold operation for management approval')
        actions.push('Conduct enhanced risk assessment')
        actions.push('Notify senior operational staff')
        actions.push('Prepare comprehensive documentation')
        break

      case 'medium':
        actions.push('Apply enhanced operational monitoring')
        actions.push('Document operational decisions and rationale')
        actions.push('Review operational procedures')
        actions.push('Notify relevant operational managers')
        break

      case 'low':
        actions.push('Proceed with standard operational procedures')
        actions.push('Maintain routine operational documentation')
        actions.push('Continue normal monitoring and reporting')
        break
    }

    // Compliance-specific actions
    if (analysis.verification.complianceScore < 70) {
      actions.push('Address identified compliance deficiencies immediately')
    }

    if (analysis.verification.requiresEscalation) {
      actions.push('Initiate formal escalation procedures')
    }

    return actions
  }

  private generateLongTermRecommendations(analysis: ComprehensiveOperationalAnalysis): string[] {
    const recommendations: string[] = []

    // Risk-based recommendations
    if (analysis.verification.operationalRisk > 30) {
      recommendations.push('Review and enhance operational risk management procedures')
      recommendations.push('Consider operational process improvements')
      recommendations.push('Implement additional operational controls')
    }

    // Compliance recommendations
    if (analysis.verification.complianceScore < 85) {
      recommendations.push('Strengthen operational compliance monitoring procedures')
      recommendations.push('Enhanced staff training on operational compliance requirements')
      recommendations.push('Regular operational compliance audits')
    }

    // System improvements
    if (analysis.summary.processingTime > 5000) {
      recommendations.push('Optimize operational validation processing performance')
    }

    // General recommendations
    recommendations.push('Regular review of operational risk assessment parameters')
    recommendations.push('Periodic audit of operational monitoring effectiveness')
    recommendations.push('Continuous improvement of operational procedures')

    return recommendations
  }

  private generateComplianceRequirements(analysis: ComprehensiveOperationalAnalysis): string[] {
    const requirements: string[] = []

    // Risk-based compliance requirements
    if (analysis.verification.riskLevel === 'high' || analysis.verification.riskLevel === 'critical') {
      requirements.push('Enhanced documentation and approval procedures required')
      requirements.push('Management sign-off mandatory for high-risk operations')
    }

    if (analysis.verification.operationalRisk > 50) {
      requirements.push('Comprehensive risk mitigation plan required')
      requirements.push('Enhanced stakeholder communication mandatory')
    }

    // General compliance requirements
    requirements.push('Maintain complete operational audit trail')
    requirements.push('Document all operational decisions and approvals')
    requirements.push('Ensure regulatory compliance validation')

    if (analysis.summary.complianceGaps.length > 0) {
      requirements.push('Remediate all identified compliance deficiencies')
    }

    return requirements
  }

  private generateRiskMitigation(analysis: ComprehensiveOperationalAnalysis): string[] {
    const mitigation: string[] = []

    // Risk-specific mitigation
    analysis.summary.operationalRisks.forEach(risk => {
      if (risk.includes('approval')) {
        mitigation.push('Implement comprehensive approval workflow procedures')
      }
      if (risk.includes('documentation')) {
        mitigation.push('Enhance operational documentation standards')
      }
      if (risk.includes('stakeholder')) {
        mitigation.push('Strengthen stakeholder communication protocols')
      }
      if (risk.includes('compliance')) {
        mitigation.push('Implement enhanced compliance monitoring procedures')
      }
    })

    // General mitigation strategies
    mitigation.push('Regular operational risk assessment and review')
    mitigation.push('Continuous monitoring system enhancement')
    mitigation.push('Staff training on operational risk management')
    mitigation.push('Automated operational compliance checking')

    return [...new Set(mitigation)] // Remove duplicates
  }

  private generateStakeholderNotifications(analysis: ComprehensiveOperationalAnalysis): string[] {
    const notifications: string[] = []

    // Risk-based notifications
    if (analysis.verification.riskLevel === 'critical') {
      notifications.push('Immediate notification to executive team required')
      notifications.push('Notify all affected business units immediately')
      notifications.push('Alert regulatory compliance team if applicable')
    } else if (analysis.verification.riskLevel === 'high') {
      notifications.push('Notify senior management within 2 hours')
      notifications.push('Inform affected operational teams')
    } else if (analysis.verification.riskLevel === 'medium') {
      notifications.push('Standard stakeholder notification procedures')
    }

    // Compliance-based notifications
    if (analysis.verification.complianceScore < 70) {
      notifications.push('Notify compliance team of deficiencies')
    }

    if (analysis.verification.requiresEscalation) {
      notifications.push('Formal escalation notification to management hierarchy')
    }

    // General notifications
    notifications.push('Document all stakeholder communications')
    notifications.push('Maintain notification audit trail')

    return notifications
  }

  /**
   * Generate specialized reports
   */
  generateIncidentReport(analysis: ComprehensiveOperationalAnalysis): {
    incidentSummary: string
    impactAssessment: string
    rootCauseAnalysis: string
    resolutionPlan: string
    preventiveMeasures: string[]
  } {
    return {
      incidentSummary: `Incident analysis: ${analysis.verification.confidence}% confidence, ${analysis.verification.riskLevel} risk`,
      impactAssessment: analysis.verification.businessImpact,
      rootCauseAnalysis: analysis.summary.criticalFindings.join('; ') || 'Root cause analysis pending',
      resolutionPlan: analysis.verification.recommendation,
      preventiveMeasures: analysis.summary.recommendedActions
    }
  }

  generateBuildProvenanceReport(analysis: ComprehensiveOperationalAnalysis): {
    buildSummary: string
    securityAssessment: string
    dependencyAnalysis: string
    deploymentRecommendation: string
    complianceStatus: string
  } {
    return {
      buildSummary: `Build provenance validated: ${analysis.verification.confidence}% confidence`,
      securityAssessment: `Security risk: ${analysis.verification.operationalRisk}%`,
      dependencyAnalysis: analysis.summary.operationalRisks.join('; ') || 'No dependency issues identified',
      deploymentRecommendation: analysis.verification.recommendation,
      complianceStatus: `${analysis.verification.complianceScore}% compliant`
    }
  }

  generatePolicyChangeReport(analysis: ComprehensiveOperationalAnalysis): {
    policyImpact: string
    stakeholderAnalysis: string
    complianceImplications: string
    implementationPlan: string
    approvalStatus: string
  } {
    return {
      policyImpact: analysis.verification.businessImpact,
      stakeholderAnalysis: `${analysis.attestationEvidence.stakeholderApprovals.length} stakeholder approvals documented`,
      complianceImplications: analysis.summary.complianceGaps.join('; ') || 'No compliance implications identified',
      implementationPlan: analysis.verification.recommendation,
      approvalStatus: analysis.verification.requiresEscalation ? 'Additional approvals required' : 'Approved for implementation'
    }
  }

  /**
   * Generate audit-ready documentation
   */
  generateAuditReport(analysis: ComprehensiveOperationalAnalysis): {
    analysisId: string
    timestamp: string
    operationalHash: string
    validationLayers: string[]
    evidence: Record<string, any>
    chainOfCustody: string[]
    complianceStatus: string
    auditTrail: string[]
  } {
    return {
      analysisId: analysis.verification.analysisId,
      timestamp: analysis.attestationEvidence.timestamp,
      operationalHash: analysis.attestationEvidence.operationalHash,
      validationLayers: Object.values(analysis.validationResults)
        .filter(Boolean)
        .map(result => result!.detector),
      evidence: analysis.validationResults,
      chainOfCustody: analysis.attestationEvidence.chainOfCustody,
      complianceStatus: this.formatComplianceStatus(analysis.verification.complianceScore),
      auditTrail: analysis.verification.auditTrail
    }
  }
}

// Export singleton instance
export const operationsReportGenerator = new OperationsReportGenerator()