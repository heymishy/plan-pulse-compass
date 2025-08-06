import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  Info,
  Star,
  StarOff,
  Filter,
  Search,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  BarChart3,
  Table,
  History,
  Bell,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle
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
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@/components/ui/accessibility';

// Core interfaces
export type InsightCategory = 'resource' | 'risk' | 'performance' | 'quality' | 'skills' | 'timeline';
export type InsightType = 'optimization' | 'prediction' | 'trend' | 'alert' | 'recommendation';
export type InsightPriority = 'low' | 'medium' | 'high' | 'critical';
export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type TrendDirection = 'improving' | 'declining' | 'stable';

export interface InsightMetric {
  name: string;
  value: number;
  unit: string;
  baseline: number;
  trend?: TrendDirection;
}

export interface PredictiveInsight {
  id: string;
  title: string;
  description: string;
  category: InsightCategory;
  type: InsightType;
  priority: InsightPriority;
  confidence: ConfidenceLevel;
  metrics: InsightMetric[];
  trend: TrendDirection;
  impact: number;
  likelihood: number;
  timeframe: string;
  recommendations: string[];
  dataSource: string;
  lastUpdated: string;
}

export interface PredictiveInsightsPanelProps {
  // Core data
  insights: PredictiveInsight[];
  
  // Appearance
  title?: string;
  className?: string;
  theme?: 'light' | 'dark';
  highContrast?: boolean;
  layout?: 'vertical' | 'horizontal';
  
  // Behavior
  searchable?: boolean;
  showFilters?: boolean;
  showSorting?: boolean;
  enableFavorites?: boolean;
  enableComparison?: boolean;
  exportable?: boolean;
  showDataTable?: boolean;
  showHistory?: boolean;
  showMetricCharts?: boolean;
  showImpactMatrix?: boolean;
  virtualized?: boolean;
  lazyLoadDetails?: boolean;
  notificationsEnabled?: boolean;
  
  // Real-time
  loading?: boolean;
  error?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  announceUpdates?: boolean;
  
  // Callbacks
  onInsightClick?: (insight: PredictiveInsight) => void;
  onRecommendationAction?: (insight: PredictiveInsight, action: string) => void;
  onCategoryFilter?: (categories: string[]) => void;
  onSearch?: (query: string) => void;
  onExport?: (format: 'csv' | 'pdf', insights: PredictiveInsight[]) => void;
  onRefresh?: () => void;
  onNotificationSend?: (insight: PredictiveInsight) => void;
  customTemplate?: (insight: PredictiveInsight) => React.ReactNode;
}

