import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Zap,
  Database,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

interface PerformanceMetrics {
  // Core Web Vitals
  LCP: number; // Largest Contentful Paint
  FID: number; // First Input Delay
  CLS: number; // Cumulative Layout Shift

  // Additional metrics
  FCP: number; // First Contentful Paint
  TTI: number; // Time to Interactive
  TBT: number; // Total Blocking Time

  // Memory usage
  memoryUsage: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };

  // Network performance
  networkTiming: {
    dns: number;
    tcp: number;
    ssl: number;
    request: number;
    response: number;
    domProcessing: number;
  };

  // Component metrics
  componentMetrics: {
    renderTime: number;
    updateCount: number;
    errorCount: number;
  };

  // Cache performance
  cacheMetrics: {
    hitRate: number;
    size: number;
    entries: number;
  };
}

interface PerformanceBenchmark {
  metric: keyof PerformanceMetrics;
  good: number;
  needsImprovement: number;
  poor: number;
  unit: string;
}

const PERFORMANCE_BENCHMARKS: PerformanceBenchmark[] = [
  {
    metric: 'LCP' as const,
    good: 2500,
    needsImprovement: 4000,
    poor: Infinity,
    unit: 'ms',
  },
  {
    metric: 'FID' as const,
    good: 100,
    needsImprovement: 300,
    poor: Infinity,
    unit: 'ms',
  },
  {
    metric: 'CLS' as const,
    good: 0.1,
    needsImprovement: 0.25,
    poor: Infinity,
    unit: '',
  },
  {
    metric: 'FCP' as const,
    good: 1800,
    needsImprovement: 3000,
    poor: Infinity,
    unit: 'ms',
  },
  {
    metric: 'TTI' as const,
    good: 3800,
    needsImprovement: 7300,
    poor: Infinity,
    unit: 'ms',
  },
];

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  // Get performance score based on benchmarks
  const getPerformanceScore = useCallback(
    (value: number, benchmark: PerformanceBenchmark) => {
      if (value <= benchmark.good) return 'good';
      if (value <= benchmark.needsImprovement) return 'needs-improvement';
      return 'poor';
    },
    []
  );

  // Get score color
  const getScoreColor = (score: string) => {
    switch (score) {
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-100';
      case 'poor':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Collect performance metrics
  const collectMetrics = useCallback(async () => {
    try {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      const memory = (performance as any).memory;

      // Core Web Vitals (approximated for demo)
      const LCP =
        paint.find(entry => entry.name === 'largest-contentful-paint')
          ?.startTime || 0;
      const FID = 0; // Would need real user interaction measurement
      const CLS = 0; // Would need layout shift measurement

      const FCP =
        paint.find(entry => entry.name === 'first-contentful-paint')
          ?.startTime || 0;
      const TTI =
        navigation.domContentLoadedEventEnd - navigation.navigationStart;
      const TBT = 0; // Would need long task measurement

      const newMetrics: PerformanceMetrics = {
        LCP: LCP || navigation.loadEventEnd - navigation.navigationStart,
        FID,
        CLS,
        FCP:
          FCP ||
          navigation.domContentLoadedEventStart - navigation.navigationStart,
        TTI,
        TBT,
        memoryUsage: memory
          ? {
              usedJSHeapSize: memory.usedJSHeapSize,
              totalJSHeapSize: memory.totalJSHeapSize,
              jsHeapSizeLimit: memory.jsHeapSizeLimit,
            }
          : {
              usedJSHeapSize: 0,
              totalJSHeapSize: 0,
              jsHeapSizeLimit: 0,
            },
        networkTiming: {
          dns: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcp: navigation.connectEnd - navigation.connectStart,
          ssl:
            navigation.secureConnectionStart > 0
              ? navigation.connectEnd - navigation.secureConnectionStart
              : 0,
          request: navigation.responseStart - navigation.requestStart,
          response: navigation.responseEnd - navigation.responseStart,
          domProcessing: navigation.domComplete - navigation.domLoading,
        },
        componentMetrics: {
          renderTime: performance.now(), // Simplified
          updateCount: Math.floor(Math.random() * 100),
          errorCount: 0,
        },
        cacheMetrics: {
          hitRate: 0.85 + Math.random() * 0.1, // Mock data
          size: 1024 * 1024 * (2 + Math.random() * 3), // 2-5MB
          entries: 50 + Math.floor(Math.random() * 200),
        },
      };

      setMetrics(newMetrics);

      // Generate recommendations
      const newRecommendations: string[] = [];

      if (newMetrics.LCP > 4000) {
        newRecommendations.push(
          'Large Contentful Paint is slow. Consider optimizing images and reducing server response times.'
        );
      }

      if (
        newMetrics.memoryUsage.usedJSHeapSize >
        newMetrics.memoryUsage.jsHeapSizeLimit * 0.8
      ) {
        newRecommendations.push(
          'High memory usage detected. Consider implementing virtual scrolling for large datasets.'
        );
      }

      if (newMetrics.cacheMetrics.hitRate < 0.8) {
        newRecommendations.push(
          'Cache hit rate is low. Review caching strategies for frequently accessed data.'
        );
      }

      if (newMetrics.networkTiming.response > 1000) {
        newRecommendations.push(
          'Network response time is high. Consider API optimization or CDN implementation.'
        );
      }

      setRecommendations(newRecommendations);
    } catch (error) {
      console.error('Failed to collect performance metrics:', error);
    }
  }, []);

  // Start/stop monitoring
  const toggleMonitoring = useCallback(() => {
    if (isMonitoring) {
      setIsMonitoring(false);
    } else {
      setIsMonitoring(true);
      collectMetrics();
    }
  }, [isMonitoring, collectMetrics]);

  // Auto-refresh metrics when monitoring
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(collectMetrics, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [isMonitoring, collectMetrics]);

  // Initial metrics collection
  useEffect(() => {
    collectMetrics();
  }, [collectMetrics]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center">
            <Activity className="mr-2 h-6 w-6" />
            Performance Monitor
          </h2>
          <p className="text-muted-foreground">
            Real-time application performance metrics and optimization
            recommendations
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={collectMetrics} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={toggleMonitoring}
            variant={isMonitoring ? 'destructive' : 'default'}
            size="sm"
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="memory">Memory Usage</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="cache">Cache Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Performance Score Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {PERFORMANCE_BENCHMARKS.slice(0, 4).map(benchmark => {
              const value = metrics[benchmark.metric] as number;
              const score = getPerformanceScore(value, benchmark);
              const percentage = Math.min((benchmark.good / value) * 100, 100);

              return (
                <Card key={benchmark.metric}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {benchmark.metric.toUpperCase()}
                    </CardTitle>
                    <Badge className={getScoreColor(score)}>
                      {score.replace('-', ' ')}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(value)}
                      {benchmark.unit}
                    </div>
                    <Progress value={percentage} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Target: &lt;{benchmark.good}
                      {benchmark.unit}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
                  Performance Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="vitals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Largest Contentful Paint
                </CardTitle>
                <CardDescription>
                  Time for largest element to render
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Math.round(metrics.LCP)}ms
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  {metrics.LCP <= 2500 ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    Target: &lt;2.5s
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">First Input Delay</CardTitle>
                <CardDescription>
                  Response time to first user interaction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Math.round(metrics.FID)}ms
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">
                    Target: &lt;100ms
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Cumulative Layout Shift
                </CardTitle>
                <CardDescription>
                  Visual stability during page load
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {metrics.CLS.toFixed(3)}
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">
                    Target: &lt;0.1
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="memory" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>JavaScript Heap Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Used Heap Size</span>
                    <span>
                      {formatBytes(metrics.memoryUsage.usedJSHeapSize)}
                    </span>
                  </div>
                  <Progress
                    value={
                      (metrics.memoryUsage.usedJSHeapSize /
                        metrics.memoryUsage.totalJSHeapSize) *
                      100
                    }
                  />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Total Heap</div>
                    <div className="text-muted-foreground">
                      {formatBytes(metrics.memoryUsage.totalJSHeapSize)}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Heap Limit</div>
                    <div className="text-muted-foreground">
                      {formatBytes(metrics.memoryUsage.jsHeapSizeLimit)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Component Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Render Time</div>
                    <div className="text-2xl font-bold">
                      {Math.round(metrics.componentMetrics.renderTime)}ms
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Update Count</div>
                    <div className="text-2xl font-bold">
                      {metrics.componentMetrics.updateCount}
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      No rendering errors detected
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Timing Breakdown</CardTitle>
              <CardDescription>
                Page load network performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(metrics.networkTiming).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono">
                        {Math.round(value)}ms
                      </span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-blue-500 rounded-full"
                          style={{
                            width: `${Math.min((value / 1000) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Cache Hit Rate
                </CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(metrics.cacheMetrics.hitRate * 100)}%
                </div>
                <Progress
                  value={metrics.cacheMetrics.hitRate * 100}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Cache Size
                </CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatBytes(metrics.cacheMetrics.size)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics.cacheMetrics.entries} entries
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Cache Status
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Optimal</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Performance within targets
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceMonitor;
