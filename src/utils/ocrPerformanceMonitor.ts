/**
 * OCR Performance Monitoring Utilities
 * Phase 3 implementation for real-time performance tracking and analysis
 */

import type { PerformanceMetrics } from './ocrAccuracyMeasurement';

export interface PerformanceSnapshot {
  timestamp: number;
  memoryUsage: number;
  cpuUsage?: number;
  activeOperations: number;
  queueLength: number;
  errorRate: number;
}

export interface PerformanceThresholds {
  maxProcessingTime: number; // milliseconds
  maxMemoryUsage: number; // bytes
  maxQueueLength: number;
  maxErrorRate: number; // percentage
  minThroughput: number; // entities per second
}

export interface AlertConfig {
  enabled: boolean;
  thresholds: PerformanceThresholds;
  alertChannels: ('console' | 'callback')[];
  callback?: (alert: PerformanceAlert) => void;
}

export interface PerformanceAlert {
  type: 'warning' | 'error' | 'critical';
  metric: string;
  currentValue: number;
  threshold: number;
  timestamp: number;
  message: string;
  suggestions: string[];
}

export interface OperationContext {
  operationId: string;
  documentId: string;
  documentType: string;
  startTime: number;
  stage: 'ocr' | 'extraction' | 'mapping' | 'complete';
  memoryBaseline: number;
}

/**
 * Performance monitor for OCR operations
 */
export class OCRPerformanceMonitor {
  private snapshots: PerformanceSnapshot[] = [];
  private activeOperations: Map<string, OperationContext> = new Map();
  private alertConfig: AlertConfig;
  private operationQueue: string[] = [];
  private errorCount = 0;
  private totalOperations = 0;
  private snapshotInterval?: NodeJS.Timeout;

  constructor(alertConfig?: Partial<AlertConfig>) {
    this.alertConfig = {
      enabled: true,
      thresholds: {
        maxProcessingTime: 30000, // 30 seconds
        maxMemoryUsage: 200 * 1024 * 1024, // 200MB
        maxQueueLength: 10,
        maxErrorRate: 10, // 10%
        minThroughput: 0.5, // 0.5 entities per second
      },
      alertChannels: ['console'],
      ...alertConfig,
    };

    this.startPerformanceTracking();
  }

  /**
   * Start tracking an OCR operation
   */
  startOperation(
    operationId: string,
    documentId: string,
    documentType: string = 'steering-committee'
  ): void {
    const context: OperationContext = {
      operationId,
      documentId,
      documentType,
      startTime: performance.now(),
      stage: 'ocr',
      memoryBaseline: this.getCurrentMemoryUsage(),
    };

    this.activeOperations.set(operationId, context);
    this.operationQueue.push(operationId);
    this.totalOperations++;

    this.checkPerformanceThresholds();
  }

  /**
   * Update operation stage
   */
  updateOperationStage(
    operationId: string,
    stage: OperationContext['stage']
  ): void {
    const context = this.activeOperations.get(operationId);
    if (context) {
      context.stage = stage;
      this.activeOperations.set(operationId, context);
    }
  }

  /**
   * Complete an operation and record metrics
   */
  completeOperation(
    operationId: string,
    success: boolean,
    extractedEntities: number = 0
  ): PerformanceMetrics {
    const context = this.activeOperations.get(operationId);
    if (!context) {
      throw new Error(`Operation ${operationId} not found`);
    }

    const endTime = performance.now();
    const processingTime = endTime - context.startTime;
    const memoryUsage = this.getCurrentMemoryUsage() - context.memoryBaseline;
    const throughput =
      extractedEntities > 0 ? extractedEntities / (processingTime / 1000) : 0;

    const metrics: PerformanceMetrics = {
      processingTime: Math.round(processingTime),
      memoryUsage: Math.max(0, memoryUsage),
      ocrTime: this.estimateStageTime(context, 'ocr'),
      extractionTime: this.estimateStageTime(context, 'extraction'),
      mappingTime: this.estimateStageTime(context, 'mapping'),
      throughput,
    };

    // Clean up
    this.activeOperations.delete(operationId);
    const queueIndex = this.operationQueue.indexOf(operationId);
    if (queueIndex > -1) {
      this.operationQueue.splice(queueIndex, 1);
    }

    if (!success) {
      this.errorCount++;
    }

    // Check for performance alerts
    this.checkOperationMetrics(metrics);

    return metrics;
  }

