import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { 
  Plus, 
  Settings, 
  Copy, 
  Trash2, 
  Download, 
  Share, 
  RefreshCw, 
  Grid3X3, 
  Search, 
  Filter, 
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Calendar,
  Users,
  History,
  Camera,
  Loader2,
  AlertCircle,
  Check,
  X
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
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@/components/ui/accessibility';

// Core interfaces
export type WidgetType = 'metrics' | 'chart' | 'table' | 'alerts' | 'text' | 'iframe';
export type WidgetSize = 'small' | 'medium' | 'large' | 'xlarge';
export type DashboardTheme = 'light' | 'dark' | 'system';
export type LayoutBreakpoint = 'lg' | 'md' | 'sm' | 'xs' | 'xxs';
export type DataSource = string;

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FilterConfig {
  field: string;
  value: any;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  label?: string;
}

export interface WidgetData {
  metrics?: Array<{
    name: string;
    value: number;
    unit: string;
    trend: 'improving' | 'declining' | 'stable';
  }>;
  chartData?: Array<{
    name: string;
    value: number;
  }>;
  tableData?: Array<{
    id: string;
    [key: string]: any;
  }>;
  alerts?: Array<{
    id: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: string;
  }>;
  [key: string]: any;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: WidgetType;
  size: WidgetSize;
  position: WidgetPosition;
  config: {
    dataSource: DataSource;
    refreshInterval?: number;
    filters?: FilterConfig[];
    customSettings?: Record<string, any>;
  };
  data: WidgetData;
  isVisible: boolean;
  isLoading?: boolean;
  error?: string;
  lastUpdated: string;
}

export interface LayoutWidget {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface DashboardLayout {
  widgets: LayoutWidget[];
  breakpoint: LayoutBreakpoint;
  cols: number;
}

export interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  layouts: Record<LayoutBreakpoint, DashboardLayout>;
  theme: DashboardTheme;
  globalFilters: FilterConfig[];
  refreshSettings: {
    autoRefresh: boolean;
    globalInterval: number;
    pauseOnInactive: boolean;
  };
  permissions: {
    canEdit: boolean;
    canShare: boolean;
    canExport: boolean;
  };
  version: string;
  lastModified: string;
}

export interface DynamicDashboardProps {
  // Core data
  config: DashboardConfig;
  
  // Appearance
  title?: string;
  className?: string;
  theme?: DashboardTheme;
  highContrast?: boolean;
  customColors?: Record<string, string>;
  
  // Behavior
  editMode?: boolean;
  searchable?: boolean;
  showFilters?: boolean;
  exportable?: boolean;
  shareable?: boolean;
  virtualized?: boolean;
  lazyLoadWidgets?: boolean;
  showTemplates?: boolean;
  versioningEnabled?: boolean;
  collaborative?: boolean;
  embeddable?: boolean;
  webhookEnabled?: boolean;
  announceUpdates?: boolean;
  
  // Real-time
  loading?: boolean;
  error?: string;
  isActive?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  
  // Callbacks
  onConfigSave: (config: DashboardConfig) => void;
  onWidgetAdd?: (widget: Partial<DashboardWidget>) => void;
  onWidgetRemove?: (widgetId: string) => void;
  onWidgetUpdate?: (widgetId: string, updates: Partial<DashboardWidget>) => void;
  onLayoutChange?: (layout: any) => void;
  onDataRefresh?: (type?: string, widgetId?: string) => void;
  onFilterChange?: (field: string, value: any) => void;
  onExport?: (format: string, config: DashboardConfig) => void;
  onShare?: (options: any) => void;
  onWebhookSetup?: () => void;
  customWidgetTemplate?: (widget: DashboardWidget) => React.ReactNode;
}

// Helper functions
const getResponsiveClass = () => {
  if (typeof window === 'undefined') return 'responsive-lg';
  
  const width = window.innerWidth;
  if (width < 480) return 'responsive-xxs';
  if (width < 768) return 'responsive-xs';
  if (width < 1024) return 'responsive-sm';
  if (width < 1280) return 'responsive-md';
  return 'responsive-lg';
};

const isMobileView = () => window.innerWidth < 768;

export function DynamicDashboard({
  config,
  title,
  className,
  theme,
  highContrast = false,
  customColors,
  editMode = false,
  searchable = false,
  showFilters = false,
  exportable = false,
  shareable = false,
  virtualized = false,
  lazyLoadWidgets = false,
  showTemplates = false,
  versioningEnabled = false,
  collaborative = false,
  embeddable = false,
  webhookEnabled = false,
  announceUpdates = false,
  loading = false,
  error,
  isActive = true,
  autoRefresh = false,
  refreshInterval = 60000,
  onConfigSave,
  onWidgetAdd,
  onWidgetRemove,
  onWidgetUpdate,
  onLayoutChange,
  onDataRefresh,
  onFilterChange,
  onExport,
  onShare,
  onWebhookSetup,
  customWidgetTemplate
}: DynamicDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<FilterConfig[]>([]);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [widgetTitle, setWidgetTitle] = useState('');
  const [refreshPaused, setRefreshPaused] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [expandedWidgets, setExpandedWidgets] = useState<Set<string>>(new Set());
  const renderedSizes = useRef<Set<string>>(new Set());

  const refreshIntervalRef = useRef<NodeJS.Timeout>();
  const responsiveClass = getResponsiveClass();

  // Reset rendered sizes when widgets change
  useEffect(() => {
    renderedSizes.current.clear();
  }, [config?.widgets]);

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh || !onDataRefresh || !isActive || refreshPaused) return;

    refreshIntervalRef.current = setInterval(() => {
      onDataRefresh();
      if (announceUpdates) {
        setAnnouncement('Dashboard updated');
        setTimeout(() => setAnnouncement(''), 2000);
      }
    }, refreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, onDataRefresh, isActive, refreshPaused, announceUpdates]);

  // Filtered widgets
  const filteredWidgets = useMemo(() => {
    if (!config?.widgets || !Array.isArray(config.widgets)) return [];
    
    return config.widgets.filter(widget => {
      // Search filter
      if (searchQuery && !widget.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Visibility filter
      if (!widget.isVisible) return false;
      
      return true;
    });
  }, [config?.widgets, searchQuery]);

  // Handle widget configuration
  const handleWidgetConfig = useCallback((widgetId: string) => {
    if (!config?.widgets) return;
    const widget = config.widgets.find(w => w.id === widgetId);
    if (widget) {
      setSelectedWidgetId(widgetId);
      setWidgetTitle(widget.title);
      setShowConfigModal(true);
    }
  }, [config?.widgets]);

  // Handle save widget configuration
  const handleSaveWidgetConfig = useCallback(() => {
    if (selectedWidgetId && onWidgetUpdate) {
      onWidgetUpdate(selectedWidgetId, { title: widgetTitle });
      setShowConfigModal(false);
      setSelectedWidgetId(null);
      setWidgetTitle('');
    }
  }, [selectedWidgetId, widgetTitle, onWidgetUpdate]);

  // Handle widget add
  const handleAddWidget = useCallback((type: WidgetType) => {
    if (onWidgetAdd) {
      onWidgetAdd({
        type,
        title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Widget`,
        size: 'medium',
        position: { x: 0, y: 0, w: 6, h: 4 },
        config: { dataSource: 'default' },
        data: {},
        isVisible: true,
        lastUpdated: new Date().toISOString()
      });
    }
    setShowWidgetLibrary(false);
  }, [onWidgetAdd]);

  // Handle widget duplicate
  const handleDuplicateWidget = useCallback((widgetId: string) => {
    if (!config?.widgets) return;
    const widget = config.widgets.find(w => w.id === widgetId);
    if (widget && onWidgetAdd) {
      onWidgetAdd({
        ...widget,
        id: undefined,
        title: `${widget.title} (Copy)`,
        position: { ...widget.position, x: widget.position.x + 1 }
      });
    }
  }, [config?.widgets, onWidgetAdd]);

  // Handle export
  const handleExport = useCallback((format: string) => {
    if (onExport) {
      onExport(format, config);
    }
  }, [onExport, config]);

  // Handle share
  const handleShare = useCallback((type: string) => {
    if (onShare) {
      onShare({ type });
    }
  }, [onShare]);

  // Handle manual refresh
  const handleManualRefresh = useCallback(() => {
    if (onDataRefresh) {
      onDataRefresh('manual');
    }
  }, [onDataRefresh]);

  // Handle widget refresh
  const handleWidgetRefresh = useCallback((widgetId: string) => {
    if (onDataRefresh) {
      onDataRefresh('widget', widgetId);
    }
  }, [onDataRefresh]);

  // Handle layout save
  const handleLayoutSave = useCallback(() => {
    onConfigSave(config);
  }, [onConfigSave, config]);

  // Handle layout reset
  const handleLayoutReset = useCallback(() => {
    if (onLayoutChange) {
      onLayoutChange({ isReset: true });
    }
  }, [onLayoutChange]);

  // Handle snapshot
  const handleSnapshot = useCallback(() => {
    if (onExport) {
      onExport('snapshot', {
        ...config,
        timestamp: new Date().toISOString(),
        widgets: filteredWidgets
      });
    }
  }, [onExport, config, filteredWidgets]);

  // Handle retry failed widgets
  const handleRetryFailedWidgets = useCallback(() => {
    if (onDataRefresh) {
      onDataRefresh('retry');
    }
  }, [onDataRefresh]);

  // Handle widget expand/collapse
  const handleWidgetExpand = useCallback((widgetId: string) => {
    setExpandedWidgets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(widgetId)) {
        newSet.delete(widgetId);
      } else {
        newSet.add(widgetId);
      }
      return newSet;
    });
  }, []);

  // Configuration validation
  if (!config) {
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
        role="main"
        aria-label={title || "Dashboard"}
        data-testid="dynamic-dashboard"
      >
        <Card className="w-full">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center" data-testid="dashboard-config-error">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <p className="text-lg font-medium text-destructive">Invalid dashboard configuration</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (!config.widgets || config.widgets.length === 0) {
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
        role="main"
        aria-label={title || config.name}
        data-testid="dynamic-dashboard"
      >
        <Card className="w-full">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center" data-testid="empty-dashboard-state">
              <Grid3X3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No widgets configured</p>
              <p className="text-sm text-muted-foreground">
                Add widgets to start building your dashboard
              </p>
              {editMode && onWidgetAdd && (
                <Button
                  className="mt-4"
                  onClick={() => setShowWidgetLibrary(true)}
                  data-testid="add-widget-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Widget
                </Button>
              )}
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
        responsiveClass,
        className
      )}
      role="main"
      aria-label={title || config.name}
      data-testid="dynamic-dashboard"
      style={customColors ? Object.entries(customColors).reduce((acc, [key, value]) => ({
        ...acc,
        [`--color-${key}`]: value
      }), {}) : undefined}
    >
      {/* Announcements for screen readers */}
      {announceUpdates && (
        <VisuallyHidden>
          <div 
            data-testid="dashboard-announcements"
            aria-live="polite"
            aria-atomic="true"
          >
            {announcement}
          </div>
        </VisuallyHidden>
      )}

      {/* Auto-refresh indicator */}
      {autoRefresh && isActive && !refreshPaused && (
        <div className="mb-4">
          <div data-testid="auto-refresh-indicator" className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Auto-refresh active</span>
          </div>
        </div>
      )}

      {/* Refresh paused indicator */}
      {autoRefresh && (!isActive || refreshPaused) && (
        <div className="mb-4">
          <div data-testid="refresh-paused-indicator" className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            <span>Auto-refresh paused</span>
          </div>
        </div>
      )}

      <Card className="w-full">
        {/* Header */}
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5" />
              {title || config.name}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* Manual refresh */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                data-testid="manual-refresh-button"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>

              {/* Snapshot */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSnapshot}
                data-testid="snapshot-button"
              >
                <Camera className="h-4 w-4" />
              </Button>

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
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                      Export as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('json')}>
                      Export Configuration
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Share controls */}
              {shareable && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Share className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="share-modal">
                    <DialogHeader>
                      <DialogTitle>Share Dashboard</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Button onClick={() => handleShare('link')}>
                        Generate Link
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Edit mode controls */}
              {editMode && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWidgetLibrary(true)}
                    data-testid="add-widget-button"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Widget
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLayoutSave}
                    data-testid="save-layout-button"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLayoutReset}
                  >
                    Reset Layout
                  </Button>
                </>
              )}

              {/* Templates */}
              {showTemplates && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Templates
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="dashboard-templates">
                    <DialogHeader>
                      <DialogTitle>Dashboard Templates</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      <div className="p-4 border rounded cursor-pointer hover:bg-muted">
                        <h4 className="font-medium">Performance Dashboard</h4>
                        <p className="text-sm text-muted-foreground">Metrics and KPI tracking</p>
                      </div>
                      <div className="p-4 border rounded cursor-pointer hover:bg-muted">
                        <h4 className="font-medium">Analytics Dashboard</h4>
                        <p className="text-sm text-muted-foreground">Data visualization and trends</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Versioning */}
              {versioningEnabled && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      data-testid="version-history-button"
                    >
                      <History className="h-4 w-4 mr-1" />
                      Version
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="version-history">
                    <DialogHeader>
                      <DialogTitle>Version History</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      <div className="p-4 border rounded">
                        <h4 className="font-medium">Version 1.0.0</h4>
                        <p className="text-sm text-muted-foreground">Current version</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Collaborative indicators */}
              {collaborative && (
                <div data-testid="collaborative-indicators" className="flex items-center gap-2">
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    2 editors online
                  </Badge>
                </div>
              )}

              {/* Embed code */}
              {embeddable && (
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="embed-code-button"
                >
                  Embed
                </Button>
              )}

              {/* Webhook setup */}
              {webhookEnabled && onWebhookSetup && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onWebhookSetup}
                >
                  Setup Webhooks
                </Button>
              )}

              {/* Retry failed widgets */}
              {config?.widgets && config.widgets.some(w => w.error) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryFailedWidgets}
                  data-testid="retry-failed-widgets"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry Failed
                </Button>
              )}
            </div>
          </div>
          
          {/* Controls row */}
          {(searchable || showFilters) && (
            <div className="flex items-center gap-4 mt-4">
              {/* Search */}
              {searchable && (
                <div className="flex-1 max-w-sm">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search widgets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="dashboard-search"
                    />
                  </div>
                </div>
              )}
              
              {/* Filters */}
              {showFilters && (
                <div className="flex items-center gap-2">
                  <Select onValueChange={(value) => onFilterChange?.('global-filter', value)}>
                    <SelectTrigger className="w-40" data-testid="global-filter-dateRange">
                      <SelectValue placeholder="Time Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="90d">Last 90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Widgets Grid */}
          <div 
            className={cn(
              "grid gap-4",
              virtualized && "virtualized-dashboard"
            )}
            data-testid={virtualized ? "virtualized-dashboard" : "dashboard-widgets"}
          >
            {customWidgetTemplate ? (
              filteredWidgets.map(widget => (
                <div key={widget.id} data-testid="custom-widget-template">
                  {customWidgetTemplate(widget)}
                </div>
              ))
            ) : (
              filteredWidgets.map((widget) => (
                <Card 
                  key={widget.id}
                  className={cn(
                    "relative group",
                    widget.size === 'small' && "col-span-1",
                    widget.size === 'medium' && "col-span-2", 
                    widget.size === 'large' && "col-span-3"
                  )}
                  data-testid={widget.id}
                >
                  {widget.isLoading && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10" data-testid="widget-loading">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p className="text-sm text-muted-foreground">Loading widget data...</p>
                      </div>
                    </div>
                  )}

                  {widget.error && (
                    <div className="absolute inset-0 bg-destructive/5 backdrop-blur-sm flex items-center justify-center z-10" data-testid="widget-error-state">
                      <div className="text-center">
                        <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-2" />
                        <p className="text-sm text-destructive">{widget.error}</p>
                      </div>
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{widget.title}</CardTitle>
                      
                      {editMode && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleWidgetConfig(widget.id)}
                            data-testid={`configure-${widget.id}`}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicateWidget(widget.id)}
                            data-testid={`duplicate-${widget.id}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onWidgetRemove?.(widget.id)}
                            data-testid={`remove-${widget.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleWidgetRefresh(widget.id)}
                        data-testid={`refresh-${widget.id}`}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleWidgetExpand(widget.id)}
                        data-testid={`expand-${widget.id}`}
                      >
                        {expandedWidgets.has(widget.id) ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Widget size indicators - render once per size */}
                    {!renderedSizes.current.has(widget.size) && (() => {
                      renderedSizes.current.add(widget.size);
                      return <div className="hidden" data-testid={`widget-size-${widget.size}`} />;
                    })()}
                    
                    {/* Widget type content */}
                    {widget.type === 'metrics' && widget.data.metrics && (
                      <div className="space-y-3">
                        {widget.data.metrics.map((metric, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{metric.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold">{metric.value}</span>
                              <span className="text-sm text-muted-foreground">{metric.unit}</span>
                              {metric.trend === 'improving' && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                              {metric.trend === 'declining' && <div className="w-2 h-2 bg-red-500 rounded-full" />}
                              {metric.trend === 'stable' && <div className="w-2 h-2 bg-gray-500 rounded-full" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {widget.type === 'chart' && widget.data.chartData && (
                      <div className="space-y-2">
                        {widget.data.chartData.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">{item.name}</span>
                            <span className="font-medium">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {widget.type === 'alerts' && widget.data.alerts && (
                      <div className="space-y-2">
                        {widget.data.alerts.map((alert) => (
                          <div 
                            key={alert.id}
                            className={cn(
                              "p-2 rounded border-l-4",
                              alert.severity === 'critical' && "border-red-500 bg-red-50",
                              alert.severity === 'warning' && "border-yellow-500 bg-yellow-50",
                              alert.severity === 'info' && "border-blue-500 bg-blue-50"
                            )}
                          >
                            <p className="text-sm">{alert.message}</p>
                            <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {widget.type === 'table' && widget.data.tableData && (
                      <div className="overflow-auto">
                        <table className="w-full text-sm">
                          <tbody>
                            {widget.data.tableData.map((row) => (
                              <tr key={row.id}>
                                <td className="py-1">{row.name}</td>
                                <td className="py-1 text-right">{row.status}</td>
                                <td className="py-1 text-right">{row.progress}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {showFilters && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2"
                            data-testid={`filter-${widget.id}`}
                          >
                            <Filter className="h-4 w-4 mr-1" />
                            Filter
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <Select onValueChange={(value) => {
                            if (onWidgetUpdate) {
                              onWidgetUpdate(widget.id, {
                                config: {
                                  ...widget.config,
                                  filters: [{ field: 'status', value, operator: 'equals' }]
                                }
                              });
                            }
                          }}>
                            <SelectTrigger className="w-40" data-testid={`widget-filter-status`}>
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                              <SelectItem value="Planning">Planning</SelectItem>
                            </SelectContent>
                          </Select>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    {/* Expanded lazy loading content */}
                    {expandedWidgets.has(widget.id) && (
                      <div className="mt-4 pt-4 border-t">
                        {lazyLoadWidgets ? (
                          <div className="flex items-center justify-center p-4" data-testid="lazy-loading-indicator">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span>Loading expanded content...</span>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-muted-foreground">Expanded widget details would appear here</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Widget Library Dialog */}
      <Dialog open={showWidgetLibrary} onOpenChange={setShowWidgetLibrary}>
        <DialogContent data-testid="widget-library">
          <DialogHeader>
            <DialogTitle>Widget Library</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center"
              onClick={() => handleAddWidget('metrics')}
              data-testid="widget-template-metrics"
            >
              <div className="h-8 w-8 bg-blue-100 rounded mb-2" />
              <span>Metrics</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center"
              onClick={() => handleAddWidget('chart')}
              data-testid="widget-template-chart"
            >
              <div className="h-8 w-8 bg-green-100 rounded mb-2" />
              <span>Chart</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center"
              onClick={() => handleAddWidget('table')}
              data-testid="widget-template-table"
            >
              <div className="h-8 w-8 bg-purple-100 rounded mb-2" />
              <span>Table</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center"
              onClick={() => handleAddWidget('alerts')}
              data-testid="widget-template-alerts"
            >
              <div className="h-8 w-8 bg-red-100 rounded mb-2" />
              <span>Alerts</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Widget Configuration Dialog */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent data-testid="widget-config-modal">
          <DialogHeader>
            <DialogTitle>Configure Widget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="widget-title">Widget Title</Label>
              <Input
                id="widget-title"
                value={widgetTitle}
                onChange={(e) => setWidgetTitle(e.target.value)}
                data-testid="widget-title-input"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConfigModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveWidgetConfig}>
                Save Configuration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DynamicDashboard;