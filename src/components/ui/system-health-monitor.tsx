import React, { useState, useCallback, useMemo } from 'react';
import { 
  Activity, AlertTriangle, CheckCircle, Clock, Settings, 
  RefreshCw, Filter, TrendingUp, TrendingDown, Minus,
  MoreVertical, Download, Loader2, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Core types
export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';
export type MetricCategory = 'performance' | 'storage' | 'network' | 'security';
export type TrendDirection = 'increasing' | 'decreasing' | 'stable';

export interface HealthMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: HealthStatus;
  category: MetricCategory;
  threshold: {
    warning: number;
    critical: number;
  };
  trend: TrendDirection;
  lastUpdated: string;
}

export interface SystemAlert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  category: MetricCategory;
  timestamp: string;
  acknowledged: boolean;
  source: string;
  actions: string[];
}

export interface SystemHealthMonitorProps {
  metrics: HealthMetric[];
  alerts: SystemAlert[];
  onAlertAcknowledge: (alertId: string) => void;
  onAlertAction: (alertId: string, action: string) => void;
  onMetricClick?: (metric: HealthMetric) => void;
  onRefresh?: () => void;
  onThresholdUpdate?: (metricId: string, thresholds: { warning: number; critical: number }) => void;
  onExport?: (format: string, data: any) => void;
  title?: string;
  className?: string;
  loading?: boolean;
  error?: string;
  autoRefresh?: boolean;
  showAlerts?: boolean;
  showTrends?: boolean;
  showFilters?: boolean;
  showSorting?: boolean;
  showSummary?: boolean;
  showUptime?: boolean;
  showChart?: boolean;
  showHistory?: boolean;
  announceUpdates?: boolean;
  exportable?: boolean;
  groupByCategory?: boolean;
  enableThresholdConfig?: boolean;
  customMetricTemplate?: (metric: HealthMetric) => React.ReactNode;
}

