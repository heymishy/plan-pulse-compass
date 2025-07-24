/**
 * Tests for OCR Performance Monitor
 * Phase 3 implementation testing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  OCRPerformanceMonitor,
  getPerformanceMonitor,
  setGlobalMonitor,
  withPerformanceMonitoring,
  createMonitoredOCRPipeline,
  type PerformanceAlert,
  type PerformanceThresholds,
  type AlertConfig,
} from '../ocrPerformanceMonitor';

// Mock performance.now() for consistent testing
const mockPerformanceNow = vi.fn();
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow,
  },
  writable: true,
});

// Mock Date.now() for consistent testing
const mockDateNow = vi.fn();
Date.now = mockDateNow;

// Mock process.memoryUsage for consistent memory testing
const mockProcessMemoryUsage = vi.fn();
Object.defineProperty(global, 'process', {
  value: {
    memoryUsage: mockProcessMemoryUsage,
  },
  writable: true,
});

describe('OCRPerformanceMonitor', () => {
  let monitor: OCRPerformanceMonitor;
  let mockTime: number;
  let mockTimestamp: number;

  beforeEach(() => {
    mockTime = 0;
    mockTimestamp = 1640995200000; // 2022-01-01 00:00:00 UTC

    mockPerformanceNow.mockImplementation(() => mockTime);
    mockDateNow.mockImplementation(() => mockTimestamp);

    // Set up low memory usage for normal conditions (10MB)
    mockProcessMemoryUsage.mockReturnValue({
      heapUsed: 10 * 1024 * 1024, // 10MB - well below threshold
      heapTotal: 50 * 1024 * 1024,
      external: 0,
      arrayBuffers: 0,
      rss: 100 * 1024 * 1024,
    });

    // Clear the global monitor instance
    setGlobalMonitor(null);

    monitor = new OCRPerformanceMonitor({
      enabled: false, // Disable alerts for most tests
      thresholds: {
        maxProcessingTime: 10000,
        maxMemoryUsage: 100 * 1024 * 1024,
        maxQueueLength: 5,
        maxErrorRate: 20,
        minThroughput: 1.0,
      },
      alertChannels: ['console'],
    });
  });

  afterEach(() => {
    monitor.stop();
    vi.clearAllMocks();
  });

  describe('operation tracking', () => {
    it('should start and complete operations successfully', () => {
      const operationId = 'test-op-1';

      monitor.startOperation(operationId, 'test-doc', 'steering-committee');

      mockTime = 5000; // Simulate 5 seconds processing
      const metrics = monitor.completeOperation(operationId, true, 10);

      expect(metrics.processingTime).toBe(5000);
      expect(metrics.throughput).toBe(2); // 10 entities / 5 seconds
      expect(metrics.ocrTime).toBeGreaterThan(0);
      expect(metrics.extractionTime).toBeGreaterThan(0);
      expect(metrics.mappingTime).toBeGreaterThan(0);
    });

    it('should track multiple concurrent operations', () => {
      const op1 = 'test-op-1';
      const op2 = 'test-op-2';

      monitor.startOperation(op1, 'doc-1', 'steering-committee');
      mockTime = 1000;
      monitor.startOperation(op2, 'doc-2', 'steering-committee');

      const snapshot = monitor.getCurrentSnapshot();
      expect(snapshot.activeOperations).toBe(2);
      expect(snapshot.queueLength).toBe(2);

      mockTime = 3000;
      monitor.completeOperation(op1, true, 5);

      const snapshot2 = monitor.getCurrentSnapshot();
      expect(snapshot2.activeOperations).toBe(1);
      expect(snapshot2.queueLength).toBe(1);

      mockTime = 5000;
      monitor.completeOperation(op2, true, 8);

      const snapshot3 = monitor.getCurrentSnapshot();
      expect(snapshot3.activeOperations).toBe(0);
      expect(snapshot3.queueLength).toBe(0);
    });

    it('should update operation stages', () => {
      const operationId = 'test-op-1';

      monitor.startOperation(operationId, 'test-doc');
      monitor.updateOperationStage(operationId, 'extraction');
      monitor.updateOperationStage(operationId, 'mapping');

      // Should not throw any errors
      expect(() => {
        monitor.completeOperation(operationId, true, 3);
      }).not.toThrow();
    });

    it('should handle operation errors', () => {
      const operationId = 'test-op-error';
      const testError = new Error('Test OCR error');

      monitor.startOperation(operationId, 'test-doc');

      expect(() => {
        monitor.recordError(operationId, testError);
      }).not.toThrow();

      const snapshot = monitor.getCurrentSnapshot();
      expect(snapshot.errorRate).toBeGreaterThan(0);
    });

    it('should throw error for non-existent operation', () => {
      expect(() => {
        monitor.completeOperation('non-existent-op', true, 1);
      }).toThrow('Operation non-existent-op not found');
    });
  });

  describe('performance snapshots', () => {
    it('should generate current performance snapshots', () => {
      const snapshot = monitor.getCurrentSnapshot();

      expect(snapshot).toHaveProperty('timestamp');
      expect(snapshot).toHaveProperty('memoryUsage');
      expect(snapshot).toHaveProperty('activeOperations');
      expect(snapshot).toHaveProperty('queueLength');
      expect(snapshot).toHaveProperty('errorRate');

      expect(snapshot.timestamp).toBe(mockTimestamp);
      expect(snapshot.activeOperations).toBe(0);
      expect(snapshot.queueLength).toBe(0);
      expect(snapshot.errorRate).toBe(0);
    });

    it('should track performance history', () => {
      // Start some operations to generate data
      monitor.startOperation('op1', 'doc1');
      monitor.startOperation('op2', 'doc2');

      mockTimestamp += 60000; // Advance 1 minute

      const history = monitor.getPerformanceHistory(5); // Last 5 minutes

      expect(Array.isArray(history)).toBe(true);
      // History might be empty initially since we're not running the interval
    });

    it('should calculate performance statistics', () => {
      // Complete some operations to generate stats
      monitor.startOperation('op1', 'doc1');
      monitor.completeOperation('op1', true, 5);

      monitor.startOperation('op2', 'doc2');
      monitor.recordError('op2', new Error('Test error'));

      const stats = monitor.getPerformanceStats();

      expect(stats).toHaveProperty('totalOperations');
      expect(stats).toHaveProperty('errorRate');
      expect(stats).toHaveProperty('avgMemoryUsage');
      expect(stats).toHaveProperty('peakMemoryUsage');
      expect(stats).toHaveProperty('avgQueueLength');

      expect(stats.totalOperations).toBe(2);
      expect(stats.errorRate).toBe(50); // 1 error out of 2 operations
    });
  });

  describe('stress detection', () => {
    it('should detect system under stress', () => {
      // Start many operations to simulate stress
      for (let i = 0; i < 10; i++) {
        monitor.startOperation(`stress-op-${i}`, `doc-${i}`);
      }

      const isStressed = monitor.isSystemUnderStress();
      expect(isStressed).toBe(true); // Queue length > threshold * 0.8
    });

    it('should not detect stress under normal conditions', () => {
      const isStressed = monitor.isSystemUnderStress();
      expect(isStressed).toBe(false);
    });

    it('should provide optimization recommendations under stress', () => {
      // Simulate high queue length
      for (let i = 0; i < 8; i++) {
        monitor.startOperation(`queue-op-${i}`, `doc-${i}`);
      }

      const recommendations = monitor.getOptimizationRecommendations();

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);

      const hasQueueRecommendation = recommendations.some(
        rec =>
          rec.includes('queue') ||
          rec.includes('capacity') ||
          rec.includes('batch')
      );
      expect(hasQueueRecommendation).toBe(true);
    });

    it('should provide idle recommendations when system is idle', () => {
      const recommendations = monitor.getOptimizationRecommendations();

      const hasIdleRecommendation = recommendations.some(
        rec => rec.includes('idle') || rec.includes('proactive')
      );
      expect(hasIdleRecommendation).toBe(true);
    });
  });

  describe('alerting system', () => {
    let alertSpy: ReturnType<typeof vi.fn>;
    let consoleWarnSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      alertSpy = vi.fn();
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      monitor = new OCRPerformanceMonitor({
        enabled: true,
        thresholds: {
          maxProcessingTime: 1000, // 1 second
          maxMemoryUsage: 50 * 1024 * 1024, // 50MB
          maxQueueLength: 2,
          maxErrorRate: 10,
          minThroughput: 2.0,
        },
        alertChannels: ['console', 'callback'],
        callback: alertSpy,
      });
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it('should trigger processing time alert', () => {
      const operationId = 'slow-op';

      monitor.startOperation(operationId, 'test-doc');
      mockTime = 2000; // 2 seconds (exceeds 1 second threshold)
      monitor.completeOperation(operationId, true, 1);

      expect(alertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          metric: 'processing_time',
          currentValue: 2000,
          threshold: 1000,
        })
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[OCR Performance Alert - WARNING]')
      );
    });

    it('should trigger queue length alert', () => {
      // Start more operations than threshold
      for (let i = 0; i < 3; i++) {
        monitor.startOperation(`queue-op-${i}`, `doc-${i}`);
      }

      // Manually trigger threshold check
      (monitor as any).checkPerformanceThresholds();

      expect(alertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          metric: 'queue_length',
          currentValue: 3,
          threshold: 2,
        })
      );
    });

    it('should trigger throughput alert', () => {
      const operationId = 'low-throughput-op';

      monitor.startOperation(operationId, 'test-doc');
      mockTime = 10000; // 10 seconds
      monitor.completeOperation(operationId, true, 1); // Only 1 entity = 0.1 entities/sec

      expect(alertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          metric: 'throughput',
          currentValue: 0.1,
          threshold: 2.0,
        })
      );
    });

    it('should trigger error rate alert', () => {
      // Generate multiple operations with high error rate
      for (let i = 0; i < 10; i++) {
        monitor.startOperation(`error-op-${i}`, `doc-${i}`);
        if (i < 2) {
          monitor.completeOperation(`error-op-${i}`, true, 1);
        } else {
          monitor.recordError(`error-op-${i}`, new Error(`Error ${i}`));
        }
      }

      // Error rate should be 80% (8 errors out of 10 operations)
      expect(alertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          metric: 'operation_error',
        })
      );
    });

    it('should not trigger alerts when disabled', () => {
      monitor = new OCRPerformanceMonitor({
        enabled: false,
        callback: alertSpy,
      });

      const operationId = 'test-op';
      monitor.startOperation(operationId, 'test-doc');
      mockTime = 60000; // Very slow operation - 1 minute
      monitor.completeOperation(operationId, true, 1);

      expect(alertSpy).not.toHaveBeenCalled();
    });
  });

  describe('cleanup and reset', () => {
    it('should reset all tracking data', () => {
      // Generate some data
      monitor.startOperation('op1', 'doc1');
      monitor.completeOperation('op1', true, 5);
      monitor.startOperation('op2', 'doc2');
      monitor.recordError('op2', new Error('Test error'));

      // Reset
      monitor.reset();

      const snapshot = monitor.getCurrentSnapshot();
      expect(snapshot.activeOperations).toBe(0);
      expect(snapshot.queueLength).toBe(0);
      expect(snapshot.errorRate).toBe(0);

      const stats = monitor.getPerformanceStats();
      expect(stats.totalOperations).toBe(0);
      expect(stats.errorRate).toBe(0);
    });

    it('should stop performance tracking', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      monitor.stop();

      expect((monitor as any).snapshotInterval).toBe(undefined);
      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });
  });
});

describe('getPerformanceMonitor', () => {
  afterEach(() => {
    // Clear global instance
    setGlobalMonitor(null);
  });

  it('should return singleton instance', () => {
    const monitor1 = getPerformanceMonitor();
    const monitor2 = getPerformanceMonitor();

    expect(monitor1).toBe(monitor2);
  });

  it('should create new instance with custom config', () => {
    const customConfig = {
      enabled: false,
      thresholds: {
        maxProcessingTime: 5000,
        maxMemoryUsage: 200 * 1024 * 1024,
        maxQueueLength: 10,
        maxErrorRate: 5,
        minThroughput: 0.5,
      },
    };

    const monitor = getPerformanceMonitor(customConfig);

    expect(monitor).toBeDefined();
    expect((monitor as any).alertConfig.enabled).toBe(false);
    expect((monitor as any).alertConfig.thresholds.maxProcessingTime).toBe(
      5000
    );
  });
});

describe('withPerformanceMonitoring', () => {
  let mockTime: number;

  beforeEach(() => {
    mockTime = 0;
    mockPerformanceNow.mockImplementation(() => mockTime);

    // Clear global instance
    setGlobalMonitor(null);
  });

  it('should wrap async function with monitoring', async () => {
    const mockAsyncFunction = vi
      .fn()
      .mockImplementation(async (data: string) => {
        mockTime = 2000; // Simulate 2 seconds processing
        return `processed-${data}`;
      });

    const monitoredFunction = withPerformanceMonitoring(
      mockAsyncFunction,
      'test-operation'
    );

    const result = await monitoredFunction('test-data');

    expect(result).toBe('processed-test-data');
    expect(mockAsyncFunction).toHaveBeenCalledWith('test-data');
  });

  it('should handle function errors and record them', async () => {
    const mockAsyncFunction = vi
      .fn()
      .mockRejectedValue(new Error('Test error'));

    const monitoredFunction = withPerformanceMonitoring(
      mockAsyncFunction,
      'error-operation'
    );

    await expect(monitoredFunction('test-data')).rejects.toThrow('Test error');

    // Monitor should have recorded the error
    const monitor = getPerformanceMonitor();
    const stats = monitor.getPerformanceStats();
    expect(stats.errorRate).toBeGreaterThan(0);
  });

  it('should work with functions that have multiple parameters', async () => {
    const mockFunction = vi
      .fn()
      .mockImplementation(async (a: number, b: string, c: boolean) => {
        return { a, b, c };
      });

    const monitoredFunction = withPerformanceMonitoring(
      mockFunction,
      'multi-param'
    );

    const result = await monitoredFunction(42, 'test', true);

    expect(result).toEqual({ a: 42, b: 'test', c: true });
    expect(mockFunction).toHaveBeenCalledWith(42, 'test', true);
  });
});

describe('createMonitoredOCRPipeline', () => {
  beforeEach(() => {
    // Clear global instance
    setGlobalMonitor(null);
  });

  it('should create a complete monitored pipeline', () => {
    const pipeline = createMonitoredOCRPipeline();

    expect(pipeline).toHaveProperty('monitor');
    expect(pipeline).toHaveProperty('startOperation');
    expect(pipeline).toHaveProperty('updateStage');
    expect(pipeline).toHaveProperty('completeOperation');
    expect(pipeline).toHaveProperty('recordError');
    expect(pipeline).toHaveProperty('getStats');
    expect(pipeline).toHaveProperty('isUnderStress');
    expect(pipeline).toHaveProperty('getRecommendations');

    expect(typeof pipeline.startOperation).toBe('function');
    expect(typeof pipeline.updateStage).toBe('function');
    expect(typeof pipeline.completeOperation).toBe('function');
    expect(typeof pipeline.recordError).toBe('function');
    expect(typeof pipeline.getStats).toBe('function');
    expect(typeof pipeline.isUnderStress).toBe('function');
    expect(typeof pipeline.getRecommendations).toBe('function');
  });

  it('should configure monitor with OCR-specific thresholds', () => {
    setGlobalMonitor(null); // Ensure fresh monitor
    const pipeline = createMonitoredOCRPipeline();
    const monitor = pipeline.monitor;

    expect((monitor as any).alertConfig.enabled).toBe(true);
    expect((monitor as any).alertConfig.thresholds.maxProcessingTime).toBe(
      60000
    ); // 1 minute
    expect((monitor as any).alertConfig.thresholds.maxMemoryUsage).toBe(
      500 * 1024 * 1024
    ); // 500MB
    expect((monitor as any).alertConfig.thresholds.maxQueueLength).toBe(5);
    expect((monitor as any).alertConfig.thresholds.maxErrorRate).toBe(15);
    expect((monitor as any).alertConfig.thresholds.minThroughput).toBe(0.3);
  });

  it('should provide bound methods that work correctly', () => {
    const pipeline = createMonitoredOCRPipeline();

    // Test that methods are properly bound
    expect(() => {
      pipeline.startOperation('test-op', 'test-doc', 'steering-committee');
    }).not.toThrow();

    expect(() => {
      pipeline.updateStage('test-op', 'extraction');
    }).not.toThrow();

    expect(() => {
      const stats = pipeline.getStats();
    }).not.toThrow();

    expect(() => {
      const stressed = pipeline.isUnderStress();
    }).not.toThrow();

    expect(() => {
      const recommendations = pipeline.getRecommendations();
    }).not.toThrow();
  });
});
