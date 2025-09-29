/**
 * Validation Monitoring and Alerting System
 *
 * Provides real-time monitoring, metrics collection, and alerting
 * for the 10/10 validation system.
 */

import { ValidationResult, ValidationLayer, ValidationSeverity } from '../validation-engine'
import { prisma } from '@/lib/prisma'

export interface ValidationMetrics {
  totalValidations: number
  successfulValidations: number
  failedValidations: number
  criticalFailures: number
  averageValidationTime: number
  layerSuccessRates: Record<ValidationLayer, number>
  commonErrors: Array<{ code: string; count: number; severity: string }>
  hourlyVolume: Array<{ hour: string; count: number }>
}

export interface ValidationAlert {
  id: string
  type: 'CRITICAL_FAILURE' | 'HIGH_ERROR_RATE' | 'SYSTEM_DEGRADATION' | 'SECURITY_BREACH'
  severity: ValidationSeverity
  message: string
  details: Record<string, unknown>
  timestamp: string
  acknowledged: boolean
  resolvedAt?: string
}

export interface MonitoringConfig {
  enableMetrics: boolean
  enableAlerting: boolean
  metricsRetentionDays: number
  alertThresholds: {
    criticalFailureRate: number    // Percentage
    highErrorRate: number          // Percentage
    avgValidationTime: number      // Milliseconds
    securityEventCount: number     // Per hour
  }
  alertChannels: string[]
}

/**
 * Core validation monitoring system
 */
