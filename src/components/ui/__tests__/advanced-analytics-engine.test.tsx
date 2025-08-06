import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdvancedAnalyticsEngine, {
  AdvancedAnalyticsEngineProps,
  AnalyticsDataPoint,
  AnalyticsChart,
  AnalyticsReport,
  ChartType,
  TimeRange,
  MetricType,
  AnalyticsFilter,
  AnalyticsInsight,
  AnalyticsConfig,
  ExportFormat,
  DrillDownLevel
} from '../advanced-analytics-engine';

// Mock data
const mockDataPoints: AnalyticsDataPoint[] = [
  {
    id: 'dp-1',
    timestamp: '2024-01-15T10:00:00Z',
    value: 75,
    metric: 'performance',
    category: 'system',
    labels: { region: 'us-east', service: 'api' }
  },
  {
    id: 'dp-2',
    timestamp: '2024-01-15T11:00:00Z',
    value: 82,
    metric: 'performance',
    category: 'system',
    labels: { region: 'us-east', service: 'api' }
  },
  {
    id: 'dp-3',
    timestamp: '2024-01-15T10:00:00Z',
    value: 68,
    metric: 'performance',
    category: 'system',
    labels: { region: 'us-west', service: 'web' }
  },
  {
    id: 'dp-4',
    timestamp: '2024-01-15T10:00:00Z',
    value: 1500,
    metric: 'usage',
    category: 'traffic',
    labels: { region: 'us-east', service: 'api' }
  }
];

const mockCharts: AnalyticsChart[] = [
  {
    id: 'chart-1',
    title: 'Performance Metrics',
    type: 'line',
    dataPoints: mockDataPoints.slice(0, 3),
    config: {
      xAxis: 'timestamp',
      yAxis: 'value',
      groupBy: 'region',
      aggregation: 'avg'
    },
    timeRange: { start: '2024-01-15T00:00:00Z', end: '2024-01-15T23:59:59Z' }
  },
  {
    id: 'chart-2',
    title: 'Usage Statistics',
    type: 'bar',
    dataPoints: [mockDataPoints[3]],
    config: {
      xAxis: 'service',
      yAxis: 'value',
      groupBy: 'region',
      aggregation: 'sum'
    },
    timeRange: { start: '2024-01-15T00:00:00Z', end: '2024-01-15T23:59:59Z' }
  },
  {
    id: 'chart-3',
    title: 'System Overview',
    type: 'pie',
    dataPoints: mockDataPoints,
    config: {
      xAxis: 'category',
      yAxis: 'value',
      groupBy: 'metric',
      aggregation: 'count'
    },
    timeRange: { start: '2024-01-15T00:00:00Z', end: '2024-01-15T23:59:59Z' }
  }
];

const mockInsights: AnalyticsInsight[] = [
  {
    id: 'insight-1',
    title: 'Performance Improvement',
    description: 'Performance metrics show 8% improvement over last hour',
    type: 'trend',
    severity: 'info',
    confidence: 0.85,
    recommendations: ['Continue current optimization strategy'],
    metadata: {
      trend: 'increasing',
      changePercent: 8,
      baseline: 75
    }
  },
  {
    id: 'insight-2',
    title: 'Regional Performance Gap',
    description: 'US-West region showing 10% lower performance than US-East',
    type: 'anomaly',
    severity: 'warning',
    confidence: 0.92,
    recommendations: ['Investigate US-West infrastructure', 'Consider load balancing'],
    metadata: {
      affectedRegions: ['us-west'],
      performanceGap: 10
    }
  }
];

const mockReports: AnalyticsReport[] = [
  {
    id: 'report-1',
    name: 'Daily Performance Report',
    description: 'Comprehensive daily performance analytics',
    charts: mockCharts,
    insights: mockInsights,
    generatedAt: '2024-01-15T12:00:00Z',
    timeRange: { start: '2024-01-15T00:00:00Z', end: '2024-01-15T23:59:59Z' },
    filters: []
  }
];

