import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DynamicDashboard, { 
  DynamicDashboardProps,
  DashboardWidget,
  WidgetType,
  WidgetSize,
  WidgetPosition,
  DashboardLayout,
  DashboardTheme,
  DataSource,
  FilterConfig,
  DashboardConfig,
  WidgetData,
  LayoutBreakpoint
} from '../dynamic-dashboard';

// Mock data interfaces
interface TestWidget extends DashboardWidget {
  id: string;
  title: string;
  type: WidgetType;
  size: WidgetSize;
  position: WidgetPosition;
  config: {
    dataSource: DataSource;
    refreshInterval?: number;
    filters?: FilterConfig[];
    customSettings?: Record<string, any>;
  };
  data: WidgetData;
  isVisible: boolean;
  isLoading?: boolean;
  error?: string;
  lastUpdated: string;
}

// Mock test data
const mockWidgets: TestWidget[] = [
  {
    id: 'widget-metrics',
    title: 'Performance Metrics',
    type: 'metrics',
    size: 'large',
    position: { x: 0, y: 0, w: 6, h: 4 },
    config: {
      dataSource: 'performance-api',
      refreshInterval: 30000,
      filters: [
        { field: 'timeRange', value: '24h', operator: 'equals' }
      ]
    },
    data: {
      metrics: [
        { name: 'Response Time', value: 245, unit: 'ms', trend: 'improving' },
        { name: 'Throughput', value: 1250, unit: 'req/min', trend: 'stable' },
        { name: 'Error Rate', value: 0.2, unit: '%', trend: 'declining' }
      ]
    },
    isVisible: true,
    lastUpdated: '2024-01-15T10:30:00Z'
  },
  {
    id: 'widget-chart',
    title: 'Team Performance Trends',
    type: 'chart',
    size: 'medium',
    position: { x: 6, y: 0, w: 6, h: 4 },
    config: {
      dataSource: 'team-data',
      refreshInterval: 60000,
      customSettings: {
        chartType: 'line',
        showLegend: true,
        animate: true
      }
    },
    data: {
      chartData: [
        { name: 'Jan', value: 65 },
        { name: 'Feb', value: 72 },
        { name: 'Mar', value: 68 },
        { name: 'Apr', value: 85 }
      ]
    },
    isVisible: true,
    lastUpdated: '2024-01-15T10:25:00Z'
  },
  {
    id: 'widget-alerts',
    title: 'System Alerts',
    type: 'alerts',
    size: 'small',
    position: { x: 0, y: 4, w: 4, h: 2 },
    config: {
      dataSource: 'alert-system',
      refreshInterval: 15000
    },
    data: {
      alerts: [
        { id: 'alert-1', severity: 'warning', message: 'High memory usage detected', timestamp: '2024-01-15T10:20:00Z' },
        { id: 'alert-2', severity: 'info', message: 'System maintenance scheduled', timestamp: '2024-01-15T09:45:00Z' }
      ]
    },
    isVisible: true,
    lastUpdated: '2024-01-15T10:30:00Z'
  },
  {
    id: 'widget-table',
    title: 'Active Projects',
    type: 'table',
    size: 'medium',
    position: { x: 4, y: 4, w: 8, h: 3 },
    config: {
      dataSource: 'project-data',
      refreshInterval: 120000,
      filters: [
        { field: 'status', value: 'active', operator: 'equals' }
      ]
    },
    data: {
      tableData: [
        { id: 'proj-1', name: 'Project Alpha', status: 'In Progress', progress: 75 },
        { id: 'proj-2', name: 'Project Beta', status: 'Planning', progress: 25 },
        { id: 'proj-3', name: 'Project Gamma', status: 'In Progress', progress: 60 }
      ]
    },
    isVisible: true,
    lastUpdated: '2024-01-15T10:15:00Z'
  }
];

