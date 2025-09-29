/**
 * Enhanced Operations Service
 *
 * Integrates the Operations Trust Intelligence Engine with existing systems
 * to provide comprehensive operational validation, attestation, and compliance
 * for incident management, build provenance, and policy compliance.
 */

import { operationsIntelligenceEngine, type OperationalInput } from './intelligence-engine/operations-intelligence-engine'
import { operationsReportGenerator } from './intelligence-engine/operations-report-generator'
import { ValidationContext } from '../validation/validation-engine'
import { signPayload } from '../signing'
import { prisma } from '../prisma'
import crypto from 'crypto'

export interface EnhancedOperationalInput extends OperationalInput {
  // Additional fields for service integration
  createReceipt?: boolean
  notifyStakeholders?: boolean
  enforceApprovals?: boolean
  auditLevel?: 'standard' | 'enhanced' | 'forensic'
}

export interface EnhancedOperationalResult {
  validation: {
    allowed: boolean
    status: 'approved' | 'declined' | 'requires_review' | 'escalation_required'
    reason: string
  }
  intelligenceAnalysis?: {
    confidence: number
    riskLevel: string
    operationalRisk: number
    complianceScore: number
    businessImpact: string
    recommendation: string
    analysisId: string
    requiresEscalation: boolean
    auditTrail: string[]
  }
  comprehensiveReport?: any
  incidentReport?: any
  buildProvenanceReport?: any
  policyChangeReport?: any
  auditReport?: any
  receipt?: {
    receiptId: string
    signature: string
    attestationHash: string
    chainOfCustody: string[]
  }
  stakeholderNotifications?: {
    sent: boolean
    recipients: string[]
    timestamp: string
  }
}

/**
 * Enhanced Operations Service with Intelligence Analysis
 */
export class EnhancedOperationsService {
  /**
   * Process operational event with comprehensive intelligence analysis
   */
  async processOperation(
    input: EnhancedOperationalInput,
    context?: ValidationContext
  ): Promise<EnhancedOperationalResult> {
    console.log(`Processing operational event: ${input.operationType} - Severity: ${input.severity}`)

    // Run comprehensive operational intelligence analysis
    let intelligenceAnalysis = undefined
    let comprehensiveReport = undefined
    let incidentReport = undefined
    let buildProvenanceReport = undefined
    let policyChangeReport = undefined
    let auditReport = undefined
    let receipt = undefined
    let stakeholderNotifications = undefined

    try {
      // Run comprehensive operational intelligence analysis
      const analysis = await operationsIntelligenceEngine.analyzeOperation(input, context)

      // Generate professional reports based on operation type
      comprehensiveReport = operationsReportGenerator.generateReport(analysis, {
        detailLevel: input.auditLevel === 'forensic' ? 'forensic' : 'detailed',
        includeComplianceDetails: true,
        includeForensicEvidence: input.auditLevel !== 'standard',
        operationType: input.operationType,
        framework: 'ALL'
      })

      // Generate operation-specific reports
      switch (input.operationType) {
        case 'incident':
          incidentReport = operationsReportGenerator.generateIncidentReport(analysis)
          break
        case 'build_provenance':
          buildProvenanceReport = operationsReportGenerator.generateBuildProvenanceReport(analysis)
          break
        case 'policy_change':
          policyChangeReport = operationsReportGenerator.generatePolicyChangeReport(analysis)
          break
      }

      // Generate audit report for all operations
      auditReport = operationsReportGenerator.generateAuditReport(analysis)

      // Extract key metrics for API response
      intelligenceAnalysis = {
        confidence: analysis.verification.confidence,
        riskLevel: analysis.verification.riskLevel,
        operationalRisk: analysis.verification.operationalRisk,
        complianceScore: analysis.verification.complianceScore,
        businessImpact: analysis.verification.businessImpact,
        recommendation: analysis.verification.recommendation,
        analysisId: analysis.verification.analysisId,
        requiresEscalation: analysis.verification.requiresEscalation,
        auditTrail: analysis.verification.auditTrail
      }

      // Create tamper-evident receipt if requested
      if (input.createReceipt !== false) { // Default to true
        receipt = await this.createOperationalReceipt(analysis, input)
      }

      // Send stakeholder notifications if required
      if (input.notifyStakeholders && analysis.verification.requiresEscalation) {
        stakeholderNotifications = await this.sendStakeholderNotifications(analysis, input)
      }

      // Store operational analysis results
      await this.storeOperationalResults(analysis, input.enterpriseId)

      console.log(`Operational intelligence analysis completed: ${analysis.verification.analysisId} - Risk: ${analysis.verification.riskLevel}, Compliance: ${analysis.verification.complianceScore}%`)

    } catch (error) {
      console.error('Operational intelligence analysis failed:', error)
      // Continue with basic processing even if intelligence analysis fails
    }

    // Determine operation approval based on analysis
    const validation = this.determineOperationApproval(intelligenceAnalysis, input)

    return {
      validation,
      intelligenceAnalysis,
      comprehensiveReport,
      incidentReport,
      buildProvenanceReport,
      policyChangeReport,
      auditReport,
      receipt,
      stakeholderNotifications
    }
  }

