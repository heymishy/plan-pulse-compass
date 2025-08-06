import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SmartWorkflowEngine, { 
  SmartWorkflowEngineProps,
  WorkflowNode,
  WorkflowEdge,
  NodeType,
  NodeStatus,
  ExecutionMode,
  AutomationRule,
  WorkflowTrigger,
  WorkflowCondition,
  ExecutionResult,
  WorkflowMetrics,
  DecisionNode,
  ActionNode,
  TaskNode,
  WorkflowTemplate
} from '../smart-workflow-engine';

// Mock data interfaces
interface TestWorkflowData {
  id: string;
  name: string;
  description: string;
  data?: Record<string, any>;
}

// Mock test data
const mockNodes: WorkflowNode[] = [
  {
    id: 'node-start',
    type: 'start',
    title: 'Start Process',
    position: { x: 100, y: 100 },
    data: {
      label: 'Process Initiation',
      description: 'Begin workflow execution'
    },
    status: 'completed',
    executionTime: 0,
    connections: ['node-task-1']
  },
  {
    id: 'node-task-1', 
    type: 'task',
    title: 'Data Collection',
    position: { x: 300, y: 100 },
    data: {
      label: 'Collect Requirements',
      description: 'Gather project requirements and constraints',
      assignee: 'system',
      estimatedDuration: 300,
      priority: 'high'
    },
    status: 'in_progress',
    executionTime: 150,
    connections: ['node-decision-1']
  },
  {
    id: 'node-decision-1',
    type: 'decision', 
    title: 'Requirements Review',
    position: { x: 500, y: 100 },
    data: {
      label: 'Validate Requirements',
      description: 'Check if requirements are complete and valid',
      condition: 'requirements.completeness > 0.8',
      trueConnection: 'node-action-1',
      falseConnection: 'node-task-2'
    },
    status: 'pending',
    connections: ['node-action-1', 'node-task-2']
  },
  {
    id: 'node-action-1',
    type: 'action',
    title: 'Auto Approve',
    position: { x: 700, y: 50 },
    data: {
      label: 'Automatic Approval',
      description: 'Automatically approve requirements that meet criteria',
      actionType: 'automation',
      triggers: ['requirements_validated']
    },
    status: 'pending',
    connections: ['node-end']
  },
  {
    id: 'node-task-2',
    type: 'task',
    title: 'Manual Review',
    position: { x: 700, y: 150 },
    data: {
      label: 'Human Review Required',
      description: 'Manual review needed for incomplete requirements',
      assignee: 'reviewer',
      estimatedDuration: 600
    },
    status: 'pending',
    connections: ['node-end']
  },
  {
    id: 'node-end',
    type: 'end',
    title: 'Complete',
    position: { x: 900, y: 100 },
    data: {
      label: 'Process Complete',
      description: 'Workflow execution finished'
    },
    status: 'pending',
    connections: []
  }
];

const mockEdges: WorkflowEdge[] = [
  {
    id: 'edge-1',
    source: 'node-start',
    target: 'node-task-1',
    type: 'default',
    label: 'Initialize'
  },
  {
    id: 'edge-2', 
    source: 'node-task-1',
    target: 'node-decision-1',
    type: 'default',
    label: 'Requirements Ready'
  },
  {
    id: 'edge-3',
    source: 'node-decision-1', 
    target: 'node-action-1',
    type: 'conditional',
    label: 'Valid',
    condition: 'requirements.completeness > 0.8'
  },
  {
    id: 'edge-4',
    source: 'node-decision-1',
    target: 'node-task-2', 
    type: 'conditional',
    label: 'Invalid',
    condition: 'requirements.completeness <= 0.8'
  },
  {
    id: 'edge-5',
    source: 'node-action-1',
    target: 'node-end',
    type: 'default',
    label: 'Approved'
  },
  {
    id: 'edge-6',
    source: 'node-task-2',
    target: 'node-end',
    type: 'default', 
    label: 'Reviewed'
  }
];