export function SystemHealthMonitor({
  metrics,
  alerts,
  onAlertAcknowledge,
  onAlertAction,
  onMetricClick,
  onRefresh,
  onThresholdUpdate,
  onExport,
  title = "System Health",
  className,
  loading = false,
  error,
  autoRefresh = false,
  showAlerts = false,
  showTrends = false,
  showFilters = false,
  showSorting = false,
  showSummary = false,
  showUptime = false,
  showChart = false,
  showHistory = false,
  announceUpdates = false,
  exportable = false,
  groupByCategory = false,
  enableThresholdConfig = false,
  customMetricTemplate
}: SystemHealthMonitorProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [alertSeverityFilter, setAlertSeverityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [expandedMetrics, setExpandedMetrics] = useState<Set<string>>(new Set());
  const [showThresholdConfig, setShowThresholdConfig] = useState(false);

  // All hooks must be called before early returns
  const filteredMetrics = useMemo(() => {
    if (!metrics || !metrics.length) return [];
    return metrics.filter(metric => {
      if (categoryFilter !== 'all' && metric.category !== categoryFilter) return false;
      return true;
    });
  }, [metrics, categoryFilter]);

  const sortedMetrics = useMemo(() => {
    if (!filteredMetrics.length) return [];
    const sorted = [...filteredMetrics];
    if (sortBy === 'status') {
      const statusOrder = { critical: 3, warning: 2, healthy: 1, unknown: 0 };
      return sorted.sort((a, b) => (statusOrder[b.status] || 0) - (statusOrder[a.status] || 0));
    } else if (sortBy === 'value') {
      return sorted.sort((a, b) => b.value - a.value);
    } else {
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [filteredMetrics, sortBy]);

  const filteredAlerts = useMemo(() => {
    if (!alerts || !alerts.length) return [];
    return alerts.filter(alert => {
      if (alertSeverityFilter !== 'all' && alert.severity !== alertSeverityFilter) return false;
      return true;
    });
  }, [alerts, alertSeverityFilter]);

  const sortedAlerts = useMemo(() => {
    if (!filteredAlerts.length) return [];
    const sorted = [...filteredAlerts];
    return sorted.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [filteredAlerts]);

  const systemStatus = useMemo(() => {
    if (!metrics || !metrics.length) return 'unknown';
    
    const criticalCount = metrics.filter(m => m.status === 'critical').length;
    const warningCount = metrics.filter(m => m.status === 'warning').length;
    
    if (criticalCount > 0) return 'critical';
    if (warningCount > 0) return 'warning';
    return 'healthy';
  }, [metrics]);

  const handleHealthAction = useCallback((action: string, data?: any) => {
    if (onHealthAction) {
      onHealthAction(action, data);
    }
  }, [onHealthAction]);

  // Error state
  if (error || !metrics) {
    return (
      <div 
        className={cn("w-full", className)}
        role="region"
        aria-label="System Health Monitor"
        data-testid="system-health-monitor"
      >
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center" data-testid="health-monitor-error">
              <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <p className="text-lg font-medium text-destructive">
                {error || 'Failed to load health data'}
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
        className={cn("w-full", className)}
        role="region"
        aria-label="System Health Monitor"
        data-testid="system-health-monitor"
      >
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center" data-testid="health-monitor-loading">
              <Loader2 className="h-8 w-8 mx-auto animate-spin mb-4" />
              <p className="text-lg font-medium">Loading system health...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter metrics
  const filteredMetrics = useMemo(() => {
    return metrics.filter(metric => {
      if (categoryFilter !== 'all' && metric.category !== categoryFilter) return false;
      return true;
    });
  }, [metrics, categoryFilter]);

  // Sort metrics
  const sortedMetrics = useMemo(() => {
    const sorted = [...filteredMetrics];
    switch (sortBy) {
      case 'status':
        const statusOrder = { critical: 3, warning: 2, healthy: 1, unknown: 0 };
        return sorted.sort((a, b) => (statusOrder[b.status] || 0) - (statusOrder[a.status] || 0));
      case 'value':
        return sorted.sort((a, b) => b.value - a.value);
      case 'name':
      default:
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [filteredMetrics, sortBy]);

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (alertSeverityFilter !== 'all' && alert.severity !== alertSeverityFilter) return false;
      return true;
    });
  }, [alerts, alertSeverityFilter]);

  // Calculate overall health status
  const overallHealth = useMemo(() => {
    if (metrics.some(m => m.status === 'critical')) return 'Critical';
    if (metrics.some(m => m.status === 'warning')) return 'Warning';
    if (metrics.some(m => m.status === 'unknown')) return 'Unknown';
    return 'Healthy';
  }, [metrics]);

  // Group metrics by category
  const groupedMetrics = useMemo(() => {
    if (!groupByCategory) {
      return { 'all': sortedMetrics };
    }

    const groups: Record<string, HealthMetric[]> = {};
    sortedMetrics.forEach(metric => {
      if (!groups[metric.category]) {
        groups[metric.category] = [];
      }
      groups[metric.category].push(metric);
    });
    
    return groups;
  }, [sortedMetrics, groupByCategory]);

  const getStatusIcon = (status: HealthStatus) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'critical': return AlertCircle;
      default: return Activity;
    }
  };

  const getStatusColor = (status: HealthStatus) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: TrendDirection) => {
    switch (trend) {
      case 'increasing': return TrendingUp;
      case 'decreasing': return TrendingDown;
      default: return Minus;
    }
  };

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

  return (
    <div 
      className={cn("w-full space-y-4", className)}
      role="region"
      aria-label="System Health Monitor"
      data-testid="system-health-monitor"
    >
      {announceUpdates && (
        <div 
          data-testid="health-announcements"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
      )}

      {/* Auto-refresh indicator */}
      {autoRefresh && (
        <div data-testid="auto-refresh-indicator" className="flex items-center gap-2 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Auto-refresh enabled</span>
        </div>
      )}

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {title}
              <Badge 
                className={getStatusColor(overallHealth.toLowerCase() as HealthStatus)}
                data-testid="overall-health-status"
              >
                {overallHealth}
              </Badge>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onRefresh}
                  data-testid="refresh-button"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}

              {enableThresholdConfig && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowThresholdConfig(true)}
                  data-testid="configure-thresholds"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}

              {exportable && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onExport?.('pdf', { metrics, alerts })}>
                      Health Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Filters and Sorting */}
          {(showFilters || showSorting) && (
            <div className="flex items-center gap-4 mt-4">
              {showFilters && (
                <>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-40" data-testid="category-filter">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="storage">Storage</SelectItem>
                      <SelectItem value="network">Network</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                    </SelectContent>
                  </Select>

                  {showAlerts && (
                    <Select value={alertSeverityFilter} onValueChange={setAlertSeverityFilter}>
                      <SelectTrigger className="w-40" data-testid="alert-severity-filter">
                        <SelectValue placeholder="Alert Severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Alerts</SelectItem>
                        <SelectItem value="critical">Critical Only</SelectItem>
                        <SelectItem value="warning">Warning Only</SelectItem>
                        <SelectItem value="info">Info Only</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </>
              )}

              {showSorting && (
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-36" data-testid="sort-select">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">By Name</SelectItem>
                    <SelectItem value="status">By Status</SelectItem>
                    <SelectItem value="value">By Value</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Summary */}
          {showSummary && (
            <div className="mb-6" data-testid="performance-summary">
              <h3 className="font-medium mb-2">Summary</h3>
              <p className="text-sm text-muted-foreground">{metrics.length} metrics monitored</p>
            </div>
          )}

          {/* Uptime */}
          {showUptime && (
            <div className="mb-6" data-testid="system-uptime">
              <h3 className="font-medium mb-2">System Uptime</h3>
              <p className="text-sm text-muted-foreground">99.9% (24h)</p>
            </div>
          )}

          {/* Chart */}
          {showChart && (
            <div className="mb-6" data-testid="utilization-chart">
              <h3 className="font-medium mb-2">Resource Utilization</h3>
              <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
                <span className="text-muted-foreground">Chart placeholder</span>
              </div>
            </div>
          )}

          {/* Metrics */}
          <div className="space-y-4">
            {groupByCategory ? (
              Object.entries(groupedMetrics).map(([category, categoryMetrics]) => (
                <div key={category} data-testid={`category-${category}`}>
                  {category !== 'all' && (
                    <h3 className="font-medium mb-2 capitalize">{category} ({categoryMetrics.length})</h3>
                  )}
                  <div className="space-y-2">
                    {categoryMetrics.map((metric) => (
                      <MetricCard
                        key={metric.id}
                        metric={metric}
                        onMetricClick={onMetricClick}
                        expanded={expandedMetrics.has(metric.id)}
                        onExpand={handleMetricExpand}
                        showTrends={showTrends}
                        customTemplate={customMetricTemplate}
                        getStatusIcon={getStatusIcon}
                        getStatusColor={getStatusColor}
                        getTrendIcon={getTrendIcon}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              sortedMetrics.map((metric) => (
                <MetricCard
                  key={metric.id}
                  metric={metric}
                  onMetricClick={onMetricClick}
                  expanded={expandedMetrics.has(metric.id)}
                  onExpand={handleMetricExpand}
                  showTrends={showTrends}
                  customTemplate={customMetricTemplate}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                  getTrendIcon={getTrendIcon}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Alerts */}
      {showAlerts && (
        <Card data-testid="system-alerts">
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredAlerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={cn(
                    "transition-all",
                    alert.severity === 'critical' && 'border-red-200 bg-red-50',
                    alert.severity === 'warning' && 'border-yellow-200 bg-yellow-50'
                  )}
                  data-testid={`alert-${alert.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Badge 
                            variant="outline"
                            data-testid={`alert-${alert.severity}`}
                          >
                            {alert.severity}
                          </Badge>
                          <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAlertAcknowledge(alert.id)}
                        data-testid={`acknowledge-${alert.id}`}
                        disabled={alert.acknowledged}
                      >
                        {alert.acknowledged ? 'Acknowledged' : 'Acknowledge'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {showHistory && (
        <Card data-testid="metric-history">
          <CardHeader>
            <CardTitle>Historical Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground">
              Historical metrics placeholder
            </div>
          </CardContent>
        </Card>
      )}

      {/* Threshold Config */}
      {showThresholdConfig && (
        <div data-testid="threshold-config" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Configure Thresholds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>Threshold configuration interface</p>
                <Button onClick={() => setShowThresholdConfig(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// MetricCard component
interface MetricCardProps {
  metric: HealthMetric;
  onMetricClick?: (metric: HealthMetric) => void;
  expanded: boolean;
  onExpand: (metricId: string) => void;
  showTrends: boolean;
  customTemplate?: (metric: HealthMetric) => React.ReactNode;
  getStatusIcon: (status: HealthStatus) => React.ComponentType;
  getStatusColor: (status: HealthStatus) => string;
  getTrendIcon: (trend: TrendDirection) => React.ComponentType;
}

function MetricCard({
  metric,
  onMetricClick,
  expanded,
  onExpand,
  showTrends,
  customTemplate,
  getStatusIcon,
  getStatusColor,
  getTrendIcon
}: MetricCardProps) {
  if (customTemplate) {
    return <div key={metric.id}>{customTemplate(metric)}</div>;
  }

  const StatusIcon = getStatusIcon(metric.status);
  const TrendIcon = getTrendIcon(metric.trend);

  return (
    <Card
      className={cn(
        "transition-all cursor-pointer hover:shadow-md",
        getStatusColor(metric.status)
      )}
      data-testid={`metric-${metric.id}`}
      tabIndex={0}
      onClick={() => onMetricClick?.(metric)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon className="h-5 w-5" />
            <div>
              <h3 className="font-medium">{metric.name}</h3>
              <Badge data-testid={`status-${metric.status}`}>
                {metric.status}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-2xl font-bold">
                {metric.value}{metric.unit}
              </div>
              {showTrends && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <TrendIcon 
                    className="h-3 w-3" 
                    data-testid={`trend-${metric.trend}`}
                  />
                  {metric.trend}
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onExpand(metric.id);
              }}
              data-testid={`expand-metric-${metric.id}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-3">
          <Progress value={metric.value} className="h-2" />
        </div>

        {expanded && (
          <div className="mt-4 space-y-2" data-testid="metric-details">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Warning: {metric.threshold.warning}%</div>
              <div>Critical: {metric.threshold.critical}%</div>
              <div>Category: {metric.category}</div>
              <div>Updated: {new Date(metric.lastUpdated).toLocaleTimeString()}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SystemHealthMonitor;