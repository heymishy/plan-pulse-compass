import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Clock, Zap, AlertTriangle } from 'lucide-react';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  interactionDelay: number;
  totalComponents: number;
  virtualizedItems: number;
  lastUpdate: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  showDetails?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = false,
  showDetails = false,
  onMetricsUpdate,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    renderTime: 0,
    interactionDelay: 0,
    totalComponents: 0,
    virtualizedItems: 0,
    lastUpdate: Date.now(),
  });

  const [isVisible, setIsVisible] = useState(false);
  const frameRef = useRef<number>();
  const lastFrameTime = useRef<number>(performance.now());
  const frameCount = useRef<number>(0);
  const renderStartTime = useRef<number>(0);

  // FPS calculation
  useEffect(() => {
    if (!enabled) return;

    const calculateFPS = () => {
      const now = performance.now();
      frameCount.current++;

      if (now - lastFrameTime.current >= 1000) {
        const fps = Math.round(
          (frameCount.current * 1000) / (now - lastFrameTime.current)
        );

        setMetrics(prev => ({
          ...prev,
          fps,
          lastUpdate: now,
        }));

        frameCount.current = 0;
        lastFrameTime.current = now;
      }

      frameRef.current = requestAnimationFrame(calculateFPS);
    };

    calculateFPS();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [enabled]);

  // Memory usage monitoring
  useEffect(() => {
    if (!enabled) return;

    const updateMemoryMetrics = () => {
      if ('memory' in performance) {
        // @ts-expect-error - Chrome-specific memory API not in standard types
        const memory = performance.memory;
        const memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);

        setMetrics(prev => ({
          ...prev,
          memoryUsage,
        }));
      }
    };

    const interval = setInterval(updateMemoryMetrics, 2000);
    updateMemoryMetrics();

    return () => clearInterval(interval);
  }, [enabled]);

  // Component count monitoring
  useEffect(() => {
    if (!enabled) return;

    const countComponents = () => {
      const totalComponents = document.querySelectorAll('*').length;
      const virtualizedItems =
        document.querySelectorAll('[data-virtualized]').length;

      setMetrics(prev => ({
        ...prev,
        totalComponents,
        virtualizedItems,
      }));
    };

    const interval = setInterval(countComponents, 5000);
    countComponents();

    return () => clearInterval(interval);
  }, [enabled]);

  // Performance observer for render timing
  useEffect(() => {
    if (!enabled) return;

    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure' && entry.name === 'React render') {
            setMetrics(prev => ({
              ...prev,
              renderTime: Math.round(entry.duration),
            }));
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['measure'] });
      } catch (e) {
        // PerformanceObserver not fully supported
      }

      return () => observer.disconnect();
    }
  }, [enabled]);

  // Report metrics to parent
  useEffect(() => {
    if (onMetricsUpdate) {
      onMetricsUpdate(metrics);
    }
  }, [metrics, onMetricsUpdate]);

  const getPerformanceStatus = () => {
    if (metrics.fps >= 55) return { status: 'excellent', color: 'green' };
    if (metrics.fps >= 45) return { status: 'good', color: 'blue' };
    if (metrics.fps >= 30) return { status: 'fair', color: 'yellow' };
    return { status: 'poor', color: 'red' };
  };

  const getMemoryStatus = () => {
    if (metrics.memoryUsage < 50) return { status: 'low', color: 'green' };
    if (metrics.memoryUsage < 100)
      return { status: 'moderate', color: 'yellow' };
    return { status: 'high', color: 'red' };
  };

  if (!enabled) return null;

  const performanceStatus = getPerformanceStatus();
  const memoryStatus = getMemoryStatus();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isVisible ? (
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg"
        >
          <Activity className="h-4 w-4" />
          Performance
        </Button>
      ) : (
        <Card className="w-80 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Performance Monitor
              </CardTitle>
              <Button
                onClick={() => setIsVisible(false)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* FPS */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="text-sm">FPS</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{metrics.fps}</span>
                <Badge
                  variant={
                    performanceStatus.color === 'green'
                      ? 'default'
                      : 'destructive'
                  }
                  className="text-xs"
                >
                  {performanceStatus.status}
                </Badge>
              </div>
            </div>

            {/* Memory Usage */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Memory</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">
                  {metrics.memoryUsage}MB
                </span>
                <Badge
                  variant={
                    memoryStatus.color === 'green' ? 'default' : 'destructive'
                  }
                  className="text-xs"
                >
                  {memoryStatus.status}
                </Badge>
              </div>
            </div>

            {/* Render Time */}
            {metrics.renderTime > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Render</span>
                </div>
                <span className="font-mono text-sm">
                  {metrics.renderTime}ms
                </span>
              </div>
            )}

            {showDetails && (
              <>
                <hr className="my-2" />

                {/* Component Count */}
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>DOM Elements</span>
                  <span className="font-mono">
                    {metrics.totalComponents.toLocaleString()}
                  </span>
                </div>

                {/* Virtualized Items */}
                {metrics.virtualizedItems > 0 && (
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Virtualized</span>
                    <span className="font-mono">
                      {metrics.virtualizedItems}
                    </span>
                  </div>
                )}

                {/* Performance Tips */}
                <div className="pt-2 text-xs text-gray-500">
                  {metrics.fps < 30 && (
                    <div className="text-red-600">
                      ⚠️ Poor performance detected. Consider enabling
                      virtualization.
                    </div>
                  )}
                  {metrics.memoryUsage > 100 && (
                    <div className="text-yellow-600">
                      💡 High memory usage. Check for memory leaks.
                    </div>
                  )}
                  {metrics.totalComponents > 5000 && (
                    <div className="text-blue-600">
                      📊 Large DOM detected. Consider pagination.
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceMonitor;