const mockFilters: AnalyticsFilter[] = [
  {
    id: 'filter-1',
    field: 'region',
    operator: 'equals',
    value: 'us-east',
    label: 'US East Region'
  },
  {
    id: 'filter-2',
    field: 'metric',
    operator: 'in',
    value: ['performance', 'usage'],
    label: 'Performance & Usage Metrics'
  }
];

const mockConfig: AnalyticsConfig = {
  refreshInterval: 30000,
  maxDataPoints: 1000,
  defaultTimeRange: { start: '2024-01-15T00:00:00Z', end: '2024-01-15T23:59:59Z' },
  enableRealTime: true,
  enableDrillDown: true,
  enableExport: true,
  thresholds: {
    performance: { warning: 70, critical: 50 },
    usage: { warning: 80, critical: 95 }
  }
};

const mockOnChartClick = vi.fn();
const mockOnInsightClick = vi.fn();
const mockOnDrillDown = vi.fn();
const mockOnTimeRangeChange = vi.fn();
const mockOnFilterChange = vi.fn();
const mockOnConfigChange = vi.fn();
const mockOnExport = vi.fn();
const mockOnRefresh = vi.fn();

const defaultProps: AdvancedAnalyticsEngineProps = {
  dataPoints: mockDataPoints,
  charts: mockCharts,
  insights: mockInsights,
  reports: mockReports,
  config: mockConfig,
  onChartClick: mockOnChartClick,
  onInsightClick: mockOnInsightClick,
  onDrillDown: mockOnDrillDown,
  onTimeRangeChange: mockOnTimeRangeChange,
  onFilterChange: mockOnFilterChange,
  onConfigChange: mockOnConfigChange,
  onExport: mockOnExport,
  onRefresh: mockOnRefresh
};

