import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { 
  Activity,
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Database,
  Server,
  Cpu,
  MemoryStick,
  Network,
  Star,
  StarOff,
  Filter,
  Download,
  RefreshCw,
  Play,
  Pause,
  Eye,
  EyeOff,
  BarChart3,
  LineChart,
  Table,
  Settings,
  ChevronDown,
  ChevronUp,
  Loader2,
  Target,
  Bell,
  Webhook,
  FileText,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@/components/ui/accessibility';

// Core interfaces
export type MetricCategory = 'performance' | 'system' | 'reliability' | 'security' | 'business' | 'user-experience';
export type MetricType = 'latency' | 'throughput' | 'utilization' | 'rate' | 'count' | 'score';
export type MetricStatus = 'good' | 'warning' | 'critical';
export type TrendDirection = 'improving' | 'declining' | 'stable';

export interface MetricThreshold {
  critical: number;
  warning: number;
  good: number;
}

export interface MetricAlert {
  id: string;
  metricId: string;
  type: 'threshold' | 'anomaly' | 'trend';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  category: MetricCategory;
  type: MetricType;
  status: MetricStatus;
  trend: TrendDirection;
  previousValue?: number;
  target?: number;
  threshold: MetricThreshold;
  description: string;
  lastUpdated: string;
  dataSource: string;
  historical?: Array<{
    timestamp: string;
    value: number;
  }>;
  annotations?: Array<{
    timestamp: string;
    text: string;
    type: string;
  }>;
}

export interface TimeRange {
  range: 'minute' | 'hour' | 'day' | 'week' | 'month';
  start: string;
  end: string;
}

export interface PerformanceData {
  metrics: PerformanceMetric[];
  alerts: MetricAlert[];
  timeRange: {
    start: string;
    end: string;
  };
  refreshInterval: number;
  lastUpdated: string;
}

export interface PerformanceMetricsWidgetProps {
  // Core data
  data: PerformanceData;
  
  // Appearance
  title?: string;
  className?: string;
  theme?: 'light' | 'dark';
  highContrast?: boolean;
  layout?: 'grid' | 'vertical' | 'compact';
  columns?: number | 'auto';
  
  // Behavior
  showFilters?: boolean;
  showViewToggle?: boolean;
  showTimeRange?: boolean;
  showTrendCharts?: boolean;
  showSparklines?: boolean;
  showSummary?: boolean;
  showDataTable?: boolean;
  showDataSources?: boolean;
  enableFavorites?: boolean;
  enableComparison?: boolean;
  editableThresholds?: boolean;
  exportable?: boolean;
  drillDownEnabled?: boolean;
  groupByCategory?: boolean;
  showPerformanceScore?: boolean;
  
  // Performance
  virtualized?: boolean;
  lazyLoadDetails?: boolean;
  
  // Real-time
  loading?: boolean;
  error?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  announceUpdates?: boolean;
  webhookEnabled?: boolean;
  
  // Styling
  customColors?: {
    good: string;
    warning: string;
    critical: string;
  };
  
  // Callbacks
  onMetricClick?: (metric: PerformanceMetric) => void;
  onAlertAcknowledge?: (alert: MetricAlert) => void;
  onTimeRangeChange?: (timeRange: TimeRange) => void;
  onRefresh?: () => void;
  onExport?: (format: 'csv' | 'pdf', data: PerformanceData) => void;
  onThresholdChange?: (metricId: string, thresholds: MetricThreshold) => void;
  onDrillDown?: (metric: PerformanceMetric) => void;
  onWebhookSetup?: () => void;
  customTemplate?: (metric: PerformanceMetric) => React.ReactNode;
}

// Helper functions
const getStatusIcon = (status: MetricStatus) => {
  switch (status) {
    case 'good': return CheckCircle;
    case 'warning': return AlertTriangle;
    case 'critical': return AlertCircle;
    default: return AlertCircle;
  }
};

const getTrendIcon = (trend: TrendDirection) => {
  switch (trend) {
    case 'improving': return TrendingUp;
    case 'declining': return TrendingDown;
    case 'stable': return Minus;
    default: return Minus;
  }
};

const getCategoryIcon = (category: MetricCategory) => {
  switch (category) {
    case 'performance': return Zap;
    case 'system': return Server;
    case 'reliability': return CheckCircle;
    case 'security': return AlertTriangle;
    case 'business': return BarChart3;
    case 'user-experience': return Activity;
    default: return Activity;
  }
};

const getStatusColor = (status: MetricStatus) => {
  switch (status) {
    case 'good': return 'border-green-500 bg-green-50 text-green-900';
    case 'warning': return 'border-yellow-500 bg-yellow-50 text-yellow-900';
    case 'critical': return 'border-red-500 bg-red-50 text-red-900';
    default: return 'border-gray-500 bg-gray-50 text-gray-900';
  }
};

const getTrendColor = (trend: TrendDirection) => {
  switch (trend) {
    case 'improving': return 'text-green-600';
    case 'declining': return 'text-red-600';
    case 'stable': return 'text-gray-600';
    default: return 'text-gray-600';
  }
};

const formatMetricValue = (value: number, unit: string) => {
  if (isNaN(value) || value < 0) return 'Invalid';
  
  if (unit === '%') {
    return `${value.toFixed(1)}%`;
  }
  
  if (unit === 'ms') {
    return `${Math.round(value)}`;
  }
  
  if (unit.includes('req')) {
    return `${Math.round(value)}`;
  }
  
  return `${value.toFixed(1)}`;
};

const calculatePercentageChange = (current: number, previous?: number) => {
  if (!previous || previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  return change.toFixed(1);
};

const calculatePerformanceScore = (metrics: PerformanceMetric[]) => {
  const scores = metrics.map(metric => {
    const { value, threshold, status } = metric;
    if (status === 'good') return 100;
    if (status === 'warning') return 70;
    if (status === 'critical') return 30;
    return 50;
  });
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
};

const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const isMobileView = () => window.innerWidth < 768;

export function PerformanceMetricsWidget({
  data,
  title = "Performance Metrics",
  className,
  theme = 'light',
  highContrast = false,
  layout = 'grid',
  columns = 'auto',
  showFilters = false,
  showViewToggle = false,
  showTimeRange = false,
  showTrendCharts = false,
  showSparklines = false,
  showSummary = false,
  showDataTable = false,
  showDataSources = false,
  enableFavorites = false,
  enableComparison = false,
  editableThresholds = false,
  exportable = false,
  drillDownEnabled = false,
  groupByCategory = false,
  showPerformanceScore = false,
  virtualized = false,
  lazyLoadDetails = false,
  loading = false,
  error,
  autoRefresh = false,
  refreshInterval = 30000,
  announceUpdates = false,
  webhookEnabled = false,
  customColors,
  onMetricClick,
  onAlertAcknowledge,
  onTimeRangeChange,
  onRefresh,
  onExport,
  onThresholdChange,
  onDrillDown,
  onWebhookSetup,
  customTemplate
}: PerformanceMetricsWidgetProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [expandedMetrics, setExpandedMetrics] = useState<Set<string>>(new Set());
  const [favoriteMetrics, setFavoriteMetrics] = useState<Set<string>>(new Set());
  const [comparisonMode, setComparisonMode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showTable, setShowTable] = useState(false);
  const [editingThresholds, setEditingThresholds] = useState<string | null>(null);
  const [thresholdValues, setThresholdValues] = useState<MetricThreshold>({
    critical: 0,
    warning: 0,
    good: 0
  });
  const [announcement, setAnnouncement] = useState('');
  const [isRefreshPaused, setIsRefreshPaused] = useState(false);

  const refreshIntervalRef = useRef<NodeJS.Timeout>();
  const thresholdDebounceRef = useRef<NodeJS.Timeout>();

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh || !onRefresh || isRefreshPaused) return;

    refreshIntervalRef.current = setInterval(() => {
      onRefresh();
      if (announceUpdates) {
        setAnnouncement('Metrics updated');
        setTimeout(() => setAnnouncement(''), 2000);
      }
    }, refreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, onRefresh, announceUpdates, isRefreshPaused]);

  // Filter logic
  const filteredMetrics = useMemo(() => {
    if (!data?.metrics || !Array.isArray(data.metrics)) return [];

    return data.metrics.filter(metric => {
      // Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(metric.category)) {
        return false;
      }
      
      // Status filter
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(metric.status)) {
        return false;
      }
      
      return true;
    });
  }, [data?.metrics, selectedCategories, selectedStatuses]);

  // Group metrics by category
  const groupedMetrics = useMemo(() => {
    if (!groupByCategory) return { all: filteredMetrics };
    
    return filteredMetrics.reduce((groups, metric) => {
      const category = metric.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(metric);
      return groups;
    }, {} as Record<string, PerformanceMetric[]>);
  }, [filteredMetrics, groupByCategory]);

  // Calculate performance score
  const performanceScore = useMemo(() => {
    if (!showPerformanceScore || !data?.metrics) return 0;
    return calculatePerformanceScore(data.metrics);
  }, [data?.metrics, showPerformanceScore]);

  // Handle metric expansion
  const handleMetricExpand = useCallback((metricId: string) => {
    setExpandedMetrics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(metricId)) {
        newSet.delete(metricId);
      } else {
        newSet.add(metricId);
      }
      return newSet;
    });
  }, []);

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback((metricId: string) => {
    setFavoriteMetrics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(metricId)) {
        newSet.delete(metricId);
      } else {
        newSet.add(metricId);
      }
      return newSet;
    });
  }, []);

  // Handle threshold editing
  const handleThresholdEdit = useCallback((metricId: string, metric: PerformanceMetric) => {
    setEditingThresholds(metricId);
    setThresholdValues(metric.threshold);
  }, []);

  // Handle threshold save with debouncing
  const handleThresholdSave = useCallback((metricId: string) => {
    if (thresholdDebounceRef.current) {
      clearTimeout(thresholdDebounceRef.current);
    }
    
    thresholdDebounceRef.current = setTimeout(() => {
      onThresholdChange?.(metricId, thresholdValues);
      setEditingThresholds(null);
    }, 300);
  }, [onThresholdChange, thresholdValues]);

  // Handle export
  const handleExport = useCallback((format: 'csv' | 'pdf') => {
    onExport?.(format, data);
  }, [onExport, data]);

  // Handle time range change
  const handleTimeRangeChange = useCallback((range: string) => {
    const now = new Date();
    let start: Date;
    
    switch (range) {
      case 'hour':
        start = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 60 * 60 * 1000);
    }
    
    onTimeRangeChange?.({
      range: range as TimeRange['range'],
      start: start.toISOString(),
      end: now.toISOString()
    });
  }, [onTimeRangeChange]);

  // Validate thresholds
  const validateThresholds = useCallback((thresholds: MetricThreshold) => {
    return thresholds.good < thresholds.warning && thresholds.warning < thresholds.critical;
  }, []);

  // Empty state
  if (!data?.metrics || data.metrics.length === 0) {
    return (
      <div 
        className={cn(
          "w-full",
          theme === 'dark' && "dark-theme",
          theme === 'light' && "light-theme",
          highContrast && "high-contrast",
          isMobileView() && "mobile-view",
          className
        )}
        role="region"
        aria-label={title}
        data-testid="performance-metrics-widget"
      >
        <Card className="w-full">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center" data-testid="empty-metrics-state">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No metrics available</p>
              <p className="text-sm text-muted-foreground">
                Configure monitoring to view performance data
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        className={cn(
          "w-full",
          theme === 'dark' && "dark-theme",
          theme === 'light' && "light-theme",
          highContrast && "high-contrast",
          isMobileView() && "mobile-view",
          className
        )}
        role="region"
        aria-label={title}
        data-testid="performance-metrics-widget"
      >
        <Card className="w-full">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center" data-testid="metrics-error-state">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <p className="text-lg font-medium text-destructive">{error}</p>
              <p className="text-sm text-muted-foreground">
                Please try refreshing or check your monitoring configuration
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div 
        className={cn(
          "w-full",
          theme === 'dark' && "dark-theme",
          theme === 'light' && "light-theme",
          highContrast && "high-contrast",
          isMobileView() && "mobile-view",
          className
        )}
        role="region"
        aria-label={title}
        data-testid="performance-metrics-widget"
      >
        <Card className="w-full">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center" data-testid="metrics-loading">
              <Loader2 className="h-8 w-8 mx-auto animate-spin mb-4" />
              <p className="text-lg font-medium">Loading metrics...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "w-full",
        theme === 'dark' && "dark-theme",
        theme === 'light' && "light-theme",
        highContrast && "high-contrast",
        isMobileView() && "mobile-view",
        className
      )}
      role="region"
      aria-label={title}
      data-testid="performance-metrics-widget"
      style={{
        '--color-good': customColors?.good || '#22c55e',
        '--color-warning': customColors?.warning || '#f59e0b',
        '--color-critical': customColors?.critical || '#ef4444',
      } as React.CSSProperties}
    >
      {/* Announcements for screen readers */}
      {announceUpdates && (
        <VisuallyHidden>
          <div 
            data-testid="metrics-announcements"
            aria-live="polite"
            aria-atomic="true"
          >
            {announcement}
          </div>
        </VisuallyHidden>
      )}

      {/* Auto-refresh indicator */}
      {autoRefresh && (
        <div className="mb-4">
          <div data-testid="auto-refresh-indicator" className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Auto-refresh enabled</span>
            <Badge variant="outline" className="text-xs">
              {Math.floor(refreshInterval / 1000)}s
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsRefreshPaused(!isRefreshPaused)}
              data-testid={isRefreshPaused ? "play-refresh-button" : "pause-refresh-button"}
            >
              {isRefreshPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      )}

      <Card className="w-full">
        {/* Header */}
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {title}
              {showPerformanceScore && (
                <Badge variant="outline" data-testid="performance-score">
                  Performance Score: {performanceScore}
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* Time range selector */}
              {showTimeRange && (
                <Select onValueChange={handleTimeRangeChange}>
                  <SelectTrigger className="w-32" data-testid="time-range-select">
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hour">Last Hour</SelectItem>
                    <SelectItem value="day">Last Day</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* View toggle */}
              {showViewToggle && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  data-testid="view-toggle"
                >
                  {viewMode === 'grid' ? <Table className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                </Button>
              )}

              {/* Export controls */}
              {exportable && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                      CSV Report
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                      PDF Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Summary toggle */}
              {showSummary && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTable(!showTable)}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Summary
                </Button>
              )}

              {/* Data table toggle */}
              {showDataTable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTable(!showTable)}
                >
                  <Table className="h-4 w-4 mr-1" />
                  Data Table
                </Button>
              )}

              {/* Webhook setup */}
              {webhookEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onWebhookSetup}
                >
                  <Webhook className="h-4 w-4 mr-1" />
                  Setup Webhooks
                </Button>
              )}

              {/* Comparison mode */}
              {enableComparison && (
                <Button
                  variant={comparisonMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setComparisonMode(!comparisonMode)}
                >
                  Compare
                </Button>
              )}
            </div>
          </div>
          
          {/* Controls row */}
          {showFilters && (
            <div className="flex items-center gap-4 mt-4">
              {/* Category filter */}
              <Select onValueChange={(value) => setSelectedCategories([value])}>
                <SelectTrigger className="w-40" data-testid="category-filter">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="reliability">Reliability</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="user-experience">User Experience</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Status filter */}
              <Select onValueChange={(value) => setSelectedStatuses([value])}>
                <SelectTrigger className="w-32" data-testid="status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Alerts section */}
          {data.alerts && data.alerts.length > 0 && (
            <div className="mb-6" data-testid="alerts-section">
              <h3 className="text-lg font-semibold mb-4">Active Alerts</h3>
              
              {/* Group alerts by severity */}
              <div className="space-y-3">
                {['critical', 'warning', 'info'].map(severity => {
                  const severityAlerts = data.alerts.filter(alert => alert.severity === severity);
                  if (severityAlerts.length === 0) return null;
                  
                  return (
                    <div key={severity} data-testid={`alerts-${severity}`}>
                      <h4 className="text-sm font-medium mb-2 capitalize">{severity} Alerts</h4>
                      <div className="space-y-2">
                        {severityAlerts.map(alert => (
                          <div
                            key={alert.id}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border",
                              severity === 'critical' && "border-red-200 bg-red-50",
                              severity === 'warning' && "border-yellow-200 bg-yellow-50",
                              severity === 'info' && "border-blue-200 bg-blue-50"
                            )}
                            data-testid={`alert-${alert.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <AlertTriangle 
                                className={cn(
                                  "h-4 w-4",
                                  severity === 'critical' && "text-red-600",
                                  severity === 'warning' && "text-yellow-600",
                                  severity === 'info' && "text-blue-600"
                                )} 
                                data-testid={`alert-severity-${severity}`}
                              />
                              <div>
                                <p className="text-sm font-medium">{alert.message}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatTimestamp(alert.timestamp)}
                                </p>
                              </div>
                            </div>
                            
                            {!alert.acknowledged && onAlertAcknowledge && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onAlertAcknowledge(alert)}
                                data-testid={`acknowledge-alert-${alert.id}`}
                              >
                                Acknowledge
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comparison mode header */}
          {comparisonMode && (
            <div className="mb-4" data-testid="comparison-mode">
              <Badge variant="secondary" className="mb-2">Comparison Mode Active</Badge>
              <p className="text-sm text-muted-foreground">Select time periods to compare</p>
            </div>
          )}

          {/* Performance summary */}
          {showTable && showSummary && (
            <div className="mb-6" data-testid="performance-summary">
              <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {data.metrics.filter(m => m.status === 'good').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Healthy Metrics</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {data.metrics.filter(m => m.status === 'warning').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Warning Metrics</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {data.metrics.filter(m => m.status === 'critical').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Critical Metrics</div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <Badge variant="outline" className="text-lg px-4 py-2">
                  Overall Performance: {performanceScore > 80 ? 'Good' : performanceScore > 60 ? 'Fair' : 'Poor'}
                </Badge>
              </div>
            </div>
          )}

          {/* Data table view */}
          {showTable && showDataTable && (
            <div className="mb-6">
              <div className="overflow-auto max-h-96 border rounded-lg">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr>
                      <th className="text-left p-3 border-b font-medium">Metric</th>
                      <th className="text-left p-3 border-b font-medium">Value</th>
                      <th className="text-left p-3 border-b font-medium">Status</th>
                      <th className="text-left p-3 border-b font-medium">Trend</th>
                      <th className="text-left p-3 border-b font-medium">Target</th>
                      {showDataSources && (
                        <th className="text-left p-3 border-b font-medium">Source</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMetrics.map((metric) => (
                      <tr key={metric.id}>
                        <td className="p-3 border-b font-medium">{metric.name}</td>
                        <td className="p-3 border-b">
                          {formatMetricValue(metric.value, metric.unit)} {metric.unit}
                        </td>
                        <td className="p-3 border-b">
                          <Badge variant="outline" className={getStatusColor(metric.status)}>
                            {metric.status}
                          </Badge>
                        </td>
                        <td className="p-3 border-b">
                          {React.createElement(getTrendIcon(metric.trend), { 
                            className: `h-4 w-4 ${getTrendColor(metric.trend)}` 
                          })}
                        </td>
                        <td className="p-3 border-b">
                          {metric.target ? `Target: ${metric.target}${metric.unit}` : 'N/A'}
                        </td>
                        {showDataSources && (
                          <td className="p-3 border-b">{metric.dataSource}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Metrics display */}
          {groupByCategory ? (
            <div className="space-y-6">
              {Object.entries(groupedMetrics).map(([category, categoryMetrics]) => (
                <div key={category} data-testid={`category-${category}`}>
                  <h3 className="text-lg font-semibold mb-4 capitalize flex items-center gap-2">
                    {React.createElement(getCategoryIcon(category as MetricCategory), { 
                      className: "h-5 w-5" 
                    })}
                    {category} Metrics
                  </h3>
                  <div 
                    className={cn(
                      layout === 'grid' && viewMode === 'grid' && "grid gap-4",
                      layout === 'grid' && viewMode === 'list' && "space-y-4",
                      layout === 'vertical' && "space-y-4",
                      layout === 'compact' && "grid gap-2 compact-layout",
                      columns === 'auto' && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
                      typeof columns === 'number' && `grid-cols-${Math.min(columns, 6)}`,
                      virtualized && "virtualized-metrics"
                    )}
                    data-testid={viewMode === 'list' ? "metrics-list-view" : "metrics-container"}
                  >
                    {categoryMetrics.map((metric) => {
                      const StatusIcon = getStatusIcon(metric.status);
                      const TrendIcon = getTrendIcon(metric.trend);
                      const CategoryIcon = getCategoryIcon(metric.category);
                      const isExpanded = expandedMetrics.has(metric.id);
                      const isFavorite = favoriteMetrics.has(metric.id);
                      const isEditing = editingThresholds === metric.id;
                      const percentageChange = calculatePercentageChange(metric.value, metric.previousValue);
                      
                      return (
                        <Card 
                          key={metric.id}
                          className={cn(
                            "cursor-pointer transition-all duration-200 hover:shadow-md",
                            getStatusColor(metric.status)
                          )}
                          onClick={() => onMetricClick?.(metric)}
                          role="button"
                          tabIndex={0}
                          data-testid={`metric-${metric.id}`}
                          onDoubleClick={() => drillDownEnabled && onDrillDown?.(metric)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <CategoryIcon className="h-4 w-4" />
                                  <CardTitle className="text-base">{metric.name}</CardTitle>
                                  {enableFavorites && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleFavoriteToggle(metric.id);
                                      }}
                                      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                                      data-testid={`favorite-button-${metric.id}`}
                                    >
                                      {isFavorite ? 
                                        <StarOff className="h-4 w-4" /> : 
                                        <Star className="h-4 w-4" />
                                      }
                                    </Button>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <StatusIcon 
                                      className={cn(
                                        "h-3 w-3",
                                        metric.status === 'good' && "text-green-600",
                                        metric.status === 'warning' && "text-yellow-600",
                                        metric.status === 'critical' && "text-red-600"
                                      )} 
                                      data-testid={`status-${metric.status}`}
                                    />
                                    <span className="capitalize">{metric.status}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <TrendIcon className={cn("h-3 w-3", getTrendColor(metric.trend))} data-testid={`trend-${metric.trend}`} />
                                    <span className="capitalize">{metric.trend}</span>
                                  </div>
                                  <Badge variant="outline">{metric.category}</Badge>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <div className="text-lg font-bold">
                                    {metric.value}{metric.unit}
                                  </div>
                                  {metric.previousValue !== undefined && percentageChange !== null && (
                                    <div className={cn(
                                      "text-sm font-medium",
                                      percentageChange > 0 ? "text-red-600" : 
                                      percentageChange < 0 ? "text-green-600" : "text-gray-600"
                                    )}>
                                      {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%
                                    </div>
                                  )}
                                  {metric.target && (
                                    <div className="text-xs text-muted-foreground">
                                      Target: {metric.target}{metric.unit}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex flex-col gap-1">
                                  {editableThresholds && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingThresholds(isEditing ? null : metric.id);
                                      }}
                                      aria-label={`Edit thresholds for ${metric.name}`}
                                      data-testid={`edit-threshold-${metric.id}`}
                                    >
                                      <Settings className="h-4 w-4" />
                                    </Button>
                                  )}
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMetricExpand(metric.id);
                                    }}
                                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${metric.name} details`}
                                    data-testid={`expand-button-${metric.id}`}
                                  >
                                    {isExpanded ? 
                                      <ChevronUp className="h-4 w-4" /> : 
                                      <ChevronDown className="h-4 w-4" />
                                    }
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="pt-0">
                            {/* Progress bar */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                <span>Performance</span>
                                <span>Target: {metric.target || 'N/A'}</span>
                              </div>
                              <div 
                                className="h-2 bg-gray-200 rounded-full overflow-hidden"
                                data-testid="metric-progress-bar"
                              >
                                <div 
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    metric.status === 'good' && "bg-green-500",
                                    metric.status === 'warning' && "bg-yellow-500",
                                    metric.status === 'critical' && "bg-red-500"
                                  )}
                                  style={{ 
                                    width: `${metric.target ? Math.min(100, (metric.value / metric.target) * 100) : 50}%` 
                                  }}
                                />
                              </div>
                            </div>

                            {/* Sparkline */}
                            {showSparklines && metric.historical && (
                              <div className="mb-3" data-testid="sparkline-chart">
                                <div className="h-8 bg-gray-100 rounded flex items-center justify-center text-xs text-muted-foreground">
                                  Sparkline: {metric.name}
                                </div>
                              </div>
                            )}

                            {/* Threshold indicators */}
                            <div className="flex items-center gap-2 text-xs mb-3">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded" data-testid="threshold-good" />
                                <span>Good: {metric.threshold.good}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-yellow-500 rounded" data-testid="threshold-warning" />
                                <span>Warning: {metric.threshold.warning}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-red-500 rounded" data-testid="threshold-critical" />
                                <span>Critical: {metric.threshold.critical}</span>
                              </div>
                            </div>

                            {/* Expanded details */}
                            {isExpanded && (
                              <div className="space-y-4 pt-3 border-t" data-testid="metric-details">
                                {lazyLoadDetails ? (
                                  <div className="flex items-center justify-center p-4" data-testid="metric-details-loading">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-sm text-muted-foreground">{metric.description}</p>
                                    
                                    {showTrendCharts && (
                                      <div data-testid="trend-chart">
                                        <h4 className="font-medium mb-2">Historical Trend</h4>
                                        <div className="h-32 bg-gray-100 rounded flex items-center justify-center text-sm text-muted-foreground" data-testid="historical-data">
                                          Historical data visualization for {metric.name}
                                        </div>
                                      </div>
                                    )}

                                    {/* Threshold editing */}
                                    {isEditing && (
                                      <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
                                        <h4 className="font-medium">Edit Thresholds</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                          <div>
                                            <label className="text-xs text-muted-foreground">Good</label>
                                            <Input
                                              type="number"
                                              defaultValue={metric.threshold.good}
                                              data-testid="good-threshold-input"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-xs text-muted-foreground">Warning</label>
                                            <Input
                                              type="number"
                                              defaultValue={metric.threshold.warning}
                                              data-testid="warning-threshold-input"
                                              onBlur={(e) => {
                                                const value = Number(e.target.value);
                                                if (value >= metric.threshold.critical) {
                                                  setThresholdError('Warning threshold must be less than critical threshold');
                                                } else {
                                                  setThresholdError(null);
                                                }
                                              }}
                                            />
                                          </div>
                                          <div>
                                            <label className="text-xs text-muted-foreground">Critical</label>
                                            <Input
                                              type="number"
                                              defaultValue={metric.threshold.critical}
                                              data-testid="critical-threshold-input"
                                            />
                                          </div>
                                        </div>
                                        {thresholdError && (
                                          <p className="text-sm text-red-600">{thresholdError}</p>
                                        )}
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            onClick={() => {
                                              const goodInput = document.querySelector(`[data-testid="good-threshold-input"]`) as HTMLInputElement;
                                              const warningInput = document.querySelector(`[data-testid="warning-threshold-input"]`) as HTMLInputElement;
                                              const criticalInput = document.querySelector(`[data-testid="critical-threshold-input"]`) as HTMLInputElement;
                                              
                                              const newThreshold = {
                                                good: Number(goodInput.value),
                                                warning: Number(warningInput.value),
                                                critical: Number(criticalInput.value)
                                              };
                                              
                                              onThresholdChange?.(metric.id, newThreshold);
                                              setEditingThresholds(null);
                                            }}
                                          >
                                            Save Thresholds
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setEditingThresholds(null)}
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    )}

                                    <div className="text-xs text-muted-foreground">
                                      <div>Data Source: {metric.dataSource}</div>
                                      <div>Last updated: {new Date(metric.lastUpdated).toLocaleTimeString()}</div>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                }
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div 
              className={cn(
                layout === 'grid' && viewMode === 'grid' && "grid gap-4",
                layout === 'grid' && viewMode === 'list' && "space-y-4",
                layout === 'vertical' && "space-y-4",
                layout === 'compact' && "grid gap-2 compact-layout",
                columns === 'auto' && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
                typeof columns === 'number' && `grid-cols-${Math.min(columns, 6)}`,
                virtualized && "virtualized-metrics"
              )}
              data-testid={virtualized ? "virtualized-metrics" : viewMode === 'list' ? "metrics-list-view" : "metrics-container"}
            >
              {customTemplate ? (
                filteredMetrics.map(metric => (
                  <div key={metric.id}>
                    {customTemplate(metric)}
                  </div>
                ))
              ) : (
                filteredMetrics.map((metric) => {
                  const StatusIcon = getStatusIcon(metric.status);
                  const TrendIcon = getTrendIcon(metric.trend);
                  const CategoryIcon = getCategoryIcon(metric.category);
                  const isExpanded = expandedMetrics.has(metric.id);
                  const isFavorite = favoriteMetrics.has(metric.id);
                  const isEditing = editingThresholds === metric.id;
                  const percentageChange = calculatePercentageChange(metric.value, metric.previousValue);
                  
                  return (
                    <Card 
                      key={metric.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-md",
                        getStatusColor(metric.status)
                      )}
                      onClick={() => onMetricClick?.(metric)}
                      role="button"
                      tabIndex={0}
                      data-testid={`metric-${metric.id}`}
                      onDoubleClick={() => drillDownEnabled && onDrillDown?.(metric)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CategoryIcon className="h-4 w-4" />
                              <CardTitle className="text-base">{metric.name}</CardTitle>
                              {enableFavorites && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFavoriteToggle(metric.id);
                                  }}
                                  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                                  data-testid={`favorite-button-${metric.id}`}
                                >
                                  {isFavorite ? 
                                    <StarOff className="h-4 w-4" /> : 
                                    <Star className="h-4 w-4" />
                                  }
                                </Button>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <StatusIcon 
                                  className={cn(
                                    "h-3 w-3",
                                    metric.status === 'good' && "text-green-600",
                                    metric.status === 'warning' && "text-yellow-600",
                                    metric.status === 'critical' && "text-red-600"
                                  )} 
                                  data-testid={`status-${metric.status}`}
                                />
                                <span className="capitalize">{metric.status}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendIcon className={cn("h-3 w-3", getTrendColor(metric.trend))} data-testid={`trend-${metric.trend}`} />
                                <span className="capitalize">{metric.trend}</span>
                              </div>
                              <Badge variant="outline">{metric.category}</Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="text-2xl font-bold">
                                {formatMetricValue(metric.value, metric.unit)}
                                <span className="text-sm font-normal text-muted-foreground ml-1">
                                  {metric.unit}
                                </span>
                              </div>
                              {percentageChange && (
                                <div className={cn(
                                  "text-xs",
                                  parseFloat(percentageChange) > 0 ? "text-red-600" : "text-green-600"
                                )}>
                                  {parseFloat(percentageChange) > 0 ? '+' : ''}{percentageChange}%
                                </div>
                              )}
                              {metric.target && (
                                <div className="text-xs text-muted-foreground">
                                  Target: {metric.target}{metric.unit}
                                </div>
                              )}
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMetricExpand(metric.id);
                              }}
                              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${metric.name} details`}
                              data-testid={`expand-button-${metric.id}`}
                            >
                              {isExpanded ? 
                                <ChevronUp className="h-4 w-4" /> : 
                                <ChevronDown className="h-4 w-4" />
                              }
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        {/* Progress bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Good</span>
                            <span>Warning</span>
                            <span>Critical</span>
                          </div>
                          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden" data-testid="metric-progress-bar">
                            {/* Threshold indicators */}
                            <div 
                              className="absolute h-full bg-green-500"
                              style={{ width: `${(metric.threshold.good / metric.threshold.critical) * 100}%` }}
                              data-testid="threshold-good"
                            />
                            <div 
                              className="absolute h-full bg-yellow-500"
                              style={{ 
                                left: `${(metric.threshold.good / metric.threshold.critical) * 100}%`,
                                width: `${((metric.threshold.warning - metric.threshold.good) / metric.threshold.critical) * 100}%` 
                              }}
                              data-testid="threshold-warning"
                            />
                            <div 
                              className="absolute h-full bg-red-500"
                              style={{ 
                                left: `${(metric.threshold.warning / metric.threshold.critical) * 100}%`,
                                width: `${((metric.threshold.critical - metric.threshold.warning) / metric.threshold.critical) * 100}%` 
                              }}
                              data-testid="threshold-critical"
                            />
                            {/* Current value indicator */}
                            <div 
                              className="absolute top-0 w-1 h-full bg-black"
                              style={{ left: `${Math.min(100, (metric.value / metric.threshold.critical) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Sparkline chart */}
                        {showSparklines && metric.historical && (
                          <div className="mb-3" data-testid="sparkline-chart">
                            <div className="h-8 bg-gray-100 rounded flex items-end justify-between px-1">
                              {metric.historical.slice(-10).map((point, index) => (
                                <div
                                  key={index}
                                  className="w-1 bg-blue-500 rounded-t"
                                  style={{ 
                                    height: `${(point.value / metric.threshold.critical) * 100}%` 
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Data source */}
                        {showDataSources && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Database className="h-3 w-3" />
                            <span>{metric.dataSource}</span>
                            <span>•</span>
                            <span>Last updated: {formatTimestamp(metric.lastUpdated)}</span>
                          </div>
                        )}

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="space-y-4 mt-4" data-testid="metric-details">
                            {lazyLoadDetails ? (
                              <div className="flex items-center justify-center p-4" data-testid="metric-details-loading">
                                <Loader2 className="h-6 w-6 animate-spin" />
                              </div>
                            ) : (
                              <>
                                {/* Description */}
                                <div>
                                  <p className="text-sm text-muted-foreground">{metric.description}</p>
                                </div>

                                {/* Historical trend chart */}
                                {showTrendCharts && metric.historical && (
                                  <div data-testid="trend-chart">
                                    <h4 className="font-medium mb-2">Historical Trend</h4>
                                    <div className="h-32 bg-gray-100 rounded p-2" data-testid="historical-data">
                                      <div className="flex items-end justify-between h-full">
                                        {metric.historical.map((point, index) => (
                                          <div
                                            key={index}
                                            className="flex-1 bg-blue-500 rounded-t mx-px"
                                            style={{ 
                                              height: `${(point.value / metric.threshold.critical) * 100}%` 
                                            }}
                                            title={`${formatTimestamp(point.timestamp)}: ${point.value}${metric.unit}`}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Threshold editing */}
                                {editableThresholds && (
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-medium">Thresholds</h4>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleThresholdEdit(metric.id, metric)}
                                        data-testid={`edit-threshold-${metric.id}`}
                                      >
                                        <Settings className="h-4 w-4 mr-1" />
                                        Edit
                                      </Button>
                                    </div>
                                    
                                    {isEditing ? (
                                      <div className="space-y-3 p-3 border rounded-lg">
                                        <div className="grid grid-cols-3 gap-3">
                                          <div>
                                            <label className="text-xs font-medium text-green-600">Good</label>
                                            <Input
                                              type="number"
                                              value={thresholdValues.good}
                                              onChange={(e) => setThresholdValues(prev => ({
                                                ...prev,
                                                good: parseFloat(e.target.value) || 0
                                              }))}
                                              className="text-xs"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-xs font-medium text-yellow-600">Warning</label>
                                            <Input
                                              type="number"
                                              value={thresholdValues.warning}
                                              onChange={(e) => setThresholdValues(prev => ({
                                                ...prev,
                                                warning: parseFloat(e.target.value) || 0
                                              }))}
                                              className="text-xs"
                                              data-testid="warning-threshold-input"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-xs font-medium text-red-600">Critical</label>
                                            <Input
                                              type="number"
                                              value={thresholdValues.critical}
                                              onChange={(e) => setThresholdValues(prev => ({
                                                ...prev,
                                                critical: parseFloat(e.target.value) || 0
                                              }))}
                                              className="text-xs"
                                            />
                                          </div>
                                        </div>
                                        
                                        {!validateThresholds(thresholdValues) && (
                                          <p className="text-xs text-red-600">
                                            Warning threshold must be less than critical threshold
                                          </p>
                                        )}
                                        
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            onClick={() => handleThresholdSave(metric.id)}
                                            disabled={!validateThresholds(thresholdValues)}
                                          >
                                            Save Thresholds
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setEditingThresholds(null)}
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-3 gap-3 text-xs">
                                        <div className="text-center">
                                          <div className="text-green-600 font-medium">Good</div>
                                          <div>&lt; {metric.threshold.good}{metric.unit}</div>
                                        </div>
                                        <div className="text-center">
                                          <div className="text-yellow-600 font-medium">Warning</div>
                                          <div>&lt; {metric.threshold.warning}{metric.unit}</div>
                                        </div>
                                        <div className="text-center">
                                          <div className="text-red-600 font-medium">Critical</div>
                                          <div>&ge; {metric.threshold.critical}{metric.unit}</div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Annotations */}
                                {metric.annotations && metric.annotations.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">Annotations</h4>
                                    <div className="space-y-2">
                                      {metric.annotations.map((annotation, index) => (
                                        <div key={index} className="text-xs p-2 bg-gray-100 rounded" data-testid="metric-annotation">
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">
                                              {annotation.type}
                                            </Badge>
                                            <span className="text-muted-foreground">
                                              {formatTimestamp(annotation.timestamp)}
                                            </span>
                                          </div>
                                          <p className="mt-1">{annotation.text}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Helper method to render metrics (for grouped display)
  private renderMetrics(metrics: PerformanceMetric[]) {
    return metrics.map((metric) => {
      // Same metric rendering logic as above
      const StatusIcon = getStatusIcon(metric.status);
      const TrendIcon = getTrendIcon(metric.trend);
      const CategoryIcon = getCategoryIcon(metric.category);
      const isExpanded = expandedMetrics.has(metric.id);
      const isFavorite = favoriteMetrics.has(metric.id);
      const percentageChange = calculatePercentageChange(metric.value, metric.previousValue);
      
      return (
        <Card 
          key={metric.id}
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md",
            getStatusColor(metric.status)
          )}
          onClick={() => onMetricClick?.(metric)}
          role="button"
          tabIndex={0}
          data-testid={`metric-${metric.id}`}
          onDoubleClick={() => drillDownEnabled && onDrillDown?.(metric)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CategoryIcon className="h-4 w-4" />
                  <CardTitle className="text-base">{metric.name}</CardTitle>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <StatusIcon 
                      className={cn(
                        "h-3 w-3",
                        metric.status === 'good' && "text-green-600",
                        metric.status === 'warning' && "text-yellow-600",
                        metric.status === 'critical' && "text-red-600"
                      )} 
                      data-testid={`status-${metric.status}`}
                    />
                    <span className="capitalize">{metric.status}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendIcon className={cn("h-3 w-3", getTrendColor(metric.trend))} data-testid={`trend-${metric.trend}`} />
                    <span className="capitalize">{metric.trend}</span>
                  </div>
                  <Badge variant="outline">{metric.category}</Badge>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {formatMetricValue(metric.value, metric.unit)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {metric.unit}
                  </span>
                </div>
                {percentageChange && (
                  <div className={cn(
                    "text-xs",
                    parseFloat(percentageChange) > 0 ? "text-red-600" : "text-green-600"
                  )}>
                    {parseFloat(percentageChange) > 0 ? '+' : ''}{percentageChange}%
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Progress bar */}
            <div className="mb-3">
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden" data-testid="metric-progress-bar">
                <div 
                  className="absolute h-full bg-green-500"
                  style={{ width: `${(metric.threshold.good / metric.threshold.critical) * 100}%` }}
                  data-testid="threshold-good"
                />
                <div 
                  className="absolute h-full bg-yellow-500"
                  style={{ 
                    left: `${(metric.threshold.good / metric.threshold.critical) * 100}%`,
                    width: `${((metric.threshold.warning - metric.threshold.good) / metric.threshold.critical) * 100}%` 
                  }}
                  data-testid="threshold-warning"
                />
                <div 
                  className="absolute h-full bg-red-500"
                  style={{ 
                    left: `${(metric.threshold.warning / metric.threshold.critical) * 100}%`,
                    width: `${((metric.threshold.critical - metric.threshold.warning) / metric.threshold.critical) * 100}%` 
                  }}
                  data-testid="threshold-critical"
                />
                <div 
                  className="absolute top-0 w-1 h-full bg-black"
                  style={{ left: `${Math.min(100, (metric.value / metric.threshold.critical) * 100)}%` }}
                />
              </div>
            </div>

            {/* Sparkline chart */}
            {showSparklines && metric.historical && (
              <div className="mb-3" data-testid="sparkline-chart">
                <div className="h-8 bg-gray-100 rounded flex items-end justify-between px-1">
                  {metric.historical.slice(-10).map((point, index) => (
                    <div
                      key={index}
                      className="w-1 bg-blue-500 rounded-t"
                      style={{ 
                        height: `${(point.value / metric.threshold.critical) * 100}%` 
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      );
    })
  }
}

export default PerformanceMetricsWidget;