const mockLayouts: Record<LayoutBreakpoint, DashboardLayout> = {
  lg: {
    widgets: mockWidgets.map(w => ({ i: w.id, x: w.position.x, y: w.position.y, w: w.position.w, h: w.position.h })),
    breakpoint: 'lg',
    cols: 12
  },
  md: {
    widgets: mockWidgets.map(w => ({ i: w.id, x: w.position.x, y: w.position.y, w: w.position.w, h: w.position.h })),
    breakpoint: 'md',
    cols: 10
  },
  sm: {
    widgets: mockWidgets.map(w => ({ i: w.id, x: 0, y: w.position.y, w: 12, h: w.position.h })),
    breakpoint: 'sm',
    cols: 6
  },
  xs: {
    widgets: mockWidgets.map(w => ({ i: w.id, x: 0, y: w.position.y, w: 4, h: w.position.h })),
    breakpoint: 'xs',
    cols: 4
  },
  xxs: {
    widgets: mockWidgets.map(w => ({ i: w.id, x: 0, y: w.position.y, w: 2, h: w.position.h })),
    breakpoint: 'xxs',
    cols: 2
  }
};

const mockDashboardConfig: DashboardConfig = {
  id: 'dashboard-main',
  name: 'Main Dashboard',
  description: 'Primary performance and monitoring dashboard',
  widgets: mockWidgets,
  layouts: mockLayouts,
  theme: 'light',
  globalFilters: [
    { field: 'dateRange', value: '7d', operator: 'equals', label: 'Last 7 Days' }
  ],
  refreshSettings: {
    autoRefresh: true,
    globalInterval: 60000,
    pauseOnInactive: true
  },
  permissions: {
    canEdit: true,
    canShare: true,
    canExport: true
  },
  version: '1.0.0',
  lastModified: '2024-01-15T10:00:00Z'
};

const mockOnWidgetUpdate = vi.fn();
const mockOnLayoutChange = vi.fn();
const mockOnWidgetAdd = vi.fn();
const mockOnWidgetRemove = vi.fn();
const mockOnConfigSave = vi.fn();
const mockOnDataRefresh = vi.fn();
const mockOnFilterChange = vi.fn();
const mockOnExport = vi.fn();
const mockOnShare = vi.fn();

const defaultProps: DynamicDashboardProps = {
  config: mockDashboardConfig,
  onConfigSave: mockOnConfigSave
};