export class ValidationMonitor {
  private config: MonitoringConfig
  private metrics: Map<string, any> = new Map()
  private alerts: ValidationAlert[] = []

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enableMetrics: true,
      enableAlerting: true,
      metricsRetentionDays: 30,
      alertThresholds: {
        criticalFailureRate: 5,    // 5%
        highErrorRate: 15,         // 15%
        avgValidationTime: 3000,   // 3 seconds
        securityEventCount: 10     // 10 per hour
      },
      alertChannels: ['console', 'database'],
      ...config
    }
  }

  /**
   * Record validation results for monitoring
   */
  async recordValidation(
    results: ValidationResult[],
    requestId: string,
    endpoint: string,
    enterpriseId?: string,
    processingTime?: number
  ): Promise<void> {
    if (!this.config.enableMetrics) {
      return
    }

    try {
      const validationRecord = {
        id: crypto.randomUUID(),
        requestId,
        endpoint,
        enterpriseId,
        results,
        processingTime: processingTime || 0,
        success: results.every(r => r.valid),
        criticalFailures: results.filter(r => !r.valid && r.severity === ValidationSeverity.CRITICAL).length,
        highFailures: results.filter(r => !r.valid && r.severity === ValidationSeverity.HIGH).length,
        timestamp: new Date()
      }

      // Store in database for persistence
      await this.storeValidationRecord(validationRecord)

      // Update in-memory metrics
      this.updateMetrics(validationRecord)

      // Check for alert conditions
      if (this.config.enableAlerting) {
        await this.checkAlertConditions(validationRecord)
      }

    } catch (error) {
      console.error('Error recording validation metrics:', error)
    }
  }

  /**
   * Get current validation metrics
   */
  async getMetrics(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<ValidationMetrics> {
    try {
      const timeframeStart = this.getTimeframeStart(timeframe)

      const validationRecords = await prisma.validationRecord.findMany({
        where: {
          timestamp: { gte: timeframeStart }
        },
        orderBy: { timestamp: 'desc' }
      })

      return this.calculateMetrics(validationRecords)

    } catch (error) {
      console.error('Error fetching validation metrics:', error)
      return this.getEmptyMetrics()
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<ValidationAlert[]> {
    try {
      const alerts = await prisma.validationAlert.findMany({
        where: {
          acknowledged: false,
          resolvedAt: null
        },
        orderBy: { timestamp: 'desc' }
      })

      return alerts.map(alert => ({
        id: alert.id,
        type: alert.type as any,
        severity: alert.severity as ValidationSeverity,
        message: alert.message,
        details: alert.details as Record<string, unknown>,
        timestamp: alert.timestamp.toISOString(),
        acknowledged: alert.acknowledged,
        resolvedAt: alert.resolvedAt?.toISOString()
      }))

    } catch (error) {
      console.error('Error fetching validation alerts:', error)
      return []
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    try {
      await prisma.validationAlert.update({
        where: { id: alertId },
        data: {
          acknowledged: true,
          acknowledgedBy,
          acknowledgedAt: new Date()
        }
      })

      console.log(`Alert ${alertId} acknowledged by ${acknowledgedBy}`)
      return true

    } catch (error) {
      console.error('Error acknowledging alert:', error)
      return false
    }
  }

  /**
   * Get validation health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'critical'
    metrics: ValidationMetrics
    activeAlerts: number
    recommendations: string[]
  }> {
    try {
      const metrics = await this.getMetrics('hour')
      const activeAlerts = await this.getActiveAlerts()
      const recommendations: string[] = []

      let status: 'healthy' | 'degraded' | 'critical' = 'healthy'

      // Determine health status
      if (activeAlerts.some(a => a.severity === ValidationSeverity.CRITICAL)) {
        status = 'critical'
        recommendations.push('Address critical validation failures immediately')
      } else if (metrics.failedValidations / metrics.totalValidations > 0.1) {
        status = 'degraded'
        recommendations.push('High validation failure rate detected')
      } else if (metrics.averageValidationTime > this.config.alertThresholds.avgValidationTime) {
        status = 'degraded'
        recommendations.push('Validation performance degradation detected')
      }

      // Add recommendations based on metrics
      if (metrics.commonErrors.length > 0) {
        const topError = metrics.commonErrors[0]
        recommendations.push(`Most common error: ${topError.code} (${topError.count} occurrences)`)
      }

      Object.entries(metrics.layerSuccessRates).forEach(([layer, rate]) => {
        if (rate < 90) {
          recommendations.push(`${layer} layer has low success rate: ${rate.toFixed(1)}%`)
        }
      })

      return {
        status,
        metrics,
        activeAlerts: activeAlerts.length,
        recommendations
      }

    } catch (error) {
      console.error('Error getting health status:', error)
      return {
        status: 'critical',
        metrics: this.getEmptyMetrics(),
        activeAlerts: 0,
        recommendations: ['Unable to assess system health']
      }
    }
  }

  /**
   * Store validation record in database
   */
  private async storeValidationRecord(record: any): Promise<void> {
    try {
      await prisma.validationRecord.create({
        data: {
          id: record.id,
          requestId: record.requestId,
          endpoint: record.endpoint,
          enterpriseId: record.enterpriseId,
          results: record.results,
          processingTime: record.processingTime,
          success: record.success,
          criticalFailures: record.criticalFailures,
          highFailures: record.highFailures,
          timestamp: record.timestamp
        }
      })
    } catch (error) {
      // Log error but don't throw to avoid disrupting validation flow
      console.error('Error storing validation record:', error)
    }
  }

  /**
   * Update in-memory metrics
   */
  private updateMetrics(record: any): void {
    const key = `metrics_${new Date().toISOString().slice(0, 13)}` // Hour key

    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        totalValidations: 0,
        successfulValidations: 0,
        failedValidations: 0,
        criticalFailures: 0,
        totalProcessingTime: 0,
        layerResults: {} as Record<ValidationLayer, { success: number; total: number }>
      })
    }

    const hourlyMetrics = this.metrics.get(key)
    hourlyMetrics.totalValidations += 1
    if (record.success) {
      hourlyMetrics.successfulValidations += 1
    } else {
      hourlyMetrics.failedValidations += 1
    }
    hourlyMetrics.criticalFailures += record.criticalFailures
    hourlyMetrics.totalProcessingTime += record.processingTime

    // Update layer metrics
    record.results.forEach((result: ValidationResult) => {
      if (!hourlyMetrics.layerResults[result.layer]) {
        hourlyMetrics.layerResults[result.layer] = { success: 0, total: 0 }
      }
      hourlyMetrics.layerResults[result.layer].total += 1
      if (result.valid) {
        hourlyMetrics.layerResults[result.layer].success += 1
      }
    })

    // Clean up old metrics (keep last 24 hours)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 13)
    for (const [key] of this.metrics) {
      if (key < `metrics_${cutoff}`) {
        this.metrics.delete(key)
      }
    }
  }

  /**
   * Check for alert conditions
   */
  private async checkAlertConditions(record: any): Promise<void> {
    try {
      const recentRecords = await this.getRecentRecords(1) // Last hour

      if (recentRecords.length === 0) return

      const totalRecords = recentRecords.length
      const criticalFailures = recentRecords.filter(r => r.criticalFailures > 0).length
      const highFailures = recentRecords.filter(r => r.highFailures > 0).length
      const avgProcessingTime = recentRecords.reduce((sum, r) => sum + r.processingTime, 0) / totalRecords

      // Critical failure rate alert
      const criticalFailureRate = (criticalFailures / totalRecords) * 100
      if (criticalFailureRate > this.config.alertThresholds.criticalFailureRate) {
        await this.createAlert('CRITICAL_FAILURE', ValidationSeverity.CRITICAL, {
          message: `Critical failure rate exceeded: ${criticalFailureRate.toFixed(1)}%`,
          details: { criticalFailureRate, threshold: this.config.alertThresholds.criticalFailureRate }
        })
      }

      // High error rate alert
      const errorRate = ((criticalFailures + highFailures) / totalRecords) * 100
      if (errorRate > this.config.alertThresholds.highErrorRate) {
        await this.createAlert('HIGH_ERROR_RATE', ValidationSeverity.HIGH, {
          message: `High error rate detected: ${errorRate.toFixed(1)}%`,
          details: { errorRate, threshold: this.config.alertThresholds.highErrorRate }
        })
      }

      // Performance degradation alert
      if (avgProcessingTime > this.config.alertThresholds.avgValidationTime) {
        await this.createAlert('SYSTEM_DEGRADATION', ValidationSeverity.MEDIUM, {
          message: `Validation performance degradation: ${avgProcessingTime.toFixed(0)}ms average`,
          details: { avgProcessingTime, threshold: this.config.alertThresholds.avgValidationTime }
        })
      }

      // Security breach detection
      const securityEvents = recentRecords.filter(r =>
        r.results.some((result: ValidationResult) =>
          result.code?.includes('XSS') ||
          result.code?.includes('SQL') ||
          result.code?.includes('TRAVERSAL')
        )
      ).length

      if (securityEvents > this.config.alertThresholds.securityEventCount) {
        await this.createAlert('SECURITY_BREACH', ValidationSeverity.CRITICAL, {
          message: `Multiple security events detected: ${securityEvents} in last hour`,
          details: { securityEvents, threshold: this.config.alertThresholds.securityEventCount }
        })
      }

    } catch (error) {
      console.error('Error checking alert conditions:', error)
    }
  }

  /**
   * Create and send alert
   */
  private async createAlert(
    type: ValidationAlert['type'],
    severity: ValidationSeverity,
    payload: { message: string; details: Record<string, unknown> }
  ): Promise<void> {
    try {
      const alert: ValidationAlert = {
        id: crypto.randomUUID(),
        type,
        severity,
        message: payload.message,
        details: payload.details,
        timestamp: new Date().toISOString(),
        acknowledged: false
      }

      // Store in database
      await prisma.validationAlert.create({
        data: {
          id: alert.id,
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          details: alert.details,
          timestamp: new Date(alert.timestamp),
          acknowledged: false
        }
      })

      // Send to configured alert channels
      await this.sendAlert(alert)

    } catch (error) {
      console.error('Error creating alert:', error)
    }
  }

  /**
   * Send alert to configured channels
   */
  private async sendAlert(alert: ValidationAlert): Promise<void> {
    for (const channel of this.config.alertChannels) {
      try {
        switch (channel) {
          case 'console':
            console.error(`🚨 VALIDATION ALERT [${alert.severity.toUpperCase()}]`, {
              type: alert.type,
              message: alert.message,
              details: alert.details,
              timestamp: alert.timestamp
            })
            break

          case 'database':
            // Already stored in database
            break

          case 'webhook':
            // TODO: Implement webhook notification
            break

          case 'email':
            // TODO: Implement email notification
            break

          case 'slack':
            // TODO: Implement Slack notification
            break

          default:
            console.warn(`Unknown alert channel: ${channel}`)
        }
      } catch (error) {
        console.error(`Error sending alert to ${channel}:`, error)
      }
    }
  }

  /**
   * Calculate metrics from validation records
   */
  private calculateMetrics(records: any[]): ValidationMetrics {
    if (records.length === 0) {
      return this.getEmptyMetrics()
    }

    const totalValidations = records.length
    const successfulValidations = records.filter(r => r.success).length
    const failedValidations = totalValidations - successfulValidations
    const criticalFailures = records.reduce((sum, r) => sum + r.criticalFailures, 0)
    const averageValidationTime = records.reduce((sum, r) => sum + r.processingTime, 0) / totalValidations

    // Calculate layer success rates
    const layerSuccessRates = {} as Record<ValidationLayer, number>
    const layerCounts = {} as Record<ValidationLayer, { success: number; total: number }>

    records.forEach(record => {
      record.results.forEach((result: ValidationResult) => {
        if (!layerCounts[result.layer]) {
          layerCounts[result.layer] = { success: 0, total: 0 }
        }
        layerCounts[result.layer].total += 1
        if (result.valid) {
          layerCounts[result.layer].success += 1
        }
      })
    })

    Object.entries(layerCounts).forEach(([layer, counts]) => {
      layerSuccessRates[layer as ValidationLayer] = (counts.success / counts.total) * 100
    })

    // Find common errors
    const errorCounts = {} as Record<string, { count: number; severity: string }>
    records.forEach(record => {
      record.results.forEach((result: ValidationResult) => {
        if (!result.valid) {
          if (!errorCounts[result.code]) {
            errorCounts[result.code] = { count: 0, severity: result.severity }
          }
          errorCounts[result.code].count += 1
        }
      })
    })

    const commonErrors = Object.entries(errorCounts)
      .map(([code, data]) => ({ code, count: data.count, severity: data.severity }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Calculate hourly volume
    const hourlyVolume = this.calculateHourlyVolume(records)

    return {
      totalValidations,
      successfulValidations,
      failedValidations,
      criticalFailures,
      averageValidationTime,
      layerSuccessRates,
      commonErrors,
      hourlyVolume
    }
  }

  private calculateHourlyVolume(records: any[]): Array<{ hour: string; count: number }> {
    const hourCounts = {} as Record<string, number>

    records.forEach(record => {
      const hour = new Date(record.timestamp).toISOString().slice(0, 13)
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    return Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour))
  }

  private getTimeframeStart(timeframe: 'hour' | 'day' | 'week'): Date {
    const now = new Date()
    switch (timeframe) {
      case 'hour':
        return new Date(now.getTime() - 60 * 60 * 1000)
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }
  }

  private async getRecentRecords(hours: number): Promise<any[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)
    return await prisma.validationRecord.findMany({
      where: { timestamp: { gte: since } },
      orderBy: { timestamp: 'desc' }
    })
  }

  private getEmptyMetrics(): ValidationMetrics {
    return {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      criticalFailures: 0,
      averageValidationTime: 0,
      layerSuccessRates: {} as Record<ValidationLayer, number>,
      commonErrors: [],
      hourlyVolume: []
    }
  }
}

// Export singleton instance
export const validationMonitor = new ValidationMonitor()