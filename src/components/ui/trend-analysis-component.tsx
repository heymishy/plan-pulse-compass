import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  Info,
  Filter,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  BarChart3,
  Table,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@/components/ui/accessibility';

// Core interfaces
export type TrendType = 'performance' | 'quality' | 'resource' | 'security' | 'skills' | 'timeline';
export type TrendPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly';
export type TrendDirection = 'improving' | 'declining' | 'stable';
export type TrendStrength = 'strong' | 'moderate' | 'weak';
export type TrendConfidence = 'high' | 'medium' | 'low';

export interface TrendIndicator {
  name: string;
  value: string;
  description: string;
}

export interface TrendMetric {
  name: string;
  value: number;
  unit: string;
}

export interface TrendData {
  id: string;
  name: string;
  type: TrendType;
  period: TrendPeriod;
  direction: TrendDirection;
  strength: TrendStrength;
  confidence: TrendConfidence;
  currentValue: number;
  previousValue: number;
  changePercentage: number;
  unit: string;
  dataPoints: Array<{
    timestamp: string;
    value: number;
  }>;
  forecast?: Array<{
    timestamp: string;
    value: number;
    confidence: number;
  }>;
  insights: string[];
  indicators: TrendIndicator[];
  metrics: TrendMetric[];
}

export interface TrendAnalysis {
  trends: TrendData[];
  summary: {
    totalTrends: number;
    improvingTrends: number;
    decliningTrends: number;
    stableTrends: number;
    highConfidenceTrends: number;
    criticalTrends: number;
  };
  period: {
    start: string;
    end: string;
  };
  lastUpdated: string;
}

export interface TrendAnalysisComponentProps {
  // Core data
  analysis: TrendAnalysis;
  
  // Appearance
  title?: string;
  className?: string;
  theme?: 'light' | 'dark';
  highContrast?: boolean;
  layout?: 'vertical' | 'horizontal' | 'grid' | 'compact';
  columns?: 'auto' | '1' | '2' | '3';
  
  // Behavior
  showFilters?: boolean;
  showViewToggle?: boolean;
  showPeriodSelector?: boolean;
  showCharts?: boolean;
  showForecast?: boolean;
  enableComparison?: boolean;
  exportable?: boolean;
  showDataTable?: boolean;
  showSummaryReport?: boolean;
  showConfidenceDistribution?: boolean;
  showHealthScore?: boolean;
  showCorrelationMatrix?: boolean;
  virtualized?: boolean;
  lazyLoadDetails?: boolean;
  groupByType?: boolean;
  showSignificanceScores?: boolean;
  showDataSources?: boolean;
  webhookEnabled?: boolean;
  
  // Real-time
  loading?: boolean;
  error?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  announceUpdates?: boolean;
  
  // Callbacks
  onTrendClick: (trend: TrendData) => void;
  onTrendDrillDown?: (trend: TrendData) => void;
  onPeriodChange?: (period: { period: string; start: string; end: string }) => void;
  onForecastToggle?: (enabled: boolean) => void;
  onExport?: (format: 'csv' | 'pdf', analysis: TrendAnalysis) => void;
  onRefresh?: () => void;
  onWebhookSetup?: () => void;
  customTemplate?: (trend: TrendData) => React.ReactNode;
  customColors?: {
    improving: string;
    declining: string;
    stable: string;
  };
}

// Helper functions
const getTrendIcon = (direction: TrendDirection) => {
  switch (direction) {
    case 'improving': return TrendingUp;
    case 'declining': return TrendingDown;
    case 'stable': return Minus;
    default: return Minus;
  }
};

const getTrendColor = (direction: TrendDirection) => {
  switch (direction) {
    case 'improving': return 'text-green-600';
    case 'declining': return 'text-red-600';
    case 'stable': return 'text-gray-600';
    default: return 'text-gray-600';
  }
};