const mockAutomationRules: AutomationRule[] = [
  {
    id: 'rule-1',
    name: 'Auto Approval Rule',
    description: 'Automatically approve when requirements completeness > 80%',
    trigger: {
      type: 'data_change',
      condition: 'requirements.completeness > 0.8',
      nodeId: 'node-decision-1'
    },
    action: {
      type: 'execute_node',
      nodeId: 'node-action-1',
      parameters: { autoApproval: true }
    },
    enabled: true
  },
  {
    id: 'rule-2',
    name: 'Escalation Rule',
    description: 'Escalate to manager if task takes longer than expected',
    trigger: {
      type: 'time_exceeded',
      condition: 'executionTime > estimatedDuration * 1.5',
      nodeId: 'node-task-1'
    },
    action: {
      type: 'send_notification',
      parameters: { 
        recipient: 'manager@company.com',
        message: 'Task requires attention - duration exceeded'
      }
    },
    enabled: true
  }
];

const mockWorkflowMetrics: WorkflowMetrics = {
  totalNodes: 6,
  completedNodes: 1,
  inProgressNodes: 1,
  pendingNodes: 4,
  totalExecutionTime: 150,
  averageNodeTime: 25,
  successRate: 85,
  automationRate: 60,
  bottlenecks: ['node-decision-1'],
  efficiency: 0.75,
  lastUpdated: '2024-01-15T10:30:00Z'
};

const mockWorkflowTemplates: WorkflowTemplate[] = [
  {
    id: 'template-approval',
    name: 'Approval Process',
    description: 'Standard approval workflow with conditional routing',
    category: 'approval',
    nodes: mockNodes.slice(0, 4),
    edges: mockEdges.slice(0, 3),
    isDefault: true
  },
  {
    id: 'template-review',
    name: 'Review Process', 
    description: 'Document review workflow with collaboration features',
    category: 'review',
    nodes: mockNodes.slice(0, 3),
    edges: mockEdges.slice(0, 2),
    isDefault: false
  }
];

// Mock callbacks
const mockOnNodeClick = vi.fn();
const mockOnNodeUpdate = vi.fn();
const mockOnEdgeUpdate = vi.fn();
const mockOnExecutionStart = vi.fn();
const mockOnExecutionComplete = vi.fn();
const mockOnWorkflowSave = vi.fn();
const mockOnTemplateApply = vi.fn();
const mockOnRuleUpdate = vi.fn();
const mockOnNodeAdd = vi.fn();
const mockOnNodeDelete = vi.fn();
const mockOnMetricsUpdate = vi.fn();

const defaultProps: SmartWorkflowEngineProps = {
  nodes: mockNodes,
  edges: mockEdges,
  onWorkflowSave: mockOnWorkflowSave
};