  /**
   * Record an error for monitoring
   */
  recordError(operationId: string, error: Error): void {
    // Complete the operation as failed - this will increment errorCount in completeOperation
    this.completeOperation(operationId, false);

    if (this.alertConfig.enabled) {
      this.sendAlert({
        type: 'error',
        metric: 'operation_error',
        currentValue: 1,
        threshold: 0,
        timestamp: Date.now(),
        message: `OCR operation failed: ${error.message}`,
        suggestions: [
          'Check document quality and format',
          'Verify available memory and resources',
          'Consider reducing concurrent operations',
        ],
      });
    }
  }

  /**
   * Get current performance snapshot
   */
  getCurrentSnapshot(): PerformanceSnapshot {
    return {
      timestamp: Date.now(),
      memoryUsage: this.getCurrentMemoryUsage(),
      activeOperations: this.activeOperations.size,
      queueLength: this.operationQueue.length,
      errorRate: this.calculateErrorRate(),
    };
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(minutes: number = 10): PerformanceSnapshot[] {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return this.snapshots.filter(s => s.timestamp > cutoff);
  }

  /**
   * Get aggregate performance statistics
   */
  getPerformanceStats(timeWindow: number = 3600000): {
    avgProcessingTime: number;
    avgMemoryUsage: number;
    totalOperations: number;
    errorRate: number;
    peakMemoryUsage: number;
    avgQueueLength: number;
  } {
    const cutoff = Date.now() - timeWindow;
    const recentSnapshots = this.snapshots.filter(s => s.timestamp > cutoff);

    if (recentSnapshots.length === 0) {
      return {
        avgProcessingTime: 0,
        avgMemoryUsage: 0,
        totalOperations: this.totalOperations,
        errorRate: this.calculateErrorRate(),
        peakMemoryUsage: 0,
        avgQueueLength: 0,
      };
    }

    const avgMemoryUsage =
      recentSnapshots.reduce((sum, s) => sum + s.memoryUsage, 0) /
      recentSnapshots.length;
    const avgQueueLength =
      recentSnapshots.reduce((sum, s) => sum + s.queueLength, 0) /
      recentSnapshots.length;
    const peakMemoryUsage = Math.max(
      ...recentSnapshots.map(s => s.memoryUsage)
    );

    return {
      avgProcessingTime: 0, // This would need to be tracked separately for completed operations
      avgMemoryUsage,
      totalOperations: this.totalOperations,
      errorRate: this.calculateErrorRate(),
      peakMemoryUsage,
      avgQueueLength,
    };
  }

  /**
   * Check if system is under stress
   */
  isSystemUnderStress(): boolean {
    const snapshot = this.getCurrentSnapshot();
    const thresholds = this.alertConfig.thresholds;

    return (
      snapshot.memoryUsage > thresholds.maxMemoryUsage * 0.8 ||
      snapshot.queueLength > thresholds.maxQueueLength * 0.8 ||
      snapshot.errorRate > thresholds.maxErrorRate * 0.8
    );
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const snapshot = this.getCurrentSnapshot();
    const thresholds = this.alertConfig.thresholds;

    if (snapshot.memoryUsage > thresholds.maxMemoryUsage * 0.7) {
      recommendations.push(
        'Consider reducing concurrent operations to manage memory usage'
      );
      recommendations.push(
        'Implement document preprocessing to reduce memory footprint'
      );
    }

    if (snapshot.queueLength > thresholds.maxQueueLength * 0.7) {
      recommendations.push(
        'Increase processing capacity or implement queue management'
      );
      recommendations.push('Consider batch processing for better throughput');
    }

    if (snapshot.errorRate > thresholds.maxErrorRate * 0.5) {
      recommendations.push(
        'Review document quality validation before OCR processing'
      );
      recommendations.push(
        'Implement more robust error handling and retry mechanisms'
      );
    }

    if (this.activeOperations.size === 0 && this.operationQueue.length === 0) {
      recommendations.push(
        'System is idle - consider proactive document processing'
      );
    }

    return recommendations;
  }

  /**
   * Reset performance tracking
   */
  reset(): void {
    this.snapshots = [];
    this.activeOperations.clear();
    this.operationQueue = [];
    this.errorCount = 0;
    this.totalOperations = 0;
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
      this.snapshotInterval = undefined;
    }
  }

