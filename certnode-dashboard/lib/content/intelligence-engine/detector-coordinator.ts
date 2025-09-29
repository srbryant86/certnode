/**
 * Detector Coordinator
 *
 * Manages the execution and coordination of multiple content detectors
 * with error handling, performance monitoring, and result aggregation.
 */

import { DetectorResult, ContentInput } from './content-intelligence-engine'

export interface DetectorConfig {
  name: string
  enabled: boolean
  priority: number
  timeout: number
  retryAttempts: number
}

export interface DetectorExecution {
  detector: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout'
  result?: DetectorResult
  error?: string
  startTime: number
  endTime?: number
}

export interface CoordinationResult {
  executions: DetectorExecution[]
  totalTime: number
  successCount: number
  failureCount: number
  results: DetectorResult[]
}

/**
 * Coordinates multiple detector executions with monitoring and fallbacks
 */
export class DetectorCoordinator {
  private detectors: Map<string, DetectorConfig> = new Map()
  private executing: Set<string> = new Set()

  constructor() {
    this.initializeDefaultDetectors()
  }

  /**
   * Register a detector with configuration
   */
  registerDetector(config: DetectorConfig): void {
    this.detectors.set(config.name, config)
  }

  /**
   * Execute multiple detectors with coordination
   */
  async executeDetectors(
    input: ContentInput,
    detectorNames: string[],
    parallel: boolean = true
  ): Promise<CoordinationResult> {
    const startTime = Date.now()
    const executions: DetectorExecution[] = []

    // Initialize execution tracking
    detectorNames.forEach(name => {
      if (this.detectors.has(name)) {
        executions.push({
          detector: name,
          status: 'pending',
          startTime: Date.now()
        })
      }
    })

    if (parallel) {
      await this.executeInParallel(input, executions)
    } else {
      await this.executeSequentially(input, executions)
    }

    // Compile results
    const results = executions
      .filter(exec => exec.result)
      .map(exec => exec.result!)

    return {
      executions,
      totalTime: Date.now() - startTime,
      successCount: executions.filter(e => e.status === 'completed').length,
      failureCount: executions.filter(e => e.status === 'failed' || e.status === 'timeout').length,
      results
    }
  }

  /**
   * Execute detectors in parallel with timeout handling
   */
  private async executeInParallel(input: ContentInput, executions: DetectorExecution[]): Promise<void> {
    const promises = executions.map(execution => this.executeDetector(input, execution))
    await Promise.allSettled(promises)
  }

  /**
   * Execute detectors sequentially with priority ordering
   */
  private async executeSequentially(input: ContentInput, executions: DetectorExecution[]): Promise<void> {
    // Sort by priority (higher number = higher priority)
    const sortedExecutions = [...executions].sort((a, b) => {
      const aPriority = this.detectors.get(a.detector)?.priority || 0
      const bPriority = this.detectors.get(b.detector)?.priority || 0
      return bPriority - aPriority
    })

    for (const execution of sortedExecutions) {
      await this.executeDetector(input, execution)
    }
  }

  /**
   * Execute a single detector with error handling and timeout
   */
  private async executeDetector(input: ContentInput, execution: DetectorExecution): Promise<void> {
    const config = this.detectors.get(execution.detector)
    if (!config || !config.enabled) {
      execution.status = 'failed'
      execution.error = 'Detector not available or disabled'
      execution.endTime = Date.now()
      return
    }

    execution.status = 'running'
    execution.startTime = Date.now()
    this.executing.add(execution.detector)

    try {
      const result = await Promise.race([
        this.runDetector(execution.detector, input),
        this.createTimeoutPromise(config.timeout)
      ])

      if (result) {
        execution.result = result
        execution.status = 'completed'
      } else {
        execution.status = 'timeout'
        execution.error = `Detector timed out after ${config.timeout}ms`
      }
    } catch (error) {
      execution.status = 'failed'
      execution.error = error instanceof Error ? error.message : 'Unknown error'

      // Retry logic for failed detectors
      if (config.retryAttempts > 0) {
        console.log(`Retrying detector ${execution.detector}...`)
        await this.retryDetector(input, execution, config.retryAttempts)
      }
    } finally {
      execution.endTime = Date.now()
      this.executing.delete(execution.detector)
    }
  }

  /**
   * Run specific detector based on name
   */
  private async runDetector(detectorName: string, input: ContentInput): Promise<DetectorResult | null> {
    switch (detectorName) {
      case 'ai-text-detection':
        return await this.runAITextDetection(input)

      case 'image-metadata-analysis':
        return await this.runImageMetadataAnalysis(input)

      case 'manipulation-detection':
        return await this.runManipulationDetection(input)

      case 'pattern-analysis':
        return await this.runPatternAnalysis(input)

      default:
        console.warn(`Unknown detector: ${detectorName}`)
        return null
    }
  }

  /**
   * Individual detector implementations
   */
  private async runAITextDetection(input: ContentInput): Promise<DetectorResult | null> {
    if (!input.contentType.startsWith('text/')) return null

    try {
      const { advancedTextDetector } = await import('../detectors/advanced-text')
      const content = Buffer.isBuffer(input.content) ? input.content.toString('utf-8') : input.content
      const result = await advancedTextDetector.analyze(content)

      return {
        detector: 'AI Text Detection',
        confidence: result.confidence * 100,
        indicators: result.indicators,
        reasoning: result.reasoning,
        processingTime: result.processingTime,
        evidence: {
          methods: result.methods,
          modelSignatures: result.modelSignatures,
          confidenceInterval: result.confidenceInterval
        }
      }
    } catch (error) {
      console.error('AI text detection error:', error)
      return null
    }
  }

