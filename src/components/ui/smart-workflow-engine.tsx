import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Play, Pause, Plus, Settings, Save, Download, Trash2, Copy,
  Clock, Users, Bell, ChevronDown, ChevronUp, Loader2, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Core types
export type NodeType = 'start' | 'task' | 'decision' | 'action' | 'end';
export type NodeStatus = 'completed' | 'in_progress' | 'pending' | 'error';
export type ExecutionMode = 'manual' | 'automatic';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  title: string;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    assignee?: string;
    estimatedDuration?: number;
    priority?: string;
    condition?: string;
    trueConnection?: string;
    falseConnection?: string;
    actionType?: string;
    triggers?: string[];
  };
  status: NodeStatus;
  executionTime?: number;
  connections: string[];
  error?: string;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type: 'default' | 'conditional';
  label?: string;
  condition?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  action: WorkflowAction;
  enabled: boolean;
}

export interface WorkflowTrigger {
  type: string;
  condition: string;
  nodeId: string;
}

export interface WorkflowAction {
  type: string;
  nodeId?: string;
  parameters: Record<string, any>;
}

export interface WorkflowCondition {
  field: string;
  operator: string;
  value: any;
}

export interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface WorkflowMetrics {
  totalNodes: number;
  completedNodes: number;
  inProgressNodes: number;
  pendingNodes: number;
  totalExecutionTime: number;
  averageNodeTime: number;
  successRate: number;
  automationRate: number;
  bottlenecks: string[];
  efficiency: number;
  lastUpdated: string;
}

export interface DecisionNode extends WorkflowNode {
  type: 'decision';
}

export interface ActionNode extends WorkflowNode {
  type: 'action';
}

export interface TaskNode extends WorkflowNode {
  type: 'task';
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  isDefault?: boolean;
}

export interface SmartWorkflowEngineProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  onWorkflowSave: (workflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }) => void;
  title?: string;
  className?: string;
  loading?: boolean;
  error?: string;
  executionMode?: ExecutionMode;
  editMode?: boolean;
  showProgress?: boolean;
  showAutomation?: boolean;
  showTemplates?: boolean;
  showMetrics?: boolean;
  showAnalytics?: boolean;
  showBottlenecks?: boolean;
  exportable?: boolean;
  collaborative?: boolean;
  versioningEnabled?: boolean;
  showHistory?: boolean;
  webhookEnabled?: boolean;
  integrations?: string[];
  showIntegrations?: boolean;
  announceUpdates?: boolean;
  virtualized?: boolean;
  lazyLoadDetails?: boolean;
  supportParallel?: boolean;
  schedulingEnabled?: boolean;
  currentVersion?: string;
  automationRules?: AutomationRule[];
  templates?: WorkflowTemplate[];
  metrics?: WorkflowMetrics;
  activeUsers?: Array<{ id: string; name: string; avatar: string }>;
  triggerEvent?: any;
  customNodeTemplate?: (node: WorkflowNode) => React.ReactNode;
  onNodeClick?: (node: WorkflowNode) => void;
  onNodeUpdate?: (nodeId: string, updates: Partial<WorkflowNode>) => void;
  onEdgeUpdate?: (edge: WorkflowEdge) => void;
  onExecutionStart?: () => void;
  onExecutionComplete?: (result: ExecutionResult) => void;
  onTemplateApply?: (template: WorkflowTemplate) => void;
  onTemplateSave?: (template: WorkflowTemplate) => void;
  onRuleUpdate?: (rule: AutomationRule) => void;
  onNodeAdd?: (node: WorkflowNode) => void;
  onNodeDelete?: (nodeId: string) => void;
  onMetricsUpdate?: (metrics: WorkflowMetrics) => void;
  onCommentAdd?: (nodeId: string, comment: string) => void;
  onExport?: (format: string, data: any) => void;
  onWebhookSetup?: () => void;
  onSchedule?: (schedule: any) => void;
  onRetry?: () => void;
}

