import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Target,
  Lightbulb,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Insight types and severity levels
export type InsightType = 'gap' | 'opportunity' | 'risk' | 'recommendation' | 'success' | 'warning';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

// Core insight interface
export interface Insight {
  id: string;
  type: InsightType;
  severity: SeverityLevel;
  title: string;
  description: string;
  confidence: number; // 0-100%
  dataSource?: string[];
  metrics?: {
    current: number;
    target?: number;
    unit: string;
  };
  trend?: {
    direction: 'up' | 'down' | 'stable';
    change: number;
    period: string;
  };
}

// Actionable recommendation
export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  actions: Action[];
  estimatedTime?: string;
}

// Individual action within a recommendation
export interface Action {
  id: string;
  type: 'primary' | 'secondary' | 'external';
  label: string;
  description?: string;
  icon?: React.ReactNode;
  handler?: () => void;
  url?: string; // For external actions
}

// Props for the intelligence panel
export interface IntelligencePanelProps {
  title: string;
  insights: Insight[];
  recommendations: Recommendation[];
  onActionClick: (action: Action) => void;
  
  // UI behavior
  collapsible?: boolean;
  defaultExpanded?: boolean;
  severity?: SeverityLevel;
  showConfidence?: boolean;
  maxHeight?: string;
  
  // Customization
  className?: string;
  headerIcon?: React.ReactNode;
  emptyStateMessage?: string;
  
  // Analytics
  onInsightView?: (insight: Insight) => void;
  onRecommendationView?: (recommendation: Recommendation) => void;
}

// Helper function to get severity styling
const getSeverityConfig = (severity: SeverityLevel) => {
  const configs = {
    low: {
      bgClass: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800',
      titleClass: 'text-blue-800 dark:text-blue-200',
      icon: <Info className="h-4 w-4" />,
      badgeVariant: 'secondary' as const
    },
    medium: {
      bgClass: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800',
      titleClass: 'text-yellow-800 dark:text-yellow-200',
      icon: <AlertTriangle className="h-4 w-4" />,
      badgeVariant: 'default' as const
    },
    high: {
      bgClass: 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800',
      titleClass: 'text-orange-800 dark:text-orange-200',
      icon: <AlertTriangle className="h-4 w-4" />,
      badgeVariant: 'destructive' as const
    },
    critical: {
      bgClass: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800',
      titleClass: 'text-red-800 dark:text-red-200',
      icon: <XCircle className="h-4 w-4" />,
      badgeVariant: 'destructive' as const
    }
  };
  return configs[severity];
};

// Helper function to get insight type icon
const getInsightTypeIcon = (type: InsightType) => {
  const icons = {
    gap: <AlertTriangle className="h-4 w-4 text-red-600" />,
    opportunity: <TrendingUp className="h-4 w-4 text-green-600" />,
    risk: <XCircle className="h-4 w-4 text-orange-600" />,
    recommendation: <Lightbulb className="h-4 w-4 text-blue-600" />,
    success: <CheckCircle className="h-4 w-4 text-green-600" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-600" />
  };
  return icons[type];
};

// Helper function to get priority styling
const getPriorityConfig = (priority: 'low' | 'medium' | 'high') => {
  const configs = {
    low: { variant: 'secondary' as const, color: 'text-gray-600' },
    medium: { variant: 'default' as const, color: 'text-blue-600' },
    high: { variant: 'destructive' as const, color: 'text-red-600' }
  };
  return configs[priority];
};