  // Private methods

  private startPerformanceTracking(): void {
    this.snapshotInterval = setInterval(() => {
      const snapshot = this.getCurrentSnapshot();
      this.snapshots.push(snapshot);

      // Keep only last hour of snapshots
      const cutoff = Date.now() - 3600000;
      this.snapshots = this.snapshots.filter(s => s.timestamp > cutoff);

      this.checkPerformanceThresholds();
    }, 5000); // Every 5 seconds
  }

  private getCurrentMemoryUsage(): number {
    // In browser environment, we can use performance.memory if available
    if (
      typeof window !== 'undefined' &&
      'performance' in window &&
      'memory' in
        (window.performance as { memory?: { usedJSHeapSize: number } })
    ) {
      return (window.performance as { memory: { usedJSHeapSize: number } })
        .memory.usedJSHeapSize;
    }

    // In Node.js environment
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }

    // Fallback estimation
    return 0;
  }

  private calculateErrorRate(): number {
    if (this.totalOperations === 0) return 0;
    return (this.errorCount / this.totalOperations) * 100;
  }

  private estimateStageTime(context: OperationContext, stage: string): number {
    // This is a simplified estimation - in practice, you'd track stage transitions
    const totalTime = performance.now() - context.startTime;

    switch (stage) {
      case 'ocr':
        return Math.round(totalTime * 0.7); // OCR typically takes 70% of total time
      case 'extraction':
        return Math.round(totalTime * 0.2); // Extraction takes 20%
      case 'mapping':
        return Math.round(totalTime * 0.1); // Mapping takes 10%
      default:
        return 0;
    }
  }

  private checkPerformanceThresholds(): void {
    if (!this.alertConfig.enabled) return;

    const snapshot = this.getCurrentSnapshot();
    const thresholds = this.alertConfig.thresholds;

    // Memory usage check
    if (snapshot.memoryUsage > thresholds.maxMemoryUsage) {
      this.sendAlert({
        type: 'critical',
        metric: 'memory_usage',
        currentValue: snapshot.memoryUsage,
        threshold: thresholds.maxMemoryUsage,
        timestamp: snapshot.timestamp,
        message: `Memory usage exceeded threshold: ${this.formatBytes(snapshot.memoryUsage)}`,
        suggestions: [
          'Reduce concurrent operations',
          'Clear document cache',
          'Consider processing smaller documents',
        ],
      });
    }

    // Queue length check
    if (snapshot.queueLength > thresholds.maxQueueLength) {
      this.sendAlert({
        type: 'warning',
        metric: 'queue_length',
        currentValue: snapshot.queueLength,
        threshold: thresholds.maxQueueLength,
        timestamp: snapshot.timestamp,
        message: `Operation queue is backing up: ${snapshot.queueLength} operations queued`,
        suggestions: [
          'Increase processing capacity',
          'Implement queue prioritization',
          'Consider batch processing',
        ],
      });
    }

    // Error rate check
    if (snapshot.errorRate > thresholds.maxErrorRate) {
      this.sendAlert({
        type: 'error',
        metric: 'error_rate',
        currentValue: snapshot.errorRate,
        threshold: thresholds.maxErrorRate,
        timestamp: snapshot.timestamp,
        message: `High error rate detected: ${snapshot.errorRate.toFixed(1)}%`,
        suggestions: [
          'Review document quality validation',
          'Check system resources',
          'Implement better error handling',
        ],
      });
    }
  }

  private checkOperationMetrics(metrics: PerformanceMetrics): void {
    if (!this.alertConfig.enabled) return;

    const thresholds = this.alertConfig.thresholds;

    // Processing time check
    if (metrics.processingTime > thresholds.maxProcessingTime) {
      this.sendAlert({
        type: 'warning',
        metric: 'processing_time',
        currentValue: metrics.processingTime,
        threshold: thresholds.maxProcessingTime,
        timestamp: Date.now(),
        message: `Operation took longer than expected: ${(metrics.processingTime / 1000).toFixed(1)}s`,
        suggestions: [
          'Consider document preprocessing',
          'Check system resources',
          'Optimize extraction patterns',
        ],
      });
    }

    // Throughput check
    if (
      metrics.throughput < thresholds.minThroughput &&
      metrics.throughput > 0
    ) {
      this.sendAlert({
        type: 'warning',
        metric: 'throughput',
        currentValue: metrics.throughput,
        threshold: thresholds.minThroughput,
        timestamp: Date.now(),
        message: `Low throughput detected: ${metrics.throughput.toFixed(2)} entities/sec`,
        suggestions: [
          'Optimize extraction algorithms',
          'Improve document quality',
          'Consider parallel processing',
        ],
      });
    }
  }

  private sendAlert(alert: PerformanceAlert): void {
    if (this.alertConfig.alertChannels.includes('console')) {
      const color =
        alert.type === 'critical'
          ? '\x1b[31m'
          : alert.type === 'error'
            ? '\x1b[33m'
            : '\x1b[36m';
      console.warn(
        `${color}[OCR Performance Alert - ${alert.type.toUpperCase()}]\x1b[0m ${alert.message}`
      );
      console.warn(
        `Current: ${alert.currentValue}, Threshold: ${alert.threshold}`
      );
      if (alert.suggestions.length > 0) {
        console.warn('Suggestions:', alert.suggestions.join(', '));
      }
    }

    if (
      this.alertConfig.alertChannels.includes('callback') &&
      this.alertConfig.callback
    ) {
      this.alertConfig.callback(alert);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

/**
 * Global performance monitor instance
 */
export let globalMonitor: OCRPerformanceMonitor | null = null;

/**
 * Get or create global performance monitor
 */
export function getPerformanceMonitor(
  config?: Partial<AlertConfig>
): OCRPerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = new OCRPerformanceMonitor(config);
  }
  return globalMonitor;
}

