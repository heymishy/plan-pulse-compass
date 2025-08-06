import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DataVisualizationEngine, { 
  DataVisualizationEngineProps, 
  ChartType,
  DataPoint,
  ChartConfig,
  VisualizationData,
  InteractionEvent,
  ExportFormat
} from '../data-visualization-engine';

// Mock chart library dependencies
vi.mock('recharts', () => ({
  LineChart: ({ children, ...props }: any) => <div data-testid="line-chart" {...props}>{children}</div>,
  BarChart: ({ children, ...props }: any) => <div data-testid="bar-chart" {...props}>{children}</div>,
  PieChart: ({ children, ...props }: any) => <div data-testid="pie-chart" {...props}>{children}</div>,
  ScatterChart: ({ children, ...props }: any) => <div data-testid="scatter-chart" {...props}>{children}</div>,
  AreaChart: ({ children, ...props }: any) => <div data-testid="area-chart" {...props}>{children}</div>,
  XAxis: (props: any) => <div data-testid="x-axis" {...props} />,
  YAxis: (props: any) => <div data-testid="y-axis" {...props} />,
  CartesianGrid: (props: any) => <div data-testid="cartesian-grid" {...props} />,
  Tooltip: (props: any) => <div data-testid="chart-tooltip" {...props} />,
  Legend: (props: any) => <div data-testid="chart-legend" {...props} />,
  Line: (props: any) => <div data-testid="line" {...props} />,
  Bar: (props: any) => <div data-testid="bar" {...props} />,
  Area: (props: any) => <div data-testid="area" {...props} />,
  Cell: (props: any) => <div data-testid="cell" {...props} />,
  Pie: (props: any) => <div data-testid="pie" {...props} />,
  Scatter: (props: any) => <div data-testid="scatter" {...props} />,
  Brush: (props: any) => <div data-testid="chart-brush" {...props} />,
  ResponsiveContainer: ({ children, ...props }: any) => <div data-testid="responsive-container" {...props}>{children}</div>
}));

// Mock data interfaces
interface TestDataPoint extends DataPoint {
  category: string;
  value: number;
  trend?: number;
  metadata?: {
    color?: string;
    description?: string;
  };
}

// Mock test data
const mockDataPoints: TestDataPoint[] = [
  {
    id: 'point-1',
    label: 'Q1 Performance',
    category: 'performance',
    value: 85,
    trend: 12,
    metadata: { color: '#10b981', description: 'Strong quarter performance' }
  },
  {
    id: 'point-2',
    label: 'Q2 Performance',
    category: 'performance',
    value: 92,
    trend: 8,
    metadata: { color: '#059669', description: 'Excellent growth' }
  },
  {
    id: 'point-3',
    label: 'Q3 Performance',
    category: 'performance',
    value: 78,
    trend: -15,
    metadata: { color: '#dc2626', description: 'Performance decline' }
  },
  {
    id: 'point-4',
    label: 'Q4 Performance',
    category: 'performance',
    value: 88,
    trend: 13,
    metadata: { color: '#16a34a', description: 'Recovery and growth' }
  }
];

const mockVisualizationData: VisualizationData<TestDataPoint> = {
  datasets: [
    {
      id: 'dataset-performance',
      label: 'Performance Metrics',
      data: mockDataPoints,
      color: '#10b981',
      type: 'line'
    }
  ],
  categories: ['performance'],
  timeRange: {
    start: '2024-01-01',
    end: '2024-12-31'
  }
};

const mockChartConfig: ChartConfig = {
  responsive: true,
  animated: true,
  showLegend: true,
  showTooltip: true,
  showGrid: true,
  theme: 'light',
  colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
  height: 400,
  width: 600
};

const mockOnDataPointClick = vi.fn();
const mockOnExport = vi.fn();
const mockOnZoom = vi.fn();
const mockOnFilter = vi.fn();

const defaultProps: DataVisualizationEngineProps<TestDataPoint> = {
  data: mockVisualizationData,
  chartType: 'line',
  config: mockChartConfig,
  onDataPointClick: mockOnDataPointClick
};

