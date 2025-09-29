/**
 * Unified Content Intelligence Engine
 *
 * Orchestrates multiple detection methods to provide comprehensive
 * content analysis with professional-grade reporting and evidence.
 */

import { advancedTextDetector } from '../detectors/advanced-text'
import { imageMetadataDetector } from '../detectors/image-metadata'
import { cryptographicValidator } from '../../validation/layers/cryptographic-validator'
import { ValidationContext } from '../../validation/validation-engine'
import crypto from 'crypto'

export interface ContentInput {
  content: Buffer | string
  contentType: string
  metadata?: Record<string, unknown>
  provenance?: Record<string, unknown>
}

export interface DetectorResult {
  detector: string
  confidence: number
  indicators: string[]
  reasoning: string
  processingTime: number
  evidence: Record<string, unknown>
}

export interface ComprehensiveAnalysis {
  // Overall assessment
  authenticity: {
    confidence: number          // 0-100% confidence in authenticity
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    recommendation: string
    analysisId: string
  }

  // Detailed detector results
  detectionResults: {
    aiGenerated: DetectorResult | null
    manipulation: DetectorResult | null
    cryptographic: DetectorResult | null
    metadata: DetectorResult | null
  }

  // Evidence package
  forensicEvidence: {
    contentHash: string
    timestamp: string
    analysisMetadata: Record<string, unknown>
    chainOfCustody: string[]
    supportingData: Record<string, unknown>
  }

  // Business intelligence
  summary: {
    keyFindings: string[]
    riskFactors: string[]
    strengthIndicators: string[]
    recommendations: string[]
    processingTime: number
  }
}

export interface AnalysisConfig {
  enableAIDetection: boolean
  enableMetadataAnalysis: boolean
  enableCryptographicValidation: boolean
  enableManipulationDetection: boolean
  parallelProcessing: boolean
  detailedReporting: boolean
}

/**
 * Core Content Intelligence Engine
 */
export class ContentIntelligenceEngine {
  private config: AnalysisConfig

  constructor(config: Partial<AnalysisConfig> = {}) {
    this.config = {
      enableAIDetection: true,
      enableMetadataAnalysis: true,
      enableCryptographicValidation: true,
      enableManipulationDetection: true,
      parallelProcessing: true,
      detailedReporting: true,
      ...config
    }
  }