describe('SmartWorkflowEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default configuration', () => {
      render(<SmartWorkflowEngine {...defaultProps} />);
      
      expect(screen.getByTestId('smart-workflow-engine')).toBeInTheDocument();
      expect(screen.getByText('Workflow Engine')).toBeInTheDocument();
      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
    });

    it('should render custom title when provided', () => {
      render(
        <SmartWorkflowEngine 
          {...defaultProps} 
          title="Custom Process Engine"
        />
      );
      
      expect(screen.getByText('Custom Process Engine')).toBeInTheDocument();
    });

    it('should render empty state when no nodes provided', () => {
      render(
        <SmartWorkflowEngine 
          nodes={[]}
          edges={[]}
          onWorkflowSave={mockOnWorkflowSave}
        />
      );
      
      expect(screen.getByTestId('empty-workflow-state')).toBeInTheDocument();
      expect(screen.getByText('No workflow configured')).toBeInTheDocument();
    });

    it('should render all node types correctly', () => {
      render(<SmartWorkflowEngine {...defaultProps} />);
      
      expect(screen.getByTestId('node-start')).toBeInTheDocument();
      expect(screen.getByTestId('node-task-1')).toBeInTheDocument();
      expect(screen.getByTestId('node-decision-1')).toBeInTheDocument();
      expect(screen.getByTestId('node-action-1')).toBeInTheDocument();
      expect(screen.getByTestId('node-end')).toBeInTheDocument();
    });

    it('should render node statuses correctly', () => {
      render(<SmartWorkflowEngine {...defaultProps} />);
      
      expect(screen.getByTestId('status-completed')).toBeInTheDocument();
      expect(screen.getByTestId('status-in_progress')).toBeInTheDocument();
      expect(screen.getAllByTestId('status-pending')).toHaveLength(4);
    });

    it('should render loading state', () => {
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          loading={true}
        />
      );
      
      expect(screen.getByTestId('workflow-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading workflow...')).toBeInTheDocument();
    });
  });

  describe('Workflow Execution', () => {
    it('should handle workflow execution start', async () => {
      const user = userEvent.setup();
      
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          executionMode="manual"
          onExecutionStart={mockOnExecutionStart}
        />
      );

      const executeButton = screen.getByTestId('execute-workflow-button');
      await user.click(executeButton);

      expect(mockOnExecutionStart).toHaveBeenCalled();
    });

    it('should handle automatic execution mode', () => {
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          executionMode="automatic"
          onExecutionStart={mockOnExecutionStart}
        />
      );

      expect(screen.getByTestId('auto-execution-indicator')).toBeInTheDocument();
    });

    it('should handle node execution', async () => {
      const user = userEvent.setup();
      
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          onNodeUpdate={mockOnNodeUpdate}
        />
      );

      const taskNode = screen.getByTestId('node-task-1');
      await user.click(taskNode);
      
      const executeNodeButton = screen.getByTestId('execute-node-button');
      await user.click(executeNodeButton);

      expect(mockOnNodeUpdate).toHaveBeenCalledWith(
        'node-task-1',
        expect.objectContaining({ status: 'completed' })
      );
    });

    it('should handle conditional execution', async () => {
      const user = userEvent.setup();
      
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          onNodeUpdate={mockOnNodeUpdate}
        />
      );

      const decisionNode = screen.getByTestId('node-decision-1');
      await user.click(decisionNode);

      expect(screen.getByTestId('condition-evaluator')).toBeInTheDocument();
      expect(screen.getByText('requirements.completeness > 0.8')).toBeInTheDocument();
    });

    it('should show execution progress', () => {
      const progressNodes = mockNodes.map(node => ({ 
        ...node, 
        status: node.id === 'node-start' ? 'completed' as NodeStatus : 'pending' as NodeStatus 
      }));
      
      render(
        <SmartWorkflowEngine 
          nodes={progressNodes}
          edges={mockEdges}
          onWorkflowSave={mockOnWorkflowSave}
          showProgress={true}
        />
      );

      expect(screen.getByTestId('execution-progress')).toBeInTheDocument();
      expect(screen.getByText('1 / 6 completed')).toBeInTheDocument();
    });
  });

  describe('Node Management', () => {
    it('should handle node addition', async () => {
      const user = userEvent.setup();
      
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          editMode={true}
          onNodeAdd={mockOnNodeAdd}
        />
      );

      const addNodeButton = screen.getByTestId('add-node-button');
      await user.click(addNodeButton);

      const taskNodeTemplate = screen.getByTestId('node-template-task');
      await user.click(taskNodeTemplate);

      expect(mockOnNodeAdd).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'task' })
      );
    });

    it('should handle node deletion', async () => {
      const user = userEvent.setup();
      
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          editMode={true}
          onNodeDelete={mockOnNodeDelete}
        />
      );

      const taskNode = screen.getByTestId('node-task-1');
      await user.click(taskNode);
      
      const deleteButton = screen.getByTestId('delete-node-button');
      await user.click(deleteButton);

      expect(mockOnNodeDelete).toHaveBeenCalledWith('node-task-1');
    });

    it('should handle node configuration', async () => {
      const user = userEvent.setup();
      
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          editMode={true}
          onNodeUpdate={mockOnNodeUpdate}
        />
      );

      const taskNode = screen.getByTestId('node-task-1');
      await user.click(taskNode);
      
      const configButton = screen.getByTestId('configure-node-button');
      await user.click(configButton);

      expect(screen.getByTestId('node-config-panel')).toBeInTheDocument();
      
      const titleInput = screen.getByTestId('node-title-input');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Task Title');

      const saveButton = screen.getByText('Save Configuration');
      await user.click(saveButton);

      expect(mockOnNodeUpdate).toHaveBeenCalledWith(
        'node-task-1',
        expect.objectContaining({ title: 'Updated Task Title' })
      );
    });

    it('should handle node connections', async () => {
      const user = userEvent.setup();
      
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          editMode={true}
          onEdgeUpdate={mockOnEdgeUpdate}
        />
      );

      const sourceNode = screen.getByTestId('node-task-1');
      const targetNode = screen.getByTestId('node-decision-1');
      
      // Simulate drag and drop connection
      fireEvent.dragStart(sourceNode);
      fireEvent.dragOver(targetNode);
      fireEvent.drop(targetNode);

      expect(mockOnEdgeUpdate).toHaveBeenCalled();
    });
  });

  describe('Automation Rules', () => {
    it('should display automation rules', () => {
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          automationRules={mockAutomationRules}
          showAutomation={true}
        />
      );

      expect(screen.getByTestId('automation-panel')).toBeInTheDocument();
      expect(screen.getByText('Auto Approval Rule')).toBeInTheDocument();
      expect(screen.getByText('Escalation Rule')).toBeInTheDocument();
    });

    it('should handle rule creation', async () => {
      const user = userEvent.setup();
      
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          showAutomation={true}
          onRuleUpdate={mockOnRuleUpdate}
        />
      );

      const addRuleButton = screen.getByTestId('add-rule-button');
      await user.click(addRuleButton);

      expect(screen.getByTestId('rule-builder')).toBeInTheDocument();
      
      const ruleName = screen.getByTestId('rule-name-input');
      await user.type(ruleName, 'New Automation Rule');

      const saveRuleButton = screen.getByText('Save Rule');
      await user.click(saveRuleButton);

      expect(mockOnRuleUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Automation Rule' })
      );
    });

    it('should handle rule execution', () => {
      const triggerEvent = {
        type: 'data_change',
        nodeId: 'node-decision-1',
        data: { requirements: { completeness: 0.9 } }
      };

      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          automationRules={mockAutomationRules}
          triggerEvent={triggerEvent}
        />
      );

      expect(screen.getByTestId('rule-triggered')).toBeInTheDocument();
      expect(screen.getByText('Auto Approval Rule activated')).toBeInTheDocument();
    });

    it('should toggle rule status', async () => {
      const user = userEvent.setup();
      
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          automationRules={mockAutomationRules}
          showAutomation={true}
          onRuleUpdate={mockOnRuleUpdate}
        />
      );

      const ruleToggle = screen.getByTestId('rule-toggle-rule-1');
      await user.click(ruleToggle);

      expect(mockOnRuleUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ 
          id: 'rule-1',
          enabled: false 
        })
      );
    });
  });

  describe('Templates and Presets', () => {
    it('should display workflow templates', () => {
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          templates={mockWorkflowTemplates}
          showTemplates={true}
        />
      );

      expect(screen.getByTestId('template-library')).toBeInTheDocument();
      expect(screen.getByText('Approval Process')).toBeInTheDocument();
      expect(screen.getByText('Review Process')).toBeInTheDocument();
    });

    it('should apply template', async () => {
      const user = userEvent.setup();
      
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          templates={mockWorkflowTemplates}
          showTemplates={true}
          onTemplateApply={mockOnTemplateApply}
        />
      );

      const template = screen.getByTestId('template-approval');
      await user.click(template);
      
      const applyButton = screen.getByText('Apply Template');
      await user.click(applyButton);

      expect(mockOnTemplateApply).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'template-approval' })
      );
    });

    it('should save workflow as template', async () => {
      const user = userEvent.setup();
      const mockOnTemplateSave = vi.fn();
      
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          editMode={true}
          onTemplateSave={mockOnTemplateSave}
        />
      );

      const saveTemplateButton = screen.getByTestId('save-as-template-button');
      await user.click(saveTemplateButton);

      const templateName = screen.getByTestId('template-name-input');
      await user.type(templateName, 'My Custom Template');

      const confirmSave = screen.getByText('Save Template');
      await user.click(confirmSave);

      expect(mockOnTemplateSave).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'My Custom Template' })
      );
    });

    it('should filter templates by category', async () => {
      const user = userEvent.setup();
      
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          templates={mockWorkflowTemplates}
          showTemplates={true}
        />
      );

      const categoryFilter = screen.getByTestId('template-category-filter');
      await user.click(categoryFilter);
      
      const approvalCategory = screen.getByText('Approval');
      await user.click(approvalCategory);

      expect(screen.getByText('Approval Process')).toBeInTheDocument();
      expect(screen.queryByText('Review Process')).not.toBeInTheDocument();
    });
  });

  describe('Metrics and Analytics', () => {
    it('should display workflow metrics', () => {
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          metrics={mockWorkflowMetrics}
          showMetrics={true}
        />
      );

      expect(screen.getByTestId('workflow-metrics')).toBeInTheDocument();
      expect(screen.getByText('Total Nodes: 6')).toBeInTheDocument();
      expect(screen.getByText('Success Rate: 85%')).toBeInTheDocument();
      expect(screen.getByText('Automation Rate: 60%')).toBeInTheDocument();
    });

    it('should show execution time analytics', () => {
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          metrics={mockWorkflowMetrics}
          showAnalytics={true}
        />
      );

      expect(screen.getByTestId('execution-analytics')).toBeInTheDocument();
      expect(screen.getByText('Average Node Time: 25s')).toBeInTheDocument();
      expect(screen.getByText('Total Execution: 2m 30s')).toBeInTheDocument();
    });

    it('should identify bottlenecks', () => {
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          metrics={mockWorkflowMetrics}
          showBottlenecks={true}
        />
      );

      expect(screen.getByTestId('bottleneck-analysis')).toBeInTheDocument();
      expect(screen.getByText('Bottleneck detected')).toBeInTheDocument();
      expect(screen.getByTestId('bottleneck-node-decision-1')).toBeInTheDocument();
    });

    it('should update metrics in real-time', () => {
      const { rerender } = render(
        <SmartWorkflowEngine 
          {...defaultProps}
          metrics={mockWorkflowMetrics}
          showMetrics={true}
        />
      );

      const updatedMetrics = {
        ...mockWorkflowMetrics,
        completedNodes: 2,
        successRate: 90
      };

      rerender(
        <SmartWorkflowEngine 
          {...defaultProps}
          metrics={updatedMetrics}
          showMetrics={true}
        />
      );

      expect(screen.getByText('Success Rate: 90%')).toBeInTheDocument();
    });
  });

  describe('Collaboration Features', () => {
    it('should show active users', () => {
      const activeUsers = [
        { id: '1', name: 'Alice', avatar: '/avatars/alice.jpg' },
        { id: '2', name: 'Bob', avatar: '/avatars/bob.jpg' }
      ];

      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          collaborative={true}
          activeUsers={activeUsers}
        />
      );

      expect(screen.getByTestId('active-users')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('should handle comments and annotations', async () => {
      const user = userEvent.setup();
      const mockOnCommentAdd = vi.fn();
      
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          collaborative={true}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      const taskNode = screen.getByTestId('node-task-1');
      await user.click(taskNode);
      
      const addCommentButton = screen.getByTestId('add-comment-button');
      await user.click(addCommentButton);

      const commentText = screen.getByTestId('comment-input');
      await user.type(commentText, 'This task needs clarification');

      const submitComment = screen.getByText('Add Comment');
      await user.click(submitComment);

      expect(mockOnCommentAdd).toHaveBeenCalledWith(
        'node-task-1',
        'This task needs clarification'
      );
    });

    it('should show version history', () => {
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          versioningEnabled={true}
          showHistory={true}
        />
      );

      expect(screen.getByTestId('version-history')).toBeInTheDocument();
      expect(screen.getByText('Version 1.0')).toBeInTheDocument();
    });
  });

  describe('Export and Integration', () => {
    it('should export workflow', async () => {
      const user = userEvent.setup();
      const mockOnExport = vi.fn();
      
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          exportable={true}
          onExport={mockOnExport}
        />
      );

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);

      const jsonOption = screen.getByText('Export as JSON');
      await user.click(jsonOption);

      expect(mockOnExport).toHaveBeenCalledWith('json', expect.any(Object));
    });

    it('should integrate with external systems', () => {
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          integrations={['slack', 'email', 'jira']}
          showIntegrations={true}
        />
      );

      expect(screen.getByTestId('integrations-panel')).toBeInTheDocument();
      expect(screen.getByText('Slack')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('JIRA')).toBeInTheDocument();
    });

    it('should handle webhook notifications', async () => {
      const user = userEvent.setup();
      const mockOnWebhookSetup = vi.fn();
      
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          webhookEnabled={true}
          onWebhookSetup={mockOnWebhookSetup}
        />
      );

      const webhookButton = screen.getByText('Setup Webhooks');
      await user.click(webhookButton);

      expect(mockOnWebhookSetup).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<SmartWorkflowEngine {...defaultProps} />);
      
      const engine = screen.getByTestId('smart-workflow-engine');
      expect(engine).toHaveAttribute('role', 'application');
      expect(engine).toHaveAttribute('aria-label', 'Workflow Engine');
      
      const canvas = screen.getByTestId('workflow-canvas');
      expect(canvas).toHaveAttribute('role', 'img');
      expect(canvas).toHaveAttribute('aria-label', 'Workflow diagram');
    });

    it('should support keyboard navigation', async () => {
      render(<SmartWorkflowEngine {...defaultProps} />);

      const firstNode = screen.getByTestId('node-start');
      firstNode.focus();
      
      expect(document.activeElement).toBe(firstNode);

      // Tab navigation should work between nodes
      fireEvent.keyDown(firstNode, { key: 'Tab' });
    });

    it('should announce workflow changes', () => {
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          announceUpdates={true}
        />
      );

      const announcements = screen.getByTestId('workflow-announcements');
      expect(announcements).toHaveAttribute('aria-live', 'polite');
      expect(announcements).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid workflow configuration', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <SmartWorkflowEngine 
          nodes={null as any}
          edges={[]}
          onWorkflowSave={mockOnWorkflowSave}
        />
      );

      expect(screen.getByTestId('workflow-config-error')).toBeInTheDocument();
      expect(screen.getByText('Invalid workflow configuration')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should handle execution errors gracefully', () => {
      const errorNodes = [
        { ...mockNodes[0], error: 'Execution failed: Invalid data format' }
      ];

      render(
        <SmartWorkflowEngine 
          nodes={errorNodes}
          edges={mockEdges}
          onWorkflowSave={mockOnWorkflowSave}
        />
      );

      expect(screen.getByTestId('node-error-state')).toBeInTheDocument();
      expect(screen.getByText('Execution failed: Invalid data format')).toBeInTheDocument();
    });

    it('should recover from connection failures', async () => {
      const user = userEvent.setup();
      const mockOnRetry = vi.fn();
      
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          onRetry={mockOnRetry}
        />
      );

      const retryButton = screen.getByTestId('retry-workflow-button');
      await user.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalled();
    });
  });

  describe('Performance Optimization', () => {
    it('should virtualize large workflows', () => {
      const largeNodeSet = Array.from({ length: 100 }, (_, i) => ({
        ...mockNodes[0],
        id: `node-${i}`,
        title: `Node ${i}`
      }));

      render(
        <SmartWorkflowEngine 
          nodes={largeNodeSet}
          edges={[]}
          onWorkflowSave={mockOnWorkflowSave}
          virtualized={true}
        />
      );

      expect(screen.getByTestId('virtualized-workflow')).toBeInTheDocument();
    });

    it('should lazy load node details', async () => {
      const user = userEvent.setup();
      
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          lazyLoadDetails={true}
        />
      );

      const taskNode = screen.getByTestId('node-task-1');
      await user.click(taskNode);

      expect(screen.getByTestId('node-details-loading')).toBeInTheDocument();
    });
  });

  describe('Advanced Features', () => {
    it('should support custom node components', () => {
      const customNodeTemplate = (node: WorkflowNode) => (
        <div data-testid="custom-node-template">
          <h3>{node.title}</h3>
          <p>Custom node implementation</p>
        </div>
      );

      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          customNodeTemplate={customNodeTemplate}
        />
      );

      expect(screen.getAllByTestId('custom-node-template')).toHaveLength(6);
    });

    it('should support parallel execution paths', () => {
      const parallelNodes = [
        ...mockNodes,
        {
          id: 'node-parallel-1',
          type: 'task' as NodeType,
          title: 'Parallel Task A',
          position: { x: 500, y: 200 },
          data: { label: 'Parallel execution path A' },
          status: 'pending' as NodeStatus,
          connections: ['node-end']
        },
        {
          id: 'node-parallel-2', 
          type: 'task' as NodeType,
          title: 'Parallel Task B',
          position: { x: 500, y: 250 },
          data: { label: 'Parallel execution path B' },
          status: 'pending' as NodeStatus,
          connections: ['node-end']
        }
      ];

      render(
        <SmartWorkflowEngine 
          nodes={parallelNodes}
          edges={mockEdges}
          onWorkflowSave={mockOnWorkflowSave}
          supportParallel={true}
        />
      );

      expect(screen.getByTestId('parallel-execution-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('node-parallel-1')).toBeInTheDocument();
      expect(screen.getByTestId('node-parallel-2')).toBeInTheDocument();
    });

    it('should handle workflow scheduling', async () => {
      const user = userEvent.setup();
      const mockOnSchedule = vi.fn();
      
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          schedulingEnabled={true}
          onSchedule={mockOnSchedule}
        />
      );

      const scheduleButton = screen.getByTestId('schedule-workflow-button');
      await user.click(scheduleButton);

      expect(screen.getByTestId('schedule-config')).toBeInTheDocument();
      
      const cronInput = screen.getByTestId('cron-expression-input');
      await user.type(cronInput, '0 9 * * MON-FRI');

      const confirmSchedule = screen.getByText('Schedule Workflow');
      await user.click(confirmSchedule);

      expect(mockOnSchedule).toHaveBeenCalledWith(
        expect.objectContaining({ 
          cronExpression: '0 9 * * MON-FRI' 
        })
      );
    });

    it('should support workflow versioning', () => {
      render(
        <SmartWorkflowEngine 
          {...defaultProps}
          versioningEnabled={true}
          currentVersion="2.1.0"
        />
      );

      expect(screen.getByTestId('version-info')).toBeInTheDocument();
      expect(screen.getByText('Version 2.1.0')).toBeInTheDocument();
    });
  });
});