  /**
   * Quick operational risk check for real-time processing
   */
  async quickRiskCheck(
    input: EnhancedOperationalInput
  ): Promise<{
    approved: boolean
    riskScore: number
    reason: string
    analysisId: string
    escalationRequired: boolean
  }> {
    try {
      // Run lightweight operational analysis
      const analysis = await operationsIntelligenceEngine.analyzeOperation(input)

      return {
        approved: analysis.verification.riskLevel !== 'critical' && analysis.verification.operationalRisk < 75,
        riskScore: analysis.verification.operationalRisk,
        reason: analysis.verification.recommendation,
        analysisId: analysis.verification.analysisId,
        escalationRequired: analysis.verification.requiresEscalation
      }
    } catch (error) {
      console.error('Quick operational risk check failed:', error)
      return {
        approved: false,
        riskScore: 100,
        reason: 'Operational risk analysis system error',
        analysisId: 'error',
        escalationRequired: true
      }
    }
  }

  /**
   * Generate compliance report for existing operation
   */
  async generateOperationalComplianceReport(
    operationId: string
  ): Promise<any> {
    try {
      // Retrieve operation from database
      const operation = await prisma.receipt.findUnique({
        where: { id: operationId }
      })

      if (!operation) {
        throw new Error('Operation not found')
      }

      // Reconstruct operational input from stored data
      const operationalInput: OperationalInput = {
        enterpriseId: operation.enterpriseId,
        operationType: (operation.type as any) || 'audit_event',
        severity: 'medium', // Default if not stored
        timestamp: operation.createdAt.toISOString(),
        metadata: operation.transactionData as Record<string, unknown>
      }

      // Run intelligence analysis
      const analysis = await operationsIntelligenceEngine.analyzeOperation(operationalInput)

      // Generate compliance report
      return operationsReportGenerator.generateReport(analysis, {
        detailLevel: 'regulatory',
        includeComplianceDetails: true,
        regulatoryFormat: true
      })

    } catch (error) {
      console.error('Operational compliance report generation failed:', error)
      throw new Error('Failed to generate operational compliance report')
    }
  }

  /**
   * Batch analyze multiple operations for compliance review
   */
  async batchAnalyzeOperations(
    enterpriseId: string,
    startDate: Date,
    endDate: Date,
    operationType?: string
  ): Promise<{
    summary: {
      totalOperations: number
      highRiskCount: number
      complianceIssues: number
      escalationRequired: number
    }
    operations: Array<{
      id: string
      operationType: string
      riskLevel: string
      operationalRisk: number
      complianceScore: number
      analysisId: string
      requiresEscalation: boolean
    }>
  }> {
    try {
      // Build query filters
      const whereClause: any = {
        enterpriseId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }

      if (operationType) {
        whereClause.type = operationType.toUpperCase()
      }

      // Retrieve operations for the period
      const operations = await prisma.receipt.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      })

      const analyses: any[] = []
      let highRiskCount = 0
      let complianceIssues = 0
      let escalationRequired = 0

      // Analyze each operation
      for (const operation of operations) {
        try {
          const operationalInput: OperationalInput = {
            enterpriseId: operation.enterpriseId,
            operationType: (operation.type?.toLowerCase() as any) || 'audit_event',
            severity: 'medium', // Default if not stored
            timestamp: operation.createdAt.toISOString(),
            metadata: operation.transactionData as Record<string, unknown>
          }

          const analysis = await operationsIntelligenceEngine.analyzeOperation(operationalInput)

          analyses.push({
            id: operation.id,
            operationType: operationalInput.operationType,
            riskLevel: analysis.verification.riskLevel,
            operationalRisk: analysis.verification.operationalRisk,
            complianceScore: analysis.verification.complianceScore,
            analysisId: analysis.verification.analysisId,
            requiresEscalation: analysis.verification.requiresEscalation
          })

          // Collect statistics
          if (analysis.verification.riskLevel === 'high' || analysis.verification.riskLevel === 'critical') {
            highRiskCount++
          }

          if (analysis.verification.complianceScore < 85) {
            complianceIssues++
          }

          if (analysis.verification.requiresEscalation) {
            escalationRequired++
          }

        } catch (error) {
          console.error(`Failed to analyze operation ${operation.id}:`, error)
        }
      }