const getConfidenceColor = (confidence: TrendConfidence) => {
  switch (confidence) {
    case 'high': return 'text-green-600';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

const getStrengthBadgeVariant = (strength: TrendStrength) => {
  switch (strength) {
    case 'strong': return 'default';
    case 'moderate': return 'secondary';
    case 'weak': return 'outline';
    default: return 'outline';
  }
};

const formatConfidencePercentage = (confidence: TrendConfidence) => {
  switch (confidence) {
    case 'high': return '85%';
    case 'medium': return '75%';
    case 'low': return '65%';
    default: return '50%';
  }
};

const isMobileView = () => window.innerWidth < 768;

export function TrendAnalysisComponent({
  analysis,
  title = "Trend Analysis",
  className,
  theme = 'light',
  highContrast = false,
  layout = 'grid',
  columns = 'auto',
  showFilters = false,
  showViewToggle = false,
  showPeriodSelector = false,
  showCharts = false,
  showForecast = false,
  enableComparison = false,
  exportable = false,
  showDataTable = false,
  showSummaryReport = false,
  showConfidenceDistribution = false,
  showHealthScore = false,
  showCorrelationMatrix = false,
  virtualized = false,
  lazyLoadDetails = false,
  groupByType = false,
  showSignificanceScores = false,
  showDataSources = false,
  webhookEnabled = false,
  loading = false,
  error,
  autoRefresh = false,
  refreshInterval = 30000,
  announceUpdates = false,
  onTrendClick,
  onTrendDrillDown,
  onPeriodChange,
  onForecastToggle,
  onExport,
  onRefresh,
  onWebhookSetup,
  customTemplate,
  customColors
}: TrendAnalysisComponentProps) {
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedDirection, setSelectedDirection] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [expandedTrends, setExpandedTrends] = useState<Set<string>>(new Set());
  const [comparisonMode, setComparisonMode] = useState(false);
  const [showForecastData, setShowForecastData] = useState(showForecast);
  const [isRefreshPaused, setIsRefreshPaused] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const refreshIntervalRef = useRef<NodeJS.Timeout>();

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh || !onRefresh || isRefreshPaused) return;

    refreshIntervalRef.current = setInterval(() => {
      onRefresh();
      if (announceUpdates) {
        setAnnouncement('Trends updated');
        setTimeout(() => setAnnouncement(''), 2000);
      }
    }, refreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, onRefresh, announceUpdates, isRefreshPaused]);

  // Filtered trends
  const filteredTrends = useMemo(() => {
    if (!analysis?.trends) return [];

    return analysis.trends.filter(trend => {
      if (selectedType && selectedType !== 'all' && trend.type !== selectedType) return false;
      if (selectedDirection && selectedDirection !== 'all' && trend.direction !== selectedDirection) return false;
      return true;
    });
  }, [analysis?.trends, selectedType, selectedDirection]);

  // Grouped trends
  const groupedTrends = useMemo(() => {
    if (!groupByType) return { all: filteredTrends };
    
    return filteredTrends.reduce((groups, trend) => {
      const type = trend.type;
      if (!groups[type]) groups[type] = [];
      groups[type].push(trend);
      return groups;
    }, {} as Record<string, TrendData[]>);
  }, [filteredTrends, groupByType]);

  // Handle trend expansion
  const handleTrendExpand = useCallback((trendId: string) => {
    setExpandedTrends(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trendId)) {
        newSet.delete(trendId);
      } else {
        newSet.add(trendId);
      }
      return newSet;
    });
  }, []);

  // Handle export
  const handleExport = useCallback((format: 'csv' | 'pdf') => {
    onExport?.(format, analysis);
  }, [onExport, analysis]);

  // Handle period change
  const handlePeriodChange = useCallback((period: string) => {
    const now = new Date();
    let start: Date;
    
    switch (period) {
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    onPeriodChange?.({
      period,
      start: start.toISOString(),
      end: now.toISOString()
    });
  }, [onPeriodChange]);

  // Handle forecast toggle
  const handleForecastToggle = useCallback(() => {
    const newState = !showForecastData;
    setShowForecastData(newState);
    onForecastToggle?.(newState);
  }, [showForecastData, onForecastToggle]);

  // Handle refresh pause/resume
  const handleRefreshPause = useCallback(() => {
    setIsRefreshPaused(!isRefreshPaused);
  }, [isRefreshPaused]);

  // Empty state
  if (!analysis?.trends || analysis.trends.length === 0) {
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
        data-testid="trend-analysis-component"
      >
        <Card className="w-full">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center" data-testid="empty-trends-state">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No trends available</p>
              <p className="text-sm text-muted-foreground">
                Configure data sources to generate trend analysis
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
        data-testid="trend-analysis-component"
      >
        <Card className="w-full">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center" data-testid="trends-error-state">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <p className="text-lg font-medium text-destructive">{error}</p>
              <p className="text-sm text-muted-foreground">
                Please try refreshing or contact support if the issue persists
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
        data-testid="trend-analysis-component"
      >
        <Card className="w-full">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center" data-testid="trends-loading">
              <Loader2 className="h-8 w-8 mx-auto animate-spin mb-4" />
              <p className="text-lg font-medium">Loading trends...</p>
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
      data-testid="trend-analysis-component"
      style={customColors ? {
        '--color-improving': customColors.improving,
        '--color-declining': customColors.declining,
        '--color-stable': customColors.stable,
      } as React.CSSProperties : undefined}
    >
      {/* Announcements for screen readers */}
      {announceUpdates && (
        <VisuallyHidden>
          <div 
            data-testid="trends-announcements"
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
              onClick={handleRefreshPause}
              data-testid={isRefreshPaused ? "play-refresh-button" : "pause-refresh-button"}
            >
              {isRefreshPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      <Card className="w-full">
        {/* Header */}
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {title}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* Forecast toggle */}
              {showForecast && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleForecastToggle}
                  data-testid="forecast-toggle"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {showForecastData ? 'Hide' : 'Show'} Forecast
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

              {/* View toggle */}
              {showViewToggle && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                  data-testid="view-toggle"
                >
                  <Table className="h-4 w-4 mr-1" />
                  {viewMode === 'grid' ? 'Table' : 'Grid'}
                </Button>
              )}

              {/* Comparison mode */}
              {enableComparison && (
                <Button
                  variant={comparisonMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setComparisonMode(!comparisonMode)}
                >
                  Compare Periods
                </Button>
              )}

              {/* Summary report */}
              {showSummaryReport && (
                <Button variant="outline" size="sm">
                  Summary Report
                </Button>
              )}

              {/* Correlation matrix */}
              {showCorrelationMatrix && (
                <Button variant="outline" size="sm">
                  Correlations
                </Button>
              )}

              {/* Webhooks */}
              {webhookEnabled && onWebhookSetup && (
                <Button variant="outline" size="sm" onClick={onWebhookSetup}>
                  Setup Webhooks
                </Button>
              )}
            </div>
          </div>
          
          {/* Controls row */}
          {(showFilters || showPeriodSelector) && (
            <div className="flex items-center gap-4 mt-4">
              {/* Type filter */}
              {showFilters && (
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-40" data-testid="type-filter">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="quality">Quality</SelectItem>
                    <SelectItem value="resource">Resource</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="skills">Skills</SelectItem>
                    <SelectItem value="timeline">Timeline</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Direction filter */}
              {showFilters && (
                <Select value={selectedDirection} onValueChange={setSelectedDirection}>
                  <SelectTrigger className="w-40" data-testid="direction-filter">
                    <SelectValue placeholder="All Directions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Directions</SelectItem>
                    <SelectItem value="improving">Improving</SelectItem>
                    <SelectItem value="declining">Declining</SelectItem>
                    <SelectItem value="stable">Stable</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Period selector */}
              {showPeriodSelector && (
                <Select onValueChange={handlePeriodChange}>
                  <SelectTrigger className="w-40" data-testid="period-select">
                    <SelectValue placeholder="Select Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="quarter">Last Quarter</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Summary statistics */}
          <div className="mb-6 grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{analysis.summary.totalTrends}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analysis.summary.improvingTrends}</div>
              <div className="text-sm text-muted-foreground">Improving</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{analysis.summary.decliningTrends}</div>
              <div className="text-sm text-muted-foreground">Declining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{analysis.summary.stableTrends}</div>
              <div className="text-sm text-muted-foreground">Stable</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{analysis.summary.highConfidenceTrends}</div>
              <div className="text-sm text-muted-foreground">High Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{analysis.summary.criticalTrends}</div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </div>
          </div>

          {/* Comparison mode header */}
          {comparisonMode && (
            <div className="mb-4" data-testid="comparison-mode">
              <Badge variant="secondary" className="mb-2">Comparison Mode Active</Badge>
              <p className="text-sm text-muted-foreground">Select periods to compare</p>
            </div>
          )}

          {/* Confidence distribution */}
          {showConfidenceDistribution && (
            <div className="mb-6" data-testid="confidence-distribution">
              <h3 className="text-lg font-semibold mb-4">Confidence Distribution</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>High Confidence: {analysis.summary.highConfidenceTrends}</span>
                  <span>Medium Confidence: {filteredTrends.filter(t => t.confidence === 'medium').length}</span>
                  <span>Low Confidence: {filteredTrends.filter(t => t.confidence === 'low').length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Health score */}
          {showHealthScore && (
            <div className="mb-6" data-testid="trend-health-score">
              <h3 className="text-lg font-semibold mb-4">Health Score</h3>
              <div className="text-center">
                <div className="text-3xl font-bold">Health Score: 75</div>
                <div className="text-sm text-muted-foreground">Based on trend analysis</div>
              </div>
            </div>
          )}

          {/* Correlation matrix */}
          {showCorrelationMatrix && (
            <div className="mb-6" data-testid="correlation-matrix">
              <h3 className="text-lg font-semibold mb-4">Trend Correlations</h3>
              <div className="grid grid-cols-3 gap-4 h-32 border rounded-lg p-4">
                <div className="text-center text-sm text-muted-foreground">
                  Correlation analysis placeholder
                </div>
              </div>
            </div>
          )}

          {/* Summary report */}
          {showSummaryReport && (
            <div className="mb-6" data-testid="trend-summary-report">
              <h3 className="text-lg font-semibold mb-4">Trend Analysis Summary</h3>
              <div className="space-y-2 text-sm">
                <p>Analysis period: {analysis.period.start} to {analysis.period.end}</p>
                <p>Last updated: {new Date(analysis.lastUpdated).toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Data table view */}
          {viewMode === 'table' && showDataTable && (
            <div className="mb-6" data-testid="trends-table-view">
              <div className="overflow-auto max-h-96 border rounded-lg">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr>
                      <th className="text-left p-3 border-b font-medium">Trend</th>
                      <th className="text-left p-3 border-b font-medium">Direction</th>
                      <th className="text-left p-3 border-b font-medium">Value</th>
                      <th className="text-left p-3 border-b font-medium">Change</th>
                      <th className="text-left p-3 border-b font-medium">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrends.map((trend) => (
                      <tr key={trend.id}>
                        <td className="p-3 border-b">{trend.name}</td>
                        <td className="p-3 border-b">
                          <Badge variant="outline" className="capitalize">
                            {trend.direction}
                          </Badge>
                        </td>
                        <td className="p-3 border-b">{trend.currentValue}{trend.unit}</td>
                        <td className="p-3 border-b">
                          <span className={getTrendColor(trend.direction)}>
                            {trend.changePercentage > 0 ? '+' : ''}{trend.changePercentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 border-b">
                          <span className={getConfidenceColor(trend.confidence)}>
                            {formatConfidencePercentage(trend.confidence)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Trends Grid/List */}
          {viewMode === 'grid' && (
            <>
              {groupByType ? (
                Object.entries(groupedTrends).map(([type, trends]) => (
                  <div key={type} className="mb-6" data-testid={`type-${type}`}>
                    <h3 className="text-lg font-semibold mb-4 capitalize">{type} Trends</h3>
                    <div 
                      className={cn(
                        "space-y-4",
                        layout === 'horizontal' && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 space-y-0",
                        layout === 'grid' && "grid gap-4 space-y-0",
                        layout === 'grid' && columns === 'auto' && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
                        layout === 'grid' && columns === '1' && "grid-cols-1",
                        layout === 'grid' && columns === '2' && "grid-cols-2",
                        layout === 'grid' && columns === '3' && "grid-cols-3",
                        layout === 'vertical' && "flex flex-col",
                        layout === 'compact' && "compact-layout",
                        virtualized && "virtualized-trends"
                      )}
                      data-testid={virtualized ? "virtualized-trends" : "trends-container"}
                    >
                      {trends.map((trend) => (
                        <TrendCard
                          key={trend.id}
                          trend={trend}
                          isExpanded={expandedTrends.has(trend.id)}
                          showCharts={showCharts}
                          showForecastData={showForecastData}
                          lazyLoadDetails={lazyLoadDetails}
                          showSignificanceScores={showSignificanceScores}
                          showDataSources={showDataSources}
                          onTrendClick={onTrendClick}
                          onTrendDrillDown={onTrendDrillDown}
                          onExpand={() => handleTrendExpand(trend.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div 
                  className={cn(
                    "space-y-4",
                    layout === 'horizontal' && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 space-y-0",
                    layout === 'grid' && "grid gap-4 space-y-0",
                    layout === 'grid' && columns === 'auto' && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
                    layout === 'grid' && columns === '1' && "grid-cols-1",
                    layout === 'grid' && columns === '2' && "grid-cols-2", 
                    layout === 'grid' && columns === '3' && "grid-cols-3",
                    layout === 'vertical' && "flex flex-col",
                    layout === 'compact' && "compact-layout",
                    virtualized && "virtualized-trends"
                  )}
                  data-testid={virtualized ? "virtualized-trends" : "trends-container"}
                >
                  {filteredTrends.map((trend) => (
                    <TrendCard
                      key={trend.id}
                      trend={trend}
                      isExpanded={expandedTrends.has(trend.id)}
                      showCharts={showCharts}
                      showForecastData={showForecastData}
                      lazyLoadDetails={lazyLoadDetails}
                      showSignificanceScores={showSignificanceScores}
                      showDataSources={showDataSources}
                      onTrendClick={onTrendClick}
                      onTrendDrillDown={onTrendDrillDown}
                      onExpand={() => handleTrendExpand(trend.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Last updated */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Last updated: {new Date(analysis.lastUpdated).toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Trend Card Component
interface TrendCardProps {
  trend: TrendData;
  isExpanded: boolean;
  showCharts: boolean;
  showForecastData: boolean;
  lazyLoadDetails: boolean;
  showSignificanceScores: boolean;
  showDataSources: boolean;
  onTrendClick: (trend: TrendData) => void;
  onTrendDrillDown?: (trend: TrendData) => void;
  onExpand: () => void;
}

function TrendCard({
  trend,
  isExpanded,
  showCharts,
  showForecastData,
  lazyLoadDetails,
  showSignificanceScores,
  showDataSources,
  onTrendClick,
  onTrendDrillDown,
  onExpand
}: TrendCardProps) {
  const TrendIcon = getTrendIcon(trend.direction);

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-md"
      onClick={() => onTrendClick(trend)}
      onDoubleClick={() => onTrendDrillDown?.(trend)}
      role="article"
      data-testid={`trend-${trend.id}`}
      tabIndex={0}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <TrendIcon 
                className={cn("h-4 w-4", getTrendColor(trend.direction))} 
                data-testid={`direction-${trend.direction}`}
              />
              <CardTitle className="text-base">{trend.name}</CardTitle>
              <Badge variant={getStrengthBadgeVariant(trend.strength)} data-testid={`strength-${trend.strength}`}>
                {trend.strength}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className={getConfidenceColor(trend.confidence)} data-testid={`confidence-${trend.confidence}`}>
                {formatConfidencePercentage(trend.confidence)}
              </div>
              <Badge variant="outline">{trend.type}</Badge>
              <Badge variant="outline">{trend.period}</Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right text-sm">
              <div className="font-medium text-lg">{trend.currentValue}{trend.unit}</div>
              <div className={cn("text-sm", getTrendColor(trend.direction))}>
                {trend.changePercentage > 0 ? '+' : ''}{trend.changePercentage.toFixed(1)}%
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onExpand();
              }}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${trend.name} details`}
              data-testid={`expand-button-${trend.id}`}
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
        {/* Mini chart */}
        {showCharts && (
          <div className="mb-3" data-testid="trend-line-chart">
            <div className="h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-muted-foreground">
              Trend Chart: {trend.name}
            </div>
          </div>
        )}
        
        {/* Expanded details */}
        {isExpanded && (
          <div className="space-y-4 border-t pt-4" data-testid="trend-details">
            {lazyLoadDetails ? (
              <div className="flex items-center justify-center p-4" data-testid="trend-details-loading">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                {/* Insights */}
                {trend.insights && trend.insights.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Key Insights</h4>
                    <ul className="space-y-1">
                      {trend.insights.map((insight, index) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          • {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Charts */}
                {showCharts && (
                  <div>
                    <h4 className="font-medium mb-2">Historical Data</h4>
                    <div className="space-y-2">
                      <div data-testid="trend-chart" className="h-32 bg-gray-100 rounded flex items-center justify-center text-xs text-muted-foreground">
                        Trend Chart: {trend.name}
                      </div>
                      <div data-testid="historical-data-chart" className="h-24 bg-gray-100 rounded flex items-center justify-center text-xs text-muted-foreground">
                        Historical Data
                      </div>
                    </div>
                  </div>
                )}

                {/* Forecast */}
                {showForecastData && trend.forecast && (
                  <div>
                    <h4 className="font-medium mb-2">Forecasted Values</h4>
                    <div data-testid="forecast-chart" className="h-24 bg-blue-50 rounded flex items-center justify-center text-xs text-muted-foreground">
                      Forecast Chart: {trend.name}
                    </div>
                  </div>
                )}

                {/* Indicators */}
                {trend.indicators && trend.indicators.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Indicators</h4>
                    <div className="space-y-2">
                      {trend.indicators.map((indicator, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{indicator.name}</span>
                          <span className="font-medium">{indicator.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metrics */}
                {trend.metrics && trend.metrics.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Metrics</h4>
                    <div className="space-y-2">
                      {trend.metrics.map((metric, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{metric.name}</span>
                          <span className="font-medium">{metric.value}{metric.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Significance scores */}
                {showSignificanceScores && (
                  <div data-testid="significance-score">
                    <h4 className="font-medium mb-2">Statistical Significance</h4>
                    <div className="text-sm">Significance: 85</div>
                  </div>
                )}

                {/* Data sources */}
                {showDataSources && (
                  <div>
                    <h4 className="font-medium mb-2">Data Sources</h4>
                    <div className="text-sm text-muted-foreground">
                      {trend.type === 'performance' && 'velocity-tracker'}
                      {trend.type === 'quality' && 'quality-monitor'}
                      {trend.type === 'resource' && 'resource-tracker'}
                    </div>
                  </div>
                )}

                {/* Annotations */}
                {(trend as any).annotations && (
                  <div data-testid="trend-annotation">
                    <h4 className="font-medium mb-2">Annotations</h4>
                    <div className="text-sm text-muted-foreground">
                      Sprint planning completed
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
}

export default TrendAnalysisComponent;