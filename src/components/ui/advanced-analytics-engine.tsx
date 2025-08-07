import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  BarChart3,
  LineChart,
  PieChart,
  Download,
  Share2,
  Settings,
  RefreshCw,
  ZoomIn,
  TrendingUp,
  Search,
  Filter,
  Calendar,
} from 'lucide-react';

// Type definitions for analytics data
export interface AnalyticsDataPoint {
  id: string;
  timestamp: string;
  value: number;
  metric: string;
  category: string;
  labels: Record<string, string>;
}

export interface AnalyticsChart {
  id: string;
  title: string;
  type: ChartType;
  dataPoints: AnalyticsDataPoint[];
  config: {
    xAxis: string;
    yAxis: string;
    groupBy: string;
    aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  };
  timeRange: TimeRange;
}

export interface AnalyticsInsight {
  id: string;
  title: string;
  description: string;
  type: 'trend' | 'anomaly' | 'alert' | 'recommendation';
  severity: 'info' | 'warning' | 'error' | 'success';
  confidence: number;
  recommendations: string[];
  metadata?: Record<string, any>;
}

export interface AnalyticsReport {
  id: string;
  name: string;
  description: string;
  charts: AnalyticsChart[];
  insights: AnalyticsInsight[];
  generatedAt: string;
  timeRange: TimeRange;
  filters: AnalyticsFilter[];
}

export interface AnalyticsFilter {
  id: string;
  field: string;
  operator: 'equals' | 'in' | 'contains' | 'gt' | 'lt' | 'between';
  value: any;
  label: string;
}

export interface AnalyticsConfig {
  refreshInterval: number;
  maxDataPoints: number;
  defaultTimeRange: TimeRange;
  enableRealTime: boolean;
  enableDrillDown: boolean;
  enableExport: boolean;
  thresholds: Record<string, { warning: number; critical: number }>;
}

export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter';
export type TimeRange = { start: string; end: string };
export type MetricType = 'performance' | 'usage' | 'traffic' | 'errors';
export type ExportFormat = 'png' | 'svg' | 'pdf' | 'csv' | 'json';
export type DrillDownLevel = 'metric' | 'category' | 'region' | 'service';

export interface AdvancedAnalyticsEngineProps {
  dataPoints: AnalyticsDataPoint[];
  charts: AnalyticsChart[];
  insights?: AnalyticsInsight[];
  reports?: AnalyticsReport[];
  config: AnalyticsConfig;
  title?: string;
  loading?: boolean;
  error?: string;
  realTime?: boolean;
  autoRefresh?: boolean;
  showTimeRange?: boolean;
  showFilters?: boolean;
  showInsights?: boolean;
  showReports?: boolean;
  showSettings?: boolean;
  showChartStats?: boolean;
  searchable?: boolean;
  exportable?: boolean;
  shareable?: boolean;
  enableZoom?: boolean;
  virtualized?: boolean;
  lazyLoadCharts?: boolean;
  cacheResults?: boolean;
  announceUpdates?: boolean;
  showPredictions?: boolean;
  enableAnomalyDetection?: boolean;
  showCorrelation?: boolean;
  customChartRenderer?: (chart: AnalyticsChart) => React.ReactNode;
  onChartClick?: (chart: AnalyticsChart) => void;
  onInsightClick?: (insight: AnalyticsInsight) => void;
  onDrillDown?: (chartId: string, level: DrillDownLevel) => void;
  onTimeRangeChange?: (timeRange: TimeRange) => void;
  onFilterChange?: (filters: AnalyticsFilter[]) => void;
  onConfigChange?: (config: Partial<AnalyticsConfig>) => void;
  onExport?: (format: ExportFormat, data: any) => void;
  onRefresh?: () => void;
  onGenerateReport?: () => void;
  onScheduleReport?: (schedule: any) => void;
  onShare?: () => void;
}