describe('DynamicDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default configuration', () => {
      render(<DynamicDashboard {...defaultProps} />);
      
      expect(screen.getByTestId('dynamic-dashboard')).toBeInTheDocument();
      expect(screen.getByText('Main Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    });

    it('should render custom title when provided', () => {
      render(
        <DynamicDashboard 
          {...defaultProps} 
          title="Custom Analytics Dashboard"
        />
      );
      
      expect(screen.getByText('Custom Analytics Dashboard')).toBeInTheDocument();
    });

    it('should render empty state when no widgets provided', () => {
      const emptyConfig = {
        ...mockDashboardConfig,
        widgets: []
      };

      render(
        <DynamicDashboard 
          config={emptyConfig}
          onConfigSave={mockOnConfigSave}
        />
      );
      
      expect(screen.getByTestId('empty-dashboard-state')).toBeInTheDocument();
      expect(screen.getByText('No widgets configured')).toBeInTheDocument();
    });

    it('should render all widget types correctly', () => {
      render(<DynamicDashboard {...defaultProps} />);
      
      expect(screen.getByTestId('widget-metrics')).toBeInTheDocument();
      expect(screen.getByTestId('widget-chart')).toBeInTheDocument();
      expect(screen.getByTestId('widget-alerts')).toBeInTheDocument();
      expect(screen.getByTestId('widget-table')).toBeInTheDocument();
    });

    it('should render widgets with proper sizes', () => {
      render(<DynamicDashboard {...defaultProps} />);
      
      expect(screen.getByTestId('widget-size-large')).toBeInTheDocument();
      expect(screen.getByTestId('widget-size-medium')).toBeInTheDocument();
      expect(screen.getByTestId('widget-size-small')).toBeInTheDocument();
    });

    it('should render loading state for widgets', () => {
      const loadingConfig = {
        ...mockDashboardConfig,
        widgets: [
          { ...mockWidgets[0], isLoading: true }
        ]
      };

      render(
        <DynamicDashboard 
          config={loadingConfig}
          onConfigSave={mockOnConfigSave}
        />
      );
      
      expect(screen.getByTestId('widget-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading widget data...')).toBeInTheDocument();
    });
  });

  describe('Widget Management', () => {
    it('should handle widget addition', async () => {
      const user = userEvent.setup();
      
      render(
        <DynamicDashboard 
          {...defaultProps} 
          editMode={true}
          onWidgetAdd={mockOnWidgetAdd}
        />
      );

      const addWidgetButton = screen.getByTestId('add-widget-button');
      await user.click(addWidgetButton);

      expect(screen.getByTestId('widget-library')).toBeInTheDocument();
      
      const metricsWidget = screen.getByTestId('widget-template-metrics');
      await user.click(metricsWidget);

      expect(mockOnWidgetAdd).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'metrics' })
      );
    });

    it('should handle widget removal', async () => {
      const user = userEvent.setup();
      
      render(
        <DynamicDashboard 
          {...defaultProps} 
          editMode={true}
          onWidgetRemove={mockOnWidgetRemove}
        />
      );

      const firstWidget = screen.getByTestId('widget-metrics');
      const removeButton = screen.getByTestId('remove-widget-metrics');
      
      await user.click(removeButton);

      expect(mockOnWidgetRemove).toHaveBeenCalledWith('widget-metrics');
    });

    it('should handle widget configuration changes', async () => {
      const user = userEvent.setup();
      
      render(
        <DynamicDashboard 
          {...defaultProps} 
          editMode={true}
          onWidgetUpdate={mockOnWidgetUpdate}
        />
      );

      const configButton = screen.getByTestId('configure-widget-metrics');
      await user.click(configButton);

      expect(screen.getByTestId('widget-config-modal')).toBeInTheDocument();
      
      const titleInput = screen.getByTestId('widget-title-input');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Performance Metrics');

      const saveButton = screen.getByText('Save Configuration');
      await user.click(saveButton);

      expect(mockOnWidgetUpdate).toHaveBeenCalledWith(
        'widget-metrics',
        expect.objectContaining({ title: 'Updated Performance Metrics' })
      );
    });

    it('should handle widget duplication', async () => {
      const user = userEvent.setup();
      
      render(
        <DynamicDashboard 
          {...defaultProps} 
          editMode={true}
          onWidgetAdd={mockOnWidgetAdd}
        />
      );

      const duplicateButton = screen.getByTestId('duplicate-widget-metrics');
      await user.click(duplicateButton);

      expect(mockOnWidgetAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Performance Metrics (Copy)',
          type: 'metrics'
        })
      );
    });
  });

  describe('Layout Management', () => {
    it('should handle drag and drop layout changes', async () => {
      render(
        <DynamicDashboard 
          {...defaultProps} 
          editMode={true}
          onLayoutChange={mockOnLayoutChange}
        />
      );

      const widget = screen.getByTestId('widget-metrics');
      
      // Simulate drag and drop
      fireEvent.dragStart(widget);
      fireEvent.dragEnd(widget);

      await waitFor(() => {
        expect(mockOnLayoutChange).toHaveBeenCalled();
      });
    });

    it('should handle responsive layout breakpoints', () => {
      // Mock window resize
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<DynamicDashboard {...defaultProps} />);

      const dashboard = screen.getByTestId('dynamic-dashboard');
      expect(dashboard).toHaveClass('responsive-md');
    });

    it('should save and restore layout preferences', async () => {
      const user = userEvent.setup();
      
      render(
        <DynamicDashboard 
          {...defaultProps} 
          editMode={true}
          onConfigSave={mockOnConfigSave}
        />
      );

      const saveLayoutButton = screen.getByTestId('save-layout-button');
      await user.click(saveLayoutButton);

      expect(mockOnConfigSave).toHaveBeenCalledWith(
        expect.objectContaining({
          layouts: expect.any(Object)
        })
      );
    });

    it('should reset layout to defaults', async () => {
      const user = userEvent.setup();
      
      render(
        <DynamicDashboard 
          {...defaultProps} 
          editMode={true}
          onLayoutChange={mockOnLayoutChange}
        />
      );

      const resetLayoutButton = screen.getByText('Reset Layout');
      await user.click(resetLayoutButton);

      expect(mockOnLayoutChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isReset: true
        })
      );
    });
  });

  describe('Real-time Updates', () => {
    it('should handle auto-refresh functionality', async () => {
      render(
        <DynamicDashboard 
          {...defaultProps} 
          onDataRefresh={mockOnDataRefresh}
        />
      );

      expect(screen.getByTestId('auto-refresh-indicator')).toBeInTheDocument();
      
      // Wait for auto-refresh to trigger
      await waitFor(() => {
        expect(mockOnDataRefresh).toHaveBeenCalled();
      }, { timeout: 2000 });
    });

    it('should pause auto-refresh when dashboard is inactive', async () => {
      const { rerender } = render(
        <DynamicDashboard 
          {...defaultProps} 
          isActive={true}
          onDataRefresh={mockOnDataRefresh}
        />
      );

      // Make dashboard inactive
      rerender(
        <DynamicDashboard 
          {...defaultProps} 
          isActive={false}
          onDataRefresh={mockOnDataRefresh}
        />
      );

      expect(screen.getByTestId('refresh-paused-indicator')).toBeInTheDocument();
    });

    it('should handle manual refresh', async () => {
      const user = userEvent.setup();
      
      render(
        <DynamicDashboard 
          {...defaultProps} 
          onDataRefresh={mockOnDataRefresh}
        />
      );

      const refreshButton = screen.getByTestId('manual-refresh-button');
      await user.click(refreshButton);

      expect(mockOnDataRefresh).toHaveBeenCalledWith('manual');
    });

    it('should handle widget-specific refresh', async () => {
      const user = userEvent.setup();
      
      render(
        <DynamicDashboard 
          {...defaultProps} 
          onDataRefresh={mockOnDataRefresh}
        />
      );

      const widgetRefreshButton = screen.getByTestId('refresh-widget-metrics');
      await user.click(widgetRefreshButton);

      expect(mockOnDataRefresh).toHaveBeenCalledWith('widget', 'widget-metrics');
    });

    it('should show real-time data updates', () => {
      const { rerender } = render(<DynamicDashboard {...defaultProps} />);

      // Update widget data
      const updatedConfig = {
        ...mockDashboardConfig,
        widgets: [
          {
            ...mockWidgets[0],
            data: {
              metrics: [
                { name: 'Response Time', value: 220, unit: 'ms', trend: 'improving' }
              ]
            },
            lastUpdated: new Date().toISOString()
          },
          ...mockWidgets.slice(1)
        ]
      };

      rerender(
        <DynamicDashboard 
          config={updatedConfig}
          onConfigSave={mockOnConfigSave}
        />
      );

      expect(screen.getByText('220')).toBeInTheDocument();
    });
  });

  describe('Filtering and Search', () => {
    it('should handle global filters', async () => {
      const user = userEvent.setup();
      
      render(
        <DynamicDashboard 
          {...defaultProps} 
          showFilters={true}
          onFilterChange={mockOnFilterChange}
        />
      );

      const filterSelect = screen.getByTestId('global-filter-dateRange');
      await user.click(filterSelect);
      
      const last30DaysOption = screen.getByText('Last 30 Days');
      await user.click(last30DaysOption);

      expect(mockOnFilterChange).toHaveBeenCalledWith(
        'dateRange',
        '30d'
      );
    });

    it('should filter widgets based on search', async () => {
      const user = userEvent.setup();
      
      render(
        <DynamicDashboard 
          {...defaultProps} 
          searchable={true}
        />
      );

      const searchInput = screen.getByTestId('dashboard-search');
      await user.type(searchInput, 'Performance');

      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      expect(screen.queryByText('System Alerts')).not.toBeInTheDocument();
    });

    it('should handle widget-specific filters', async () => {
      const user = userEvent.setup();
      
      render(
        <DynamicDashboard 
          {...defaultProps} 
          onWidgetUpdate={mockOnWidgetUpdate}
        />
      );

      const widgetFilterButton = screen.getByTestId('filter-widget-table');
      await user.click(widgetFilterButton);

      const statusFilter = screen.getByTestId('widget-filter-status');
      await user.click(statusFilter);
      
      const inProgressOption = screen.getByText('In Progress');
      await user.click(inProgressOption);

      expect(mockOnWidgetUpdate).toHaveBeenCalledWith(
        'widget-table',
        expect.objectContaining({
          config: expect.objectContaining({
            filters: expect.arrayContaining([
              expect.objectContaining({ field: 'status', value: 'In Progress' })
            ])
          })
        })
      );
    });
  });

  describe('Themes and Customization', () => {
    it('should apply light theme correctly', () => {
      render(
        <DynamicDashboard 
          {...defaultProps} 
          theme="light"
        />
      );

      const dashboard = screen.getByTestId('dynamic-dashboard');
      expect(dashboard).toHaveClass('theme-light');
    });

    it('should apply dark theme correctly', () => {
      render(
        <DynamicDashboard 
          {...defaultProps} 
          theme="dark"
        />
      );

      const dashboard = screen.getByTestId('dynamic-dashboard');
      expect(dashboard).toHaveClass('theme-dark');
    });

    it('should support high contrast mode', () => {
      render(
        <DynamicDashboard 
          {...defaultProps} 
          highContrast={true}
        />
      );

      const dashboard = screen.getByTestId('dynamic-dashboard');
      expect(dashboard).toHaveClass('high-contrast');
    });

    it('should apply custom color schemes', () => {
      const customColors = {
        primary: '#007acc',
        secondary: '#f0f0f0',
        accent: '#ff6b35'
      };

      render(
        <DynamicDashboard 
          {...defaultProps} 
          customColors={customColors}
        />
      );

      const dashboard = screen.getByTestId('dynamic-dashboard');
      expect(dashboard).toHaveStyle(`--color-primary: ${customColors.primary}`);
    });
  });

  describe('Export and Sharing', () => {
    it('should export dashboard as PDF', async () => {
      const user = userEvent.setup();
      
      render(
        <DynamicDashboard 
          {...defaultProps} 
          exportable={true}
          onExport={mockOnExport}
        />
      );

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);

      const pdfOption = screen.getByText('Export as PDF');
      await user.click(pdfOption);

      expect(mockOnExport).toHaveBeenCalledWith('pdf', mockDashboardConfig);
    });

    it('should export dashboard as JSON', async () => {
      const user = userEvent.setup();
      
      render(
        <DynamicDashboard 
          {...defaultProps} 
          exportable={true}
          onExport={mockOnExport}
        />
      );

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);

      const jsonOption = screen.getByText('Export Configuration');
      await user.click(jsonOption);

      expect(mockOnExport).toHaveBeenCalledWith('json', mockDashboardConfig);
    });

    it('should handle dashboard sharing', async () => {
      const user = userEvent.setup();
      
      render(
        <DynamicDashboard 
          {...defaultProps} 
          shareable={true}
          onShare={mockOnShare}
        />
      );

      const shareButton = screen.getByText('Share');
      await user.click(shareButton);

      expect(screen.getByTestId('share-modal')).toBeInTheDocument();
      
      const generateLinkButton = screen.getByText('Generate Link');
      await user.click(generateLinkButton);

      expect(mockOnShare).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'link' })
      );
    });

    it('should generate dashboard snapshots', async () => {
      const user = userEvent.setup();
      
      render(
        <DynamicDashboard 
          {...defaultProps} 
          onExport={mockOnExport}
        />
      );

      const snapshotButton = screen.getByTestId('snapshot-button');
      await user.click(snapshotButton);

      expect(mockOnExport).toHaveBeenCalledWith('snapshot', expect.objectContaining({
        timestamp: expect.any(String),
        widgets: expect.any(Array)
      }));
    });
  });

  describe('Performance Optimization', () => {
    it('should virtualize large widget lists', () => {
      const largeWidgetList = Array.from({ length: 100 }, (_, i) => ({
        ...mockWidgets[0],
        id: `widget-${i}`,
        title: `Widget ${i}`
      }));

      const largeConfig = {
        ...mockDashboardConfig,
        widgets: largeWidgetList
      };

      render(
        <DynamicDashboard 
          config={largeConfig}
          onConfigSave={mockOnConfigSave}
          virtualized={true}
        />
      );

      expect(screen.getByTestId('virtualized-dashboard')).toBeInTheDocument();
    });

    it('should lazy load widget data', async () => {
      const user = userEvent.setup();
      
      render(
        <DynamicDashboard 
          {...defaultProps} 
          lazyLoadWidgets={true}
        />
      );

      const expandButton = screen.getByTestId('expand-widget-metrics');
      await user.click(expandButton);

      expect(screen.getByTestId('lazy-loading-indicator')).toBeInTheDocument();
    });

    it('should debounce layout changes', async () => {
      render(
        <DynamicDashboard 
          {...defaultProps} 
          editMode={true}
          onLayoutChange={mockOnLayoutChange}
        />
      );

      const widget = screen.getByTestId('widget-metrics');
      
      // Simulate rapid layout changes
      fireEvent.dragStart(widget);
      fireEvent.dragEnd(widget);
      fireEvent.dragStart(widget);
      fireEvent.dragEnd(widget);
      
      // Should debounce and only call once
      await waitFor(() => {
        expect(mockOnLayoutChange).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<DynamicDashboard {...defaultProps} />);
      
      const dashboard = screen.getByTestId('dynamic-dashboard');
      expect(dashboard).toHaveAttribute('role', 'main');
      expect(dashboard).toHaveAttribute('aria-label', 'Main Dashboard');
      
      const widgets = screen.getAllByRole('region');
      expect(widgets.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', async () => {
      render(<DynamicDashboard {...defaultProps} />);

      const firstWidget = screen.getByTestId('widget-metrics');
      firstWidget.focus();
      
      expect(document.activeElement).toBe(firstWidget);

      // Tab navigation should work
      fireEvent.keyDown(firstWidget, { key: 'Tab' });
    });

    it('should announce updates to screen readers', () => {
      render(
        <DynamicDashboard 
          {...defaultProps} 
          announceUpdates={true}
        />
      );

      const announcements = screen.getByTestId('dashboard-announcements');
      expect(announcements).toHaveAttribute('aria-live', 'polite');
      expect(announcements).toHaveAttribute('aria-atomic', 'true');
    });

    it('should provide alternative content for screen readers', () => {
      render(
        <DynamicDashboard 
          {...defaultProps} 
          showDataTables={true}
        />
      );
      
      const dataTableToggle = screen.getByText('Data View');
      expect(dataTableToggle).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle widget error states gracefully', () => {
      const errorConfig = {
        ...mockDashboardConfig,
        widgets: [
          { ...mockWidgets[0], error: 'Failed to load widget data' }
        ]
      };

      render(
        <DynamicDashboard 
          config={errorConfig}
          onConfigSave={mockOnConfigSave}
        />
      );

      expect(screen.getByTestId('widget-error-state')).toBeInTheDocument();
      expect(screen.getByText('Failed to load widget data')).toBeInTheDocument();
    });

    it('should handle configuration validation errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <DynamicDashboard 
          config={null as any}
          onConfigSave={mockOnConfigSave}
        />
      );

      expect(screen.getByTestId('dashboard-config-error')).toBeInTheDocument();
      expect(screen.getByText('Invalid dashboard configuration')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should recover from data loading failures', async () => {
      const user = userEvent.setup();
      
      render(
        <DynamicDashboard 
          {...defaultProps} 
          onDataRefresh={mockOnDataRefresh}
        />
      );

      const retryButton = screen.getByTestId('retry-failed-widgets');
      await user.click(retryButton);

      expect(mockOnDataRefresh).toHaveBeenCalledWith('retry');
    });
  });

  describe('Advanced Features', () => {
    it('should support custom widget templates', () => {
      const customTemplate = (widget: TestWidget) => (
        <div data-testid="custom-widget-template">
          <h3>{widget.title}</h3>
          <p>Custom widget content</p>
        </div>
      );

      render(
        <DynamicDashboard 
          {...defaultProps} 
          customWidgetTemplate={customTemplate}
        />
      );

      expect(screen.getAllByTestId('custom-widget-template')).toHaveLength(4);
    });

    it('should support dashboard templates', async () => {
      const user = userEvent.setup();
      
      render(
        <DynamicDashboard 
          {...defaultProps} 
          editMode={true}
          showTemplates={true}
        />
      );

      const templatesButton = screen.getByText('Templates');
      await user.click(templatesButton);

      expect(screen.getByTestId('dashboard-templates')).toBeInTheDocument();
      expect(screen.getByText('Performance Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    });

    it('should support dashboard versioning', async () => {
      const user = userEvent.setup();
      
      render(
        <DynamicDashboard 
          {...defaultProps} 
          versioningEnabled={true}
          onConfigSave={mockOnConfigSave}
        />
      );

      const versionButton = screen.getByTestId('version-history-button');
      await user.click(versionButton);

      expect(screen.getByTestId('version-history')).toBeInTheDocument();
      expect(screen.getByText('Version 1.0.0')).toBeInTheDocument();
    });

    it('should support collaborative editing', async () => {
      render(
        <DynamicDashboard 
          {...defaultProps} 
          collaborative={true}
        />
      );

      expect(screen.getByTestId('collaborative-indicators')).toBeInTheDocument();
      expect(screen.getByText('2 editors online')).toBeInTheDocument();
    });

    it('should support dashboard permissions', () => {
      const readOnlyConfig = {
        ...mockDashboardConfig,
        permissions: {
          canEdit: false,
          canShare: false,
          canExport: true
        }
      };

      render(
        <DynamicDashboard 
          config={readOnlyConfig}
          onConfigSave={mockOnConfigSave}
        />
      );

      expect(screen.queryByTestId('add-widget-button')).not.toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
    });
  });

  describe('Integration Features', () => {
    it('should integrate with external data sources', () => {
      render(
        <DynamicDashboard 
          {...defaultProps} 
          showDataSources={true}
        />
      );

      expect(screen.getByText('performance-api')).toBeInTheDocument();
      expect(screen.getByText('team-data')).toBeInTheDocument();
      expect(screen.getByText('alert-system')).toBeInTheDocument();
    });

    it('should display refresh timestamps', () => {
      render(<DynamicDashboard {...defaultProps} />);

      expect(screen.getByText('Last updated: 10:30 AM')).toBeInTheDocument();
    });

    it('should handle webhook notifications', async () => {
      const user = userEvent.setup();
      const mockOnWebhookSetup = vi.fn();
      
      render(
        <DynamicDashboard 
          {...defaultProps} 
          webhookEnabled={true}
          onWebhookSetup={mockOnWebhookSetup}
        />
      );

      const webhookButton = screen.getByText('Setup Webhooks');
      await user.click(webhookButton);

      expect(mockOnWebhookSetup).toHaveBeenCalled();
    });

    it('should support dashboard embedding', () => {
      render(
        <DynamicDashboard 
          {...defaultProps} 
          embeddable={true}
        />
      );

      expect(screen.getByTestId('embed-code-button')).toBeInTheDocument();
    });
  });
});