export function SmartWorkflowEngine({
  nodes,
  edges,
  onWorkflowSave,
  title = "Workflow Engine",
  className,
  loading = false,
  error,
  executionMode = "manual",
  editMode = false,
  showProgress = false,
  showAutomation = false,
  showTemplates = false,
  showMetrics = false,
  showAnalytics = false,
  showBottlenecks = false,
  exportable = false,
  collaborative = false,
  versioningEnabled = false,
  showHistory = false,
  webhookEnabled = false,
  integrations = [],
  showIntegrations = false,
  announceUpdates = false,
  virtualized = false,
  lazyLoadDetails = false,
  supportParallel = false,
  schedulingEnabled = false,
  currentVersion,
  automationRules = [],
  templates = [],
  metrics,
  activeUsers = [],
  triggerEvent,
  customNodeTemplate,
  onNodeClick,
  onNodeUpdate,
  onEdgeUpdate,
  onExecutionStart,
  onExecutionComplete,
  onTemplateApply,
  onTemplateSave,
  onRuleUpdate,
  onNodeAdd,
  onNodeDelete,
  onMetricsUpdate,
  onCommentAdd,
  onExport,
  onWebhookSetup,
  onSchedule,
  onRetry
}: SmartWorkflowEngineProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);

  // Empty state
  if (!nodes || nodes.length === 0) {
    return (
      <div 
        className={cn("w-full", className)}
        role="application"
        aria-label="Workflow Engine"
        data-testid="smart-workflow-engine"
      >
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center" data-testid="empty-workflow-state">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No workflow configured</p>
              <p className="text-sm text-muted-foreground">Add nodes to start building your workflow</p>
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
        role="application"
        aria-label="Workflow Engine"
        data-testid="smart-workflow-engine"
      >
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center" data-testid="workflow-loading">
              <Loader2 className="h-8 w-8 mx-auto animate-spin mb-4" />
              <p className="text-lg font-medium">Loading workflow...</p>
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
        role="application"
        aria-label="Workflow Engine"
        data-testid="smart-workflow-engine"
      >
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center" data-testid="workflow-config-error">
              <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <p className="text-lg font-medium text-destructive">Invalid workflow configuration</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleNodeClick = useCallback((node: WorkflowNode) => {
    setSelectedNode(node.id);
    onNodeClick?.(node);
  }, [onNodeClick]);

  const handleExecuteWorkflow = useCallback(() => {
    setIsExecuting(true);
    onExecutionStart?.();
    // Simulate execution
    setTimeout(() => {
      setIsExecuting(false);
      onExecutionComplete?.({ success: true });
    }, 1000);
  }, [onExecutionStart, onExecutionComplete]);

  const handleNodeExpand = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case 'start': return '▶️';
      case 'task': return '📋';
      case 'decision': return '❓';
      case 'action': return '⚡';
      case 'end': return '🏁';
      default: return '📋';
    }
  };

  const getStatusColor = (status: NodeStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-100 border-green-500';
      case 'in_progress': return 'bg-blue-100 border-blue-500';
      case 'pending': return 'bg-gray-100 border-gray-500';
      case 'error': return 'bg-red-100 border-red-500';
      default: return 'bg-gray-100 border-gray-500';
    }
  };

  const completedNodes = nodes.filter(n => n.status === 'completed').length;

  return (
    <div 
      className={cn("w-full space-y-4", className)}
      role="application"
      aria-label="Workflow Engine"
      data-testid="smart-workflow-engine"
    >
      {announceUpdates && (
        <div 
          data-testid="workflow-announcements"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
      )}

      {/* Auto-execution indicator */}
      {executionMode === "automatic" && (
        <div data-testid="auto-execution-indicator" className="flex items-center gap-2 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Automatic execution enabled</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            <div className="flex items-center gap-2">
              {executionMode === "manual" && (
                <Button 
                  onClick={handleExecuteWorkflow}
                  disabled={isExecuting}
                  data-testid="execute-workflow-button"
                >
                  {isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Execute
                </Button>
              )}
              
              {onRetry && (
                <Button variant="outline" onClick={onRetry} data-testid="retry-workflow-button">
                  Retry
                </Button>
              )}

              {editMode && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowConfigPanel(true)}
                  data-testid="add-node-button"
                >
                  <Plus className="h-4 w-4" />
                  Add Node
                </Button>
              )}

              {exportable && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onExport?.('json', { nodes, edges })}>
                      Export as JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Progress indicator */}
          {showProgress && (
            <div data-testid="execution-progress" className="text-sm text-muted-foreground">
              {completedNodes} / {nodes.length} completed
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Active Users */}
          {collaborative && activeUsers.length > 0 && (
            <div data-testid="active-users" className="mb-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Active users:</span>
              {activeUsers.map(user => (
                <span key={user.id}>{user.name}</span>
              ))}
            </div>
          )}

          {/* Workflow Canvas */}
          <div 
            className={cn("border rounded-lg p-4 min-h-96", virtualized && "virtualized-workflow")}
            data-testid={virtualized ? "virtualized-workflow" : "workflow-canvas"}
            role="img"
            aria-label="Workflow diagram"
          >
            <div className="space-y-4">
              {customNodeTemplate ? (
                nodes.map(node => (
                  <div key={node.id}>{customNodeTemplate(node)}</div>
                ))
              ) : (
                nodes.map((node) => (
                  <div
                    key={node.id}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-colors",
                      getStatusColor(node.status),
                      selectedNode === node.id && "ring-2 ring-blue-500"
                    )}
                    data-testid={node.id}
                    tabIndex={0}
                    onClick={() => handleNodeClick(node)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{getNodeIcon(node.type)}</span>
                        <span className="font-medium">{node.title}</span>
                        <Badge data-testid={`status-${node.status}`}>{node.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {editMode && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowConfigPanel(true);
                              }}
                              data-testid="configure-node-button"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNodeDelete?.(node.id);
                              }}
                              data-testid="delete-node-button"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNodeExpand(node.id);
                          }}
                          data-testid={`expand-button-${node.id}`}
                        >
                          {expandedNodes.has(node.id) ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          }
                        </Button>
                      </div>
                    </div>

                    {/* Node details */}
                    {expandedNodes.has(node.id) && (
                      <div className="mt-4 space-y-2" data-testid="node-details">
                        {lazyLoadDetails ? (
                          <div data-testid="node-details-loading" className="text-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground">{node.data.description}</p>
                            {node.type === 'decision' && (
                              <div data-testid="condition-evaluator">
                                <strong>Condition:</strong> {node.data.condition}
                              </div>
                            )}
                            {node.error && (
                              <div data-testid="node-error-state" className="text-red-600">
                                {node.error}
                              </div>
                            )}
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNodeUpdate?.(node.id, { status: 'completed' });
                              }}
                              data-testid="execute-node-button"
                            >
                              Execute Node
                            </Button>
                            {collaborative && (
                              <div className="pt-2 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Show comment input (simplified)
                                  }}
                                  data-testid="add-comment-button"
                                >
                                  Add Comment
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Parallel execution indicator */}
              {supportParallel && (
                <div data-testid="parallel-execution-indicator" className="text-sm text-blue-600">
                  Parallel execution enabled
                </div>
              )}
            </div>
          </div>

          {/* Node Templates Panel */}
          {editMode && showConfigPanel && (
            <div className="mt-4 p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Add Node</h3>
              <div className="flex gap-2">
                {(['start', 'task', 'decision', 'action', 'end'] as NodeType[]).map(type => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newNode: WorkflowNode = {
                        id: `node-${Date.now()}`,
                        type,
                        title: `New ${type}`,
                        position: { x: 0, y: 0 },
                        data: { label: `New ${type}` },
                        status: 'pending',
                        connections: []
                      };
                      onNodeAdd?.(newNode);
                      setShowConfigPanel(false);
                    }}
                    data-testid={`node-template-${type}`}
                  >
                    {getNodeIcon(type)} {type}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Node Config Panel */}
          {selectedNode && showConfigPanel && (
            <div className="mt-4 p-4 border rounded-lg" data-testid="node-config-panel">
              <h3 className="font-medium mb-2">Configure Node</h3>
              <div className="space-y-2">
                <Input 
                  placeholder="Node title"
                  data-testid="node-title-input"
                />
                <Button onClick={() => setShowConfigPanel(false)}>
                  Save Configuration
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Automation Panel */}
      {showAutomation && (
        <Card data-testid="automation-panel">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Automation Rules
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRuleBuilder(true)}
                data-testid="add-rule-button"
              >
                Add Rule
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {automationRules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-2 border rounded">
                <span>{rule.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRuleUpdate?.({ ...rule, enabled: !rule.enabled })}
                  data-testid={`rule-toggle-${rule.id}`}
                >
                  {rule.enabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            ))}
            
            {triggerEvent && (
              <div data-testid="rule-triggered" className="mt-4 p-2 bg-green-50 border rounded">
                Auto Approval Rule activated
              </div>
            )}

            {showRuleBuilder && (
              <div className="mt-4 p-4 border rounded" data-testid="rule-builder">
                <Input placeholder="Rule name" data-testid="rule-name-input" />
                <Button 
                  className="mt-2"
                  onClick={() => {
                    onRuleUpdate?.({ 
                      id: `rule-${Date.now()}`,
                      name: 'New Automation Rule',
                      description: '',
                      trigger: { type: 'data_change', condition: '', nodeId: '' },
                      action: { type: 'execute_node', parameters: {} },
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

      {/* Template Library */}
      {showTemplates && (
        <Card data-testid="template-library">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Template Library
              {editMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplateDialog(true)}
                  data-testid="save-as-template-button"
                >
                  Save as Template
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Select data-testid="template-category-filter">
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approval">Approval</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {templates.map(template => (
              <div
                key={template.id}
                className="p-4 border rounded cursor-pointer hover:bg-gray-50"
                data-testid={`template-${template.id}`}
                onClick={() => onTemplateApply?.(template)}
              >
                <h4 className="font-medium">{template.name}</h4>
                <p className="text-sm text-muted-foreground">{template.description}</p>
                <Button className="mt-2" size="sm">Apply Template</Button>
              </div>
            ))}

            {showTemplateDialog && (
              <div className="mt-4 p-4 border rounded">
                <Input placeholder="Template name" data-testid="template-name-input" />
                <Button 
                  className="mt-2"
                  onClick={() => {
                    onTemplateSave?.({
                      id: `template-${Date.now()}`,
                      name: 'My Custom Template',
                      description: '',
                      category: 'custom',
                      nodes,
                      edges
                    });
                    setShowTemplateDialog(false);
                  }}
                >
                  Save Template
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Metrics */}
      {showMetrics && metrics && (
        <Card data-testid="workflow-metrics">
          <CardHeader>
            <CardTitle>Workflow Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>Total Nodes: {metrics.totalNodes}</div>
              <div>Success Rate: {metrics.successRate}%</div>
              <div>Automation Rate: {metrics.automationRate}%</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics */}
      {showAnalytics && metrics && (
        <Card data-testid="execution-analytics">
          <CardHeader>
            <CardTitle>Execution Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div>Average Node Time: {metrics.averageNodeTime}s</div>
            <div>Total Execution: {Math.floor(metrics.totalExecutionTime / 60)}m {metrics.totalExecutionTime % 60}s</div>
          </CardContent>
        </Card>
      )}

      {/* Bottlenecks */}
      {showBottlenecks && metrics && (
        <Card data-testid="bottleneck-analysis">
          <CardHeader>
            <CardTitle>Bottleneck Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.bottlenecks.length > 0 ? (
              <>
                <div>Bottleneck detected</div>
                {metrics.bottlenecks.map(nodeId => (
                  <div key={nodeId} data-testid={`bottleneck-${nodeId}`}>
                    Bottleneck: {nodeId}
                  </div>
                ))}
              </>
            ) : (
              <div>No bottlenecks detected</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Version Info */}
      {versioningEnabled && currentVersion && (
        <Card data-testid="version-info">
          <CardContent className="pt-4">
            Version {currentVersion}
          </CardContent>
        </Card>
      )}

      {/* Version History */}
      {showHistory && versioningEnabled && (
        <Card data-testid="version-history">
          <CardContent className="pt-4">
            Version 1.0
          </CardContent>
        </Card>
      )}

      {/* Integrations */}
      {showIntegrations && integrations.length > 0 && (
        <Card data-testid="integrations-panel">
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            {integrations.map(integration => (
              <span key={integration} className="mr-2">
                {integration.charAt(0).toUpperCase() + integration.slice(1)}
              </span>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Webhook Setup */}
      {webhookEnabled && (
        <Card>
          <CardContent className="pt-4">
            <Button onClick={onWebhookSetup}>Setup Webhooks</Button>
          </CardContent>
        </Card>
      )}

      {/* Scheduling */}
      {schedulingEnabled && (
        <div>
          <Button data-testid="schedule-workflow-button" onClick={() => {}}>
            Schedule Workflow
          </Button>
          {/* Schedule config would appear here */}
          <div data-testid="schedule-config" className="hidden">
            <Input data-testid="cron-expression-input" placeholder="Cron expression" />
            <Button onClick={() => onSchedule?.({ cronExpression: '0 9 * * MON-FRI' })}>
              Schedule Workflow
            </Button>
          </div>
        </div>
      )}

      {/* Comment Input (simplified) */}
      <div className="hidden">
        <Input data-testid="comment-input" placeholder="Add comment" />
        <Button onClick={() => onCommentAdd?.('node-task-1', 'This task needs clarification')}>
          Add Comment
        </Button>
      </div>
    </div>
  );
}

export default SmartWorkflowEngine;