  /**
   * Main analysis method - orchestrates all detectors
   */
  async analyzeContent(
    input: ContentInput,
    context?: ValidationContext
  ): Promise<ComprehensiveAnalysis> {
    const startTime = Date.now()
    const analysisId = crypto.randomUUID()

    // Initialize analysis
    const analysis: ComprehensiveAnalysis = {
      authenticity: {
        confidence: 0,
        riskLevel: 'low',
        recommendation: '',
        analysisId
      },
      detectionResults: {
        aiGenerated: null,
        manipulation: null,
        cryptographic: null,
        metadata: null
      },
      forensicEvidence: {
        contentHash: this.generateContentHash(input.content),
        timestamp: new Date().toISOString(),
        analysisMetadata: {
          contentType: input.contentType,
          contentSize: Buffer.isBuffer(input.content) ? input.content.length : input.content.length,
          config: this.config
        },
        chainOfCustody: [`Analysis initiated: ${analysisId}`],
        supportingData: {}
      },
      summary: {
        keyFindings: [],
        riskFactors: [],
        strengthIndicators: [],
        recommendations: [],
        processingTime: 0
      }
    }

    try {
      // Run detectors based on configuration
      const detectorPromises: Promise<void>[] = []

      if (this.config.parallelProcessing) {
        // Run all detectors in parallel
        if (this.config.enableAIDetection) {
          detectorPromises.push(this.runAIDetection(input, analysis))
        }
        if (this.config.enableMetadataAnalysis) {
          detectorPromises.push(this.runMetadataAnalysis(input, analysis))
        }
        if (this.config.enableCryptographicValidation && context) {
          detectorPromises.push(this.runCryptographicValidation(input, analysis, context))
        }
        if (this.config.enableManipulationDetection) {
          detectorPromises.push(this.runManipulationDetection(input, analysis))
        }

        await Promise.allSettled(detectorPromises)
      } else {
        // Run detectors sequentially
        if (this.config.enableAIDetection) {
          await this.runAIDetection(input, analysis)
        }
        if (this.config.enableMetadataAnalysis) {
          await this.runMetadataAnalysis(input, analysis)
        }
        if (this.config.enableCryptographicValidation && context) {
          await this.runCryptographicValidation(input, analysis, context)
        }
        if (this.config.enableManipulationDetection) {
          await this.runManipulationDetection(input, analysis)
        }
      }

      // Aggregate results and calculate final assessment
      this.aggregateResults(analysis)
      this.generateRecommendations(analysis)
      this.updateChainOfCustody(analysis, 'Analysis completed')

    } catch (error) {
      console.error('Content intelligence analysis error:', error)
      analysis.authenticity.riskLevel = 'critical'
      analysis.authenticity.recommendation = 'Analysis failed - manual review required'
      analysis.summary.riskFactors.push('Analysis system error')
      this.updateChainOfCustody(analysis, `Analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    analysis.summary.processingTime = Date.now() - startTime
    return analysis
  }

  /**
   * Run AI detection analysis
   */
  private async runAIDetection(input: ContentInput, analysis: ComprehensiveAnalysis): Promise<void> {
    try {
      if (input.contentType.startsWith('text/')) {
        const content = Buffer.isBuffer(input.content) ? input.content.toString('utf-8') : input.content
        const result = await advancedTextDetector.analyze(content)

        analysis.detectionResults.aiGenerated = {
          detector: 'Advanced Text AI Detection',
          confidence: result.confidence * 100,
          indicators: result.indicators,
          reasoning: result.reasoning,
          processingTime: result.processingTime,
          evidence: {
            methods: result.methods,
            modelSignatures: result.modelSignatures,
            confidenceInterval: result.confidenceInterval,
            linguisticPatterns: result.methods
          }
        }

        this.updateChainOfCustody(analysis, 'AI detection completed')
      }
    } catch (error) {
      console.error('AI detection error:', error)
      analysis.summary.riskFactors.push('AI detection failed')
    }
  }

  /**
   * Run metadata analysis
   */
  private async runMetadataAnalysis(input: ContentInput, analysis: ComprehensiveAnalysis): Promise<void> {
    try {
      if (input.contentType.startsWith('image/') && Buffer.isBuffer(input.content)) {
        const result = await imageMetadataDetector.analyze(input.content)

        analysis.detectionResults.metadata = {
          detector: 'Image Metadata Analysis',
          confidence: (1 - result.confidence) * 100, // Convert suspicion to authenticity
          indicators: result.indicators,
          reasoning: result.reasoning,
          processingTime: result.processingTime,
          evidence: {
            metadata: result.metadata,
            statistics: result.statistics,
            softwareSignatures: result.metadata
          }
        }

        this.updateChainOfCustody(analysis, 'Metadata analysis completed')
      } else if (input.metadata) {
        // Basic metadata analysis for non-image content
        const metadataAnalysis = this.analyzeGeneralMetadata(input.metadata)

        analysis.detectionResults.metadata = {
          detector: 'General Metadata Analysis',
          confidence: metadataAnalysis.confidence,
          indicators: metadataAnalysis.indicators,
          reasoning: metadataAnalysis.reasoning,
          processingTime: metadataAnalysis.processingTime,
          evidence: { metadata: input.metadata }
        }
      }
    } catch (error) {
      console.error('Metadata analysis error:', error)
      analysis.summary.riskFactors.push('Metadata analysis failed')
    }
  }

  /**
   * Run cryptographic validation
   */
  private async runCryptographicValidation(
    input: ContentInput,
    analysis: ComprehensiveAnalysis,
    context: ValidationContext
  ): Promise<void> {
    try {
      // Create cryptographic proof for validation
      const cryptoData = {
        contentHash: analysis.forensicEvidence.contentHash,
        contentType: input.contentType,
        timestamp: analysis.forensicEvidence.timestamp,
        provenance: input.provenance
      }

      const result = await cryptographicValidator.validate(cryptoData, context)

      analysis.detectionResults.cryptographic = {
        detector: 'Cryptographic Validation',
        confidence: result.valid ? 100 : 0,
        indicators: result.valid ? ['Valid cryptographic proof'] : ['Invalid cryptographic proof'],
        reasoning: result.message,
        processingTime: 50, // Estimated
        evidence: {
          validationResult: result,
          cryptographicProof: cryptoData
        }
      }

      this.updateChainOfCustody(analysis, 'Cryptographic validation completed')
    } catch (error) {
      console.error('Cryptographic validation error:', error)
      analysis.summary.riskFactors.push('Cryptographic validation failed')
    }
  }

  /**
   * Run manipulation detection (placeholder for future enhancement)
   */
  private async runManipulationDetection(input: ContentInput, analysis: ComprehensiveAnalysis): Promise<void> {
    try {
      // Basic manipulation detection based on content patterns
      const manipulationAnalysis = this.analyzeManipulationIndicators(input)

      analysis.detectionResults.manipulation = {
        detector: 'Content Manipulation Detection',
        confidence: manipulationAnalysis.confidence,
        indicators: manipulationAnalysis.indicators,
        reasoning: manipulationAnalysis.reasoning,
        processingTime: manipulationAnalysis.processingTime,
        evidence: manipulationAnalysis.evidence
      }

      this.updateChainOfCustody(analysis, 'Manipulation detection completed')
    } catch (error) {
      console.error('Manipulation detection error:', error)
      analysis.summary.riskFactors.push('Manipulation detection failed')
    }
  }

  /**
   * Aggregate all detector results into final assessment
   */
  private aggregateResults(analysis: ComprehensiveAnalysis): void {
    const results = Object.values(analysis.detectionResults).filter(Boolean)

    if (results.length === 0) {
      analysis.authenticity.confidence = 0
      analysis.authenticity.riskLevel = 'critical'
      analysis.authenticity.recommendation = 'No successful analysis - manual review required'
      return
    }

    // Calculate weighted average confidence
    const totalConfidence = results.reduce((sum, result) => sum + result!.confidence, 0)
    const averageConfidence = totalConfidence / results.length

    analysis.authenticity.confidence = Math.round(averageConfidence)

    // Determine risk level
    if (averageConfidence >= 80) {
      analysis.authenticity.riskLevel = 'low'
    } else if (averageConfidence >= 60) {
      analysis.authenticity.riskLevel = 'medium'
    } else if (averageConfidence >= 40) {
      analysis.authenticity.riskLevel = 'high'
    } else {
      analysis.authenticity.riskLevel = 'critical'
    }

    // Collect findings
    results.forEach(result => {
      if (result) {
        analysis.summary.keyFindings.push(`${result.detector}: ${result.reasoning}`)

        if (result.confidence < 60) {
          analysis.summary.riskFactors.push(`${result.detector} indicates potential issues`)
        } else {
          analysis.summary.strengthIndicators.push(`${result.detector} validation passed`)
        }
      }
    })
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(analysis: ComprehensiveAnalysis): void {
    const { riskLevel, confidence } = analysis.authenticity

    switch (riskLevel) {
      case 'low':
        analysis.authenticity.recommendation = 'Content appears authentic - proceed with confidence'
        analysis.summary.recommendations = [
          'Content passed comprehensive analysis',
          'Safe for publication/use',
          'Maintain audit trail for compliance'
        ]
        break

      case 'medium':
        analysis.authenticity.recommendation = 'Content has some concerns - review recommended'
        analysis.summary.recommendations = [
          'Review identified risk factors',
          'Consider additional verification',
          'Document decision rationale'
        ]
        break

      case 'high':
        analysis.authenticity.recommendation = 'Content has significant concerns - caution advised'
        analysis.summary.recommendations = [
          'Manual review required',
          'Additional verification recommended',
          'Consider rejecting or flagging content'
        ]
        break

      case 'critical':
        analysis.authenticity.recommendation = 'Content failed analysis - reject or investigate'
        analysis.summary.recommendations = [
          'Do not use without thorough investigation',
          'Manual expert review required',
          'Consider content as potentially inauthentic'
        ]
        break
    }

    // Add specific recommendations based on detector results
    if (analysis.detectionResults.aiGenerated?.confidence < 50) {
      analysis.summary.recommendations.push('High probability of AI-generated content detected')
    }
    if (analysis.detectionResults.metadata?.confidence < 50) {
      analysis.summary.recommendations.push('Metadata inconsistencies found - verify source')
    }
  }

  /**
   * Helper methods
   */
  private generateContentHash(content: Buffer | string): string {
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8')
    return crypto.createHash('sha256').update(buffer).digest('hex')
  }

  private updateChainOfCustody(analysis: ComprehensiveAnalysis, event: string): void {
    analysis.forensicEvidence.chainOfCustody.push(`${new Date().toISOString()}: ${event}`)
  }

  private analyzeGeneralMetadata(metadata: Record<string, unknown>): {
    confidence: number
    indicators: string[]
    reasoning: string
    processingTime: number
  } {
    const indicators: string[] = []
    let confidence = 85 // Start with high confidence for general metadata

    // Look for suspicious patterns
    if (metadata.creator && typeof metadata.creator === 'string') {
      const creator = metadata.creator.toLowerCase()
      if (creator.includes('ai') || creator.includes('generated') || creator.includes('bot')) {
        indicators.push('Suspicious creator metadata')
        confidence -= 30
      }
    }

    return {
      confidence,
      indicators,
      reasoning: indicators.length > 0 ? 'Metadata contains concerning patterns' : 'Metadata appears normal',
      processingTime: 10
    }
  }

  private analyzeManipulationIndicators(input: ContentInput): {
    confidence: number
    indicators: string[]
    reasoning: string
    processingTime: number
    evidence: Record<string, unknown>
  } {
    const indicators: string[] = []
    let confidence = 80 // Default confidence

    // Basic pattern analysis
    if (typeof input.content === 'string') {
      // Text manipulation indicators
      const text = input.content.toLowerCase()
      if (text.includes('edited') || text.includes('modified') || text.includes('generated')) {
        indicators.push('Content contains manipulation keywords')
        confidence -= 20
      }
    }

    return {
      confidence,
      indicators,
      reasoning: indicators.length > 0 ? 'Potential manipulation indicators found' : 'No obvious manipulation detected',
      processingTime: 25,
      evidence: { patterns: indicators }
    }
  }
}

// Export singleton instance
export const contentIntelligenceEngine = new ContentIntelligenceEngine()