describe('AdvancedAnalyticsEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} />);
      
      expect(screen.getByTestId('advanced-analytics-engine')).toBeInTheDocument();
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    });

    it('should render custom title', () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} title="Custom Analytics" />);
      
      expect(screen.getByText('Custom Analytics')).toBeInTheDocument();
    });

    it('should display data points summary', () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} />);
      
      expect(screen.getByTestId('data-points-summary')).toBeInTheDocument();
      expect(screen.getByText('4 data points')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} loading={true} />);
      
      expect(screen.getByTestId('analytics-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
    });

    it('should render error state', () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} error="Failed to load analytics data" />);
      
      expect(screen.getByTestId('analytics-error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument();
    });

    it('should render empty state when no data', () => {
      render(
        <AdvancedAnalyticsEngine 
          {...defaultProps} 
          dataPoints={[]} 
          charts={[]} 
          insights={[]} 
        />
      );
      
      expect(screen.getByTestId('analytics-empty-state')).toBeInTheDocument();
      expect(screen.getByText('No analytics data available')).toBeInTheDocument();
    });
  });

  describe('Chart Display and Interaction', () => {
    it('should display all charts', () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} />);
      
      expect(screen.getByTestId('chart-chart-1')).toBeInTheDocument();
      expect(screen.getByTestId('chart-chart-2')).toBeInTheDocument();
      expect(screen.getByTestId('chart-chart-3')).toBeInTheDocument();
    });

    it('should show chart types', () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} />);
      
      expect(screen.getByTestId('chart-type-line')).toBeInTheDocument();
      expect(screen.getByTestId('chart-type-bar')).toBeInTheDocument();
      expect(screen.getByTestId('chart-type-pie')).toBeInTheDocument();
    });

    it('should handle chart clicks', async () => {
      const user = userEvent.setup();
      render(<AdvancedAnalyticsEngine {...defaultProps} />);

      const chart = screen.getByTestId('chart-chart-1');
      await user.click(chart);

      expect(mockOnChartClick).toHaveBeenCalledWith(mockCharts[0]);
    });

    it('should display chart titles', () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} />);
      
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      expect(screen.getByText('Usage Statistics')).toBeInTheDocument();
      expect(screen.getByText('System Overview')).toBeInTheDocument();
    });

    it('should show chart data point counts', () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} showChartStats={true} />);
      
      expect(screen.getByTestId('chart-stats-chart-1')).toBeInTheDocument();
      expect(screen.getByText('3 data points')).toBeInTheDocument();
    });

    it('should support chart zoom', async () => {
      const user = userEvent.setup();
      render(<AdvancedAnalyticsEngine {...defaultProps} enableZoom={true} />);

      const zoomButton = screen.getByTestId('zoom-chart-1');
      await user.click(zoomButton);

      expect(screen.getByTestId('chart-zoomed')).toBeInTheDocument();
    });

    it('should handle chart drill down', async () => {
      const user = userEvent.setup();
      render(<AdvancedAnalyticsEngine {...defaultProps} />);

      const drillDownButton = screen.getByTestId('drill-down-chart-1');
      await user.click(drillDownButton);

      expect(mockOnDrillDown).toHaveBeenCalledWith('chart-1', expect.any(Object));
    });
  });

  describe('Insights Display', () => {
    it('should display all insights', () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} showInsights={true} />);
      
      expect(screen.getByTestId('analytics-insights')).toBeInTheDocument();
      expect(screen.getByText('Performance Improvement')).toBeInTheDocument();
      expect(screen.getByText('Regional Performance Gap')).toBeInTheDocument();
    });

    it('should show insight types and severity', () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} showInsights={true} />);
      
      expect(screen.getByTestId('insight-type-trend')).toBeInTheDocument();
      expect(screen.getByTestId('insight-type-anomaly')).toBeInTheDocument();
      expect(screen.getByTestId('insight-severity-info')).toBeInTheDocument();
      expect(screen.getByTestId('insight-severity-warning')).toBeInTheDocument();
    });

    it('should display insight confidence levels', () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} showInsights={true} />);
      
      expect(screen.getByText('85% confidence')).toBeInTheDocument();
      expect(screen.getByText('92% confidence')).toBeInTheDocument();
    });

    it('should handle insight clicks', async () => {
      const user = userEvent.setup();
      render(<AdvancedAnalyticsEngine {...defaultProps} showInsights={true} />);

      const insight = screen.getByTestId('insight-insight-1');
      await user.click(insight);

      expect(mockOnInsightClick).toHaveBeenCalledWith(mockInsights[0]);
    });

    it('should show insight recommendations', async () => {
      const user = userEvent.setup();
      render(<AdvancedAnalyticsEngine {...defaultProps} showInsights={true} />);

      const expandButton = screen.getByTestId('expand-insight-insight-1');
      await user.click(expandButton);

      expect(screen.getByText('Continue current optimization strategy')).toBeInTheDocument();
    });

    it('should filter insights by severity', async () => {
      const user = userEvent.setup();
      render(<AdvancedAnalyticsEngine {...defaultProps} showInsights={true} showFilters={true} />);

      const severityFilter = screen.getByTestId('insight-severity-filter');
      await user.click(severityFilter);
      
      const warningOption = screen.getByText('Warning Only');
      await user.click(warningOption);

      expect(screen.getByTestId('insight-insight-2')).toBeInTheDocument();
      expect(screen.queryByTestId('insight-insight-1')).not.toBeInTheDocument();
    });
  });

  describe('Time Range Control', () => {
    it('should display time range selector', () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} showTimeRange={true} />);
      
      expect(screen.getByTestId('time-range-selector')).toBeInTheDocument();
    });

    it('should handle time range changes', async () => {
      const user = userEvent.setup();
      render(<AdvancedAnalyticsEngine {...defaultProps} showTimeRange={true} />);

      const timeRangeSelect = screen.getByTestId('time-range-select');
      await user.click(timeRangeSelect);
      
      const lastHourOption = screen.getByText('Last Hour');
      await user.click(lastHourOption);

      expect(mockOnTimeRangeChange).toHaveBeenCalled();
    });

    it('should display custom time range picker', async () => {
      const user = userEvent.setup();
      render(<AdvancedAnalyticsEngine {...defaultProps} showTimeRange={true} />);

      const customRangeButton = screen.getByTestId('custom-time-range');
      await user.click(customRangeButton);

      expect(screen.getByTestId('time-range-picker')).toBeInTheDocument();
    });

    it('should show real-time indicator', () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} realTime={true} />);
      
      expect(screen.getByTestId('real-time-indicator')).toBeInTheDocument();
      expect(screen.getByText('Live data')).toBeInTheDocument();
    });
  });

  describe('Filtering and Search', () => {
    it('should display filter controls', () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} showFilters={true} />);
      
      expect(screen.getByTestId('analytics-filters')).toBeInTheDocument();
    });

    it('should apply metric filters', async () => {
      const user = userEvent.setup();
      render(<AdvancedAnalyticsEngine {...defaultProps} showFilters={true} />);

      const metricFilter = screen.getByTestId('metric-filter');
      await user.click(metricFilter);
      
      const performanceOption = screen.getByText('Performance');
      await user.click(performanceOption);

      expect(mockOnFilterChange).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ field: 'metric', value: 'performance' })
      ]));
    });

    it('should apply category filters', async () => {
      const user = userEvent.setup();
      render(<AdvancedAnalyticsEngine {...defaultProps} showFilters={true} />);

      const categoryFilter = screen.getByTestId('category-filter');
      await user.click(categoryFilter);
      
      const systemOption = screen.getByText('System');
      await user.click(systemOption);

      expect(mockOnFilterChange).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ field: 'category', value: 'system' })
      ]));
    });

    it('should support text search', async () => {
      const user = userEvent.setup();
      render(<AdvancedAnalyticsEngine {...defaultProps} searchable={true} />);

      const searchInput = screen.getByTestId('analytics-search');
      await user.type(searchInput, 'performance');

      expect(screen.getByDisplayValue('performance')).toBeInTheDocument();
    });

    it('should clear all filters', async () => {
      const user = userEvent.setup();
      render(<AdvancedAnalyticsEngine {...defaultProps} showFilters={true} />);

      const clearFiltersButton = screen.getByTestId('clear-filters');
      await user.click(clearFiltersButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Report Generation', () => {
    it('should display reports section', () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} showReports={true} />);
      
      expect(screen.getByTestId('analytics-reports')).toBeInTheDocument();
      expect(screen.getByText('Daily Performance Report')).toBeInTheDocument();
    });

    it('should generate new report', async () => {
      const user = userEvent.setup();
      const mockOnGenerateReport = vi.fn();
      
      render(
        <AdvancedAnalyticsEngine 
          {...defaultProps} 
          showReports={true} 
          onGenerateReport={mockOnGenerateReport} 
        />
      );

      const generateButton = screen.getByTestId('generate-report');
      await user.click(generateButton);

      expect(mockOnGenerateReport).toHaveBeenCalled();
    });

    it('should schedule reports', async () => {
      const user = userEvent.setup();
      const mockOnScheduleReport = vi.fn();
      
      render(
        <AdvancedAnalyticsEngine 
          {...defaultProps} 
          showReports={true}
          onScheduleReport={mockOnScheduleReport}
        />
      );

      const scheduleButton = screen.getByTestId('schedule-report');
      await user.click(scheduleButton);

      expect(screen.getByTestId('report-scheduler')).toBeInTheDocument();
      
      const saveScheduleButton = screen.getByText('Save Schedule');
      await user.click(saveScheduleButton);

      expect(mockOnScheduleReport).toHaveBeenCalled();
    });

    it('should display report metadata', () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} showReports={true} />);
      
      expect(screen.getByText('Generated')).toBeInTheDocument();
      expect(screen.getByText(/2024-01-15/)).toBeInTheDocument();
    });
  });

  describe('Export and Sharing', () => {
    it('should export charts as images', async () => {
      const user = userEvent.setup();
      render(<AdvancedAnalyticsEngine {...defaultProps} exportable={true} />);

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);
      
      const pngOption = screen.getByText('Export as PNG');
      await user.click(pngOption);

      expect(mockOnExport).toHaveBeenCalledWith('png', expect.any(Object));
    });

    it('should export data as CSV', async () => {
      const user = userEvent.setup();
      render(<AdvancedAnalyticsEngine {...defaultProps} exportable={true} />);

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);
      
      const csvOption = screen.getByText('Export as CSV');
      await user.click(csvOption);

      expect(mockOnExport).toHaveBeenCalledWith('csv', mockDataPoints);
    });

    it('should export reports as PDF', async () => {
      const user = userEvent.setup();
      render(<AdvancedAnalyticsEngine {...defaultProps} exportable={true} />);

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);
      
      const pdfOption = screen.getByText('Export Report as PDF');
      await user.click(pdfOption);

      expect(mockOnExport).toHaveBeenCalledWith('pdf', expect.any(Object));
    });

    it('should share analytics dashboard', async () => {
      const user = userEvent.setup();
      const mockOnShare = vi.fn();
      
      render(
        <AdvancedAnalyticsEngine 
          {...defaultProps} 
          shareable={true}
          onShare={mockOnShare}
        />
      );

      const shareButton = screen.getByTestId('share-dashboard');
      await user.click(shareButton);

      expect(mockOnShare).toHaveBeenCalled();
    });
  });

  describe('Configuration and Settings', () => {
    it('should display configuration panel', () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} showSettings={true} />);
      
      expect(screen.getByTestId('analytics-settings')).toBeInTheDocument();
    });

    it('should toggle real-time updates', async () => {
      const user = userEvent.setup();
      render(<AdvancedAnalyticsEngine {...defaultProps} showSettings={true} />);

      const realTimeToggle = screen.getByTestId('real-time-toggle');
      await user.click(realTimeToggle);

      expect(mockOnConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ enableRealTime: false })
      );
    });

    it('should configure refresh interval', async () => {
      const user = userEvent.setup();
      render(<AdvancedAnalyticsEngine {...defaultProps} showSettings={true} />);

      const refreshIntervalInput = screen.getByTestId('refresh-interval-input');
      await user.clear(refreshIntervalInput);
      await user.type(refreshIntervalInput, '60000');

      expect(mockOnConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ refreshInterval: 60000 })
      );
    });

    it('should configure data thresholds', async () => {
      const user = userEvent.setup();
      render(<AdvancedAnalyticsEngine {...defaultProps} showSettings={true} />);

      const thresholdButton = screen.getByTestId('configure-thresholds');
      await user.click(thresholdButton);

      expect(screen.getByTestId('threshold-config')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should show auto-refresh indicator', () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} autoRefresh={true} />);
      
      expect(screen.getByTestId('auto-refresh-indicator')).toBeInTheDocument();
    });

    it('should handle manual refresh', async () => {
      const user = userEvent.setup();
      render(<AdvancedAnalyticsEngine {...defaultProps} />);

      const refreshButton = screen.getByTestId('refresh-button');
      await user.click(refreshButton);

      expect(mockOnRefresh).toHaveBeenCalled();
    });

    it('should update data in real-time', () => {
      const { rerender } = render(<AdvancedAnalyticsEngine {...defaultProps} />);

      const updatedDataPoints = [
        ...mockDataPoints,
        {
          id: 'dp-5',
          timestamp: '2024-01-15T12:00:00Z',
          value: 90,
          metric: 'performance',
          category: 'system',
          labels: { region: 'us-central', service: 'api' }
        }
      ];

      rerender(<AdvancedAnalyticsEngine {...defaultProps} dataPoints={updatedDataPoints} />);

      expect(screen.getByText('5 data points')).toBeInTheDocument();
    });
  });

  describe('Performance Features', () => {
    it('should virtualize large datasets', () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        ...mockDataPoints[0],
        id: `dp-${i}`,
        value: Math.random() * 100
      }));

      render(
        <AdvancedAnalyticsEngine 
          {...defaultProps} 
          dataPoints={largeDataset}
          virtualized={true}
        />
      );

      expect(screen.getByTestId('virtualized-analytics')).toBeInTheDocument();
    });

    it('should lazy load chart details', async () => {
      const user = userEvent.setup();
      render(<AdvancedAnalyticsEngine {...defaultProps} lazyLoadCharts={true} />);

      const expandButton = screen.getByTestId('expand-chart-chart-1');
      await user.click(expandButton);

      expect(screen.getByTestId('chart-loading')).toBeInTheDocument();
    });

    it('should cache analytics results', () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} cacheResults={true} />);
      
      expect(screen.getByTestId('cache-indicator')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} />);
      
      const engine = screen.getByTestId('advanced-analytics-engine');
      expect(engine).toHaveAttribute('role', 'region');
      expect(engine).toHaveAttribute('aria-label', 'Advanced Analytics Engine');
    });

    it('should support keyboard navigation', async () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} />);

      const firstChart = screen.getByTestId('chart-chart-1');
      firstChart.focus();
      
      expect(document.activeElement).toBe(firstChart);

      fireEvent.keyDown(firstChart, { key: 'Tab' });
    });

    it('should announce updates to screen readers', () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} announceUpdates={true} />);

      const announcements = screen.getByTestId('analytics-announcements');
      expect(announcements).toHaveAttribute('aria-live', 'polite');
      expect(announcements).toHaveAttribute('aria-atomic', 'true');
    });

    it('should provide chart data in accessible format', () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} />);

      const chartTable = screen.getByTestId('chart-data-table-chart-1');
      expect(chartTable).toHaveAttribute('role', 'table');
      expect(chartTable).toHaveAttribute('aria-label', 'Performance Metrics chart data');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid data points', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <AdvancedAnalyticsEngine 
          {...defaultProps} 
          dataPoints={null as any}
        />
      );

      expect(screen.getByTestId('analytics-empty-state')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should handle chart rendering errors', () => {
      const invalidCharts = [
        {
          ...mockCharts[0],
          dataPoints: null as any
        }
      ];

      render(
        <AdvancedAnalyticsEngine 
          {...defaultProps} 
          charts={invalidCharts}
        />
      );

      expect(screen.getByTestId('chart-error-chart-1')).toBeInTheDocument();
    });

    it('should handle API failures gracefully', () => {
      render(
        <AdvancedAnalyticsEngine 
          {...defaultProps} 
          error="Failed to connect to analytics service"
        />
      );

      expect(screen.getByTestId('analytics-error')).toBeInTheDocument();
      expect(screen.getByText('Failed to connect to analytics service')).toBeInTheDocument();
    });

    it('should recover from network errors', async () => {
      const user = userEvent.setup();
      render(
        <AdvancedAnalyticsEngine 
          {...defaultProps} 
          error="Network error"
        />
      );

      const retryButton = screen.getByTestId('retry-button');
      await user.click(retryButton);

      expect(mockOnRefresh).toHaveBeenCalled();
    });
  });

  describe('Advanced Features', () => {
    it('should support custom chart renderers', () => {
      const customRenderer = (chart: AnalyticsChart) => (
        <div data-testid="custom-chart-renderer">
          Custom: {chart.title}
        </div>
      );

      render(
        <AdvancedAnalyticsEngine 
          {...defaultProps} 
          customChartRenderer={customRenderer}
        />
      );

      expect(screen.getAllByTestId('custom-chart-renderer')).toHaveLength(3);
    });

    it('should support drill-down analytics', async () => {
      const user = userEvent.setup();
      render(<AdvancedAnalyticsEngine {...defaultProps} />);

      const drillDownButton = screen.getByTestId('drill-down-chart-1');
      await user.click(drillDownButton);

      expect(screen.getByTestId('drill-down-view')).toBeInTheDocument();
      expect(mockOnDrillDown).toHaveBeenCalledWith('chart-1', expect.any(Object));
    });

    it('should support predictive analytics', () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} showPredictions={true} />);
      
      expect(screen.getByTestId('predictive-analytics')).toBeInTheDocument();
      expect(screen.getByText('Predictions')).toBeInTheDocument();
    });

    it('should support anomaly detection', () => {
      render(<AdvancedAnalyticsEngine {...defaultProps} enableAnomalyDetection={true} />);
      
      expect(screen.getByTestId('anomaly-detection')).toBeInTheDocument();
    });

    it('should support correlation analysis', async () => {
      const user = userEvent.setup();
      render(<AdvancedAnalyticsEngine {...defaultProps} showCorrelation={true} />);

      const correlationButton = screen.getByTestId('correlation-analysis');
      await user.click(correlationButton);

      expect(screen.getByTestId('correlation-matrix')).toBeInTheDocument();
    });
  });
});