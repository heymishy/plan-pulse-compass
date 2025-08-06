import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TrendAnalysisComponent, { 
  TrendAnalysisComponentProps,
  TrendAnalysis,
  TrendType,
  TrendPeriod,
  TrendIndicator,
  TrendData,
  TrendMetric,
  TrendDirection,
  TrendStrength,
  TrendConfidence
} from '../trend-analysis-component';

// Mock data interfaces
interface TestTrendData extends TrendData {
  id: string;
  name: string;
  type: TrendType;
  period: TrendPeriod;
  direction: TrendDirection;
  strength: TrendStrength;
  confidence: TrendConfidence;
  currentValue: number;
  previousValue: number;
  changePercentage: number;
  unit: string;
  dataPoints: Array<{
    timestamp: string;
    value: number;
  }>;
  forecast?: Array<{
    timestamp: string;
    value: number;
    confidence: number;
  }>;
  insights: string[];
  indicators: TrendIndicator[];
  metrics: TrendMetric[];
}

// Mock test data
const mockTrendData: TestTrendData[] = [
  {
    id: 'trend-velocity',
    name: 'Team Velocity',
    type: 'performance',
    period: 'weekly',
    direction: 'improving',
    strength: 'strong',
    confidence: 'high',
    currentValue: 85,
    previousValue: 72,
    changePercentage: 18.1,
    unit: 'points',
    dataPoints: [
      { timestamp: '2024-01-01T00:00:00Z', value: 65 },
      { timestamp: '2024-01-08T00:00:00Z', value: 70 },
      { timestamp: '2024-01-15T00:00:00Z', value: 72 },
      { timestamp: '2024-01-22T00:00:00Z', value: 78 },
      { timestamp: '2024-01-29T00:00:00Z', value: 85 }
    ],
    forecast: [
      { timestamp: '2024-02-05T00:00:00Z', value: 88, confidence: 85 },
      { timestamp: '2024-02-12T00:00:00Z', value: 92, confidence: 75 },
      { timestamp: '2024-02-19T00:00:00Z', value: 95, confidence: 65 }
    ],
    insights: [
      'Consistent velocity improvement over 5 weeks',
      'Team efficiency increased by 18.1%',
      'Projected to reach 95 points by end of February'
    ],
    indicators: [
      { name: 'Acceleration', value: 'positive', description: 'Velocity increasing at steady rate' },
      { name: 'Consistency', value: 'high', description: 'Low variance in weekly measurements' }
    ],
    metrics: [
      { name: 'Weekly Average', value: 76, unit: 'points' },
      { name: 'Growth Rate', value: 18.1, unit: '%' },
      { name: 'Volatility', value: 12.5, unit: '%' }
    ]
  },
  {
    id: 'trend-quality',
    name: 'Code Quality Score',
    type: 'quality',
    period: 'daily',
    direction: 'declining',
    strength: 'moderate',
    confidence: 'medium',
    currentValue: 78,
    previousValue: 85,
    changePercentage: -8.2,
    unit: '%',
    dataPoints: [
      { timestamp: '2024-01-25T00:00:00Z', value: 85 },
      { timestamp: '2024-01-26T00:00:00Z', value: 83 },
      { timestamp: '2024-01-27T00:00:00Z', value: 81 },
      { timestamp: '2024-01-28T00:00:00Z', value: 79 },
      { timestamp: '2024-01-29T00:00:00Z', value: 78 }
    ],
    insights: [
      'Code quality declining over past 5 days',
      'Technical debt accumulating faster than cleanup',
      'Immediate attention required to prevent further degradation'
    ],
    indicators: [
      { name: 'Technical Debt', value: 'increasing', description: 'Growing technical debt load' },
      { name: 'Test Coverage', value: 'decreasing', description: 'Test coverage dropping' }
    ],
    metrics: [
      { name: 'Daily Average', value: 81.2, unit: '%' },
      { name: 'Decline Rate', value: -8.2, unit: '%' },
      { name: 'Volatility', value: 4.8, unit: '%' }
    ]
  },
  {
    id: 'trend-resources',
    name: 'Resource Utilization',
    type: 'resource',
    period: 'monthly',
    direction: 'stable',
    strength: 'weak',
    confidence: 'low',
    currentValue: 82,
    previousValue: 81,
    changePercentage: 1.2,
    unit: '%',
    dataPoints: [
      { timestamp: '2023-09-01T00:00:00Z', value: 78 },
      { timestamp: '2023-10-01T00:00:00Z', value: 80 },
      { timestamp: '2023-11-01T00:00:00Z', value: 79 },
      { timestamp: '2023-12-01T00:00:00Z', value: 81 },
      { timestamp: '2024-01-01T00:00:00Z', value: 82 }
    ],
    insights: [
      'Resource utilization remains relatively stable',
      'Minor fluctuations within normal range',
      'No significant trends detected'
    ],
    indicators: [
      { name: 'Stability', value: 'high', description: 'Consistent utilization levels' },
      { name: 'Efficiency', value: 'moderate', description: 'Room for optimization' }
    ],
    metrics: [
      { name: 'Monthly Average', value: 80, unit: '%' },
      { name: 'Change Rate', value: 1.2, unit: '%' },
      { name: 'Volatility', value: 3.1, unit: '%' }
    ]
  }
];