  private async runImageMetadataAnalysis(input: ContentInput): Promise<DetectorResult | null> {
    if (!input.contentType.startsWith('image/') || !Buffer.isBuffer(input.content)) return null

    try {
      const { imageMetadataDetector } = await import('../detectors/image-metadata')
      const result = await imageMetadataDetector.analyze(input.content)

      return {
        detector: 'Image Metadata Analysis',
        confidence: (1 - result.confidence) * 100, // Convert suspicion to authenticity
        indicators: result.indicators,
        reasoning: result.reasoning,
        processingTime: result.processingTime,
        evidence: {
          metadata: result.metadata,
          statistics: result.statistics
        }
      }
    } catch (error) {
      console.error('Image metadata analysis error:', error)
      return null
    }
  }

  private async runManipulationDetection(input: ContentInput): Promise<DetectorResult | null> {
    try {
      // Basic manipulation detection (placeholder for advanced implementation)
      const indicators: string[] = []
      let confidence = 85

      if (typeof input.content === 'string') {
        const suspiciousPatterns = ['edited', 'modified', 'generated', 'artificial']
        const text = input.content.toLowerCase()

        suspiciousPatterns.forEach(pattern => {
          if (text.includes(pattern)) {
            indicators.push(`Contains suspicious term: ${pattern}`)
            confidence -= 15
          }
        })
      }

      return {
        detector: 'Manipulation Detection',
        confidence: Math.max(0, confidence),
        indicators,
        reasoning: indicators.length > 0
          ? 'Potential manipulation indicators detected'
          : 'No obvious manipulation patterns found',
        processingTime: 25,
        evidence: { patterns: indicators }
      }
    } catch (error) {
      console.error('Manipulation detection error:', error)
      return null
    }
  }

  private async runPatternAnalysis(input: ContentInput): Promise<DetectorResult | null> {
    try {
      // Advanced pattern analysis (placeholder for ML implementation)
      const indicators: string[] = []
      let confidence = 80

      // Basic pattern checks
      if (typeof input.content === 'string') {
        const content = input.content

        // Check for repetitive patterns
        const words = content.split(/\s+/)
        const uniqueWords = new Set(words)
        const repetitionRatio = uniqueWords.size / words.length

        if (repetitionRatio < 0.3) {
          indicators.push('High word repetition detected')
          confidence -= 20
        }

        // Check for unusual sentence structure
        const sentences = content.split(/[.!?]+/)
        const avgSentenceLength = words.length / sentences.length

        if (avgSentenceLength > 50 || avgSentenceLength < 5) {
          indicators.push('Unusual sentence length patterns')
          confidence -= 15
        }
      }

      return {
        detector: 'Pattern Analysis',
        confidence: Math.max(0, confidence),
        indicators,
        reasoning: indicators.length > 0
          ? 'Unusual content patterns detected'
          : 'Content patterns appear natural',
        processingTime: 35,
        evidence: { analysis: 'pattern-check' }
      }
    } catch (error) {
      console.error('Pattern analysis error:', error)
      return null
    }
  }

  /**
   * Retry failed detector with exponential backoff
   */
  private async retryDetector(
    input: ContentInput,
    execution: DetectorExecution,
    retriesLeft: number
  ): Promise<void> {
    if (retriesLeft <= 0) return

    const delay = Math.pow(2, 3 - retriesLeft) * 1000 // Exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay))

    try {
      const result = await this.runDetector(execution.detector, input)
      if (result) {
        execution.result = result
        execution.status = 'completed'
        execution.error = undefined
        return
      }
    } catch (error) {
      console.warn(`Retry failed for ${execution.detector}:`, error)
    }

    await this.retryDetector(input, execution, retriesLeft - 1)
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(timeoutMs: number): Promise<null> {
    return new Promise(resolve => {
      setTimeout(() => resolve(null), timeoutMs)
    })
  }

  /**
   * Initialize default detector configurations
   */
  private initializeDefaultDetectors(): void {
    this.registerDetector({
      name: 'ai-text-detection',
      enabled: true,
      priority: 10,
      timeout: 5000,
      retryAttempts: 2
    })

    this.registerDetector({
      name: 'image-metadata-analysis',
      enabled: true,
      priority: 8,
      timeout: 3000,
      retryAttempts: 1
    })

    this.registerDetector({
      name: 'manipulation-detection',
      enabled: true,
      priority: 6,
      timeout: 2000,
      retryAttempts: 1
    })

    this.registerDetector({
      name: 'pattern-analysis',
      enabled: true,
      priority: 4,
      timeout: 4000,
      retryAttempts: 2
    })
  }

  /**
   * Get coordination metrics
   */
  getMetrics(): {
    registeredDetectors: number
    activeExecutions: number
    availableDetectors: string[]
  } {
    return {
      registeredDetectors: this.detectors.size,
      activeExecutions: this.executing.size,
      availableDetectors: Array.from(this.detectors.keys())
    }
  }
}

// Export singleton instance
export const detectorCoordinator = new DetectorCoordinator()