// Helper functions
const getPriorityIcon = (priority: InsightPriority) => {
  switch (priority) {
    case 'critical': return AlertTriangle;
    case 'high': return AlertTriangle;
    case 'medium': return Info;
    case 'low': return Info;
    default: return Info;
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

const getConfidenceColor = (confidence: ConfidenceLevel) => {
  switch (confidence) {
    case 'high': return 'text-green-600';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

const getPriorityColor = (priority: InsightPriority) => {
  switch (priority) {
    case 'critical': return 'border-red-500 bg-red-50';
    case 'high': return 'border-orange-500 bg-orange-50';
    case 'medium': return 'border-yellow-500 bg-yellow-50';
    case 'low': return 'border-blue-500 bg-blue-50';
    default: return 'border-gray-500 bg-gray-50';
  }
};

const isMobileView = () => window.innerWidth < 768;

export function PredictiveInsightsPanel({
  insights,
  title = "Predictive Insights",
  className,
  theme = 'light',
  highContrast = false,
  layout = 'vertical',
  searchable = false,
  showFilters = false,
  showSorting = false,
  enableFavorites = false,
  enableComparison = false,
  exportable = false,
  showDataTable = false,
  showHistory = false,
  showMetricCharts = false,
  showImpactMatrix = false,
  virtualized = false,
  lazyLoadDetails = false,
  notificationsEnabled = false,
  loading = false,
  error,
  autoRefresh = false,
  refreshInterval = 30000,
  announceUpdates = false,
  onInsightClick,
  onRecommendationAction,
  onCategoryFilter,
  onSearch,
  onExport,
  onRefresh,
  onNotificationSend,
  customTemplate
}: PredictiveInsightsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('impact');
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [favoriteInsights, setFavoriteInsights] = useState<Set<string>>(new Set());
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<Set<string>>(new Set());
  const [showTable, setShowTable] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showImpactMatrixView, setShowImpactMatrixView] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const refreshIntervalRef = useRef<NodeJS.Timeout>();
  const searchDebounceRef = useRef<NodeJS.Timeout>();

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return;

    refreshIntervalRef.current = setInterval(() => {
      onRefresh();
      if (announceUpdates) {
        setAnnouncement('Insights updated');
        setTimeout(() => setAnnouncement(''), 2000);
      }
    }, refreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, onRefresh, announceUpdates]);

  // Search and filter logic
  const filteredInsights = useMemo(() => {
    if (!insights || !Array.isArray(insights)) return [];

    return insights.filter(insight => {
      // Search filter
      if (searchQuery && !insight.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !insight.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(insight.category)) {
        return false;
      }
      
      // Priority filter
      if (selectedPriorities.length > 0 && !selectedPriorities.includes(insight.priority)) {
        return false;
      }
      
      return true;
    });
  }, [insights, searchQuery, selectedCategories, selectedPriorities]);

  // Sorting logic
  const sortedInsights = useMemo(() => {
    const sorted = [...filteredInsights];
    
    switch (sortBy) {
      case 'impact':
        return sorted.sort((a, b) => b.impact - a.impact);
      case 'priority':
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return sorted.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
      case 'confidence':
        const confidenceOrder = { high: 3, medium: 2, low: 1 };
        return sorted.sort((a, b) => confidenceOrder[b.confidence] - confidenceOrder[a.confidence]);
      case 'recent':
        return sorted.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
      default:
        return sorted;
    }
  }, [filteredInsights, sortBy]);

  // Handle search with debouncing
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    // Debounce the onSearch callback
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    searchDebounceRef.current = setTimeout(() => {
      onSearch?.(query);
    }, 300);
  }, [onSearch]);

  // Handle category filter
  const handleCategoryFilter = useCallback((categories: string[]) => {
    setSelectedCategories(categories);
    onCategoryFilter?.(categories);
  }, [onCategoryFilter]);

  // Handle insight expansion
  const handleInsightExpand = useCallback((insightId: string) => {
    setExpandedInsights(prev => {
      const newSet = new Set(prev);
      if (newSet.has(insightId)) {
        newSet.delete(insightId);
      } else {
        newSet.add(insightId);
      }
      return newSet;
    });
  }, []);

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback((insightId: string) => {
    setFavoriteInsights(prev => {
      const newSet = new Set(prev);
      if (newSet.has(insightId)) {
        newSet.delete(insightId);
      } else {
        newSet.add(insightId);
      }
      return newSet;
    });
  }, []);

  // Handle export
  const handleExport = useCallback((format: 'csv' | 'pdf') => {
    onExport?.(format, sortedInsights);
  }, [onExport, sortedInsights]);

  // Empty state
  if (!insights || insights.length === 0) {
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
        data-testid="predictive-insights-panel"
      >
        <Card className="w-full">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center" data-testid="empty-insights-state">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No insights available</p>
              <p className="text-sm text-muted-foreground">
                Configure data sources to generate predictive insights
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
        data-testid="predictive-insights-panel"
      >
        <Card className="w-full">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center" data-testid="insights-error-state">
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
        data-testid="predictive-insights-panel"
      >
        <Card className="w-full">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center" data-testid="insights-loading">
              <Loader2 className="h-8 w-8 mx-auto animate-spin mb-4" />
              <p className="text-lg font-medium">Loading insights...</p>
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
      data-testid="predictive-insights-panel"
    >
      {/* Announcements for screen readers */}
      {announceUpdates && (
        <VisuallyHidden>
          <div 
            data-testid="insights-announcements"
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

              {/* View toggles */}
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

              {showHistory && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                >
                  <History className="h-4 w-4 mr-1" />
                  History
                </Button>
              )}

              {showImpactMatrix && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImpactMatrixView(!showImpactMatrixView)}
                >
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Impact Matrix
                </Button>
              )}

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
          {(searchable || showFilters || showSorting) && (
            <div className="flex items-center gap-4 mt-4">
              {/* Search */}
              {searchable && (
                <div className="flex-1 max-w-sm">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search insights..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}
              
              {/* Filters */}
              {showFilters && (
                <div className="flex items-center gap-2">
                  <Select onValueChange={(value) => handleCategoryFilter([value])}>
                    <SelectTrigger className="w-40" data-testid="category-filter">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resource">Resource</SelectItem>
                      <SelectItem value="risk">Risk</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="quality">Quality</SelectItem>
                      <SelectItem value="skills">Skills</SelectItem>
                      <SelectItem value="timeline">Timeline</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select onValueChange={(value) => setSelectedPriorities([value])}>
                    <SelectTrigger className="w-40" data-testid="priority-filter">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="critical">Critical Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Sorting */}
              {showSorting && (
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40" data-testid="sort-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="impact">Impact Score</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="confidence">Confidence</SelectItem>
                    <SelectItem value="recent">Recently Updated</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Comparison mode header */}
          {comparisonMode && (
            <div className="mb-4" data-testid="comparison-mode">
              <Badge variant="secondary" className="mb-2">Comparison Mode Active</Badge>
              <p className="text-sm text-muted-foreground">Select insights to compare</p>
            </div>
          )}

          {/* Impact Matrix View */}
          {showImpactMatrixView && (
            <div className="mb-6" data-testid="impact-likelihood-matrix">
              <h3 className="text-lg font-semibold mb-4">Impact vs Likelihood Matrix</h3>
              <div className="grid grid-cols-3 gap-4 h-64 border rounded-lg p-4">
                {sortedInsights.map(insight => (
                  <div
                    key={insight.id}
                    className="flex items-center justify-center p-2 rounded border text-xs text-center"
                    style={{
                      gridColumn: Math.ceil(insight.likelihood / 33.33),
                      gridRow: Math.ceil((10 - insight.impact) / 3.33)
                    }}
                  >
                    {insight.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History Panel */}
          {showHistoryPanel && (
            <div className="mb-6" data-testid="insight-history">
              <h3 className="text-lg font-semibold mb-4">Insight History</h3>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Recent insight changes and updates</p>
              </div>
            </div>
          )}

          {/* Data Table View */}
          {showTable && showDataTable && (
            <div className="mb-6">
              <div className="overflow-auto max-h-96 border rounded-lg">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr>
                      <th className="text-left p-3 border-b font-medium">Insight</th>
                      <th className="text-left p-3 border-b font-medium">Priority</th>
                      <th className="text-left p-3 border-b font-medium">Impact</th>
                      <th className="text-left p-3 border-b font-medium">Confidence</th>
                      <th className="text-left p-3 border-b font-medium">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedInsights.map((insight) => (
                      <tr key={insight.id}>
                        <td className="p-3 border-b">{insight.title}</td>
                        <td className="p-3 border-b">
                          <Badge variant="outline" className={getPriorityColor(insight.priority)}>
                            {insight.priority}
                          </Badge>
                        </td>
                        <td className="p-3 border-b">{insight.impact.toFixed(1)}</td>
                        <td className="p-3 border-b">
                          <span className={getConfidenceColor(insight.confidence)}>
                            {insight.likelihood}%
                          </span>
                        </td>
                        <td className="p-3 border-b">
                          {React.createElement(getTrendIcon(insight.trend), { 
                            className: `h-4 w-4 ${insight.trend === 'improving' ? 'text-green-600' : 
                                      insight.trend === 'declining' ? 'text-red-600' : 'text-gray-600'}` 
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Insights Grid */}
          <div 
            className={cn(
              "space-y-4",
              layout === 'horizontal' && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 space-y-0",
              layout === 'vertical' && "flex flex-col",
              virtualized && "virtualized-insights"
            )}
            data-testid={virtualized ? "virtualized-insights" : "insights-container"}
          >
            {customTemplate ? (
              sortedInsights.map(insight => (
                <div key={insight.id}>
                  {customTemplate(insight)}
                </div>
              ))
            ) : (
              sortedInsights.map((insight) => {
                const PriorityIcon = getPriorityIcon(insight.priority);
                const TrendIcon = getTrendIcon(insight.trend);
                const isExpanded = expandedInsights.has(insight.id);
                const isFavorite = favoriteInsights.has(insight.id);
                
                return (
                  <Card 
                    key={insight.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-md",
                      getPriorityColor(insight.priority),
                      comparisonMode && selectedForComparison.has(insight.id) && "ring-2 ring-blue-500"
                    )}
                    onClick={() => onInsightClick?.(insight)}
                    role="article"
                    data-testid={`insight-${insight.id}`}
                    tabIndex={0}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <PriorityIcon className="h-4 w-4" data-testid={`priority-${insight.priority}`} />
                            <CardTitle className="text-base">{insight.title}</CardTitle>
                            {enableFavorites && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFavoriteToggle(insight.id);
                                }}
                                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                                data-testid={`favorite-button-${insight.id}`}
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
                              <TrendIcon className="h-3 w-3" data-testid={`trend-${insight.trend}`} />
                              <span className="capitalize">{insight.trend}</span>
                            </div>
                            <div className={getConfidenceColor(insight.confidence)} data-testid={`confidence-${insight.confidence}`}>
                              {insight.likelihood}%
                            </div>
                            <Badge variant="outline">{insight.category}</Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="text-right text-sm">
                            <div className="font-medium">Impact: {insight.impact}</div>
                            <div className="text-muted-foreground">{insight.timeframe}</div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInsightExpand(insight.id);
                            }}
                            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${insight.title} details`}
                            data-testid={`expand-button-${insight.id}`}
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
                      <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                      
                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="space-y-4" data-testid="insight-details">
                          {lazyLoadDetails ? (
                            <div className="flex items-center justify-center p-4" data-testid="insight-details-loading">
                              <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                          ) : (
                            <>
                              {/* Metrics */}
                              {insight.metrics && insight.metrics.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">Key Metrics</h4>
                                  <div className="grid grid-cols-2 gap-3">
                                    {insight.metrics.map((metric, index) => (
                                      <div key={index} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                          <span>{metric.name}</span>
                                          <span className="font-medium">
                                            {metric.value}{metric.unit}
                                          </span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-blue-500 rounded-full transition-all"
                                            style={{ width: `${Math.min(100, (metric.value / metric.baseline) * 100)}%` }}
                                          />
                                        </div>
                                        {showMetricCharts && (
                                          <div className="mt-2" data-testid={`metric-chart-${metric.name.toLowerCase().replace(/\s+/g, '-')}`}>
                                            <div data-testid="metric-chart" className="h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-muted-foreground">
                                              Metric Chart: {metric.name}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Recommendations */}
                              {insight.recommendations && insight.recommendations.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">Recommendations</h4>
                                  <ul className="space-y-2">
                                    {insight.recommendations.map((recommendation, index) => (
                                      <li key={index} className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                        <span className="text-sm flex-1">{recommendation}</span>
                                      </li>
                                    ))}
                                  </ul>
                                  
                                  <div className="flex gap-2 mt-3">
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onRecommendationAction?.(insight, 'accept');
                                      }}
                                    >
                                      Accept
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onRecommendationAction?.(insight, 'dismiss');
                                      }}
                                    >
                                      Dismiss
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onRecommendationAction?.(insight, insight.recommendations[0]);
                                      }}
                                    >
                                      Take Action
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Notification controls */}
                              {notificationsEnabled && onNotificationSend && (
                                <div className="pt-2 border-t">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onNotificationSend?.(insight);
                                    }}
                                  >
                                    <Bell className="h-4 w-4 mr-1" />
                                    Send Notification
                                  </Button>
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
        </CardContent>
      </Card>
    </div>
  );
}

export default PredictiveInsightsPanel;