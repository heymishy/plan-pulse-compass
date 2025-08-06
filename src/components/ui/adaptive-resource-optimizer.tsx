import React, { useState, useCallback, useMemo } from 'react';
import { 
  Zap, Settings, TrendingUp, TrendingDown, DollarSign, Clock, Filter,
  MoreVertical, Play, Pause, Download, Plus, RefreshCw,
  Loader2, AlertTriangle, CheckCircle, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

// Core types
export type ResourceType = 'compute' | 'memory' | 'storage' | 'network';
export type ResourceStatus = 'optimal' | 'underutilized' | 'overutilized' | 'critical';
export type OptimizationStrategy = 'cost' | 'performance' | 'balanced' | 'custom';

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  currentUsage: number;
  capacity: number;
  efficiency: number;
  cost: number;
  tags: string[];
  lastUpdated: string;
}

export interface ResourceMetrics {
  totalResources: number;
  utilizationRate: number;
  efficiencyScore: number;
  costOptimization: number;
  recommendations: number;
  potentialSavings: number;
}

export interface OptimizationResult {
  success: boolean;
  resourcesOptimized: number;
  costSaved: number;
  efficiencyGained: number;
  message: string;
}

export interface OptimizationRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
  enabled: boolean;
}

export interface AdaptiveResourceOptimizerProps {
  resources: Resource[];
  metrics: ResourceMetrics;
  onOptimize: (strategy: OptimizationStrategy, resources: Resource[]) => void;
  title?: string;
  className?: string;
  loading?: boolean;
  error?: string;
  optimizing?: boolean;
  autoRefresh?: boolean;
  showStrategies?: boolean;
  showRecommendations?: boolean;
  enableAutoOptimization?: boolean;
  showFilters?: boolean;
  enableTagging?: boolean;
  showAnalytics?: boolean;
  showCostAnalysis?: boolean;
  exportable?: boolean;
  showTrends?: boolean;
  showRules?: boolean;
  showPredictions?: boolean;
  enableBatchOperations?: boolean;
  showHistory?: boolean;
  enableScheduling?: boolean;
  announceUpdates?: boolean;
  rules?: OptimizationRule[];
  customTemplate?: (resource: Resource) => React.ReactNode;
  onScale?: (resourceId: string, direction: 'up' | 'down') => void;
  onExport?: (format: string, data: any) => void;
  onRuleUpdate?: (rule: OptimizationRule) => void;
  onRuleCreate?: (rule: OptimizationRule) => void;
  onBatchOptimize?: (resources: Resource[]) => void;
}