export function IntelligencePanel({
  title,
  insights,
  recommendations,
  onActionClick,
  collapsible = true,
  defaultExpanded = true,
  severity = 'medium',
  showConfidence = true,
  maxHeight = "600px",
  className,
  headerIcon,
  emptyStateMessage = "No insights available",
  onInsightView,
  onRecommendationView
}: IntelligencePanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [activeTab, setActiveTab] = useState<'insights' | 'recommendations'>('insights');

  const severityConfig = getSeverityConfig(severity);

  // Group insights by severity for better organization
  const groupedInsights = useMemo(() => {
    const groups = {
      critical: insights.filter(i => i.severity === 'critical'),
      high: insights.filter(i => i.severity === 'high'),
      medium: insights.filter(i => i.severity === 'medium'),
      low: insights.filter(i => i.severity === 'low')
    };
    return groups;
  }, [insights]);

  // Sort recommendations by priority and impact
  const sortedRecommendations = useMemo(() => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const impactOrder = { high: 3, medium: 2, low: 1 };
    
    return [...recommendations].sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }, [recommendations]);

  const hasContent = insights.length > 0 || recommendations.length > 0;

  const handleInsightClick = (insight: Insight) => {
    onInsightView?.(insight);
  };

  const handleRecommendationClick = (recommendation: Recommendation) => {
    onRecommendationView?.(recommendation);
  };

  const handleActionClick = (action: Action, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (action.url) {
      window.open(action.url, '_blank', 'noopener,noreferrer');
    } else {
      onActionClick(action);
    }
  };

  return (
    <Card className={cn(severityConfig.bgClass, "border-2", className)}>
      <CardHeader 
        className={cn(
          "pb-3",
          collapsible && "cursor-pointer hover:bg-black/5 transition-colors"
        )}
        onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <CardTitle className={cn("flex items-center justify-between", severityConfig.titleClass)}>
          <div className="flex items-center gap-2">
            {headerIcon || severityConfig.icon}
            <span className="font-semibold">{title}</span>
            {hasContent && (
              <Badge variant={severityConfig.badgeVariant} className="ml-2">
                {insights.length + recommendations.length}
              </Badge>
            )}
          </div>
          {collapsible && (
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {!hasContent ? (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{emptyStateMessage}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tab Navigation */}
              {insights.length > 0 && recommendations.length > 0 && (
                <div className="flex gap-1 p-1 bg-muted rounded-lg">
                  <button
                    className={cn(
                      "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      activeTab === 'insights' 
                        ? "bg-background shadow-sm" 
                        : "hover:bg-background/50"
                    )}
                    onClick={() => setActiveTab('insights')}
                  >
                    Insights ({insights.length})
                  </button>
                  <button
                    className={cn(
                      "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      activeTab === 'recommendations' 
                        ? "bg-background shadow-sm" 
                        : "hover:bg-background/50"
                    )}
                    onClick={() => setActiveTab('recommendations')}
                  >
                    Actions ({recommendations.length})
                  </button>
                </div>
              )}

              {/* Content Area */}
              <div style={{ maxHeight, overflowY: 'auto' }} className="space-y-3">
                {/* Insights Tab */}
                {(activeTab === 'insights' || recommendations.length === 0) && insights.length > 0 && (
                  <div className="space-y-3">
                    {(['critical', 'high', 'medium', 'low'] as const).map(severityLevel => {
                      const severityInsights = groupedInsights[severityLevel];
                      if (severityInsights.length === 0) return null;

                      return (
                        <div key={severityLevel}>
                          {severityInsights.map(insight => (
                            <div
                              key={insight.id}
                              className="p-3 bg-background/50 rounded-lg border cursor-pointer hover:bg-background/80 transition-colors"
                              onClick={() => handleInsightClick(insight)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5">
                                  {getInsightTypeIcon(insight.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-sm">{insight.title}</h4>
                                    <Badge variant="outline" className="text-xs">
                                      {insight.type}
                                    </Badge>
                                    {showConfidence && (
                                      <Badge variant="secondary" className="text-xs">
                                        {insight.confidence}%
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {insight.description}
                                  </p>
                                  
                                  {/* Metrics Display */}
                                  {insight.metrics && (
                                    <div className="flex items-center gap-4 mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">Current:</span>
                                        <span className="text-sm font-medium">
                                          {insight.metrics.current} {insight.metrics.unit}
                                        </span>
                                      </div>
                                      {insight.metrics.target && (
                                        <>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">Target:</span>
                                            <span className="text-sm font-medium">
                                              {insight.metrics.target} {insight.metrics.unit}
                                            </span>
                                          </div>
                                          <Progress 
                                            value={(insight.metrics.current / insight.metrics.target) * 100}
                                            className="flex-1 max-w-24"
                                          />
                                        </>
                                      )}
                                    </div>
                                  )}

                                  {/* Trend Display */}
                                  {insight.trend && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <TrendingUp className={cn(
                                        "h-3 w-3",
                                        insight.trend.direction === 'up' && "text-green-600",
                                        insight.trend.direction === 'down' && "text-red-600",
                                        insight.trend.direction === 'stable' && "text-gray-600"
                                      )} />
                                      <span>
                                        {insight.trend.change > 0 ? '+' : ''}{insight.trend.change}% 
                                        over {insight.trend.period}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Recommendations Tab */}
                {(activeTab === 'recommendations' || insights.length === 0) && recommendations.length > 0 && (
                  <div className="space-y-3">
                    {sortedRecommendations.map(recommendation => {
                      const priorityConfig = getPriorityConfig(recommendation.priority);
                      
                      return (
                        <div
                          key={recommendation.id}
                          className="p-4 bg-background/50 rounded-lg border hover:bg-background/80 transition-colors"
                          onClick={() => handleRecommendationClick(recommendation)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-blue-600" />
                              <h4 className="font-medium">{recommendation.title}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={priorityConfig.variant} className="text-xs">
                                {recommendation.priority}
                              </Badge>
                              {recommendation.estimatedTime && (
                                <Badge variant="outline" className="text-xs">
                                  {recommendation.estimatedTime}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {recommendation.description}
                          </p>

                          {/* Effort and Impact Indicators */}
                          <div className="flex items-center gap-4 mb-3 text-xs">
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Effort:</span>
                              <Badge variant="outline" size="sm">{recommendation.effort}</Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Impact:</span>
                              <Badge variant="outline" size="sm">{recommendation.impact}</Badge>
                            </div>
                          </div>

                          {/* Actions */}
                          {recommendation.actions.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {recommendation.actions.map(action => (
                                <Button
                                  key={action.id}
                                  variant={action.type === 'primary' ? 'default' : 'outline'}
                                  size="sm"
                                  className="h-8"
                                  onClick={(e) => handleActionClick(action, e)}
                                >
                                  {action.icon}
                                  <span>{action.label}</span>
                                  {action.url && <ExternalLink className="h-3 w-3 ml-1" />}
                                  {action.type === 'primary' && !action.url && (
                                    <ArrowRight className="h-3 w-3 ml-1" />
                                  )}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default IntelligencePanel;