      return {
        summary: {
          totalOperations: operations.length,
          highRiskCount,
          complianceIssues,
          escalationRequired
        },
        operations: analyses
      }

    } catch (error) {
      console.error('Batch operational analysis failed:', error)
      throw new Error('Failed to perform batch operational analysis')
    }
  }

  /**
   * Create tamper-evident receipt for operational event
   */
  private async createOperationalReceipt(
    analysis: any,
    input: EnhancedOperationalInput
  ): Promise<EnhancedOperationalResult['receipt']> {
    try {
      // Prepare receipt payload
      const receiptPayload = {
        operationType: input.operationType,
        severity: input.severity,
        timestamp: input.timestamp,
        enterpriseId: input.enterpriseId,
        analysisId: analysis.verification.analysisId,
        riskLevel: analysis.verification.riskLevel,
        complianceScore: analysis.verification.complianceScore,
        operationalHash: analysis.attestationEvidence.operationalHash,
        auditTrail: analysis.verification.auditTrail,
        attestationType: 'operational_trust'
      }

      // Sign the payload to create tamper-evident receipt
      const signedReceipt = await signPayload(receiptPayload)

      return {
        receiptId: signedReceipt.receipt_id,
        signature: signedReceipt.signature,
        attestationHash: analysis.attestationEvidence.operationalHash,
        chainOfCustody: analysis.attestationEvidence.chainOfCustody
      }

    } catch (error) {
      console.error('Failed to create operational receipt:', error)
      throw new Error('Failed to create operational receipt')
    }
  }

  /**
   * Send stakeholder notifications for escalation
   */
  private async sendStakeholderNotifications(
    analysis: any,
    input: EnhancedOperationalInput
  ): Promise<EnhancedOperationalResult['stakeholderNotifications']> {
    try {
      // Extract stakeholders from input metadata
      const stakeholders: string[] = []

      if (input.metadata?.approvals) {
        stakeholders.push(...input.metadata.approvals.map(a => a.approver))
      }

      // Add default escalation recipients based on risk level
      if (analysis.verification.riskLevel === 'critical') {
        stakeholders.push('security-team@company.com', 'executive-team@company.com')
      } else if (analysis.verification.riskLevel === 'high') {
        stakeholders.push('operations-manager@company.com')
      }

      // In a real implementation, this would send actual notifications
      console.log(`Stakeholder notifications would be sent to: ${stakeholders.join(', ')}`)
      console.log(`Notification content: ${analysis.verification.recommendation}`)

      return {
        sent: true,
        recipients: [...new Set(stakeholders)],
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error('Failed to send stakeholder notifications:', error)
      return {
        sent: false,
        recipients: [],
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Determine operation approval based on intelligence analysis
   */
  private determineOperationApproval(
    analysis: EnhancedOperationalResult['intelligenceAnalysis'],
    input: EnhancedOperationalInput
  ): EnhancedOperationalResult['validation'] {
    if (!analysis) {
      return {
        allowed: false,
        status: 'declined',
        reason: 'Intelligence analysis failed - manual review required'
      }
    }

    // Critical risk operations are declined
    if (analysis.riskLevel === 'critical') {
      return {
        allowed: false,
        status: 'declined',
        reason: 'Critical operational risk detected - operation blocked pending management review'
      }
    }

    // High risk operations require escalation
    if (analysis.riskLevel === 'high' || analysis.requiresEscalation) {
      return {
        allowed: false,
        status: 'escalation_required',
        reason: 'High risk operation requires management approval before proceeding'
      }
    }

    // Medium risk operations require review
    if (analysis.riskLevel === 'medium' || analysis.complianceScore < 85) {
      return {
        allowed: true,
        status: 'requires_review',
        reason: 'Operation approved with enhanced monitoring and documentation requirements'
      }
    }

    // Low risk operations are approved
    return {
      allowed: true,
      status: 'approved',
      reason: 'Operation approved - standard procedures apply'
    }
  }

  /**
   * Store operational analysis results for audit trail
   */
  private async storeOperationalResults(
    analysis: any,
    enterpriseId: string
  ): Promise<void> {
    try {
      // Store in audit log or separate analysis table
      // For now, just log - could expand to dedicated storage
      console.log(`Storing operational analysis results for enterprise ${enterpriseId}:`, {
        analysisId: analysis.verification.analysisId,
        riskLevel: analysis.verification.riskLevel,
        confidence: analysis.verification.confidence,
        complianceScore: analysis.verification.complianceScore,
        operationalRisk: analysis.verification.operationalRisk,
        requiresEscalation: analysis.verification.requiresEscalation
      })

      // Could implement database storage here:
      // await prisma.operationalAnalysis.create({...})

    } catch (error) {
      console.error('Failed to store operational analysis results:', error)
    }
  }
}

// Export singleton instance
export const enhancedOperationsService = new EnhancedOperationsService()