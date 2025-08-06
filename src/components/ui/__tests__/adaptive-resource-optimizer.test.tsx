import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdaptiveResourceOptimizer, {
  AdaptiveResourceOptimizerProps,
  Resource,
  ResourceType,
  ResourceStatus,
  OptimizationStrategy,
  OptimizationResult,
  ResourceMetrics,
  OptimizationRule
} from '../adaptive-resource-optimizer';

// Mock data
const mockResources: Resource[] = [
  {
    id: 'cpu-server-1',
    name: 'CPU Server 1',
    type: 'compute',
    status: 'optimal',
    currentUsage: 65,
    capacity: 100,
    efficiency: 0.85,
    cost: 120.50,
    tags: ['production', 'web-server'],
    lastUpdated: '2024-01-15T10:30:00Z'
  },
  {
    id: 'memory-pool-1',
    name: 'Memory Pool 1', 
    type: 'memory',
    status: 'underutilized',
    currentUsage: 30,
    capacity: 100,
    efficiency: 0.45,
    cost: 80.25,
    tags: ['production', 'cache'],
    lastUpdated: '2024-01-15T10:30:00Z'
  },
  {
    id: 'storage-ssd-1',
    name: 'Storage SSD 1',
    type: 'storage',
    status: 'overutilized',
    currentUsage: 95,
    capacity: 100,
    efficiency: 0.92,
    cost: 200.75,
    tags: ['production', 'database'],
    lastUpdated: '2024-01-15T10:30:00Z'
  }
];

const mockMetrics: ResourceMetrics = {
  totalResources: 3,
  utilizationRate: 0.63,
  efficiencyScore: 0.74,
  costOptimization: 0.82,
  recommendations: 5,
  potentialSavings: 45.25
};

const mockOptimizationRules: OptimizationRule[] = [
  {
    id: 'rule-1',
    name: 'Scale Down Underutilized',
    condition: 'usage < 30%',
    action: 'scale_down',
    priority: 'high',
    enabled: true
  }
];

const mockProps: AdaptiveResourceOptimizerProps = {
  resources: mockResources,
  metrics: mockMetrics,
  onOptimize: vi.fn()
};

describe('AdaptiveResourceOptimizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<AdaptiveResourceOptimizer {...mockProps} />);
      
      expect(screen.getByTestId('adaptive-resource-optimizer')).toBeInTheDocument();
      expect(screen.getByText('Resource Optimizer')).toBeInTheDocument();
    });

    it('should render custom title', () => {
      render(<AdaptiveResourceOptimizer {...mockProps} title="Custom Optimizer" />);
      
      expect(screen.getByText('Custom Optimizer')).toBeInTheDocument();
    });

    it('should show empty state when no resources', () => {
      render(<AdaptiveResourceOptimizer resources={[]} metrics={mockMetrics} onOptimize={vi.fn()} />);
      
      expect(screen.getByTestId('empty-resources-state')).toBeInTheDocument();
      expect(screen.getByText('No resources to optimize')).toBeInTheDocument();
    });

    it('should display resource metrics', () => {
      render(<AdaptiveResourceOptimizer {...mockProps} />);
      
      expect(screen.getByTestId('resource-metrics')).toBeInTheDocument();
      expect(screen.getByText('Total: 3')).toBeInTheDocument();
      expect(screen.getByText('Efficiency: 74%')).toBeInTheDocument();
    });

    it('should render all resource types', () => {
      render(<AdaptiveResourceOptimizer {...mockProps} />);
      
      expect(screen.getByTestId('resource-cpu-server-1')).toBeInTheDocument();
      expect(screen.getByTestId('resource-memory-pool-1')).toBeInTheDocument();
      expect(screen.getByTestId('resource-storage-ssd-1')).toBeInTheDocument();
    });

    it('should show resource statuses', () => {
      render(<AdaptiveResourceOptimizer {...mockProps} />);
      
      expect(screen.getByTestId('status-optimal')).toBeInTheDocument();
      expect(screen.getByTestId('status-underutilized')).toBeInTheDocument();
      expect(screen.getByTestId('status-overutilized')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      render(<AdaptiveResourceOptimizer {...mockProps} loading={true} />);
      
      expect(screen.getByTestId('optimizer-loading')).toBeInTheDocument();
      expect(screen.getByText('Analyzing resources...')).toBeInTheDocument();
    });
  });

  describe('Optimization Actions', () => {
    it('should handle optimization trigger', async () => {
      const user = userEvent.setup();
      const mockOnOptimize = vi.fn();
      
      render(<AdaptiveResourceOptimizer {...mockProps} onOptimize={mockOnOptimize} />);

      const optimizeButton = screen.getByTestId('optimize-button');
      await user.click(optimizeButton);

      expect(mockOnOptimize).toHaveBeenCalledWith('auto', mockResources);
    });

    it('should show optimization strategies', async () => {
      const user = userEvent.setup();
      
      render(<AdaptiveResourceOptimizer {...mockProps} showStrategies={true} />);

      const strategySelect = screen.getByTestId('strategy-select');
      await user.click(strategySelect);
      
      expect(screen.getByText('Cost Optimization')).toBeInTheDocument();
      expect(screen.getByText('Performance Optimization')).toBeInTheDocument();
    });

    it('should handle resource scaling', async () => {
      const user = userEvent.setup();
      const mockOnScale = vi.fn();
      
      render(<AdaptiveResourceOptimizer {...mockProps} onScale={mockOnScale} />);

      const scaleButton = screen.getByTestId('scale-button-cpu-server-1');
      await user.click(scaleButton);

      expect(mockOnScale).toHaveBeenCalledWith('cpu-server-1', 'up');
    });

    it('should display optimization recommendations', () => {
      render(<AdaptiveResourceOptimizer {...mockProps} showRecommendations={true} />);
      
      expect(screen.getByTestId('optimization-recommendations')).toBeInTheDocument();
      expect(screen.getByText('5 recommendations available')).toBeInTheDocument();
    });

    it('should handle auto-optimization toggle', async () => {
      const user = userEvent.setup();
      
      render(<AdaptiveResourceOptimizer {...mockProps} enableAutoOptimization={true} />);

      const autoToggle = screen.getByTestId('auto-optimization-toggle');
      await user.click(autoToggle);

      expect(screen.getByTestId('auto-optimization-enabled')).toBeInTheDocument();
    });
  });

  describe('Resource Management', () => {
    it('should filter resources by type', async () => {
      const user = userEvent.setup();
      
      render(<AdaptiveResourceOptimizer {...mockProps} showFilters={true} />);

      const typeFilter = screen.getByTestId('type-filter');
      await user.click(typeFilter);
      
      const computeOption = screen.getByText('Compute');
      await user.click(computeOption);

      expect(screen.getByTestId('resource-cpu-server-1')).toBeInTheDocument();
      expect(screen.queryByTestId('resource-memory-pool-1')).not.toBeInTheDocument();
    });

    it('should filter resources by status', async () => {
      const user = userEvent.setup();
      
      render(<AdaptiveResourceOptimizer {...mockProps} showFilters={true} />);

      const statusFilter = screen.getByTestId('status-filter');
      await user.click(statusFilter);
      
      const overutilizedOption = screen.getByText('Overutilized');
      await user.click(overutilizedOption);

      expect(screen.getByTestId('resource-storage-ssd-1')).toBeInTheDocument();
      expect(screen.queryByTestId('resource-cpu-server-1')).not.toBeInTheDocument();
    });

    it('should show resource details on expand', async () => {
      const user = userEvent.setup();
      
      render(<AdaptiveResourceOptimizer {...mockProps} />);

      const expandButton = screen.getByTestId('expand-button-cpu-server-1');
      await user.click(expandButton);

      expect(screen.getByTestId('resource-details')).toBeInTheDocument();
      expect(screen.getByText('Current usage: 65%')).toBeInTheDocument();
    });

    it('should handle resource tagging', async () => {
      const user = userEvent.setup();
      
      render(<AdaptiveResourceOptimizer {...mockProps} enableTagging={true} />);

      const tagButton = screen.getByTestId('tag-button-cpu-server-1');
      await user.click(tagButton);

      expect(screen.getByTestId('tag-editor')).toBeInTheDocument();
      expect(screen.getByText('production')).toBeInTheDocument();
    });
  });

  describe('Analytics and Reporting', () => {
    it('should display efficiency analytics', () => {
      render(<AdaptiveResourceOptimizer {...mockProps} showAnalytics={true} />);
      
      expect(screen.getByTestId('efficiency-analytics')).toBeInTheDocument();
      expect(screen.getByText('Overall efficiency: 74%')).toBeInTheDocument();
    });

    it('should show cost analysis', () => {
      render(<AdaptiveResourceOptimizer {...mockProps} showCostAnalysis={true} />);
      
      expect(screen.getByTestId('cost-analysis')).toBeInTheDocument();
      expect(screen.getByText('Potential savings: $45.25')).toBeInTheDocument();
    });

    it('should export optimization report', async () => {
      const user = userEvent.setup();
      const mockOnExport = vi.fn();
      
      render(<AdaptiveResourceOptimizer {...mockProps} exportable={true} onExport={mockOnExport} />);

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);
      
      const reportOption = screen.getByText('Optimization Report');
      await user.click(reportOption);

      expect(mockOnExport).toHaveBeenCalledWith('pdf', expect.any(Object));
    });

    it('should display historical trends', () => {
      render(<AdaptiveResourceOptimizer {...mockProps} showTrends={true} />);
      
      expect(screen.getByTestId('resource-trends')).toBeInTheDocument();
      expect(screen.getByText('Trend Analysis')).toBeInTheDocument();
    });
  });

  describe('Optimization Rules', () => {
    it('should display optimization rules', () => {
      render(<AdaptiveResourceOptimizer {...mockProps} rules={mockOptimizationRules} showRules={true} />);
      
      expect(screen.getByTestId('optimization-rules')).toBeInTheDocument();
      expect(screen.getByText('Scale Down Underutilized')).toBeInTheDocument();
    });

    it('should handle rule toggle', async () => {
      const user = userEvent.setup();
      const mockOnRuleUpdate = vi.fn();
      
      render(<AdaptiveResourceOptimizer {...mockProps} rules={mockOptimizationRules} showRules={true} onRuleUpdate={mockOnRuleUpdate} />);

      const ruleToggle = screen.getByTestId('rule-toggle-rule-1');
      await user.click(ruleToggle);

      expect(mockOnRuleUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: 'rule-1', enabled: false }));
    });

    it('should create new optimization rule', async () => {
      const user = userEvent.setup();
      const mockOnRuleCreate = vi.fn();
      
      render(<AdaptiveResourceOptimizer {...mockProps} showRules={true} onRuleCreate={mockOnRuleCreate} />);

      const addRuleButton = screen.getByTestId('add-rule-button');
      await user.click(addRuleButton);

      expect(screen.getByTestId('rule-builder')).toBeInTheDocument();
      
      const saveButton = screen.getByText('Save Rule');
      await user.click(saveButton);

      expect(mockOnRuleCreate).toHaveBeenCalled();
    });
  });

  describe('Real-time Updates', () => {
    it('should handle real-time resource updates', () => {
      const { rerender } = render(<AdaptiveResourceOptimizer {...mockProps} />);

      const updatedResources = [...mockResources];
      updatedResources[0] = { ...updatedResources[0], currentUsage: 75 };

      rerender(<AdaptiveResourceOptimizer {...mockProps} resources={updatedResources} />);

      expect(screen.getByText('75% usage')).toBeInTheDocument();
    });

    it('should show auto-refresh indicator', () => {
      render(<AdaptiveResourceOptimizer {...mockProps} autoRefresh={true} />);
      
      expect(screen.getByTestId('auto-refresh-indicator')).toBeInTheDocument();
    });

    it('should handle optimization in progress', () => {
      render(<AdaptiveResourceOptimizer {...mockProps} optimizing={true} />);
      
      expect(screen.getByTestId('optimization-progress')).toBeInTheDocument();
      expect(screen.getByText('Optimizing resources...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid resource data', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<AdaptiveResourceOptimizer resources={null as any} metrics={mockMetrics} onOptimize={vi.fn()} />);

      expect(screen.getByTestId('empty-resources-state')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should display optimization errors', () => {
      render(<AdaptiveResourceOptimizer {...mockProps} error="Optimization failed" />);
      
      expect(screen.getByTestId('optimizer-error-state')).toBeInTheDocument();
      expect(screen.getByText('Optimization failed')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<AdaptiveResourceOptimizer {...mockProps} />);
      
      const optimizer = screen.getByTestId('adaptive-resource-optimizer');
      expect(optimizer).toHaveAttribute('role', 'region');
      expect(optimizer).toHaveAttribute('aria-label', 'Resource Optimizer');
    });

    it('should support keyboard navigation', () => {
      render(<AdaptiveResourceOptimizer {...mockProps} />);

      const firstResource = screen.getByTestId('resource-cpu-server-1');
      firstResource.focus();
      
      expect(document.activeElement).toBe(firstResource);
    });

    it('should announce optimization updates', () => {
      render(<AdaptiveResourceOptimizer {...mockProps} announceUpdates={true} />);

      const announcements = screen.getByTestId('optimizer-announcements');
      expect(announcements).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Advanced Features', () => {
    it('should support custom optimization templates', () => {
      const customTemplate = (resource: Resource) => (
        <div data-testid="custom-resource-template">
          {resource.name}: {resource.currentUsage}%
        </div>
      );

      render(<AdaptiveResourceOptimizer {...mockProps} customTemplate={customTemplate} />);

      expect(screen.getAllByTestId('custom-resource-template')).toHaveLength(3);
    });

    it('should handle resource predictions', () => {
      render(<AdaptiveResourceOptimizer {...mockProps} showPredictions={true} />);
      
      expect(screen.getByTestId('resource-predictions')).toBeInTheDocument();
      expect(screen.getByText('Predicted utilization')).toBeInTheDocument();
    });

    it('should support batch operations', async () => {
      const user = userEvent.setup();
      const mockOnBatchOptimize = vi.fn();
      
      render(<AdaptiveResourceOptimizer {...mockProps} enableBatchOperations={true} onBatchOptimize={mockOnBatchOptimize} />);

      const selectAll = screen.getByTestId('select-all-resources');
      await user.click(selectAll);

      const batchOptimize = screen.getByTestId('batch-optimize-button');
      await user.click(batchOptimize);

      expect(mockOnBatchOptimize).toHaveBeenCalledWith(mockResources);
    });

    it('should display optimization history', () => {
      render(<AdaptiveResourceOptimizer {...mockProps} showHistory={true} />);
      
      expect(screen.getByTestId('optimization-history')).toBeInTheDocument();
      expect(screen.getByText('Recent optimizations')).toBeInTheDocument();
    });

    it('should support resource scheduling', async () => {
      const user = userEvent.setup();
      
      render(<AdaptiveResourceOptimizer {...mockProps} enableScheduling={true} />);

      const scheduleButton = screen.getByTestId('schedule-optimization-button');
      await user.click(scheduleButton);

      expect(screen.getByTestId('schedule-config')).toBeInTheDocument();
    });
  });
});