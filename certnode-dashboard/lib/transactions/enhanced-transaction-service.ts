/**
 * Enhanced Transaction Service
 *
 * Integrates the Transaction Intelligence Engine with existing transaction
 * validation to provide comprehensive financial analysis and compliance.
 */

import { validateTransaction, type TransactionValidationPayload, type TransactionValidationResult } from '../transactions'
import { transactionIntelligenceEngine, type TransactionInput } from './intelligence-engine/transaction-intelligence-engine'
import { transactionReportGenerator } from './intelligence-engine/transaction-report-generator'
import { ValidationContext } from '../validation/validation-engine'
import { prisma } from '../prisma'

export interface EnhancedTransactionInput extends TransactionValidationPayload {
  transactionType: string
  currency?: string
  paymentMethod?: string
  customerInfo?: Record<string, unknown>
  merchantInfo?: Record<string, unknown>
  location?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface EnhancedTransactionResult extends TransactionValidationResult {
  intelligenceAnalysis?: {
    confidence: number
    riskLevel: string
    fraudProbability: number
    complianceScore: number
    recommendation: string
    analysisId: string
    regulatoryAlerts: string[]
    filingRequirements: string[]
  }
  comprehensiveReport?: any
  complianceReport?: any
  fraudAssessment?: any
}

/**
 * Enhanced Transaction Service with Intelligence Analysis
 */
export class EnhancedTransactionService {
  /**
   * Validate transaction with comprehensive intelligence analysis
   */
  async validateWithIntelligence(
    input: EnhancedTransactionInput,
    context?: ValidationContext
  ): Promise<EnhancedTransactionResult> {
    // Start with base transaction validation
    const baseValidation = await validateTransaction({
      enterpriseId: input.enterpriseId,
      amountCents: input.amountCents
    })

    // Run comprehensive intelligence analysis
    let intelligenceAnalysis = undefined
    let comprehensiveReport = undefined
    let complianceReport = undefined
    let fraudAssessment = undefined

    try {
      // Prepare transaction input for intelligence engine
      const transactionInput: TransactionInput = {
        enterpriseId: input.enterpriseId,
        amount: input.amountCents / 100, // Convert cents to dollars
        currency: input.currency || 'USD',
        transactionType: input.transactionType,
        paymentMethod: input.paymentMethod,
        customerInfo: input.customerInfo,
        merchantInfo: input.merchantInfo,
        location: input.location,
        metadata: input.metadata,
        timestamp: new Date().toISOString()
      }

      // Run comprehensive transaction intelligence analysis
      const analysis = await transactionIntelligenceEngine.analyzeTransaction(transactionInput, context)

      // Generate professional reports
      comprehensiveReport = transactionReportGenerator.generateReport(analysis, {
        detailLevel: 'detailed',
        includeComplianceDetails: true,
        includeForensicEvidence: true
      })

      complianceReport = transactionReportGenerator.generateComplianceReport(analysis)
      fraudAssessment = transactionReportGenerator.generateFraudReport(analysis)

      // Extract key metrics for API response
      intelligenceAnalysis = {
        confidence: analysis.verification.confidence,
        riskLevel: analysis.verification.riskLevel,
        fraudProbability: analysis.verification.fraudProbability,
        complianceScore: analysis.verification.complianceScore,
        recommendation: analysis.verification.recommendation,
        analysisId: analysis.verification.analysisId,
        regulatoryAlerts: analysis.summary.regulatoryAlerts,
        filingRequirements: complianceReport.filingRequirements
      }

      // Log analysis results
      console.log(`Transaction intelligence analysis completed: ${analysis.verification.analysisId} - Risk: ${analysis.verification.riskLevel}, Confidence: ${analysis.verification.confidence}%`)

      // Store analysis results if transaction is processed
      if (baseValidation.allowed && analysis.verification.riskLevel !== 'critical') {
        await this.storeAnalysisResults(analysis, input.enterpriseId)
      }

    } catch (error) {
      console.error('Transaction intelligence analysis failed:', error)
      // Continue with base validation even if intelligence analysis fails
    }

    // Combine base validation with intelligence analysis
    const enhancedResult: EnhancedTransactionResult = {
      ...baseValidation,
      intelligenceAnalysis,
      comprehensiveReport,
      complianceReport,
      fraudAssessment
    }

    // Override approval if intelligence engine flags critical risk
    if (intelligenceAnalysis && intelligenceAnalysis.riskLevel === 'critical') {
      enhancedResult.allowed = false
    }

    return enhancedResult
  }

