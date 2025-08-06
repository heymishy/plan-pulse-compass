import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PerformanceMetricsWidget, { 
  PerformanceMetricsWidgetProps,
  PerformanceMetric,
  MetricCategory,
  MetricType,
  MetricStatus,
  TimeRange,
  TrendDirection,
  MetricAlert,
  MetricThreshold,
  PerformanceData
} from '../performance-metrics-widget';

// Mock data interfaces
interface TestMetric extends PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  category: MetricCategory;
  type: MetricType;
  status: MetricStatus;
  trend: TrendDirection;
  previousValue?: number;
  target?: number;
  threshold: MetricThreshold;
  description: string;
  lastUpdated: string;
  dataSource: string;
  historical?: Array<{
    timestamp: string;
    value: number;
  }>;
}

// Mock test data
const mockMetrics: TestMetric[] = [
  {
    id: 'metric-response-time',
    name: 'Response Time',
    value: 245,
    unit: 'ms',
    category: 'performance',
    type: 'latency',
    status: 'warning',
    trend: 'improving',
    previousValue: 280,
    target: 200,
    threshold: {
      critical: 500,
      warning: 300,
      good: 200
    },
    description: 'Average API response time across all endpoints',
    lastUpdated: '2024-01-15T10:30:00Z',
    dataSource: 'api-monitor',
    historical: [
      { timestamp: '2024-01-15T09:00:00Z', value: 280 },
      { timestamp: '2024-01-15T09:30:00Z', value: 265 },
      { timestamp: '2024-01-15T10:00:00Z', value: 252 },
      { timestamp: '2024-01-15T10:30:00Z', value: 245 }
    ]
  },
  {
    id: 'metric-cpu-usage',
    name: 'CPU Usage',
    value: 68,
    unit: '%',
    category: 'system',
    type: 'utilization',
    status: 'good',
    trend: 'stable',
    previousValue: 65,
    target: 70,
    threshold: {
      critical: 90,
      warning: 80,
      good: 70
    },
    description: 'Average CPU utilization across all servers',
    lastUpdated: '2024-01-15T10:30:00Z',
    dataSource: 'system-monitor'
  },
  {
    id: 'metric-error-rate',
    name: 'Error Rate',
    value: 2.5,
    unit: '%',
    category: 'reliability',
    type: 'rate',
    status: 'critical',
    trend: 'declining',
    previousValue: 1.8,
    target: 1.0,
    threshold: {
      critical: 5.0,
      warning: 2.0,
      good: 1.0
    },
    description: 'Percentage of requests resulting in errors',
    lastUpdated: '2024-01-15T10:30:00Z',
    dataSource: 'error-tracker'
  },
  {
    id: 'metric-throughput',
    name: 'Throughput',
    value: 1250,
    unit: 'req/min',
    category: 'performance',
    type: 'throughput',
    status: 'good',
    trend: 'improving',
    previousValue: 1180,
    target: 1500,
    threshold: {
      critical: 500,
      warning: 800,
      good: 1000
    },
    description: 'Number of requests processed per minute',
    lastUpdated: '2024-01-15T10:30:00Z',
    dataSource: 'traffic-monitor'
  }
];

const mockAlerts: MetricAlert[] = [
  {
    id: 'alert-1',
    metricId: 'metric-error-rate',
    type: 'threshold',
    severity: 'critical',
    message: 'Error rate exceeds critical threshold',
    timestamp: '2024-01-15T10:25:00Z',
    acknowledged: false
  }
];

const mockPerformanceData: PerformanceData = {
  metrics: mockMetrics,
  alerts: mockAlerts,
  timeRange: {
    start: '2024-01-15T09:00:00Z',
    end: '2024-01-15T10:30:00Z'
  },
  refreshInterval: 30,
  lastUpdated: '2024-01-15T10:30:00Z'
};

const mockOnMetricClick = vi.fn();
const mockOnAlertAcknowledge = vi.fn();
const mockOnTimeRangeChange = vi.fn();
const mockOnRefresh = vi.fn();
const mockOnExport = vi.fn();
const mockOnThresholdChange = vi.fn();

const defaultProps: PerformanceMetricsWidgetProps = {
  data: mockPerformanceData,
  onMetricClick: mockOnMetricClick
};