const AdvancedAnalyticsEngine: React.FC<AdvancedAnalyticsEngineProps> = ({
  dataPoints,
  charts,
  insights = [],
  reports = [],
  config,
  title = 'Analytics Dashboard',
  loading = false,
  error,
  realTime = false,
  autoRefresh = false,
  showTimeRange = false,
  showFilters = false,
  showInsights = false,
  showReports = false,
  showSettings = false,
  showChartStats = false,
  searchable = false,
  exportable = false,
  shareable = false,
  enableZoom = false,
  virtualized = false,
  lazyLoadCharts = false,
  cacheResults = false,
  announceUpdates = false,
  showPredictions = false,
  enableAnomalyDetection = false,
  showCorrelation = false,
  customChartRenderer,
  onChartClick,
  onInsightClick,
  onDrillDown,
  onTimeRangeChange,
  onFilterChange,
  onConfigChange,
  onExport,
  onRefresh,
  onGenerateReport,
  onScheduleReport,
  onShare,
}) => {
  // All hooks must be called before any early returns
  const [selectedFilters, setSelectedFilters] = useState<AnalyticsFilter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(
    new Set()
  );
  const [insightSeverityFilter, setInsightSeverityFilter] =
    useState<string>('all');
  const [timeRangeSelector, setTimeRangeSelector] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [zoomedChart, setZoomedChart] = useState<string | null>(null);
  const [drillDownView, setDrillDownView] = useState<string | null>(null);
  const [customTimeRange, setCustomTimeRange] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [reportSchedulerOpen, setReportSchedulerOpen] = useState(false);

  const handleFilterChange = useCallback(
    (filters: AnalyticsFilter[]) => {
      setSelectedFilters(filters);
      onFilterChange?.(filters);
    },
    [onFilterChange]
  );

  const handleInsightClick = useCallback(
    (insight: AnalyticsInsight) => {
      onInsightClick?.(insight);
    },
    [onInsightClick]
  );

  const handleChartClick = useCallback(
    (chart: AnalyticsChart) => {
      onChartClick?.(chart);
    },
    [onChartClick]
  );

  const handleDrillDown = useCallback(
    (chartId: string) => {
      setDrillDownView(chartId);
      onDrillDown?.(chartId, 'metric');
    },
    [onDrillDown]
  );

  const handleZoomChart = useCallback((chartId: string) => {
    setZoomedChart(chartId);
  }, []);

  const filteredCharts = useMemo(() => {
    if (!charts) return [];
    return charts.filter(chart => {
      if (
        searchQuery &&
        !chart.title.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [charts, searchQuery]);

  const filteredInsights = useMemo(() => {
    if (!insights) return [];
    return insights.filter(insight => {
      if (
        insightSeverityFilter !== 'all' &&
        insight.severity !== insightSeverityFilter
      ) {
        return false;
      }
      if (
        searchQuery &&
        !insight.title.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [insights, insightSeverityFilter, searchQuery]);

  const handleTimeRangeChange = useCallback(
    (range: string) => {
      const now = new Date();
      let timeRange: TimeRange;

      switch (range) {
        case 'last-hour':
          timeRange = {
            start: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
            end: now.toISOString(),
          };
          break;
        case 'last-day':
          timeRange = {
            start: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
            end: now.toISOString(),
          };
          break;
        default:
          return;
      }

      onTimeRangeChange?.(timeRange);
    },
    [onTimeRangeChange]
  );

  const toggleInsightExpansion = useCallback((insightId: string) => {
    setExpandedInsights(prev => {
      const next = new Set(prev);
      if (next.has(insightId)) {
        next.delete(insightId);
      } else {
        next.add(insightId);
      }
      return next;
    });
  }, []);

  // Check if we have data
  const hasData =
    (dataPoints && dataPoints.length > 0) ||
    (charts && charts.length > 0) ||
    (insights && insights.length > 0);

  // Handle loading state
  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-64">
          <div
            data-testid="analytics-loading"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading analytics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-64">
          <div
            data-testid="analytics-error"
            className="flex flex-col items-center gap-4"
          >
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="text-center">
              <p className="text-lg font-medium">Analytics Error</p>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button
              data-testid="retry-button"
              onClick={onRefresh}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle empty state
  if (!hasData) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-64">
          <div data-testid="analytics-empty-state" className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">No analytics data available</p>
            <p className="text-muted-foreground">
              Start collecting data to see analytics insights
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderChart = (chart: AnalyticsChart) => {
    if (customChartRenderer) {
      return customChartRenderer(chart);
    }

    const getChartIcon = (type: ChartType) => {
      switch (type) {
        case 'line':
          return <LineChart className="h-4 w-4" />;
        case 'bar':
          return <BarChart3 className="h-4 w-4" />;
        case 'pie':
          return <PieChart className="h-4 w-4" />;
        default:
          return <BarChart3 className="h-4 w-4" />;
      }
    };

    return (
      <Card
        key={chart.id}
        className="cursor-pointer hover:shadow-md transition-shadow"
        data-testid={`chart-${chart.id}`}
        onClick={() => handleChartClick(chart)}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{chart.title}</CardTitle>
          <div className="flex items-center gap-2">
            <div data-testid={`chart-type-${chart.type}`}>
              {getChartIcon(chart.type)}
            </div>
            {enableZoom && (
              <Button
                size="sm"
                variant="ghost"
                data-testid={`zoom-${chart.id}`}
                onClick={e => {
                  e.stopPropagation();
                  handleZoomChart(chart.id);
                }}
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              data-testid={`drill-down-${chart.id}`}
              onClick={e => {
                e.stopPropagation();
                handleDrillDown(chart.id);
              }}
            >
              <TrendingUp className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center bg-muted rounded">
            <span className="text-muted-foreground text-sm">
              {chart.type.toUpperCase()} Chart - {chart.dataPoints.length}{' '}
              points
            </span>
          </div>
          {showChartStats && (
            <div
              data-testid={`chart-stats-${chart.id}`}
              className="mt-2 text-xs text-muted-foreground"
            >
              {chart.dataPoints.length} data points
            </div>
          )}
          {lazyLoadCharts && (
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                data-testid={`expand-chart-${chart.id}`}
                onClick={() => {
                  // Simulate loading
                }}
              >
                View Details
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderInsight = (insight: AnalyticsInsight) => {
    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case 'error':
          return 'destructive';
        case 'warning':
          return 'secondary';
        case 'success':
          return 'default';
        default:
          return 'outline';
      }
    };

    const isExpanded = expandedInsights.has(insight.id);

    return (
      <Card
        key={insight.id}
        className="cursor-pointer hover:shadow-md transition-shadow"
        data-testid={`insight-${insight.id}`}
        onClick={() => handleInsightClick(insight)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-sm font-medium">
                {insight.title}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {insight.description}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <Badge
                variant={getSeverityColor(insight.severity) as any}
                data-testid={`insight-severity-${insight.severity}`}
              >
                {insight.severity}
              </Badge>
              <Badge
                variant="outline"
                data-testid={`insight-type-${insight.type}`}
              >
                {insight.type}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {Math.round(insight.confidence * 100)}% confidence
            </span>
            <Button
              size="sm"
              variant="ghost"
              data-testid={`expand-insight-${insight.id}`}
              onClick={e => {
                e.stopPropagation();
                toggleInsightExpansion(insight.id);
              }}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
          {isExpanded && insight.recommendations && (
            <div className="mt-3 border-t pt-3">
              <p className="text-xs font-medium mb-2">Recommendations:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {insight.recommendations.map((rec, idx) => (
                  <li key={idx}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div
      className="w-full space-y-6"
      data-testid="advanced-analytics-engine"
      role="region"
      aria-label="Advanced Analytics Engine"
    >
      {/* Announcements for screen readers */}
      {announceUpdates && (
        <div
          data-testid="analytics-announcements"
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        >
          Analytics data updated
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">{title}</h2>
          {realTime && (
            <Badge variant="outline" data-testid="real-time-indicator">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Live data
            </Badge>
          )}
          {autoRefresh && (
            <div
              data-testid="auto-refresh-indicator"
              className="flex items-center gap-1 text-xs text-muted-foreground"
            >
              <RefreshCw className="h-3 w-3" />
              Auto-refresh
            </div>
          )}
          {cacheResults && (
            <Badge variant="outline" data-testid="cache-indicator">
              Cached
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Data Points Summary */}
          <div
            data-testid="data-points-summary"
            className="text-sm text-muted-foreground"
          >
            {dataPoints ? dataPoints.length : 0} data points
          </div>

          {/* Refresh Button */}
          <Button
            size="sm"
            variant="outline"
            data-testid="refresh-button"
            onClick={onRefresh}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* Export Button */}
          {exportable && (
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              {exportMenuOpen && (
                <div className="absolute right-0 mt-1 bg-white border rounded-md shadow-lg z-10 min-w-[160px]">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm"
                    onClick={() => {
                      onExport?.('png', {});
                      setExportMenuOpen(false);
                    }}
                  >
                    Export as PNG
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm"
                    onClick={() => {
                      onExport?.('csv', dataPoints);
                      setExportMenuOpen(false);
                    }}
                  >
                    Export as CSV
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm"
                    onClick={() => {
                      onExport?.('pdf', reports[0] || {});
                      setExportMenuOpen(false);
                    }}
                  >
                    Export Report as PDF
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Share Button */}
          {shareable && (
            <Button
              size="sm"
              variant="outline"
              data-testid="share-dashboard"
              onClick={onShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}

          {/* Settings Button */}
          {showSettings && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSettingsOpen(!settingsOpen)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      {(showFilters || searchable || showTimeRange) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Search */}
              {searchable && (
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search analytics..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="analytics-search"
                    />
                  </div>
                </div>
              )}

              {/* Time Range */}
              {showTimeRange && (
                <div data-testid="time-range-selector">
                  <Select
                    onValueChange={handleTimeRangeChange}
                    data-testid="time-range-select"
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Time range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last-hour">Last Hour</SelectItem>
                      <SelectItem value="last-day">Last 24 Hours</SelectItem>
                      <SelectItem value="last-week">Last Week</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-2"
                    data-testid="custom-time-range"
                    onClick={() => setCustomTimeRange(!customTimeRange)}
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Filters */}
              {showFilters && (
                <div
                  data-testid="analytics-filters"
                  className="flex items-center gap-2"
                >
                  <Select
                    onValueChange={value => {
                      const filter: AnalyticsFilter = {
                        id: 'metric-filter',
                        field: 'metric',
                        operator: 'equals',
                        value: value.toLowerCase(),
                        label: value,
                      };
                      handleFilterChange([...selectedFilters, filter]);
                    }}
                  >
                    <SelectTrigger
                      className="w-[120px]"
                      data-testid="metric-filter"
                    >
                      <SelectValue placeholder="Metric" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Performance">Performance</SelectItem>
                      <SelectItem value="Usage">Usage</SelectItem>
                      <SelectItem value="Errors">Errors</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    onValueChange={value => {
                      const filter: AnalyticsFilter = {
                        id: 'category-filter',
                        field: 'category',
                        operator: 'equals',
                        value: value.toLowerCase(),
                        label: value,
                      };
                      handleFilterChange([...selectedFilters, filter]);
                    }}
                  >
                    <SelectTrigger
                      className="w-[120px]"
                      data-testid="category-filter"
                    >
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="System">System</SelectItem>
                      <SelectItem value="Network">Network</SelectItem>
                      <SelectItem value="Database">Database</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    size="sm"
                    variant="outline"
                    data-testid="clear-filters"
                    onClick={() => handleFilterChange([])}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}

              {/* Insight Filters */}
              {showInsights && (
                <Select
                  value={insightSeverityFilter}
                  onValueChange={setInsightSeverityFilter}
                >
                  <SelectTrigger
                    className="w-[140px]"
                    data-testid="insight-severity-filter"
                  >
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="info">Info Only</SelectItem>
                    <SelectItem value="warning">Warning Only</SelectItem>
                    <SelectItem value="error">Error Only</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Time Range Picker */}
      {customTimeRange && (
        <Card data-testid="time-range-picker">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Input type="datetime-local" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <Input type="datetime-local" className="mt-1" />
              </div>
              <Button onClick={() => setCustomTimeRange(false)}>Apply</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          {showInsights && <TabsTrigger value="insights">Insights</TabsTrigger>}
          {showReports && <TabsTrigger value="reports">Reports</TabsTrigger>}
          {showPredictions && (
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
          )}
          {enableAnomalyDetection && (
            <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          )}
          {showCorrelation && (
            <TabsTrigger value="correlation">Correlation</TabsTrigger>
          )}
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Zoomed Chart */}
          {zoomedChart && (
            <Card data-testid="chart-zoomed">
              <CardHeader>
                <CardTitle>Zoomed View</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setZoomedChart(null)}
                >
                  Close Zoom
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted rounded flex items-center justify-center">
                  <span className="text-muted-foreground">
                    Zoomed chart view for {zoomedChart}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Drill Down View */}
          {drillDownView && (
            <Card data-testid="drill-down-view">
              <CardHeader>
                <CardTitle>Drill Down Analysis</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDrillDownView(null)}
                >
                  Back to Overview
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-muted rounded flex items-center justify-center">
                  <span className="text-muted-foreground">
                    Detailed view for {drillDownView}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chart Loading State */}
          {lazyLoadCharts && (
            <div data-testid="chart-loading" className="hidden">
              <RefreshCw className="h-4 w-4 animate-spin" />
            </div>
          )}

          {/* Charts Grid */}
          <div
            className={`grid gap-6 ${virtualized ? 'virtualized' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}
            data-testid={virtualized ? 'virtualized-analytics' : undefined}
          >
            {(charts || []).map(chart => {
              // Handle chart errors
              if (!chart.dataPoints) {
                return (
                  <Card key={chart.id} data-testid={`chart-error-${chart.id}`}>
                    <CardContent className="flex items-center justify-center h-32">
                      <div className="text-center">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                        <span className="text-sm text-muted-foreground">
                          Chart Error
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              return renderChart(chart);
            })}
          </div>

          {/* Dashboard Insights */}
          {showInsights && (
            <div data-testid="analytics-insights">
              <h3 className="text-lg font-medium mb-4">Key Insights</h3>
              {filteredInsights.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center h-32">
                    <span className="text-muted-foreground">
                      No insights available
                    </span>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredInsights.map(renderInsight)}
                </div>
              )}
            </div>
          )}

          {/* Chart Data Tables for Accessibility */}
          {(charts || []).map(chart => (
            <div key={`table-${chart.id}`} className="sr-only">
              <table
                data-testid={`chart-data-table-${chart.id}`}
                role="table"
                aria-label={`${chart.title} chart data`}
              >
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Value</th>
                    <th>Metric</th>
                  </tr>
                </thead>
                <tbody>
                  {(chart.dataPoints || []).map(point => (
                    <tr key={point.id}>
                      <td>{point.timestamp}</td>
                      <td>{point.value}</td>
                      <td>{point.metric}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </TabsContent>

        {/* Insights Tab */}
        {showInsights && (
          <TabsContent value="insights" className="space-y-6">
            <div data-testid="analytics-insights">
              {filteredInsights.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center h-32">
                    <span className="text-muted-foreground">
                      No insights available
                    </span>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredInsights.map(renderInsight)}
                </div>
              )}
            </div>
          </TabsContent>
        )}

        {/* Reports Tab */}
        {showReports && (
          <TabsContent value="reports" className="space-y-6">
            <div data-testid="analytics-reports">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Analytics Reports</h3>
                <div className="flex items-center gap-2">
                  <Button
                    data-testid="generate-report"
                    onClick={onGenerateReport}
                  >
                    Generate Report
                  </Button>
                  <Button
                    variant="outline"
                    data-testid="schedule-report"
                    onClick={() => setReportSchedulerOpen(true)}
                  >
                    Schedule Report
                  </Button>
                </div>
              </div>

              {/* Report Scheduler */}
              {reportSchedulerOpen && (
                <Card data-testid="report-scheduler">
                  <CardHeader>
                    <CardTitle>Schedule Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            onScheduleReport?.({});
                            setReportSchedulerOpen(false);
                          }}
                        >
                          Save Schedule
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setReportSchedulerOpen(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reports List */}
              <div className="space-y-4">
                {(reports || []).map(report => (
                  <Card key={report.id}>
                    <CardHeader>
                      <CardTitle>{report.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {report.description}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          Generated:{' '}
                          {new Date(report.generatedAt).toLocaleDateString()}
                        </span>
                        <span>
                          {report.charts.length} charts,{' '}
                          {report.insights.length} insights
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        )}

        {/* Predictions Tab */}
        {showPredictions && (
          <TabsContent value="predictions" className="space-y-6">
            <div data-testid="predictive-analytics">
              <h3 className="text-lg font-medium mb-4">Predictions</h3>
              <Card>
                <CardContent className="pt-6">
                  <div className="h-32 bg-muted rounded flex items-center justify-center">
                    <span className="text-muted-foreground">
                      Predictive analytics view
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Anomalies Tab */}
        {enableAnomalyDetection && (
          <TabsContent value="anomalies" className="space-y-6">
            <div data-testid="anomaly-detection">
              <h3 className="text-lg font-medium mb-4">Anomaly Detection</h3>
              <Card>
                <CardContent className="pt-6">
                  <div className="h-32 bg-muted rounded flex items-center justify-center">
                    <span className="text-muted-foreground">
                      Anomaly detection results
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Correlation Tab */}
        {showCorrelation && (
          <TabsContent value="correlation" className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Correlation Analysis</h3>
                <Button data-testid="correlation-analysis">
                  Analyze Correlations
                </Button>
              </div>
              <div data-testid="correlation-matrix">
                <Card>
                  <CardContent className="pt-6">
                    <div className="h-32 bg-muted rounded flex items-center justify-center">
                      <span className="text-muted-foreground">
                        Correlation matrix
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Settings Panel */}
      {settingsOpen && (
        <Card data-testid="analytics-settings">
          <CardHeader>
            <CardTitle>Analytics Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Real-time Updates</label>
              <Switch
                checked={config.enableRealTime}
                onCheckedChange={checked =>
                  onConfigChange?.({ enableRealTime: checked })
                }
                data-testid="real-time-toggle"
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Refresh Interval (ms)
              </label>
              <Input
                type="number"
                value={config.refreshInterval}
                onChange={e =>
                  onConfigChange?.({
                    refreshInterval: parseInt(e.target.value),
                  })
                }
                data-testid="refresh-interval-input"
                className="mt-1"
              />
            </div>
            <Button
              variant="outline"
              data-testid="configure-thresholds"
              onClick={() => {
                // Show threshold configuration modal
              }}
            >
              Configure Thresholds
            </Button>
            {/* Threshold Config (hidden by default) */}
            <div data-testid="threshold-config" className="hidden">
              <h4 className="font-medium">Threshold Configuration</h4>
              <div className="space-y-2 mt-2">
                <div>
                  <label className="text-xs">Performance Warning</label>
                  <Input
                    type="number"
                    defaultValue={config.thresholds.performance?.warning}
                  />
                </div>
                <div>
                  <label className="text-xs">Performance Critical</label>
                  <Input
                    type="number"
                    defaultValue={config.thresholds.performance?.critical}
                  />
                </div>
              </div>
            </div>
            <Button onClick={() => setSettingsOpen(false)}>
              Close Settings
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedAnalyticsEngine;