export function setGlobalMonitor(monitor: OCRPerformanceMonitor | null): void {
  globalMonitor = monitor;
}

/**
 * Performance monitoring decorator for OCR functions
 */
export function withPerformanceMonitoring<
  T extends (...args: unknown[]) => Promise<unknown>,
>(fn: T, operationName: string): T {
  return (async (...args: unknown[]) => {
    const monitor = getPerformanceMonitor();
    const operationId = `${operationName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      monitor.startOperation(operationId, 'unknown', 'unknown');
      const result = await fn(...args);
      monitor.completeOperation(operationId, true, 1); // Assuming 1 entity for simplicity
      return result;
    } catch (error) {
      monitor.recordError(operationId, error as Error);
      throw error;
    }
  }) as T;
}

/**
 * Create performance monitoring wrapper for OCR pipeline
 */
export function createMonitoredOCRPipeline() {
  const monitor = getPerformanceMonitor({
    enabled: true,
    thresholds: {
      maxProcessingTime: 60000, // 1 minute
      maxMemoryUsage: 500 * 1024 * 1024, // 500MB
      maxQueueLength: 5,
      maxErrorRate: 15,
      minThroughput: 0.3,
    },
    alertChannels: ['console'],
  });

  return {
    monitor,
    startOperation: monitor.startOperation.bind(monitor),
    updateStage: monitor.updateOperationStage.bind(monitor),
    completeOperation: monitor.completeOperation.bind(monitor),
    recordError: monitor.recordError.bind(monitor),
    getStats: monitor.getPerformanceStats.bind(monitor),
    isUnderStress: monitor.isSystemUnderStress.bind(monitor),
    getRecommendations: monitor.getOptimizationRecommendations.bind(monitor),
  };
}