describe('PerformanceMetricsWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<PerformanceMetricsWidget {...defaultProps} />);
      
      expect(screen.getByTestId('performance-metrics-widget')).toBeInTheDocument();
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      expect(screen.getByText('Response Time')).toBeInTheDocument();
    });

    it('should render custom title when provided', () => {
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          title="System Performance Dashboard"
        />
      );
      
      expect(screen.getByText('System Performance Dashboard')).toBeInTheDocument();
    });

    it('should render empty state when no metrics provided', () => {
      render(
        <PerformanceMetricsWidget 
          data={{ ...mockPerformanceData, metrics: [] }}
          onMetricClick={mockOnMetricClick}
        />
      );
      
      expect(screen.getByTestId('empty-metrics-state')).toBeInTheDocument();
      expect(screen.getByText('No metrics available')).toBeInTheDocument();
    });

    it('should render metrics with proper status indicators', () => {
      render(<PerformanceMetricsWidget {...defaultProps} />);
      
      expect(screen.getByTestId('status-good')).toBeInTheDocument();
      expect(screen.getByTestId('status-warning')).toBeInTheDocument();
      expect(screen.getByTestId('status-critical')).toBeInTheDocument();
    });

    it('should render metrics with trend indicators', () => {
      render(<PerformanceMetricsWidget {...defaultProps} />);
      
      expect(screen.getByTestId('trend-improving')).toBeInTheDocument();
      expect(screen.getByTestId('trend-stable')).toBeInTheDocument();
      expect(screen.getByTestId('trend-declining')).toBeInTheDocument();
    });

    it('should render alerts when present', () => {
      render(<PerformanceMetricsWidget {...defaultProps} />);
      
      expect(screen.getByTestId('alert-alert-1')).toBeInTheDocument();
      expect(screen.getByText('Error rate exceeds critical threshold')).toBeInTheDocument();
    });
  });

  describe('Metric Interactions', () => {
    it('should handle metric click events', async () => {
      const user = userEvent.setup();
      
      render(<PerformanceMetricsWidget {...defaultProps} />);

      const firstMetric = screen.getByTestId('metric-metric-response-time');
      await user.click(firstMetric);

      expect(mockOnMetricClick).toHaveBeenCalledWith(mockMetrics[0]);
    });

    it('should expand metric details on click', async () => {
      const user = userEvent.setup();
      
      render(<PerformanceMetricsWidget {...defaultProps} />);

      const expandButton = screen.getByTestId('expand-button-metric-response-time');
      await user.click(expandButton);

      expect(screen.getByTestId('metric-details')).toBeInTheDocument();
      expect(screen.getByText('Average API response time across all endpoints')).toBeInTheDocument();
    });

    it('should handle alert acknowledgment', async () => {
      const user = userEvent.setup();
      
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          onAlertAcknowledge={mockOnAlertAcknowledge}
        />
      );

      const ackButton = screen.getByTestId('acknowledge-alert-alert-1');
      await user.click(ackButton);

      expect(mockOnAlertAcknowledge).toHaveBeenCalledWith(mockAlerts[0]);
    });

    it('should toggle metric favorites', async () => {
      const user = userEvent.setup();
      
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          enableFavorites={true}
        />
      );

      const favoriteButton = screen.getByTestId('favorite-button-metric-response-time');
      await user.click(favoriteButton);

      expect(screen.getByLabelText('Remove from favorites')).toBeInTheDocument();
    });
  });

  describe('Filtering and Views', () => {
    it('should filter metrics by category', async () => {
      const user = userEvent.setup();
      
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          showFilters={true}
        />
      );

      const categoryFilter = screen.getByTestId('category-filter');
      await user.click(categoryFilter);
      
      const performanceOption = screen.getByText('Performance');
      await user.click(performanceOption);

      expect(screen.getByText('Response Time')).toBeInTheDocument();
      expect(screen.getByText('Throughput')).toBeInTheDocument();
      expect(screen.queryByText('CPU Usage')).not.toBeInTheDocument();
    });

    it('should filter metrics by status', async () => {
      const user = userEvent.setup();
      
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          showFilters={true}
        />
      );

      const statusFilter = screen.getByTestId('status-filter');
      await user.click(statusFilter);
      
      const criticalOption = screen.getByText('Critical');
      await user.click(criticalOption);

      expect(screen.getByText('Error Rate')).toBeInTheDocument();
      expect(screen.queryByText('Response Time')).not.toBeInTheDocument();
    });

    it('should switch between grid and list views', async () => {
      const user = userEvent.setup();
      
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          showViewToggle={true}
        />
      );

      const viewToggle = screen.getByTestId('view-toggle');
      await user.click(viewToggle);

      expect(screen.getByTestId('metrics-list-view')).toBeInTheDocument();
    });

    it('should show metrics in compact mode', () => {
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          layout="compact"
        />
      );

      const container = screen.getByTestId('metrics-container');
      expect(container).toHaveClass('compact-layout');
    });
  });

  describe('Real-time Updates', () => {
    it('should handle real-time metric updates', () => {
      const { rerender } = render(<PerformanceMetricsWidget {...defaultProps} />);

      // Update metrics
      const updatedData = {
        ...mockPerformanceData,
        metrics: [
          ...mockMetrics,
          {
            id: 'metric-memory',
            name: 'Memory Usage',
            value: 85,
            unit: '%',
            category: 'system' as MetricCategory,
            type: 'utilization' as MetricType,
            status: 'warning' as MetricStatus,
            trend: 'stable' as TrendDirection,
            threshold: { critical: 95, warning: 85, good: 70 },
            description: 'System memory utilization',
            lastUpdated: '2024-01-15T10:35:00Z',
            dataSource: 'system-monitor'
          }
        ]
      };

      rerender(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          data={updatedData}
        />
      );

      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
    });

    it('should show loading state during updates', () => {
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          loading={true}
        />
      );

      expect(screen.getByTestId('metrics-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading metrics...')).toBeInTheDocument();
    });

    it('should auto-refresh metrics when enabled', async () => {
      render(
        <PerformanceMetricsWidget 
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
        <PerformanceMetricsWidget 
          {...defaultProps} 
          autoRefresh={true}
        />
      );

      const pauseButton = screen.getByTestId('pause-refresh-button');
      await user.click(pauseButton);

      expect(screen.getByTestId('play-refresh-button')).toBeInTheDocument();
    });
  });

  describe('Time Range and Historical Data', () => {
    it('should handle time range changes', async () => {
      const user = userEvent.setup();
      
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          showTimeRange={true}
          onTimeRangeChange={mockOnTimeRangeChange}
        />
      );

      const timeRangeSelect = screen.getByTestId('time-range-select');
      await user.click(timeRangeSelect);
      
      const lastHourOption = screen.getByText('Last Hour');
      await user.click(lastHourOption);

      expect(mockOnTimeRangeChange).toHaveBeenCalledWith({
        range: 'hour',
        start: expect.any(String),
        end: expect.any(String)
      });
    });

    it('should display historical trend charts', async () => {
      const user = userEvent.setup();
      
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          showTrendCharts={true}
        />
      );

      const expandButton = screen.getByTestId('expand-button-metric-response-time');
      await user.click(expandButton);

      expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
      expect(screen.getByTestId('historical-data')).toBeInTheDocument();
    });

    it('should compare metrics across time periods', async () => {
      const user = userEvent.setup();
      
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          enableComparison={true}
        />
      );

      const compareButton = screen.getByText('Compare');
      await user.click(compareButton);

      expect(screen.getByTestId('comparison-mode')).toBeInTheDocument();
      expect(screen.getByText('Select time periods to compare')).toBeInTheDocument();
    });
  });

  describe('Threshold Management', () => {
    it('should display threshold indicators', () => {
      render(<PerformanceMetricsWidget {...defaultProps} />);

      expect(screen.getByTestId('threshold-critical')).toBeInTheDocument();
      expect(screen.getByTestId('threshold-warning')).toBeInTheDocument();
      expect(screen.getByTestId('threshold-good')).toBeInTheDocument();
    });

    it('should handle threshold changes', async () => {
      const user = userEvent.setup();
      
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          editableThresholds={true}
          onThresholdChange={mockOnThresholdChange}
        />
      );

      const editThresholdButton = screen.getByTestId('edit-threshold-metric-response-time');
      await user.click(editThresholdButton);

      const warningThresholdInput = screen.getByTestId('warning-threshold-input');
      await user.clear(warningThresholdInput);
      await user.type(warningThresholdInput, '250');

      const saveButton = screen.getByText('Save Thresholds');
      await user.click(saveButton);

      expect(mockOnThresholdChange).toHaveBeenCalledWith(
        'metric-response-time',
        expect.objectContaining({ warning: 250 })
      );
    });

    it('should validate threshold ranges', async () => {
      const user = userEvent.setup();
      
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          editableThresholds={true}
        />
      );

      const editThresholdButton = screen.getByTestId('edit-threshold-metric-response-time');
      await user.click(editThresholdButton);

      // Try to set warning threshold higher than critical
      const warningInput = screen.getByTestId('warning-threshold-input');
      await user.clear(warningInput);
      await user.type(warningInput, '600');

      expect(screen.getByText('Warning threshold must be less than critical threshold')).toBeInTheDocument();
    });
  });

  describe('Alerts and Notifications', () => {
    it('should display active alerts', () => {
      render(<PerformanceMetricsWidget {...defaultProps} />);

      expect(screen.getByTestId('alerts-section')).toBeInTheDocument();
      expect(screen.getByText('Error rate exceeds critical threshold')).toBeInTheDocument();
    });

    it('should handle alert acknowledgment', async () => {
      const user = userEvent.setup();
      
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          onAlertAcknowledge={mockOnAlertAcknowledge}
        />
      );

      const acknowledgeButton = screen.getByTestId('acknowledge-alert-alert-1');
      await user.click(acknowledgeButton);

      expect(mockOnAlertAcknowledge).toHaveBeenCalledWith(mockAlerts[0]);
    });

    it('should show alert severity levels', () => {
      render(<PerformanceMetricsWidget {...defaultProps} />);

      expect(screen.getByTestId('alert-severity-critical')).toBeInTheDocument();
    });

    it('should group alerts by severity', () => {
      const multipleAlerts = {
        ...mockPerformanceData,
        alerts: [
          ...mockAlerts,
          {
            id: 'alert-2',
            metricId: 'metric-cpu-usage',
            type: 'threshold' as const,
            severity: 'warning' as const,
            message: 'CPU usage approaching threshold',
            timestamp: '2024-01-15T10:20:00Z',
            acknowledged: false
          }
        ]
      };

      render(
        <PerformanceMetricsWidget 
          data={multipleAlerts}
          onMetricClick={mockOnMetricClick}
        />
      );

      expect(screen.getByTestId('alerts-critical')).toBeInTheDocument();
      expect(screen.getByTestId('alerts-warning')).toBeInTheDocument();
    });
  });

  describe('Data Visualization', () => {
    it('should render metric value with proper formatting', () => {
      render(<PerformanceMetricsWidget {...defaultProps} />);

      expect(screen.getByText('245')).toBeInTheDocument();
      expect(screen.getByText('ms')).toBeInTheDocument();
      expect(screen.getByText('68%')).toBeInTheDocument();
      expect(screen.getByText('2.5%')).toBeInTheDocument();
    });

    it('should display percentage changes', () => {
      render(<PerformanceMetricsWidget {...defaultProps} />);

      // Response time improved from 280 to 245: ((245-280)/280)*100 = -12.5%
      expect(screen.getByText('-12.5%')).toBeInTheDocument();
    });

    it('should render mini sparkline charts', async () => {
      const user = userEvent.setup();
      
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          showSparklines={true}
        />
      );

      expect(screen.getAllByTestId('sparkline-chart')).toHaveLength(4);
    });

    it('should display target vs actual comparison', () => {
      render(<PerformanceMetricsWidget {...defaultProps} />);

      expect(screen.getByText('Target: 200ms')).toBeInTheDocument();
      expect(screen.getByText('Target: 70%')).toBeInTheDocument();
    });

    it('should render metric progress bars', () => {
      render(<PerformanceMetricsWidget {...defaultProps} />);

      expect(screen.getAllByTestId('metric-progress-bar')).toHaveLength(4);
    });
  });

  describe('Export and Reporting', () => {
    it('should export metrics as CSV', async () => {
      const user = userEvent.setup();
      
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          exportable={true}
          onExport={mockOnExport}
        />
      );

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);

      const csvOption = screen.getByText('CSV Report');
      await user.click(csvOption);

      expect(mockOnExport).toHaveBeenCalledWith('csv', mockPerformanceData);
    });

    it('should export metrics as PDF', async () => {
      const user = userEvent.setup();
      
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          exportable={true}
          onExport={mockOnExport}
        />
      );

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);

      const pdfOption = screen.getByText('PDF Report');
      await user.click(pdfOption);

      expect(mockOnExport).toHaveBeenCalledWith('pdf', mockPerformanceData);
    });

    it('should generate performance summary report', async () => {
      const user = userEvent.setup();
      
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          showSummary={true}
        />
      );

      const summaryButton = screen.getByText('Summary');
      await user.click(summaryButton);

      expect(screen.getByTestId('performance-summary')).toBeInTheDocument();
      expect(screen.getByText('Overall Performance: Good')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<PerformanceMetricsWidget {...defaultProps} />);
      
      const widget = screen.getByTestId('performance-metrics-widget');
      expect(widget).toHaveAttribute('role', 'region');
      expect(widget).toHaveAttribute('aria-label');
      
      const metrics = screen.getAllByRole('button');
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', async () => {
      render(<PerformanceMetricsWidget {...defaultProps} />);

      const firstMetric = screen.getByTestId('metric-metric-response-time');
      firstMetric.focus();
      
      expect(document.activeElement).toBe(firstMetric);

      // Tab navigation should work
      fireEvent.keyDown(firstMetric, { key: 'Tab' });
    });

    it('should announce updates to screen readers', () => {
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          announceUpdates={true}
        />
      );

      const announcements = screen.getByTestId('metrics-announcements');
      expect(announcements).toHaveAttribute('aria-live', 'polite');
      expect(announcements).toHaveAttribute('aria-atomic', 'true');
    });

    it('should provide alternative text representations', () => {
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          showDataTable={true}
        />
      );
      
      const dataTableToggle = screen.getByText('Data Table');
      expect(dataTableToggle).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid metric data gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <PerformanceMetricsWidget 
          data={null as any}
          onMetricClick={mockOnMetricClick}
        />
      );

      expect(screen.getByTestId('empty-metrics-state')).toBeInTheDocument();
      expect(screen.getByText('No metrics available')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should handle missing threshold data', () => {
      const metricsWithoutThresholds = [{
        ...mockMetrics[0],
        threshold: null as any
      }];

      render(
        <PerformanceMetricsWidget 
          data={{ ...mockPerformanceData, metrics: metricsWithoutThresholds }}
          onMetricClick={mockOnMetricClick}
        />
      );

      expect(screen.getByText('Response Time')).toBeInTheDocument();
    });

    it('should display error state for data processing failures', () => {
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          error="Failed to load performance data"
        />
      );

      expect(screen.getByTestId('metrics-error-state')).toBeInTheDocument();
      expect(screen.getByText('Failed to load performance data')).toBeInTheDocument();
    });

    it('should validate metric value ranges', () => {
      const invalidMetrics = [{
        ...mockMetrics[0],
        value: -1 // Invalid value
      }];

      render(
        <PerformanceMetricsWidget 
          data={{ ...mockPerformanceData, metrics: invalidMetrics }}
          onMetricClick={mockOnMetricClick}
        />
      );

      expect(screen.getByText('Response Time')).toBeInTheDocument();
      expect(screen.getByText('Invalid')).toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    it('should virtualize large metric lists', () => {
      const largeMetricList = Array.from({ length: 100 }, (_, i) => ({
        ...mockMetrics[0],
        id: `metric-${i}`,
        name: `Metric ${i}`
      }));

      render(
        <PerformanceMetricsWidget 
          data={{ ...mockPerformanceData, metrics: largeMetricList }}
          onMetricClick={mockOnMetricClick}
          virtualized={true}
        />
      );

      expect(screen.getByTestId('virtualized-metrics')).toBeInTheDocument();
    });

    it('should lazy load metric details', async () => {
      const user = userEvent.setup();
      
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          lazyLoadDetails={true}
        />
      );

      const expandButton = screen.getByTestId('expand-button-metric-response-time');
      await user.click(expandButton);

      expect(screen.getByTestId('metric-details-loading')).toBeInTheDocument();
    });

    it('should debounce threshold input changes', async () => {
      const user = userEvent.setup();
      
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          editableThresholds={true}
          onThresholdChange={mockOnThresholdChange}
        />
      );

      const editButton = screen.getByTestId('edit-threshold-metric-response-time');
      await user.click(editButton);

      const thresholdInput = screen.getByTestId('warning-threshold-input');
      
      // Rapid typing should be debounced
      await user.type(thresholdInput, '250');
      
      // Should not call threshold change for every keystroke
      expect(mockOnThresholdChange).not.toHaveBeenCalledTimes(3);
    });
  });

  describe('Advanced Features', () => {
    it('should support custom metric cards', () => {
      const customTemplate = (metric: TestMetric) => (
        <div data-testid="custom-metric-template">
          <h3>{metric.name}</h3>
          <p>{metric.value}{metric.unit}</p>
        </div>
      );

      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          customTemplate={customTemplate}
        />
      );

      expect(screen.getAllByTestId('custom-metric-template')).toHaveLength(4);
    });

    it('should support metric drill-down', async () => {
      const user = userEvent.setup();
      const mockOnDrillDown = vi.fn();
      
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          drillDownEnabled={true}
          onDrillDown={mockOnDrillDown}
        />
      );

      const metric = screen.getByTestId('metric-metric-response-time');
      await user.dblClick(metric);

      expect(mockOnDrillDown).toHaveBeenCalledWith(mockMetrics[0]);
    });

    it('should support metric grouping by category', () => {
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          groupByCategory={true}
        />
      );

      expect(screen.getByTestId('category-performance')).toBeInTheDocument();
      expect(screen.getByTestId('category-system')).toBeInTheDocument();
      expect(screen.getByTestId('category-reliability')).toBeInTheDocument();
    });

    it('should calculate performance scores', () => {
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          showPerformanceScore={true}
        />
      );

      expect(screen.getByTestId('performance-score')).toBeInTheDocument();
      expect(screen.getByText(/Performance Score: \d+/)).toBeInTheDocument();
    });

    it('should support metric annotations', () => {
      const annotatedData = {
        ...mockPerformanceData,
        metrics: [
          {
            ...mockMetrics[0],
            annotations: [
              {
                timestamp: '2024-01-15T10:00:00Z',
                text: 'Deployment completed',
                type: 'deployment'
              }
            ]
          },
          ...mockMetrics.slice(1)
        ]
      };

      render(
        <PerformanceMetricsWidget 
          data={annotatedData}
          onMetricClick={mockOnMetricClick}
        />
      );

      expect(screen.getByTestId('metric-annotation')).toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('should apply light theme correctly', () => {
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          theme="light"
        />
      );

      const widget = screen.getByTestId('performance-metrics-widget');
      expect(widget).toHaveClass('light-theme');
    });

    it('should apply dark theme correctly', () => {
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          theme="dark"
        />
      );

      const widget = screen.getByTestId('performance-metrics-widget');
      expect(widget).toHaveClass('dark-theme');
    });

    it('should support high contrast mode', () => {
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          highContrast={true}
        />
      );

      const widget = screen.getByTestId('performance-metrics-widget');
      expect(widget).toHaveClass('high-contrast');
    });

    it('should support custom color schemes', () => {
      const customColors = {
        good: '#22c55e',
        warning: '#f59e0b',
        critical: '#ef4444'
      };

      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          customColors={customColors}
        />
      );

      const widget = screen.getByTestId('performance-metrics-widget');
      expect(widget).toHaveStyle(`--color-good: ${customColors.good}`);
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

      render(<PerformanceMetricsWidget {...defaultProps} />);

      const widget = screen.getByTestId('performance-metrics-widget');
      expect(widget).toHaveClass('mobile-view');
    });

    it('should stack metrics vertically on small screens', () => {
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          layout="vertical"
        />
      );

      const container = screen.getByTestId('metrics-container');
      expect(container).toHaveClass('flex-col');
    });

    it('should show grid layout on large screens', () => {
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          layout="grid"
        />
      );

      const container = screen.getByTestId('metrics-container');
      expect(container).toHaveClass('grid');
    });

    it('should adjust columns based on screen size', () => {
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          layout="grid"
          columns="auto"
        />
      );

      const container = screen.getByTestId('metrics-container');
      expect(container).toHaveClass('grid-cols-1');
    });
  });

  describe('Integration Features', () => {
    it('should integrate with external monitoring systems', () => {
      render(
        <PerformanceMetricsWidget 
          {...defaultProps} 
          showDataSources={true}
        />
      );

      expect(screen.getByText('api-monitor')).toBeInTheDocument();
      expect(screen.getByText('system-monitor')).toBeInTheDocument();
      expect(screen.getByText('error-tracker')).toBeInTheDocument();
    });

    it('should display metric collection timestamps', () => {
      render(<PerformanceMetricsWidget {...defaultProps} />);

      expect(screen.getByText('Last updated: 10:30 AM')).toBeInTheDocument();
    });

    it('should handle webhook notifications', async () => {
      const user = userEvent.setup();
      const mockOnWebhookSetup = vi.fn();
      
      render(
        <PerformanceMetricsWidget 
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
});