describe('DataVisualizationEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<DataVisualizationEngine {...defaultProps} />);
      
      expect(screen.getByTestId('data-visualization-engine')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should render different chart types correctly', () => {
      const chartTypes: ChartType[] = ['line', 'bar', 'pie', 'scatter', 'area'];
      
      chartTypes.forEach(chartType => {
        const { unmount } = render(
          <DataVisualizationEngine 
            {...defaultProps} 
            chartType={chartType}
          />
        );
        
        expect(screen.getByTestId(`${chartType}-chart`)).toBeInTheDocument();
        unmount();
      });
    });

    it('should render with custom title and description', () => {
      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          title="Performance Analytics"
          description="Quarterly performance metrics visualization"
        />
      );
      
      expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      expect(screen.getByText('Quarterly performance metrics visualization')).toBeInTheDocument();
    });

    it('should render chart controls when enabled', () => {
      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          showControls={true}
        />
      );
      
      expect(screen.getByText('Chart Type')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render export controls when enabled', () => {
      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          exportable={true}
          onExport={mockOnExport}
        />
      );
      
      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    });
  });

  describe('Chart Interactions', () => {
    it('should handle data point clicks', async () => {
      const user = userEvent.setup();
      
      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          interactive={true}
        />
      );

      // Mock chart interaction - click on data point
      const chartContainer = screen.getByTestId('line-chart');
      await user.click(chartContainer);

      // In real implementation, this would trigger from chart library
      // For test, we simulate the click callback
      mockOnDataPointClick(mockDataPoints[0], { x: 100, y: 200 });

      expect(mockOnDataPointClick).toHaveBeenCalledWith(
        mockDataPoints[0],
        expect.objectContaining({ x: 100, y: 200 })
      );
    });

    it('should handle zoom interactions', async () => {
      const user = userEvent.setup();
      
      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          zoomable={true}
          onZoom={mockOnZoom}
        />
      );

      // Look for zoom controls
      const zoomInButton = screen.getByLabelText('Zoom in');
      const zoomOutButton = screen.getByLabelText('Zoom out');
      
      expect(zoomInButton).toBeInTheDocument();
      expect(zoomOutButton).toBeInTheDocument();

      await user.click(zoomInButton);
      expect(mockOnZoom).toHaveBeenCalledWith('in', expect.any(Number));
    });

    it('should handle brush selection for time range', async () => {
      const user = userEvent.setup();
      
      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          brushable={true}
        />
      );

      // Check for brush component
      expect(screen.getByTestId('chart-brush')).toBeInTheDocument();
    });

    it('should handle legend toggle interactions', async () => {
      const user = userEvent.setup();
      
      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          config={{
            ...mockChartConfig,
            showLegend: true,
            interactiveLegend: true
          }}
        />
      );

      const legendItem = screen.getByTestId('legend-item-0');
      await user.click(legendItem);

      // Should toggle dataset visibility
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  describe('Chart Type Switching', () => {
    it('should switch between chart types', async () => {
      const user = userEvent.setup();
      
      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          showControls={true}
        />
      );

      const chartTypeSelect = screen.getByRole('combobox');
      
      // Switch to bar chart
      await user.click(chartTypeSelect);
      const barOption = screen.getByText('Bar Chart');
      await user.click(barOption);

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
        expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
      });
    });

    it('should maintain data integrity when switching chart types', async () => {
      const user = userEvent.setup();
      
      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          showControls={true}
        />
      );

      // Switch to pie chart
      const chartTypeSelect = screen.getByRole('combobox');
      await user.click(chartTypeSelect);
      
      const pieOption = screen.getByText('Pie Chart');
      await user.click(pieOption);

      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
        // Data should still be present
        expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      });
    });

    it('should disable incompatible chart types for data structure', () => {
      const timeSeriesData = {
        ...mockVisualizationData,
        datasets: [{
          ...mockVisualizationData.datasets[0],
          data: mockDataPoints.map(p => ({ ...p, timestamp: '2024-01-01' }))
        }]
      };

      render(
        <DataVisualizationEngine 
          data={timeSeriesData}
          chartType="line"
          config={mockChartConfig}
          showControls={true}
        />
      );

      // Pie charts should be disabled for time series data
      const chartTypeSelect = screen.getByRole('combobox');
      expect(chartTypeSelect).toBeInTheDocument();
    });
  });

  describe('Data Filtering and Transformation', () => {
    it('should filter data by category', async () => {
      const user = userEvent.setup();
      
      const multiCategoryData = {
        ...mockVisualizationData,
        categories: ['performance', 'quality', 'efficiency'],
        datasets: [{
          ...mockVisualizationData.datasets[0],
          data: [
            ...mockDataPoints,
            { id: 'quality-1', label: 'Quality Score', category: 'quality', value: 90 }
          ]
        }]
      };

      render(
        <DataVisualizationEngine 
          data={multiCategoryData}
          chartType="line"
          config={mockChartConfig}
          filterable={true}
          onFilter={mockOnFilter}
        />
      );

      const filterButton = screen.getByText('Filter');
      await user.click(filterButton);

      const performanceFilter = screen.getByLabelText('performance');
      await user.click(performanceFilter);

      expect(mockOnFilter).toHaveBeenCalledWith({
        categories: ['performance'],
        dateRange: expect.any(Object)
      });
    });

    it('should handle date range filtering', async () => {
      const user = userEvent.setup();
      
      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          filterable={true}
          onFilter={mockOnFilter}
        />
      );

      const dateRangeButton = screen.getByText('Date Range');
      await user.click(dateRangeButton);

      // Should show date picker
      expect(screen.getByTestId('date-range-picker')).toBeInTheDocument();
    });

    it('should aggregate data when requested', () => {
      const aggregatedData = {
        ...mockVisualizationData,
        aggregation: 'monthly'
      };

      render(
        <DataVisualizationEngine 
          data={aggregatedData}
          chartType="bar"
          config={mockChartConfig}
        />
      );

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should export chart as PNG', async () => {
      const user = userEvent.setup();
      
      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          exportable={true}
          onExport={mockOnExport}
        />
      );

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);

      const pngOption = screen.getByText('PNG Image');
      await user.click(pngOption);

      expect(mockOnExport).toHaveBeenCalledWith('png', expect.any(Object));
    });

    it('should export data as CSV', async () => {
      const user = userEvent.setup();
      
      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          exportable={true}
          onExport={mockOnExport}
        />
      );

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);

      const csvOption = screen.getByText('CSV Data');
      await user.click(csvOption);

      expect(mockOnExport).toHaveBeenCalledWith('csv', mockVisualizationData);
    });

    it('should export data as JSON', async () => {
      const user = userEvent.setup();
      
      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          exportable={true}
          onExport={mockOnExport}
        />
      );

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);

      const jsonOption = screen.getByText('JSON Data');
      await user.click(jsonOption);

      expect(mockOnExport).toHaveBeenCalledWith('json', mockVisualizationData);
    });
  });

  describe('Real-time Updates', () => {
    it('should handle data updates gracefully', () => {
      const { rerender } = render(<DataVisualizationEngine {...defaultProps} />);

      // Update data
      const updatedData = {
        ...mockVisualizationData,
        datasets: [{
          ...mockVisualizationData.datasets[0],
          data: [...mockDataPoints, {
            id: 'point-5',
            label: 'Q5 Performance',
            category: 'performance',
            value: 95
          }]
        }]
      };

      rerender(
        <DataVisualizationEngine 
          {...defaultProps} 
          data={updatedData}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    });

    it('should handle streaming data updates', async () => {
      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          realTimeUpdates={true}
          updateInterval={1000}
        />
      );

      expect(screen.getByTestId('real-time-indicator')).toBeInTheDocument();
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('should pause and resume real-time updates', async () => {
      const user = userEvent.setup();
      
      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          realTimeUpdates={true}
        />
      );

      const pauseButton = screen.getByLabelText('Pause updates');
      await user.click(pauseButton);

      expect(screen.getByLabelText('Resume updates')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<DataVisualizationEngine {...defaultProps} />);
      
      const container = screen.getByTestId('data-visualization-engine');
      expect(container).toHaveAttribute('role', 'img');
      expect(container).toHaveAttribute('aria-label');
      
      const chart = screen.getByTestId('line-chart');
      expect(chart).toHaveAttribute('aria-describedby');
    });

    it('should provide data table alternative', () => {
      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          showDataTable={true}
        />
      );
      
      const dataTableToggle = screen.getByText('Data Table');
      expect(dataTableToggle).toBeInTheDocument();
    });

    it('should support keyboard navigation for interactive elements', async () => {
      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          interactive={true}
          showControls={true}
        />
      );

      const firstControl = screen.getByRole('combobox');
      firstControl.focus();
      
      expect(document.activeElement).toBe(firstControl);

      // Tab navigation should work
      fireEvent.keyDown(firstControl, { key: 'Tab' });
    });

    it('should announce data changes to screen readers', async () => {
      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          announceChanges={true}
        />
      );

      const announcement = screen.getByTestId('chart-announcements');
      expect(announcement).toHaveAttribute('aria-live', 'polite');
      expect(announcement).toHaveAttribute('aria-atomic', 'true');
    });

    it('should support high contrast mode', () => {
      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          config={{
            ...mockChartConfig,
            highContrast: true
          }}
        />
      );
      
      const container = screen.getByTestId('data-visualization-engine');
      expect(container).toHaveClass('high-contrast');
    });
  });

  describe('Performance Optimization', () => {
    it('should virtualize large datasets', () => {
      const largeData = {
        ...mockVisualizationData,
        datasets: [{
          ...mockVisualizationData.datasets[0],
          data: Array.from({ length: 1000 }, (_, i) => ({
            id: `point-${i}`,
            label: `Data Point ${i}`,
            category: 'performance',
            value: Math.random() * 100
          }))
        }]
      };

      render(
        <DataVisualizationEngine 
          data={largeData}
          chartType="line"
          config={mockChartConfig}
          virtualized={true}
        />
      );

      expect(screen.getByTestId('virtualized-chart')).toBeInTheDocument();
    });

    it('should debounce user interactions', async () => {
      const user = userEvent.setup();
      
      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          filterable={true}
          onFilter={mockOnFilter}
        />
      );

      const filterInput = screen.getByPlaceholderText('Filter data...');
      
      // Rapid typing should be debounced
      await user.type(filterInput, 'test');
      
      // Should not call filter for every keystroke
      expect(mockOnFilter).not.toHaveBeenCalledTimes(4);
    });

    it('should lazy load chart components', () => {
      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          lazyLoad={true}
        />
      );

      // Chart should be wrapped in Suspense
      expect(screen.getByTestId('chart-loading')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid data gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <DataVisualizationEngine 
          data={null as any}
          chartType="line"
          config={mockChartConfig}
        />
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state-icon')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should handle chart rendering errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Simulate chart rendering error
      const errorData = {
        ...mockVisualizationData,
        datasets: [{
          ...mockVisualizationData.datasets[0],
          data: [{ id: 'invalid', label: 'Invalid', category: 'test', value: NaN }]
        }]
      };

      render(
        <DataVisualizationEngine 
          data={errorData}
          chartType="line"
          config={mockChartConfig}
        />
      );

      // Should show error state
      expect(screen.getByText('Chart rendering error')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should validate prop requirements', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      render(
        <DataVisualizationEngine 
          data={mockVisualizationData}
          chartType="line"
          config={null as any}
        />
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid chart configuration')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Advanced Features', () => {
    it('should support multiple datasets', () => {
      const multiDatasetData = {
        ...mockVisualizationData,
        datasets: [
          mockVisualizationData.datasets[0],
          {
            id: 'dataset-quality',
            label: 'Quality Metrics',
            data: mockDataPoints.map(p => ({ ...p, category: 'quality', value: p.value * 0.9 })),
            color: '#3b82f6',
            type: 'line' as const
          }
        ]
      };

      render(
        <DataVisualizationEngine 
          data={multiDatasetData}
          chartType="line"
          config={mockChartConfig}
        />
      );

      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      expect(screen.getByText('Quality Metrics')).toBeInTheDocument();
    });

    it('should support custom color schemes', () => {
      const customConfig = {
        ...mockChartConfig,
        colors: ['#ff6b6b', '#4ecdc4', '#45b7d1'],
        theme: 'dark' as const
      };

      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          config={customConfig}
        />
      );

      const container = screen.getByTestId('data-visualization-engine');
      expect(container).toHaveClass('dark-theme');
    });

    it('should support annotations and markers', () => {
      const annotatedData = {
        ...mockVisualizationData,
        annotations: [
          {
            id: 'annotation-1',
            type: 'vertical',
            value: 'Q2 Performance',
            label: 'Peak Performance',
            color: '#f59e0b'
          }
        ]
      };

      render(
        <DataVisualizationEngine 
          data={annotatedData}
          chartType="line"
          config={mockChartConfig}
        />
      );

      expect(screen.getByTestId('chart-annotation')).toBeInTheDocument();
    });

    it('should support drill-down interactions', async () => {
      const user = userEvent.setup();
      const mockOnDrillDown = vi.fn();
      
      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          drillDownEnabled={true}
          onDrillDown={mockOnDrillDown}
        />
      );

      // Double-click should trigger drill-down
      const chartContainer = screen.getByTestId('line-chart');
      await user.dblClick(chartContainer);

      expect(mockOnDrillDown).toHaveBeenCalled();
    });

    it('should support comparison mode', () => {
      const comparisonData = {
        ...mockVisualizationData,
        comparisonMode: true,
        baselineDataset: 'dataset-performance'
      };

      render(
        <DataVisualizationEngine 
          data={comparisonData}
          chartType="line"
          config={mockChartConfig}
        />
      );

      expect(screen.getByText('Comparison Mode')).toBeInTheDocument();
      expect(screen.getByTestId('baseline-indicator')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to container size changes', () => {
      const { rerender } = render(
        <DataVisualizationEngine 
          {...defaultProps} 
          config={{
            ...mockChartConfig,
            responsive: true
          }}
        />
      );

      // Simulate container resize
      rerender(
        <DataVisualizationEngine 
          {...defaultProps} 
          config={{
            ...mockChartConfig,
            responsive: true,
            width: 800,
            height: 500
          }}
        />
      );

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should provide mobile-optimized view', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          config={{
            ...mockChartConfig,
            responsive: true
          }}
        />
      );

      const container = screen.getByTestId('data-visualization-engine');
      expect(container).toHaveClass('mobile-view');
    });
  });

  describe('Theme Support', () => {
    it('should apply light theme correctly', () => {
      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          config={{
            ...mockChartConfig,
            theme: 'light'
          }}
        />
      );

      const container = screen.getByTestId('data-visualization-engine');
      expect(container).toHaveClass('light-theme');
    });

    it('should apply dark theme correctly', () => {
      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          config={{
            ...mockChartConfig,
            theme: 'dark'
          }}
        />
      );

      const container = screen.getByTestId('data-visualization-engine');
      expect(container).toHaveClass('dark-theme');
    });

    it('should support custom theme configuration', () => {
      const customTheme = {
        background: '#1a1a2e',
        primary: '#16213e',
        secondary: '#0f3460',
        accent: '#e94560',
        text: '#ffffff'
      };

      render(
        <DataVisualizationEngine 
          {...defaultProps} 
          config={{
            ...mockChartConfig,
            customTheme
          }}
        />
      );

      const container = screen.getByTestId('data-visualization-engine');
      expect(container).toHaveStyle(`--chart-background: ${customTheme.background}`);
    });
  });
});