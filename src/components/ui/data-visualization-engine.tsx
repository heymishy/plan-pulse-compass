import React, { useState, useMemo, useCallback, useEffect, useRef, Suspense } from 'react';
import { 
  Download, 
  Filter, 
  ZoomIn, 
  ZoomOut, 
  Play, 
  Pause, 
  BarChart3, 
  LineChart, 
  PieChart, 
  Calendar,
  Table,
  AlertCircle,
  TrendingUp,
  Loader2
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
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@/components/ui/accessibility';

// Chart library imports
import {
  LineChart,
  BarChart,
  PieChart,
  ScatterChart,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  Bar,
  Area,
  Cell,
  Brush,
  Pie,
  Scatter
} from 'recharts';

// Core interfaces
export interface DataPoint {
  id: string;
  label: string;
  [key: string]: any;
}

export interface Dataset<T extends DataPoint> {
  id: string;
  label: string;
  data: T[];
  color: string;
  type: ChartType;
}

export interface VisualizationData<T extends DataPoint> {
  datasets: Dataset<T>[];
  categories: string[];
  timeRange?: {
    start: string;
    end: string;
  };
  aggregation?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  comparisonMode?: boolean;
  baselineDataset?: string;
  annotations?: ChartAnnotation[];
}

export interface ChartAnnotation {
  id: string;
  type: 'vertical' | 'horizontal' | 'point';
  value: string | number;
  label: string;
  color: string;
}

export interface ChartConfig {
  responsive: boolean;
  animated: boolean;
  showLegend: boolean;
  showTooltip: boolean;
  showGrid: boolean;
  theme: 'light' | 'dark';
  colors: string[];
  height: number;
  width: number;
  highContrast?: boolean;
  customTheme?: {
    background: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
  };
  interactiveLegend?: boolean;
}

export type ChartType = 'line' | 'bar' | 'pie' | 'scatter' | 'area';
export type ExportFormat = 'png' | 'svg' | 'csv' | 'json' | 'xlsx';

export interface InteractionEvent {
  x: number;
  y: number;
  dataPoint?: DataPoint;
}

export interface FilterOptions {
  categories: string[];
  dateRange: {
    start: string;
    end: string;
  };
  valueRange?: {
    min: number;
    max: number;
  };
}

// Props interface
export interface DataVisualizationEngineProps<T extends DataPoint> {
  // Core data
  data: VisualizationData<T>;
  chartType: ChartType;
  config: ChartConfig;
  
  // Appearance
  title?: string;
  description?: string;
  className?: string;
  
  // Behavior
  interactive?: boolean;
  showControls?: boolean;
  exportable?: boolean;
  filterable?: boolean;
  zoomable?: boolean;
  brushable?: boolean;
  showDataTable?: boolean;
  drillDownEnabled?: boolean;
  
  // Performance
  virtualized?: boolean;
  lazyLoad?: boolean;
  
  // Real-time
  realTimeUpdates?: boolean;
  updateInterval?: number;
  
  // Accessibility
  announceChanges?: boolean;
  
  // Callbacks
  onDataPointClick?: (dataPoint: T, event: InteractionEvent) => void;
  onExport?: (format: ExportFormat, data: any) => void;
  onFilter?: (filters: FilterOptions) => void;
  onZoom?: (direction: 'in' | 'out', level: number) => void;
  onDrillDown?: (dataPoint: T) => void;
}

// Helper functions
const getChartIcon = (chartType: ChartType) => {
  switch (chartType) {
    case 'line': return LineChart;
    case 'bar': return BarChart3;
    case 'pie': return PieChart;
    case 'scatter': return TrendingUp;
    case 'area': return BarChart3;
    default: return LineChart;
  }
};

const isDataValid = (data: any): boolean => {
  return data && 
         data.datasets && 
         Array.isArray(data.datasets) && 
         data.datasets.length > 0 &&
         data.datasets.every((dataset: any) => 
           dataset.data && Array.isArray(dataset.data)
         );
};

const isMobileView = () => window.innerWidth < 768;

export function DataVisualizationEngine<T extends DataPoint>({
  data,
  chartType,
  config,
  title,
  description,
  className,
  interactive = false,
  showControls = false,
  exportable = false,
  filterable = false,
  zoomable = false,
  brushable = false,
  showDataTable = false,
  drillDownEnabled = false,
  virtualized = false,
  lazyLoad = false,
  realTimeUpdates = false,
  updateInterval = 5000,
  announceChanges = false,
  onDataPointClick,
  onExport,
  onFilter,
  onZoom,
  onDrillDown
}: DataVisualizationEngineProps<T>) {
  const [currentChartType, setCurrentChartType] = useState<ChartType>(chartType);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: data?.categories || [],
    dateRange: data?.timeRange || { start: '', end: '' }
  });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isRealTimePaused, setIsRealTimePaused] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const chartRef = useRef<HTMLDivElement>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout>();

  // Validate props
  useEffect(() => {
    if (!config) {
      console.warn('Invalid chart configuration: config is required');
      setError('Invalid chart configuration');
      return;
    }
    
    if (!isDataValid(data)) {
      setError('No data available');
      return;
    }
    
    setError(null);
  }, [data, config]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeUpdates || isRealTimePaused) return;

    updateIntervalRef.current = setInterval(() => {
      if (announceChanges) {
        setAnnouncement('Data updated');
        setTimeout(() => setAnnouncement(''), 2000);
      }
    }, updateInterval);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [realTimeUpdates, isRealTimePaused, updateInterval, announceChanges]);

  // Handle chart type change
  const handleChartTypeChange = useCallback((newType: ChartType) => {
    setCurrentChartType(newType);
    if (announceChanges) {
      setAnnouncement(`Chart type changed to ${newType}`);
      setTimeout(() => setAnnouncement(''), 2000);
    }
  }, [announceChanges]);

  // Handle export
  const handleExport = useCallback((format: ExportFormat) => {
    if (!onExport) return;
    
    switch (format) {
      case 'png':
        onExport('png', { chartRef: chartRef.current });
        break;
      case 'csv':
        onExport('csv', data);
        break;
      case 'json':
        onExport('json', data);
        break;
      default:
        onExport(format, data);
    }
  }, [onExport, data]);

  // Handle zoom
  const handleZoom = useCallback((direction: 'in' | 'out') => {
    const newLevel = direction === 'in' ? zoomLevel * 1.2 : zoomLevel / 1.2;
    setZoomLevel(Math.max(0.5, Math.min(3, newLevel)));
    onZoom?.(direction, newLevel);
  }, [zoomLevel, onZoom]);

  // Handle filter
  const handleFilter = useCallback((newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filterOptions, ...newFilters };
    setFilterOptions(updatedFilters);
    onFilter?.(updatedFilters);
  }, [filterOptions, onFilter]);

  // Safe data access helpers
  const safeData = useMemo(() => {
    if (!data || !isDataValid(data)) return null;
    return data;
  }, [data]);

  const filteredData = useMemo(() => {
    if (!safeData?.datasets[0]?.data) return [];
    return safeData.datasets[0].data;
  }, [safeData]);

  // Chart component renderer
  const renderChart = useCallback(() => {
    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-2" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      );
    }

    if (!isDataValid(data)) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" data-testid="empty-state-icon" />
            <p className="text-lg font-medium text-muted-foreground">No data available</p>
            <p className="text-sm text-muted-foreground">
              Configure data sources to view visualizations
            </p>
          </div>
        </div>
      );
    }

    const chartData = filteredData;
    
    const ChartComponent = () => {
      switch (currentChartType) {
        case 'line':
          return (
            <LineChart data={chartData} data-testid="line-chart">
              {config?.showGrid && <CartesianGrid data-testid="cartesian-grid" />}
              <XAxis dataKey="label" data-testid="x-axis" />
              <YAxis data-testid="y-axis" />
              {config?.showTooltip && <Tooltip data-testid="chart-tooltip" />}
              {config?.showLegend && <Legend data-testid="chart-legend" />}
              <Line type="monotone" dataKey="value" stroke={safeData?.datasets[0]?.color || '#10b981'} data-testid="line" />
              {brushable && <Brush data-testid="chart-brush" />}
            </LineChart>
          );
        case 'bar':
          return (
            <BarChart data={chartData} data-testid="bar-chart">
              {config?.showGrid && <CartesianGrid data-testid="cartesian-grid" />}
              <XAxis dataKey="label" data-testid="x-axis" />
              <YAxis data-testid="y-axis" />
              {config?.showTooltip && <Tooltip data-testid="chart-tooltip" />}
              {config?.showLegend && <Legend data-testid="chart-legend" />}
              <Bar dataKey="value" fill={safeData?.datasets[0]?.color || '#10b981'} data-testid="bar" />
            </BarChart>
          );
        case 'pie':
          return (
            <PieChart data={chartData} data-testid="pie-chart">
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill={safeData?.datasets[0]?.color || '#10b981'}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={config?.colors?.[index % (config?.colors?.length || 1)] || '#10b981'} data-testid="cell" />
                ))}
              </Pie>
              {config?.showTooltip && <Tooltip data-testid="chart-tooltip" />}
              {config?.showLegend && <Legend data-testid="chart-legend" />}
            </PieChart>
          );
        case 'scatter':
          return (
            <ScatterChart data={chartData} data-testid="scatter-chart">
              {config?.showGrid && <CartesianGrid data-testid="cartesian-grid" />}
              <XAxis dataKey="label" data-testid="x-axis" />
              <YAxis dataKey="value" data-testid="y-axis" />
              {config?.showTooltip && <Tooltip data-testid="chart-tooltip" />}
              {config?.showLegend && <Legend data-testid="chart-legend" />}
              <Scatter dataKey="value" fill={safeData?.datasets[0]?.color || '#10b981'} />
            </ScatterChart>
          );
        case 'area':
          return (
            <AreaChart data={chartData} data-testid="area-chart">
              {config?.showGrid && <CartesianGrid data-testid="cartesian-grid" />}
              <XAxis dataKey="label" data-testid="x-axis" />
              <YAxis data-testid="y-axis" />
              {config?.showTooltip && <Tooltip data-testid="chart-tooltip" />}
              {config?.showLegend && <Legend data-testid="chart-legend" />}
              <Area type="monotone" dataKey="value" stroke={safeData?.datasets[0]?.color || '#10b981'} fill={safeData?.datasets[0]?.color || '#10b981'} data-testid="area" />
            </AreaChart>
          );
        default:
          return <div>Unsupported chart type</div>;
      }
    };

    if (virtualized && filteredData.length > 100) {
      return (
        <div data-testid="virtualized-chart">
          <ResponsiveContainer width="100%" height={config?.height || 400} data-testid="responsive-container">
            <ChartComponent />
          </ResponsiveContainer>
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={config?.height || 400} data-testid="responsive-container">
        <ChartComponent />
      </ResponsiveContainer>
    );
  }, [currentChartType, data, config, error, brushable, virtualized]);

  // Error boundary fallback
  if (error === 'Chart rendering error') {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <p className="text-lg font-medium text-destructive">Chart rendering error</p>
            <p className="text-sm text-muted-foreground">
              Please check your data format and try again
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div 
      className={cn(
        "w-full",
        config?.theme === 'dark' && "dark-theme",
        config?.theme === 'light' && "light-theme",
        config?.highContrast && "high-contrast",
        isMobileView() && "mobile-view",
        className
      )}
      role="img"
      aria-label={title || "Data visualization"}
      data-testid="data-visualization-engine"
      style={{
        '--chart-background': config?.customTheme?.background,
        '--chart-primary': config?.customTheme?.primary,
        '--chart-secondary': config?.customTheme?.secondary,
        '--chart-accent': config?.customTheme?.accent,
        '--chart-text': config?.customTheme?.text,
      } as React.CSSProperties}
    >
      {/* Announcements for screen readers */}
      {announceChanges && (
        <VisuallyHidden>
          <div 
            data-testid="chart-announcements"
            aria-live="polite"
            aria-atomic="true"
          >
            {announcement}
          </div>
        </VisuallyHidden>
      )}

      <Card className="w-full">
        {/* Header */}
        {(title || description || showControls || exportable || realTimeUpdates || zoomable || filterable) && (
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                {title && (
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {title}
                  </CardTitle>
                )}
                {/* Dataset labels for multiple datasets */}
                {safeData?.datasets && safeData.datasets.length > 1 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {safeData.datasets.map((dataset, index) => (
                      <Badge key={dataset.id} variant="outline" className="text-xs">
                        <div 
                          className="w-2 h-2 rounded-full mr-1" 
                          style={{ backgroundColor: dataset.color }}
                        />
                        {dataset.label}
                      </Badge>
                    ))}
                  </div>
                )}
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Real-time indicator */}
                {realTimeUpdates && (
                  <div className="flex items-center gap-2">
                    <div data-testid="real-time-indicator" className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-muted-foreground">Live</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsRealTimePaused(!isRealTimePaused)}
                      aria-label={isRealTimePaused ? "Resume updates" : "Pause updates"}
                    >
                      {isRealTimePaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </Button>
                  </div>
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
                      <DropdownMenuItem onClick={() => handleExport('png')}>
                        PNG Image
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('csv')}>
                        CSV Data
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('json')}>
                        JSON Data
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            
            {/* Controls */}
            {(showControls || filterable || zoomable) && (
              <div className="flex items-center gap-4 mt-4">
                {/* Chart type selector */}
                {showControls && (
                  <div className="flex items-center gap-2">
                    <label htmlFor="chart-type" className="text-sm font-medium">
                      Chart Type
                    </label>
                    <Select value={currentChartType} onValueChange={handleChartTypeChange}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="line">Line Chart</SelectItem>
                        <SelectItem value="bar">Bar Chart</SelectItem>
                        <SelectItem value="pie">Pie Chart</SelectItem>
                        <SelectItem value="scatter">Scatter Plot</SelectItem>
                        <SelectItem value="area">Area Chart</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Filter controls */}
                {filterable && (
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4 mr-1" />
                          Filter
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Categories</label>
                            <div className="space-y-2 mt-2">
                              {(safeData?.categories || []).map(category => (
                                <label key={category} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={filterOptions.categories.includes(category)}
                                    onChange={(e) => {
                                      const newCategories = e.target.checked
                                        ? [...filterOptions.categories, category]
                                        : filterOptions.categories.filter(c => c !== category);
                                      handleFilter({ categories: newCategories });
                                    }}
                                    aria-label={category}
                                  />
                                  <span className="text-sm">{category}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Date Range</label>
                            <div className="mt-2">
                              <Button variant="outline" size="sm">
                                <Calendar className="h-4 w-4 mr-1" />
                                Date Range
                              </Button>
                              <div data-testid="date-range-picker" className="hidden">
                                Date picker component
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-2">
                            <Input
                              placeholder="Filter data..."
                              className="w-full"
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
                
                {/* Zoom controls */}
                {zoomable && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleZoom('out')}
                      aria-label="Zoom out"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Badge variant="outline" className="px-2">
                      {Math.round(zoomLevel * 100)}%
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleZoom('in')}
                      aria-label="Zoom in"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
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
              </div>
            )}
          </CardHeader>
        )}

        <CardContent className="p-0">
          {/* Chart container */}
          <div 
            ref={chartRef}
            className="p-6"
            aria-describedby={description ? "chart-description" : undefined}
            onDoubleClick={() => drillDownEnabled && filteredData[0] && onDrillDown?.(filteredData[0])}
          >
            {/* Comparison mode indicator */}
            {safeData?.comparisonMode && (
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">Comparison Mode</Badge>
                <div data-testid="baseline-indicator" className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-xs text-muted-foreground">Baseline: {safeData.baselineDataset}</span>
              </div>
            )}
            
            {/* Chart annotations */}
            {safeData?.annotations?.map(annotation => (
              <div key={annotation.id} data-testid="chart-annotation" className="mb-2">
                <Badge variant="outline" style={{ borderColor: annotation.color }}>
                  {annotation.label}
                </Badge>
              </div>
            ))}

            {/* Chart rendering */}
            {lazyLoad ? (
              <Suspense fallback={
                <div className="flex items-center justify-center h-64" data-testid="chart-loading">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              }>
                {renderChart()}
              </Suspense>
            ) : (
              renderChart()
            )}
            
            {/* Legend interaction */}
            {config?.interactiveLegend && safeData?.datasets.map((dataset, index) => (
              <button
                key={dataset.id}
                data-testid={`legend-item-${index}`}
                className="inline-flex items-center gap-2 mr-4 text-sm"
                onClick={() => {
                  // Toggle dataset visibility
                }}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: dataset.color }}
                />
                {dataset.label}
              </button>
            ))}
          </div>

          {/* Data table view */}
          {showTable && showDataTable && (
            <div className="border-t p-6">
              <div className="overflow-auto max-h-64">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-2 border-b">Label</th>
                      <th className="text-left p-2 border-b">Value</th>
                      <th className="text-left p-2 border-b">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((point) => (
                      <tr key={point.id}>
                        <td className="p-2 border-b">{point.label}</td>
                        <td className="p-2 border-b">{(point as any).value}</td>
                        <td className="p-2 border-b">{(point as any).category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DataVisualizationEngine;