  /**
   * Quick fraud check for real-time transaction processing
   */
  async quickFraudCheck(
    input: EnhancedTransactionInput
  ): Promise<{
    approved: boolean
    riskScore: number
    reason: string
    analysisId: string
  }> {
    try {
      const transactionInput: TransactionInput = {
        enterpriseId: input.enterpriseId,
        amount: input.amountCents / 100,
        currency: input.currency || 'USD',
        transactionType: input.transactionType,
        paymentMethod: input.paymentMethod,
        customerInfo: input.customerInfo,
        metadata: input.metadata,
        timestamp: new Date().toISOString()
      }

      // Run lightweight fraud analysis
      const analysis = await transactionIntelligenceEngine.analyzeTransaction(transactionInput)

      return {
        approved: analysis.verification.riskLevel !== 'critical' && analysis.verification.fraudProbability < 70,
        riskScore: analysis.verification.fraudProbability,
        reason: analysis.verification.recommendation,
        analysisId: analysis.verification.analysisId
      }
    } catch (error) {
      console.error('Quick fraud check failed:', error)
      return {
        approved: false,
        riskScore: 100,
        reason: 'Fraud analysis system error',
        analysisId: 'error'
      }
    }
  }

  /**
   * Generate compliance report for existing transaction
   */
  async generateComplianceReport(
    transactionId: string
  ): Promise<any> {
    try {
      // Retrieve transaction from database
      const transaction = await prisma.receipt.findUnique({
        where: { id: transactionId }
      })

      if (!transaction) {
        throw new Error('Transaction not found')
      }

      // Reconstruct transaction input from stored data
      const transactionInput: TransactionInput = {
        enterpriseId: transaction.enterpriseId,
        amount: Number(transaction.transactionData || 0),
        currency: transaction.currency || 'USD',
        transactionType: transaction.type || 'TRANSACTION',
        metadata: transaction.transactionData as Record<string, unknown>,
        timestamp: transaction.createdAt.toISOString()
      }

      // Run intelligence analysis
      const analysis = await transactionIntelligenceEngine.analyzeTransaction(transactionInput)

      // Generate compliance report
      return transactionReportGenerator.generateComplianceReport(analysis)

    } catch (error) {
      console.error('Compliance report generation failed:', error)
      throw new Error('Failed to generate compliance report')
    }
  }

  /**
   * Batch analyze multiple transactions for compliance review
   */
  async batchAnalyzeTransactions(
    enterpriseId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    summary: {
      totalTransactions: number
      highRiskCount: number
      complianceIssues: number
      filingRequirements: string[]
    }
    transactions: Array<{
      id: string
      riskLevel: string
      fraudProbability: number
      complianceScore: number
      analysisId: string
    }>
  }> {
    try {
      // Retrieve transactions for the period
      const transactions = await prisma.receipt.findMany({
        where: {
          enterpriseId,
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          type: 'TRANSACTION'
        },
        orderBy: { createdAt: 'desc' }
      })

      const analyses: any[] = []
      const filingRequirements = new Set<string>()
      let highRiskCount = 0
      let complianceIssues = 0

      // Analyze each transaction
      for (const transaction of transactions) {
        try {
          const transactionInput: TransactionInput = {
            enterpriseId: transaction.enterpriseId,
            amount: Number(transaction.transactionData || 0),
            currency: transaction.currency || 'USD',
            transactionType: transaction.type || 'TRANSACTION',
            metadata: transaction.transactionData as Record<string, unknown>,
            timestamp: transaction.createdAt.toISOString()
          }

          const analysis = await transactionIntelligenceEngine.analyzeTransaction(transactionInput)

          analyses.push({
            id: transaction.id,
            riskLevel: analysis.verification.riskLevel,
            fraudProbability: analysis.verification.fraudProbability,
            complianceScore: analysis.verification.complianceScore,
            analysisId: analysis.verification.analysisId
          })

          // Collect statistics
          if (analysis.verification.riskLevel === 'high' || analysis.verification.riskLevel === 'critical') {
            highRiskCount++
          }

          if (analysis.verification.complianceScore < 85) {
            complianceIssues++
          }

          // Collect filing requirements
          const complianceReport = transactionReportGenerator.generateComplianceReport(analysis)
          complianceReport.filingRequirements.forEach(req => filingRequirements.add(req))

        } catch (error) {
          console.error(`Failed to analyze transaction ${transaction.id}:`, error)
        }
      }

      return {
        summary: {
          totalTransactions: transactions.length,
          highRiskCount,
          complianceIssues,
          filingRequirements: Array.from(filingRequirements)
        },
        transactions: analyses
      }

    } catch (error) {
      console.error('Batch transaction analysis failed:', error)
      throw new Error('Failed to perform batch analysis')
    }
  }

  /**
   * Store analysis results for audit trail
   */
  private async storeAnalysisResults(
    analysis: any,
    enterpriseId: string
  ): Promise<void> {
    try {
      // Store in audit log or separate analysis table
      // For now, just log - could expand to dedicated storage
      console.log(`Storing analysis results for enterprise ${enterpriseId}:`, {
        analysisId: analysis.verification.analysisId,
        riskLevel: analysis.verification.riskLevel,
        confidence: analysis.verification.confidence,
        complianceScore: analysis.verification.complianceScore
      })
    } catch (error) {
      console.error('Failed to store analysis results:', error)
    }
  }
}

// Export singleton instance
export const enhancedTransactionService = new EnhancedTransactionService()