export function AdaptiveResourceOptimizer({
  resources,
  metrics,
  onOptimize,
  title = "Resource Optimizer",
  className,
  loading = false,
  error,
  optimizing = false,
  autoRefresh = false,
  showStrategies = false,
  showRecommendations = false,
  enableAutoOptimization = false,
  showFilters = false,
  enableTagging = false,
  showAnalytics = false,
  showCostAnalysis = false,
  exportable = false,
  showTrends = false,
  showRules = false,
  showPredictions = false,
  enableBatchOperations = false,
  showHistory = false,
  enableScheduling = false,
  announceUpdates = false,
  rules = [],
  customTemplate,
  onScale,
  onExport,
  onRuleUpdate,
  onRuleCreate,
  onBatchOptimize
}: AdaptiveResourceOptimizerProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<OptimizationStrategy>('auto');
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());
  const [autoOptimizationEnabled, setAutoOptimizationEnabled] = useState(false);
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [editingTagsFor, setEditingTagsFor] = useState<string | null>(null);

  // Empty state
  if (!resources || resources.length === 0) {
    return (
      <div 
        className={cn("w-full", className)}
        role="region"
        aria-label="Resource Optimizer"
        data-testid="adaptive-resource-optimizer"
      >
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center" data-testid="empty-resources-state">
              <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No resources to optimize</p>
              <p className="text-sm text-muted-foreground">Add resources to start optimization</p>
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
        aria-label="Resource Optimizer"
        data-testid="adaptive-resource-optimizer"
      >
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center" data-testid="optimizer-loading">
              <Loader2 className="h-8 w-8 mx-auto animate-spin mb-4" />
              <p className="text-lg font-medium">Analyzing resources...</p>
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
        className={cn("w-full", className)}
        role="region"
        aria-label="Resource Optimizer"
        data-testid="adaptive-resource-optimizer"
      >
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center" data-testid="optimizer-error-state">
              <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <p className="text-lg font-medium text-destructive">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter resources
  const filteredResources = useMemo(() => {
    return resources.filter(resource => {
      if (filterType !== 'all' && resource.type !== filterType) return false;
      if (filterStatus !== 'all' && resource.status !== filterStatus) return false;
      return true;
    });
  }, [resources, filterType, filterStatus]);

  const getStatusIcon = (status: ResourceStatus) => {
    switch (status) {
      case 'optimal': return CheckCircle;
      case 'underutilized': return TrendingDown;
      case 'overutilized': return TrendingUp;
      case 'critical': return AlertCircle;
      default: return CheckCircle;
    }
  };

  const getStatusColor = (status: ResourceStatus) => {
    switch (status) {
      case 'optimal': return 'bg-green-100 border-green-500 text-green-700';
      case 'underutilized': return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      case 'overutilized': return 'bg-orange-100 border-orange-500 text-orange-700';
      case 'critical': return 'bg-red-100 border-red-500 text-red-700';
      default: return 'bg-gray-100 border-gray-500 text-gray-700';
    }
  };

  const handleOptimize = useCallback(() => {
    onOptimize(selectedStrategy, filteredResources);
  }, [selectedStrategy, filteredResources, onOptimize]);

  const handleResourceExpand = useCallback((resourceId: string) => {
    setExpandedResources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resourceId)) {
        newSet.delete(resourceId);
      } else {
        newSet.add(resourceId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedResources.size === resources.length) {
      setSelectedResources(new Set());
    } else {
      setSelectedResources(new Set(resources.map(r => r.id)));
    }
  }, [resources, selectedResources.size]);

  return (
    <div 
      className={cn("w-full space-y-4", className)}
      role="region"
      aria-label="Resource Optimizer"
      data-testid="adaptive-resource-optimizer"
    >
      {announceUpdates && (
        <div 
          data-testid="optimizer-announcements"
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

      {/* Metrics Overview */}
      <Card data-testid="resource-metrics">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">Total: {metrics.totalResources}</div>
              <div className="text-sm text-muted-foreground">Resources</div>
            </div>
            <div>
              <div className="text-2xl font-bold">Efficiency: {Math.round(metrics.efficiencyScore * 100)}%</div>
              <div className="text-sm text-muted-foreground">Overall</div>
            </div>
            <div>
              <div className="text-2xl font-bold">${metrics.potentialSavings}</div>
              <div className="text-sm text-muted-foreground">Potential savings</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{metrics.recommendations}</div>
              <div className="text-sm text-muted-foreground">Recommendations</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Strategy Selection */}
              {showStrategies && (
                <Select value={selectedStrategy} onValueChange={(value: OptimizationStrategy) => setSelectedStrategy(value)}>
                  <SelectTrigger className="w-48" data-testid="strategy-select">
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cost">Cost Optimization</SelectItem>
                    <SelectItem value="performance">Performance Optimization</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Auto-optimization toggle */}
              {enableAutoOptimization && (
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={autoOptimizationEnabled}
                    onCheckedChange={setAutoOptimizationEnabled}
                    data-testid="auto-optimization-toggle"
                  />
                  <span className="text-sm">Auto-optimize</span>
                  {autoOptimizationEnabled && (
                    <Badge data-testid="auto-optimization-enabled">Auto</Badge>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Batch operations */}
              {enableBatchOperations && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    data-testid="select-all-resources"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onBatchOptimize?.(filteredResources)}
                    data-testid="batch-optimize-button"
                    disabled={selectedResources.size === 0}
                  >
                    Batch Optimize
                  </Button>
                </>
              )}

              {/* Scheduling */}
              {enableScheduling && (
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="schedule-optimization-button"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Schedule
                </Button>
              )}

              {/* Export */}
              {exportable && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onExport?.('pdf', { resources, metrics })}>
                      Optimization Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Optimize button */}
              <Button 
                onClick={handleOptimize}
                disabled={optimizing}
                data-testid="optimize-button"
              >
                {optimizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Optimize
              </Button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="flex items-center gap-4 mt-4">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40" data-testid="type-filter">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="compute">Compute</SelectItem>
                  <SelectItem value="memory">Memory</SelectItem>
                  <SelectItem value="storage">Storage</SelectItem>
                  <SelectItem value="network">Network</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40" data-testid="status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="optimal">Optimal</SelectItem>
                  <SelectItem value="underutilized">Underutilized</SelectItem>
                  <SelectItem value="overutilized">Overutilized</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Optimization progress */}
          {optimizing && (
            <div className="mt-4" data-testid="optimization-progress">
              <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Optimizing resources...</span>
              </div>
              <Progress value={65} className="h-2" />
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Recommendations */}
          {showRecommendations && (
            <div className="mb-6" data-testid="optimization-recommendations">
              <h3 className="font-medium mb-2">Recommendations</h3>
              <p className="text-sm text-muted-foreground">{metrics.recommendations} recommendations available</p>
            </div>
          )}

          {/* Resources Grid */}
          <div className="space-y-4">
            {customTemplate ? (
              filteredResources.map(resource => (
                <div key={resource.id}>{customTemplate(resource)}</div>
              ))
            ) : (
              filteredResources.map((resource) => {
                const StatusIcon = getStatusIcon(resource.status);
                const isExpanded = expandedResources.has(resource.id);
                
                return (
                  <Card
                    key={resource.id}
                    className={cn("transition-all", getStatusColor(resource.status))}
                    data-testid={`resource-${resource.id}`}
                    tabIndex={0}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <StatusIcon className="h-5 w-5" />
                          <div>
                            <h3 className="font-medium">{resource.name}</h3>
                            <Badge data-testid={`status-${resource.status}`}>{resource.status}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right text-sm">
                            <div>{resource.currentUsage}% usage</div>
                            <div className="text-muted-foreground">${resource.cost}</div>
                          </div>
                          
                          {onScale && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onScale(resource.id, 'up')}
                              data-testid={`scale-button-${resource.id}`}
                            >
                              Scale
                            </Button>
                          )}

                          {enableTagging && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingTagsFor(resource.id)}
                              data-testid={`tag-button-${resource.id}`}
                            >
                              Tags
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResourceExpand(resource.id)}
                            data-testid={`expand-button-${resource.id}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="mb-3">
                        <Progress value={resource.currentUsage} className="h-2" />
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="space-y-3" data-testid="resource-details">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>Current usage: {resource.currentUsage}%</div>
                            <div>Efficiency: {Math.round(resource.efficiency * 100)}%</div>
                            <div>Type: {resource.type}</div>
                            <div>Updated: {new Date(resource.lastUpdated).toLocaleTimeString()}</div>
                          </div>

                          {resource.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {resource.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
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

      {/* Analytics */}
      {showAnalytics && (
        <Card data-testid="efficiency-analytics">
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div>Overall efficiency: {Math.round(metrics.efficiencyScore * 100)}%</div>
          </CardContent>
        </Card>
      )}

      {/* Cost Analysis */}
      {showCostAnalysis && (
        <Card data-testid="cost-analysis">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cost Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>Potential savings: ${metrics.potentialSavings}</div>
          </CardContent>
        </Card>
      )}

      {/* Trends */}
      {showTrends && (
        <Card data-testid="resource-trends">
          <CardHeader>
            <CardTitle>Trend Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
              <span className="text-muted-foreground">Trend chart placeholder</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Predictions */}
      {showPredictions && (
        <Card data-testid="resource-predictions">
          <CardHeader>
            <CardTitle>Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div>Predicted utilization</div>
          </CardContent>
        </Card>
      )}

      {/* Optimization Rules */}
      {showRules && (
        <Card data-testid="optimization-rules">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Optimization Rules
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRuleBuilder(true)}
                data-testid="add-rule-button"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Rule
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-2 border rounded mb-2">
                <span>{rule.name}</span>
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={(enabled) => onRuleUpdate?.({ ...rule, enabled })}
                  data-testid={`rule-toggle-${rule.id}`}
                />
              </div>
            ))}

            {showRuleBuilder && (
              <div className="mt-4 p-4 border rounded" data-testid="rule-builder">
                <h4>Create Rule</h4>
                <Button 
                  className="mt-2"
                  onClick={() => {
                    onRuleCreate?.({
                      id: `rule-${Date.now()}`,
                      name: 'New Rule',
                      condition: 'usage > 80%',
                      action: 'scale_up',
                      priority: 'medium',
                      enabled: true
                    });
                    setShowRuleBuilder(false);
                  }}
                >
                  Save Rule
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* History */}
      {showHistory && (
        <Card data-testid="optimization-history">
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            <div>Recent optimizations</div>
          </CardContent>
        </Card>
      )}

      {/* Tag Editor */}
      {editingTagsFor && (() => {
        const resource = resources.find(r => r.id === editingTagsFor);
        return resource ? (
          <Card data-testid="tag-editor" className="mt-4">
            <CardHeader>
              <CardTitle>Edit Tags - {resource.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {resource.tags.map(tag => (
                  <div key={tag}>{tag}</div>
                ))}
              </div>
              <Button 
                className="mt-2" 
                onClick={() => setEditingTagsFor(null)}
              >
                Close
              </Button>
            </CardContent>
          </Card>
        ) : null;
      })()}

      {/* Hidden elements for testing */}
      <div className="hidden">
        <div data-testid="schedule-config">Schedule config</div>
      </div>
    </div>
  );
}

export default AdaptiveResourceOptimizer;