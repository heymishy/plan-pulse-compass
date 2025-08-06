import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PredictiveInsightsPanel, { 
  PredictiveInsightsPanelProps,
  InsightType,
  InsightPriority,
  InsightCategory,
  PredictiveInsight,
  InsightMetric,
  TrendDirection,
  ConfidenceLevel
} from '../predictive-insights-panel';

// Mock data interfaces
interface TestInsight extends PredictiveInsight {
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

// Mock test data
const mockInsights: TestInsight[] = [
  {
    id: 'insight-1',
    title: 'Resource Allocation Optimization',
    description: 'Current allocation shows 23% inefficiency in Q4 projects',
    category: 'resource',
    type: 'optimization',
    priority: 'high',
    confidence: 'high',
    metrics: [
      { name: 'Efficiency Score', value: 77, unit: '%', baseline: 85 },
      { name: 'Resource Utilization', value: 68, unit: '%', baseline: 80 }
    ],
    trend: 'declining',
    impact: 8.5,
    likelihood: 92,
    timeframe: '2-4 weeks',
    recommendations: [
      'Redistribute senior developers across teams',
      'Reduce parallel project assignments',
      'Implement skill-based allocation matrix'
    ],
    dataSource: 'allocation-engine',
    lastUpdated: '2024-01-15T10:30:00Z'
  },
  {
    id: 'insight-2',
    title: 'Skill Gap Risk Assessment',
    description: 'Emerging technology gap may impact delivery timelines',
    category: 'risk',
    type: 'prediction',
    priority: 'medium',
    confidence: 'medium',
    metrics: [
      { name: 'Skill Coverage', value: 65, unit: '%', baseline: 80 },
      { name: 'Training Progress', value: 45, unit: '%', baseline: 70 }
    ],
    trend: 'stable',
    impact: 6.2,
    likelihood: 75,
    timeframe: '6-8 weeks',
    recommendations: [
      'Accelerate React 18 training program',
      'Partner with external consultants',
      'Cross-train existing team members'
    ],
    dataSource: 'skills-analyzer',
    lastUpdated: '2024-01-15T09:15:00Z'
  },
  {
    id: 'insight-3',
    title: 'Performance Trend Analysis',
    description: 'Team velocity showing consistent 15% improvement trend',
    category: 'performance',
    type: 'trend',
    priority: 'low',
    confidence: 'high',
    metrics: [
      { name: 'Velocity Score', value: 92, unit: 'points', baseline: 80 },
      { name: 'Quality Index', value: 88, unit: '%', baseline: 85 }
    ],
    trend: 'improving',
    impact: 4.1,
    likelihood: 89,
    timeframe: '1-2 weeks',
    recommendations: [
      'Document successful practices',
      'Share methodology across teams',
      'Maintain current project scope'
    ],
    dataSource: 'performance-tracker',
    lastUpdated: '2024-01-15T11:45:00Z'
  }
];

const mockOnInsightClick = vi.fn();
const mockOnRecommendationAction = vi.fn();
const mockOnCategoryFilter = vi.fn();
const mockOnRefresh = vi.fn();

const defaultProps: PredictiveInsightsPanelProps = {
  insights: mockInsights,
  onInsightClick: mockOnInsightClick,
  onRecommendationAction: mockOnRecommendationAction
};

describe('PredictiveInsightsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<PredictiveInsightsPanel {...defaultProps} />);
      
      expect(screen.getByTestId('predictive-insights-panel')).toBeInTheDocument();
      expect(screen.getByText('Predictive Insights')).toBeInTheDocument();
      expect(screen.getByText('Resource Allocation Optimization')).toBeInTheDocument();
    });

    it('should render custom title when provided', () => {
      render(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          title="Strategic Intelligence Dashboard"
        />
      );
      
      expect(screen.getByText('Strategic Intelligence Dashboard')).toBeInTheDocument();
    });

    it('should render empty state when no insights provided', () => {
      render(
        <PredictiveInsightsPanel 
          insights={[]}
          onInsightClick={mockOnInsightClick}
          onRecommendationAction={mockOnRecommendationAction}
        />
      );
      
      expect(screen.getByTestId('empty-insights-state')).toBeInTheDocument();
      expect(screen.getByText('No insights available')).toBeInTheDocument();
    });

    it('should render insights with proper priority indicators', () => {
      render(<PredictiveInsightsPanel {...defaultProps} />);
      
      expect(screen.getByTestId('priority-high')).toBeInTheDocument();
      expect(screen.getByTestId('priority-medium')).toBeInTheDocument();
      expect(screen.getByTestId('priority-low')).toBeInTheDocument();
    });

    it('should render insights with confidence indicators', () => {
      render(<PredictiveInsightsPanel {...defaultProps} />);
      
      expect(screen.getByText('92%')).toBeInTheDocument(); // High confidence
      expect(screen.getByText('75%')).toBeInTheDocument(); // Medium confidence
      expect(screen.getByText('89%')).toBeInTheDocument(); // High confidence
    });
  });

  describe('Insight Interactions', () => {
    it('should handle insight click events', async () => {
      const user = userEvent.setup();
      
      render(<PredictiveInsightsPanel {...defaultProps} />);

      const firstInsight = screen.getByTestId('insight-insight-1');
      await user.click(firstInsight);

      expect(mockOnInsightClick).toHaveBeenCalledWith(mockInsights[0]);
    });

    it('should expand insight details on click', async () => {
      const user = userEvent.setup();
      
      render(<PredictiveInsightsPanel {...defaultProps} />);

      const expandButton = screen.getByTestId('expand-button-insight-1');
      await user.click(expandButton);

      expect(screen.getByTestId('insight-details')).toBeInTheDocument();
      expect(screen.getByText('Efficiency Score')).toBeInTheDocument();
      expect(screen.getByText('77%')).toBeInTheDocument();
    });

    it('should handle recommendation action buttons', async () => {
      const user = userEvent.setup();
      
      render(<PredictiveInsightsPanel {...defaultProps} />);

      // Expand first insight to see recommendations
      const expandButton = screen.getByTestId('expand-button-insight-1');
      await user.click(expandButton);

      const actionButton = screen.getByText('Take Action');
      await user.click(actionButton);

      expect(mockOnRecommendationAction).toHaveBeenCalledWith(
        mockInsights[0],
        mockInsights[0].recommendations[0]
      );
    });

    it('should toggle insight favorites', async () => {
      const user = userEvent.setup();
      
      render(<PredictiveInsightsPanel {...defaultProps} enableFavorites={true} />);

      const favoriteButton = screen.getByTestId('favorite-button-insight-1');
      await user.click(favoriteButton);

      expect(screen.getByLabelText('Remove from favorites')).toBeInTheDocument();
    });
  });

  describe('Filtering and Sorting', () => {
    it('should filter insights by category', async () => {
      const user = userEvent.setup();
      
      render(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          showFilters={true}
          onCategoryFilter={mockOnCategoryFilter}
        />
      );

      const categoryFilter = screen.getByTestId('category-filter');
      await user.click(categoryFilter);
      
      const resourceOption = screen.getByText('Resource');
      await user.click(resourceOption);

      expect(mockOnCategoryFilter).toHaveBeenCalledWith(['resource']);
    });

    it('should filter insights by priority', async () => {
      const user = userEvent.setup();
      
      render(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          showFilters={true}
        />
      );

      const priorityFilter = screen.getByTestId('priority-filter');
      await user.click(priorityFilter);
      
      const highPriorityOption = screen.getByText('High Priority');
      await user.click(highPriorityOption);

      // Should only show high priority insights
      expect(screen.getByText('Resource Allocation Optimization')).toBeInTheDocument();
      expect(screen.queryByText('Skill Gap Risk Assessment')).not.toBeInTheDocument();
    });

    it('should sort insights by impact score', async () => {
      const user = userEvent.setup();
      
      render(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          showSorting={true}
        />
      );

      const sortSelect = screen.getByTestId('sort-select');
      await user.click(sortSelect);
      
      const impactSort = screen.getAllByText('Impact Score')[1];
      await user.click(impactSort);

      // Should display insights sorted by impact
      const insights = screen.getAllByTestId(/insight-/);
      expect(insights[0]).toHaveAttribute('data-testid', 'insight-insight-1'); // Highest impact
    });

    it('should search insights by text', async () => {
      const user = userEvent.setup();
      
      render(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          searchable={true}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search insights...');
      await user.type(searchInput, 'allocation');

      expect(screen.getByText('Resource Allocation Optimization')).toBeInTheDocument();
      expect(screen.queryByText('Skill Gap Risk Assessment')).not.toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should handle real-time insight updates', () => {
      const { rerender } = render(<PredictiveInsightsPanel {...defaultProps} />);

      // Update insights
      const updatedInsights = [
        ...mockInsights,
        {
          id: 'insight-4',
          title: 'New Critical Insight',
          description: 'Urgent action required',
          category: 'risk' as InsightCategory,
          type: 'alert' as InsightType,
          priority: 'high' as InsightPriority,
          confidence: 'high' as ConfidenceLevel,
          metrics: [],
          trend: 'declining' as TrendDirection,
          impact: 9.5,
          likelihood: 95,
          timeframe: 'immediate',
          recommendations: ['Take immediate action'],
          dataSource: 'alert-system',
          lastUpdated: '2024-01-15T12:00:00Z'
        }
      ];

      rerender(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          insights={updatedInsights}
        />
      );

      expect(screen.getByText('New Critical Insight')).toBeInTheDocument();
    });

    it('should show loading state during updates', () => {
      render(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          loading={true}
        />
      );

      expect(screen.getByTestId('insights-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading insights...')).toBeInTheDocument();
    });

    it('should auto-refresh insights when enabled', async () => {
      render(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          autoRefresh={true}
          refreshInterval={1000}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByTestId('auto-refresh-indicator')).toBeInTheDocument();
      
      // Wait for auto-refresh to trigger
      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalled();
      }, { timeout: 1500 });
    });
  });

  describe('Insight Details and Metrics', () => {
    it('should display insight metrics correctly', async () => {
      const user = userEvent.setup();
      
      render(<PredictiveInsightsPanel {...defaultProps} />);

      const expandButton = screen.getByTestId('expand-button-insight-1');
      await user.click(expandButton);

      expect(screen.getByText('Efficiency Score')).toBeInTheDocument();
      expect(screen.getByText('77%')).toBeInTheDocument();
      expect(screen.getByText('Resource Utilization')).toBeInTheDocument();
      expect(screen.getByText('68%')).toBeInTheDocument();
    });

    it('should show trend indicators', () => {
      render(<PredictiveInsightsPanel {...defaultProps} />);

      expect(screen.getByTestId('trend-declining')).toBeInTheDocument();
      expect(screen.getByTestId('trend-stable')).toBeInTheDocument();
      expect(screen.getByTestId('trend-improving')).toBeInTheDocument();
    });

    it('should display impact and likelihood scores', () => {
      render(<PredictiveInsightsPanel {...defaultProps} />);

      expect(screen.getByText('Impact: 8.5')).toBeInTheDocument();
      expect(screen.getByText('Impact: 6.2')).toBeInTheDocument();
      expect(screen.getByText('Impact: 4.1')).toBeInTheDocument();
    });

    it('should format timeframes correctly', () => {
      render(<PredictiveInsightsPanel {...defaultProps} />);

      expect(screen.getByText('2-4 weeks')).toBeInTheDocument();
      expect(screen.getByText('6-8 weeks')).toBeInTheDocument();
      expect(screen.getByText('1-2 weeks')).toBeInTheDocument();
    });
  });

  describe('Recommendations', () => {
    it('should display recommendation lists', async () => {
      const user = userEvent.setup();
      
      render(<PredictiveInsightsPanel {...defaultProps} />);

      const expandButton = screen.getByTestId('expand-button-insight-1');
      await user.click(expandButton);

      expect(screen.getByText('Redistribute senior developers across teams')).toBeInTheDocument();
      expect(screen.getByText('Reduce parallel project assignments')).toBeInTheDocument();
    });

    it('should handle recommendation acceptance', async () => {
      const user = userEvent.setup();
      
      render(<PredictiveInsightsPanel {...defaultProps} />);

      const expandButton = screen.getByTestId('expand-button-insight-1');
      await user.click(expandButton);

      const acceptButton = screen.getByText('Accept');
      await user.click(acceptButton);

      expect(mockOnRecommendationAction).toHaveBeenCalledWith(
        mockInsights[0],
        'accept'
      );
    });

    it('should handle recommendation dismissal', async () => {
      const user = userEvent.setup();
      
      render(<PredictiveInsightsPanel {...defaultProps} />);

      const expandButton = screen.getByTestId('expand-button-insight-1');
      await user.click(expandButton);

      const dismissButton = screen.getByText('Dismiss');
      await user.click(dismissButton);

      expect(mockOnRecommendationAction).toHaveBeenCalledWith(
        mockInsights[0],
        'dismiss'
      );
    });
  });

  describe('Data Visualization', () => {
    it('should render metric charts for insights', async () => {
      const user = userEvent.setup();
      
      render(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          showMetricCharts={true}
        />
      );

      const expandButton = screen.getByTestId('expand-button-insight-1');
      await user.click(expandButton);

      expect(screen.getAllByTestId('metric-chart')).toHaveLength(2);
      expect(screen.getByTestId('metric-chart-efficiency-score')).toBeInTheDocument();
    });

    it('should display confidence visualization', () => {
      render(<PredictiveInsightsPanel {...defaultProps} />);

      expect(screen.getAllByTestId('confidence-high')).toHaveLength(2);
      expect(screen.getByTestId('confidence-medium')).toBeInTheDocument();
    });

    it('should show impact vs likelihood scatter plot', async () => {
      const user = userEvent.setup();
      
      render(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          showImpactMatrix={true}
        />
      );

      const matrixButton = screen.getByText('Impact Matrix');
      await user.click(matrixButton);

      expect(screen.getByTestId('impact-likelihood-matrix')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<PredictiveInsightsPanel {...defaultProps} />);
      
      const panel = screen.getByTestId('predictive-insights-panel');
      expect(panel).toHaveAttribute('role', 'region');
      expect(panel).toHaveAttribute('aria-label');
      
      const insights = screen.getAllByRole('article');
      expect(insights).toHaveLength(3);
    });

    it('should support keyboard navigation', async () => {
      render(<PredictiveInsightsPanel {...defaultProps} />);

      const firstInsight = screen.getByTestId('insight-insight-1');
      firstInsight.focus();
      
      expect(document.activeElement).toBe(firstInsight);

      // Tab navigation should work
      fireEvent.keyDown(firstInsight, { key: 'Tab' });
    });

    it('should announce insights to screen readers', () => {
      render(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          announceUpdates={true}
        />
      );

      const announcements = screen.getByTestId('insights-announcements');
      expect(announcements).toHaveAttribute('aria-live', 'polite');
      expect(announcements).toHaveAttribute('aria-atomic', 'true');
    });

    it('should provide alternative data representations', async () => {
      const user = userEvent.setup();
      
      render(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          showDataTable={true}
        />
      );
      
      const dataTableToggle = screen.getByText('Data Table');
      await user.click(dataTableToggle);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Insight')).toBeInTheDocument();
      expect(screen.getByText('Priority')).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should export insights as CSV', async () => {
      const user = userEvent.setup();
      const mockOnExport = vi.fn();
      
      render(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          exportable={true}
          onExport={mockOnExport}
        />
      );

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);

      const csvOption = screen.getByText('CSV Report');
      await user.click(csvOption);

      expect(mockOnExport).toHaveBeenCalledWith('csv', mockInsights);
    });

    it('should export insights as PDF report', async () => {
      const user = userEvent.setup();
      const mockOnExport = vi.fn();
      
      render(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          exportable={true}
          onExport={mockOnExport}
        />
      );

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);

      const pdfOption = screen.getByText('PDF Report');
      await user.click(pdfOption);

      expect(mockOnExport).toHaveBeenCalledWith('pdf', mockInsights);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid insight data gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <PredictiveInsightsPanel 
          insights={null as any}
          onInsightClick={mockOnInsightClick}
          onRecommendationAction={mockOnRecommendationAction}
        />
      );

      expect(screen.getByTestId('empty-insights-state')).toBeInTheDocument();
      expect(screen.getByText('No insights available')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should handle missing metrics gracefully', () => {
      const insightsWithoutMetrics = [{
        ...mockInsights[0],
        metrics: null as any
      }];

      render(
        <PredictiveInsightsPanel 
          insights={insightsWithoutMetrics}
          onInsightClick={mockOnInsightClick}
          onRecommendationAction={mockOnRecommendationAction}
        />
      );

      expect(screen.getByText('Resource Allocation Optimization')).toBeInTheDocument();
    });

    it('should display error state for processing failures', () => {
      render(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          error="Failed to load insights"
        />
      );

      expect(screen.getByTestId('insights-error-state')).toBeInTheDocument();
      expect(screen.getByText('Failed to load insights')).toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    it('should virtualize large insight lists', () => {
      const largeInsightList = Array.from({ length: 100 }, (_, i) => ({
        ...mockInsights[0],
        id: `insight-${i}`,
        title: `Insight ${i}`
      }));

      render(
        <PredictiveInsightsPanel 
          insights={largeInsightList}
          onInsightClick={mockOnInsightClick}
          onRecommendationAction={mockOnRecommendationAction}
          virtualized={true}
        />
      );

      expect(screen.getByTestId('virtualized-insights')).toBeInTheDocument();
    });

    it('should lazy load insight details', async () => {
      const user = userEvent.setup();
      
      render(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          lazyLoadDetails={true}
        />
      );

      const expandButton = screen.getByTestId('expand-button-insight-1');
      await user.click(expandButton);

      expect(screen.getByTestId('insight-details-loading')).toBeInTheDocument();
    });

    it('should debounce search input', async () => {
      const user = userEvent.setup();
      const mockOnSearch = vi.fn();
      
      render(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          searchable={true}
          onSearch={mockOnSearch}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search insights...');
      
      // Rapid typing should be debounced
      await user.type(searchInput, 'test');
      
      // Should not call search for every keystroke
      expect(mockOnSearch).not.toHaveBeenCalledTimes(4);
    });
  });

  describe('Advanced Features', () => {
    it('should support insight comparison mode', async () => {
      const user = userEvent.setup();
      
      render(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          enableComparison={true}
        />
      );

      const compareButton = screen.getByText('Compare');
      await user.click(compareButton);

      expect(screen.getByTestId('comparison-mode')).toBeInTheDocument();
      expect(screen.getByText('Select insights to compare')).toBeInTheDocument();
    });

    it('should track insight history and changes', async () => {
      const user = userEvent.setup();
      
      render(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          showHistory={true}
        />
      );

      const historyButton = screen.getByText('History');
      await user.click(historyButton);

      expect(screen.getByTestId('insight-history')).toBeInTheDocument();
    });

    it('should support custom insight templates', () => {
      const customTemplate = (insight: TestInsight) => (
        <div data-testid="custom-insight-template">
          <h3>{insight.title}</h3>
          <p>{insight.description}</p>
        </div>
      );

      render(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          customTemplate={customTemplate}
        />
      );

      expect(screen.getAllByTestId('custom-insight-template')).toHaveLength(3);
    });

    it('should integrate with notification system', async () => {
      const user = userEvent.setup();
      const mockOnNotificationSend = vi.fn();
      
      render(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          notificationsEnabled={true}
          onNotificationSend={mockOnNotificationSend}
        />
      );

      // First expand the insight to see notification controls
      const expandButton = screen.getByTestId('expand-button-insight-1');
      await user.click(expandButton);

      const notifyButton = screen.getByText('Send Notification');
      await user.click(notifyButton);

      expect(mockOnNotificationSend).toHaveBeenCalledWith(mockInsights[0]);
    });
  });

  describe('Theme Support', () => {
    it('should apply light theme correctly', () => {
      render(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          theme="light"
        />
      );

      const panel = screen.getByTestId('predictive-insights-panel');
      expect(panel).toHaveClass('light-theme');
    });

    it('should apply dark theme correctly', () => {
      render(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          theme="dark"
        />
      );

      const panel = screen.getByTestId('predictive-insights-panel');
      expect(panel).toHaveClass('dark-theme');
    });

    it('should support high contrast mode', () => {
      render(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          highContrast={true}
        />
      );

      const panel = screen.getByTestId('predictive-insights-panel');
      expect(panel).toHaveClass('high-contrast');
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<PredictiveInsightsPanel {...defaultProps} />);

      const panel = screen.getByTestId('predictive-insights-panel');
      expect(panel).toHaveClass('mobile-view');
    });

    it('should stack insights vertically on small screens', () => {
      render(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          layout="vertical"
        />
      );

      const container = screen.getByTestId('insights-container');
      expect(container).toHaveClass('flex-col');
    });

    it('should show horizontal layout on large screens', () => {
      render(
        <PredictiveInsightsPanel 
          {...defaultProps} 
          layout="horizontal"
        />
      );

      const container = screen.getByTestId('insights-container');
      expect(container).toHaveClass('grid');
    });
  });
});