const mockTrendAnalysis: TrendAnalysis = {
  trends: mockTrendData,
  summary: {
    totalTrends: 3,
    improvingTrends: 1,
    decliningTrends: 1,
    stableTrends: 1,
    highConfidenceTrends: 1,
    criticalTrends: 1
  },
  period: {
    start: '2024-01-01T00:00:00Z',
    end: '2024-01-29T00:00:00Z'
  },
  lastUpdated: '2024-01-29T12:00:00Z'
};

const mockOnTrendClick = vi.fn();
const mockOnTrendDrillDown = vi.fn();
const mockOnPeriodChange = vi.fn();
const mockOnExport = vi.fn();
const mockOnRefresh = vi.fn();
const mockOnForecastToggle = vi.fn();

const defaultProps: TrendAnalysisComponentProps = {
  analysis: mockTrendAnalysis,
  onTrendClick: mockOnTrendClick
};

describe('TrendAnalysisComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<TrendAnalysisComponent {...defaultProps} />);
      
      expect(screen.getByTestId('trend-analysis-component')).toBeInTheDocument();
      expect(screen.getByText('Trend Analysis')).toBeInTheDocument();
      expect(screen.getByText('Team Velocity')).toBeInTheDocument();
    });

    it('should render custom title when provided', () => {
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          title="Performance Trend Dashboard"
        />
      );
      
      expect(screen.getByText('Performance Trend Dashboard')).toBeInTheDocument();
    });

    it('should render empty state when no trends provided', () => {
      render(
        <TrendAnalysisComponent 
          analysis={{ ...mockTrendAnalysis, trends: [] }}
          onTrendClick={mockOnTrendClick}
        />
      );
      
      expect(screen.getByTestId('empty-trends-state')).toBeInTheDocument();
      expect(screen.getByText('No trends available')).toBeInTheDocument();
    });

    it('should render trends with proper direction indicators', () => {
      render(<TrendAnalysisComponent {...defaultProps} />);
      
      expect(screen.getByTestId('direction-improving')).toBeInTheDocument();
      expect(screen.getByTestId('direction-declining')).toBeInTheDocument();
      expect(screen.getByTestId('direction-stable')).toBeInTheDocument();
    });

    it('should render trends with strength indicators', () => {
      render(<TrendAnalysisComponent {...defaultProps} />);
      
      expect(screen.getByTestId('strength-strong')).toBeInTheDocument();
      expect(screen.getByTestId('strength-moderate')).toBeInTheDocument();
      expect(screen.getByTestId('strength-weak')).toBeInTheDocument();
    });

    it('should render trends with confidence levels', () => {
      render(<TrendAnalysisComponent {...defaultProps} />);
      
      expect(screen.getByText('85%')).toBeInTheDocument(); // High confidence
      expect(screen.getByText('75%')).toBeInTheDocument(); // Medium confidence
      expect(screen.getByText('65%')).toBeInTheDocument(); // Low confidence
    });
  });

  describe('Trend Interactions', () => {
    it('should handle trend click events', async () => {
      const user = userEvent.setup();
      
      render(<TrendAnalysisComponent {...defaultProps} />);

      const firstTrend = screen.getByTestId('trend-trend-velocity');
      await user.click(firstTrend);

      expect(mockOnTrendClick).toHaveBeenCalledWith(mockTrendData[0]);
    });

    it('should expand trend details on click', async () => {
      const user = userEvent.setup();
      
      render(<TrendAnalysisComponent {...defaultProps} />);

      const expandButton = screen.getByTestId('expand-button-trend-velocity');
      await user.click(expandButton);

      expect(screen.getByTestId('trend-details')).toBeInTheDocument();
      expect(screen.getByText('Consistent velocity improvement over 5 weeks')).toBeInTheDocument();
    });

    it('should handle trend drill-down', async () => {
      const user = userEvent.setup();
      
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          drillDownEnabled={true}
          onTrendDrillDown={mockOnTrendDrillDown}
        />
      );

      const trend = screen.getByTestId('trend-trend-velocity');
      await user.dblClick(trend);

      expect(mockOnTrendDrillDown).toHaveBeenCalledWith(mockTrendData[0]);
    });

    it('should toggle forecast display', async () => {
      const user = userEvent.setup();
      
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          showForecast={true}
          onForecastToggle={mockOnForecastToggle}
        />
      );

      const forecastToggle = screen.getByTestId('forecast-toggle');
      await user.click(forecastToggle);

      expect(mockOnForecastToggle).toHaveBeenCalledWith(true);
    });
  });

  describe('Filtering and Views', () => {
    it('should filter trends by type', async () => {
      const user = userEvent.setup();
      
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          showFilters={true}
        />
      );

      const typeFilter = screen.getByTestId('type-filter');
      await user.click(typeFilter);
      
      const performanceOption = screen.getByText('Performance');
      await user.click(performanceOption);

      expect(screen.getByText('Team Velocity')).toBeInTheDocument();
      expect(screen.queryByText('Code Quality Score')).not.toBeInTheDocument();
    });

    it('should filter trends by direction', async () => {
      const user = userEvent.setup();
      
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          showFilters={true}
        />
      );

      const directionFilter = screen.getByTestId('direction-filter');
      await user.click(directionFilter);
      
      const improvingOption = screen.getByText('Improving');
      await user.click(improvingOption);

      expect(screen.getByText('Team Velocity')).toBeInTheDocument();
      expect(screen.queryByText('Code Quality Score')).not.toBeInTheDocument();
    });

    it('should switch between chart views', async () => {
      const user = userEvent.setup();
      
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          showViewToggle={true}
        />
      );

      const viewToggle = screen.getByTestId('view-toggle');
      await user.click(viewToggle);

      expect(screen.getByTestId('trends-table-view')).toBeInTheDocument();
    });

    it('should show trends in compact mode', () => {
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          layout="compact"
        />
      );

      const container = screen.getByTestId('trends-container');
      expect(container).toHaveClass('compact-layout');
    });
  });

  describe('Time Period Management', () => {
    it('should handle period changes', async () => {
      const user = userEvent.setup();
      
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          showPeriodSelector={true}
          onPeriodChange={mockOnPeriodChange}
        />
      );

      const periodSelect = screen.getByTestId('period-select');
      await user.click(periodSelect);
      
      const lastMonthOption = screen.getByText('Last Month');
      await user.click(lastMonthOption);

      expect(mockOnPeriodChange).toHaveBeenCalledWith({
        period: 'month',
        start: expect.any(String),
        end: expect.any(String)
      });
    });

    it('should display trend charts with historical data', async () => {
      const user = userEvent.setup();
      
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          showCharts={true}
        />
      );

      const expandButton = screen.getByTestId('expand-button-trend-velocity');
      await user.click(expandButton);

      expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
      expect(screen.getByTestId('historical-data-chart')).toBeInTheDocument();
    });

    it('should display forecast data when enabled', async () => {
      const user = userEvent.setup();
      
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          showForecast={true}
        />
      );

      const expandButton = screen.getByTestId('expand-button-trend-velocity');
      await user.click(expandButton);

      expect(screen.getByTestId('forecast-chart')).toBeInTheDocument();
      expect(screen.getByText('Forecasted Values')).toBeInTheDocument();
    });

    it('should compare trends across time periods', async () => {
      const user = userEvent.setup();
      
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          enableComparison={true}
        />
      );

      const compareButton = screen.getByText('Compare Periods');
      await user.click(compareButton);

      expect(screen.getByTestId('comparison-mode')).toBeInTheDocument();
      expect(screen.getByText('Select periods to compare')).toBeInTheDocument();
    });
  });

  describe('Data Visualization', () => {
    it('should render trend value with proper formatting', () => {
      render(<TrendAnalysisComponent {...defaultProps} />);

      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('points')).toBeInTheDocument();
      expect(screen.getByText('78%')).toBeInTheDocument();
      expect(screen.getByText('82%')).toBeInTheDocument();
    });

    it('should display percentage changes', () => {
      render(<TrendAnalysisComponent {...defaultProps} />);

      expect(screen.getByText('+18.1%')).toBeInTheDocument();
      expect(screen.getByText('-8.2%')).toBeInTheDocument();
      expect(screen.getByText('+1.2%')).toBeInTheDocument();
    });

    it('should render trend line charts', async () => {
      const user = userEvent.setup();
      
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          showCharts={true}
        />
      );

      expect(screen.getAllByTestId('trend-line-chart')).toHaveLength(3);
    });

    it('should display trend indicators', () => {
      render(<TrendAnalysisComponent {...defaultProps} />);

      expect(screen.getByText('Acceleration')).toBeInTheDocument();
      expect(screen.getByText('Technical Debt')).toBeInTheDocument();
      expect(screen.getByText('Stability')).toBeInTheDocument();
    });

    it('should render trend metrics summary', () => {
      render(<TrendAnalysisComponent {...defaultProps} />);

      expect(screen.getByText('Weekly Average')).toBeInTheDocument();
      expect(screen.getByText('Growth Rate')).toBeInTheDocument();
      expect(screen.getByText('Volatility')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should handle real-time trend updates', () => {
      const { rerender } = render(<TrendAnalysisComponent {...defaultProps} />);

      // Update trends
      const updatedAnalysis = {
        ...mockTrendAnalysis,
        trends: [
          ...mockTrendData,
          {
            id: 'trend-security',
            name: 'Security Score',
            type: 'security' as TrendType,
            period: 'weekly' as TrendPeriod,
            direction: 'improving' as TrendDirection,
            strength: 'strong' as TrendStrength,
            confidence: 'high' as TrendConfidence,
            currentValue: 95,
            previousValue: 88,
            changePercentage: 8.0,
            unit: '%',
            dataPoints: [],
            insights: ['Security posture improving'],
            indicators: [],
            metrics: []
          }
        ]
      };

      rerender(
        <TrendAnalysisComponent 
          {...defaultProps} 
          analysis={updatedAnalysis}
        />
      );

      expect(screen.getByText('Security Score')).toBeInTheDocument();
    });

    it('should show loading state during updates', () => {
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          loading={true}
        />
      );

      expect(screen.getByTestId('trends-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading trends...')).toBeInTheDocument();
    });

    it('should auto-refresh trends when enabled', async () => {
      render(
        <TrendAnalysisComponent 
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

    it('should pause and resume auto-refresh', async () => {
      const user = userEvent.setup();
      
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          autoRefresh={true}
        />
      );

      const pauseButton = screen.getByTestId('pause-refresh-button');
      await user.click(pauseButton);

      expect(screen.getByTestId('play-refresh-button')).toBeInTheDocument();
    });
  });

  describe('Trend Summary and Statistics', () => {
    it('should display trend summary statistics', () => {
      render(<TrendAnalysisComponent {...defaultProps} />);

      expect(screen.getByText('3')).toBeInTheDocument(); // Total trends
      expect(screen.getByText('1 Improving')).toBeInTheDocument();
      expect(screen.getByText('1 Declining')).toBeInTheDocument();
      expect(screen.getByText('1 Stable')).toBeInTheDocument();
    });

    it('should show confidence distribution', () => {
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          showConfidenceDistribution={true}
        />
      );

      expect(screen.getByTestId('confidence-distribution')).toBeInTheDocument();
      expect(screen.getByText('High Confidence: 1')).toBeInTheDocument();
    });

    it('should calculate overall trend health score', () => {
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          showHealthScore={true}
        />
      );

      expect(screen.getByTestId('trend-health-score')).toBeInTheDocument();
      expect(screen.getByText(/Health Score: \d+/)).toBeInTheDocument();
    });

    it('should display trend correlation matrix', async () => {
      const user = userEvent.setup();
      
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          showCorrelationMatrix={true}
        />
      );

      const correlationButton = screen.getByText('Correlations');
      await user.click(correlationButton);

      expect(screen.getByTestId('correlation-matrix')).toBeInTheDocument();
    });
  });

  describe('Export and Reporting', () => {
    it('should export trends as CSV', async () => {
      const user = userEvent.setup();
      
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          exportable={true}
          onExport={mockOnExport}
        />
      );

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);

      const csvOption = screen.getByText('CSV Report');
      await user.click(csvOption);

      expect(mockOnExport).toHaveBeenCalledWith('csv', mockTrendAnalysis);
    });

    it('should export trends as PDF', async () => {
      const user = userEvent.setup();
      
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          exportable={true}
          onExport={mockOnExport}
        />
      );

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);

      const pdfOption = screen.getByText('PDF Report');
      await user.click(pdfOption);

      expect(mockOnExport).toHaveBeenCalledWith('pdf', mockTrendAnalysis);
    });

    it('should generate trend summary report', async () => {
      const user = userEvent.setup();
      
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          showSummaryReport={true}
        />
      );

      const summaryButton = screen.getByText('Summary Report');
      await user.click(summaryButton);

      expect(screen.getByTestId('trend-summary-report')).toBeInTheDocument();
      expect(screen.getByText('Trend Analysis Summary')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<TrendAnalysisComponent {...defaultProps} />);
      
      const component = screen.getByTestId('trend-analysis-component');
      expect(component).toHaveAttribute('role', 'region');
      expect(component).toHaveAttribute('aria-label');
      
      const trends = screen.getAllByRole('article');
      expect(trends.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', async () => {
      render(<TrendAnalysisComponent {...defaultProps} />);

      const firstTrend = screen.getByTestId('trend-trend-velocity');
      firstTrend.focus();
      
      expect(document.activeElement).toBe(firstTrend);

      // Tab navigation should work
      fireEvent.keyDown(firstTrend, { key: 'Tab' });
    });

    it('should announce updates to screen readers', () => {
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          announceUpdates={true}
        />
      );

      const announcements = screen.getByTestId('trends-announcements');
      expect(announcements).toHaveAttribute('aria-live', 'polite');
      expect(announcements).toHaveAttribute('aria-atomic', 'true');
    });

    it('should provide alternative data representations', async () => {
      const user = userEvent.setup();
      
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          showDataTable={true}
        />
      );
      
      const dataTableToggle = screen.getByText('Data Table');
      await user.click(dataTableToggle);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Trend')).toBeInTheDocument();
      expect(screen.getByText('Direction')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid trend data gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <TrendAnalysisComponent 
          analysis={null as any}
          onTrendClick={mockOnTrendClick}
        />
      );

      expect(screen.getByTestId('empty-trends-state')).toBeInTheDocument();
      expect(screen.getByText('No trends available')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should handle missing forecast data', () => {
      const trendsWithoutForecast = [{
        ...mockTrendData[0],
        forecast: null as any
      }];

      render(
        <TrendAnalysisComponent 
          analysis={{ ...mockTrendAnalysis, trends: trendsWithoutForecast }}
          onTrendClick={mockOnTrendClick}
        />
      );

      expect(screen.getByText('Team Velocity')).toBeInTheDocument();
    });

    it('should display error state for processing failures', () => {
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          error="Failed to load trend data"
        />
      );

      expect(screen.getByTestId('trends-error-state')).toBeInTheDocument();
      expect(screen.getByText('Failed to load trend data')).toBeInTheDocument();
    });

    it('should validate trend value ranges', () => {
      const invalidTrends = [{
        ...mockTrendData[0],
        currentValue: -1 // Invalid value
      }];

      render(
        <TrendAnalysisComponent 
          analysis={{ ...mockTrendAnalysis, trends: invalidTrends }}
          onTrendClick={mockOnTrendClick}
        />
      );

      expect(screen.getByText('Team Velocity')).toBeInTheDocument();
      expect(screen.getByText('Invalid')).toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    it('should virtualize large trend lists', () => {
      const largeTrendList = Array.from({ length: 100 }, (_, i) => ({
        ...mockTrendData[0],
        id: `trend-${i}`,
        name: `Trend ${i}`
      }));

      render(
        <TrendAnalysisComponent 
          analysis={{ ...mockTrendAnalysis, trends: largeTrendList }}
          onTrendClick={mockOnTrendClick}
          virtualized={true}
        />
      );

      expect(screen.getByTestId('virtualized-trends')).toBeInTheDocument();
    });

    it('should lazy load trend details', async () => {
      const user = userEvent.setup();
      
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          lazyLoadDetails={true}
        />
      );

      const expandButton = screen.getByTestId('expand-button-trend-velocity');
      await user.click(expandButton);

      expect(screen.getByTestId('trend-details-loading')).toBeInTheDocument();
    });

    it('should debounce period selector changes', async () => {
      const user = userEvent.setup();
      
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          showPeriodSelector={true}
          onPeriodChange={mockOnPeriodChange}
        />
      );

      const periodSelect = screen.getByTestId('period-select');
      
      // Rapid selection changes should be debounced
      await user.click(periodSelect);
      await user.click(screen.getByText('Last Week'));
      await user.click(periodSelect);
      await user.click(screen.getByText('Last Month'));
      
      // Should not call period change for every selection
      expect(mockOnPeriodChange).not.toHaveBeenCalledTimes(2);
    });
  });

  describe('Advanced Features', () => {
    it('should support custom trend cards', () => {
      const customTemplate = (trend: TestTrendData) => (
        <div data-testid="custom-trend-template">
          <h3>{trend.name}</h3>
          <p>{trend.currentValue}{trend.unit}</p>
        </div>
      );

      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          customTemplate={customTemplate}
        />
      );

      expect(screen.getAllByTestId('custom-trend-template')).toHaveLength(3);
    });

    it('should support trend grouping by type', () => {
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          groupByType={true}
        />
      );

      expect(screen.getByTestId('type-performance')).toBeInTheDocument();
      expect(screen.getByTestId('type-quality')).toBeInTheDocument();
      expect(screen.getByTestId('type-resource')).toBeInTheDocument();
    });

    it('should calculate trend significance scores', () => {
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          showSignificanceScores={true}
        />
      );

      expect(screen.getByTestId('significance-score')).toBeInTheDocument();
      expect(screen.getByText(/Significance: \d+/)).toBeInTheDocument();
    });

    it('should support trend annotations', () => {
      const annotatedData = {
        ...mockTrendAnalysis,
        trends: [
          {
            ...mockTrendData[0],
            annotations: [
              {
                timestamp: '2024-01-15T00:00:00Z',
                text: 'Sprint planning completed',
                type: 'milestone'
              }
            ]
          },
          ...mockTrendData.slice(1)
        ]
      };

      render(
        <TrendAnalysisComponent 
          analysis={annotatedData}
          onTrendClick={mockOnTrendClick}
        />
      );

      expect(screen.getByTestId('trend-annotation')).toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('should apply light theme correctly', () => {
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          theme="light"
        />
      );

      const component = screen.getByTestId('trend-analysis-component');
      expect(component).toHaveClass('light-theme');
    });

    it('should apply dark theme correctly', () => {
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          theme="dark"
        />
      );

      const component = screen.getByTestId('trend-analysis-component');
      expect(component).toHaveClass('dark-theme');
    });

    it('should support high contrast mode', () => {
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          highContrast={true}
        />
      );

      const component = screen.getByTestId('trend-analysis-component');
      expect(component).toHaveClass('high-contrast');
    });

    it('should support custom color schemes', () => {
      const customColors = {
        improving: '#22c55e',
        declining: '#ef4444',
        stable: '#6b7280'
      };

      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          customColors={customColors}
        />
      );

      const component = screen.getByTestId('trend-analysis-component');
      expect(component).toHaveStyle(`--color-improving: ${customColors.improving}`);
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

      render(<TrendAnalysisComponent {...defaultProps} />);

      const component = screen.getByTestId('trend-analysis-component');
      expect(component).toHaveClass('mobile-view');
    });

    it('should stack trends vertically on small screens', () => {
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          layout="vertical"
        />
      );

      const container = screen.getByTestId('trends-container');
      expect(container).toHaveClass('flex-col');
    });

    it('should show grid layout on large screens', () => {
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          layout="grid"
        />
      );

      const container = screen.getByTestId('trends-container');
      expect(container).toHaveClass('grid');
    });

    it('should adjust columns based on screen size', () => {
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          layout="grid"
          columns="auto"
        />
      );

      const container = screen.getByTestId('trends-container');
      expect(container).toHaveClass('grid-cols-1');
    });
  });

  describe('Integration Features', () => {
    it('should integrate with external analytics systems', () => {
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          showDataSources={true}
        />
      );

      expect(screen.getByText('velocity-tracker')).toBeInTheDocument();
      expect(screen.getByText('quality-monitor')).toBeInTheDocument();
    });

    it('should display trend collection timestamps', () => {
      render(<TrendAnalysisComponent {...defaultProps} />);

      expect(screen.getByText('Last updated: 12:00 PM')).toBeInTheDocument();
    });

    it('should handle webhook notifications', async () => {
      const user = userEvent.setup();
      const mockOnWebhookSetup = vi.fn();
      
      render(
        <TrendAnalysisComponent 
          {...defaultProps} 
          webhookEnabled={true}
          onWebhookSetup={mockOnWebhookSetup}
        />
      );

      const webhookButton = screen.getByText('Setup Webhooks');
      await user.click(webhookButton);

      expect(mockOnWebhookSetup).toHaveBeenCalled();
    });

    it('should support trend alerts and notifications', () => {
      const alertData = {
        ...mockTrendAnalysis,
        alerts: [
          {
            id: 'alert-1',
            trendId: 'trend-quality',
            message: 'Code quality declining rapidly',
            severity: 'critical',
            timestamp: '2024-01-29T11:00:00Z'
          }
        ]
      };

      render(
        <TrendAnalysisComponent 
          analysis={alertData}
          onTrendClick={mockOnTrendClick}
        />
      );

      expect(screen.getByTestId('trend-alert')).toBeInTheDocument();
      expect(screen.getByText('Code quality declining rapidly')).toBeInTheDocument();
    });
  });
});