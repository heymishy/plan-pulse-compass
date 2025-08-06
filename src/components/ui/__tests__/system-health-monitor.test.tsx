import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SystemHealthMonitor, {
  SystemHealthMonitorProps,
  HealthMetric,
  SystemAlert,
  HealthStatus,
  MetricCategory
} from '../system-health-monitor';

// Mock data
const mockHealthMetrics: HealthMetric[] = [
  {
    id: 'cpu-usage',
    name: 'CPU Usage',
    value: 75,
    unit: '%',
    status: 'warning',
    category: 'performance',
    threshold: { warning: 70, critical: 90 },
    trend: 'increasing',
    lastUpdated: '2024-01-15T10:30:00Z'
  },
  {
    id: 'memory-usage',
    name: 'Memory Usage',
    value: 60,
    unit: '%',
    status: 'healthy',
    category: 'performance', 
    threshold: { warning: 80, critical: 95 },
    trend: 'stable',
    lastUpdated: '2024-01-15T10:30:00Z'
  },
  {
    id: 'disk-space',
    name: 'Disk Space',
    value: 85,
    unit: '%',
    status: 'critical',
    category: 'storage',
    threshold: { warning: 80, critical: 90 },
    trend: 'increasing',
    lastUpdated: '2024-01-15T10:30:00Z'
  }
];

const mockSystemAlerts: SystemAlert[] = [
  {
    id: 'alert-1',
    title: 'High CPU Usage Detected',
    message: 'CPU usage has exceeded 70% for 5 minutes',
    severity: 'warning',
    category: 'performance',
    timestamp: '2024-01-15T10:25:00Z',
    acknowledged: false,
    source: 'cpu-monitor',
    actions: ['acknowledge', 'escalate']
  },
  {
    id: 'alert-2', 
    title: 'Disk Space Critical',
    message: 'Available disk space is below 15%',
    severity: 'critical',
    category: 'storage',
    timestamp: '2024-01-15T10:20:00Z',
    acknowledged: false,
    source: 'disk-monitor',
    actions: ['acknowledge', 'cleanup']
  }
];

const mockOnAlertAcknowledge = vi.fn();
const mockOnAlertAction = vi.fn();
const mockOnMetricClick = vi.fn();
const mockOnRefresh = vi.fn();

const defaultProps: SystemHealthMonitorProps = {
  metrics: mockHealthMetrics,
  alerts: mockSystemAlerts,
  onAlertAcknowledge: mockOnAlertAcknowledge,
  onAlertAction: mockOnAlertAction,
  onMetricClick: mockOnMetricClick,
  onRefresh: mockOnRefresh
};

describe('SystemHealthMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<SystemHealthMonitor {...defaultProps} />);
      
      expect(screen.getByTestId('system-health-monitor')).toBeInTheDocument();
      expect(screen.getByText('System Health')).toBeInTheDocument();
    });

    it('should render custom title', () => {
      render(<SystemHealthMonitor {...defaultProps} title="Custom Health Monitor" />);
      
      expect(screen.getByText('Custom Health Monitor')).toBeInTheDocument();
    });

    it('should display all health metrics', () => {
      render(<SystemHealthMonitor {...defaultProps} />);
      
      expect(screen.getByTestId('metric-cpu-usage')).toBeInTheDocument();
      expect(screen.getByTestId('metric-memory-usage')).toBeInTheDocument();
      expect(screen.getByTestId('metric-disk-space')).toBeInTheDocument();
    });

    it('should show metric values and units', () => {
      render(<SystemHealthMonitor {...defaultProps} />);
      
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('should display metric status indicators', () => {
      render(<SystemHealthMonitor {...defaultProps} />);
      
      expect(screen.getByTestId('status-warning')).toBeInTheDocument();
      expect(screen.getByTestId('status-healthy')).toBeInTheDocument();
      expect(screen.getByTestId('status-critical')).toBeInTheDocument();
    });

    it('should show overall system health status', () => {
      render(<SystemHealthMonitor {...defaultProps} />);
      
      expect(screen.getByTestId('overall-health-status')).toBeInTheDocument();
      expect(screen.getByText('Critical')).toBeInTheDocument(); // Worst status
    });

    it('should render loading state', () => {
      render(<SystemHealthMonitor {...defaultProps} loading={true} />);
      
      expect(screen.getByTestId('health-monitor-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading system health...')).toBeInTheDocument();
    });

    it('should render error state', () => {
      render(<SystemHealthMonitor {...defaultProps} error="Failed to load health data" />);
      
      expect(screen.getByTestId('health-monitor-error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load health data')).toBeInTheDocument();
    });
  });

  describe('System Alerts', () => {
    it('should display all system alerts', () => {
      render(<SystemHealthMonitor {...defaultProps} showAlerts={true} />);
      
      expect(screen.getByTestId('system-alerts')).toBeInTheDocument();
      expect(screen.getByText('High CPU Usage Detected')).toBeInTheDocument();
      expect(screen.getByText('Disk Space Critical')).toBeInTheDocument();
    });

    it('should show alert severity levels', () => {
      render(<SystemHealthMonitor {...defaultProps} showAlerts={true} />);
      
      expect(screen.getByTestId('alert-warning')).toBeInTheDocument();
      expect(screen.getByTestId('alert-critical')).toBeInTheDocument();
    });

    it('should handle alert acknowledgment', async () => {
      const user = userEvent.setup();
      render(<SystemHealthMonitor {...defaultProps} showAlerts={true} />);

      const acknowledgeButton = screen.getByTestId('acknowledge-alert-1');
      await user.click(acknowledgeButton);

      expect(mockOnAlertAcknowledge).toHaveBeenCalledWith('alert-1');
    });

    it('should display alert timestamps', () => {
      render(<SystemHealthMonitor {...defaultProps} showAlerts={true} />);
      
      // Check that timestamps are displayed - more flexible approach
      const timeElements = Array.from(document.querySelectorAll('span')).filter(el => 
        el.textContent && /\d{1,2}:\d{2}/.test(el.textContent)
      );
      expect(timeElements.length).toBeGreaterThan(0);
    });

    it('should filter alerts by severity', async () => {
      const user = userEvent.setup();
      render(<SystemHealthMonitor {...defaultProps} showAlerts={true} showFilters={true} />);

      const severityFilter = screen.getByTestId('alert-severity-filter');
      await user.click(severityFilter);
      
      const criticalOption = screen.getByText('Critical Only');
      await user.click(criticalOption);

      expect(screen.getByTestId('alert-alert-2')).toBeInTheDocument();
      expect(screen.queryByTestId('alert-alert-1')).not.toBeInTheDocument();
    });
  });

  describe('Metric Interactions', () => {
    it('should handle metric clicks', async () => {
      const user = userEvent.setup();
      render(<SystemHealthMonitor {...defaultProps} />);

      const cpuMetric = screen.getByTestId('metric-cpu-usage');
      await user.click(cpuMetric);

      expect(mockOnMetricClick).toHaveBeenCalledWith(mockHealthMetrics[0]);
    });

    it('should show metric trends', () => {
      render(<SystemHealthMonitor {...defaultProps} showTrends={true} />);
      
      expect(screen.getAllByTestId('trend-increasing')).toHaveLength(2); // Two metrics have increasing trend
      expect(screen.getByTestId('trend-stable')).toBeInTheDocument();
    });

    it('should display metric details on expand', async () => {
      const user = userEvent.setup();
      render(<SystemHealthMonitor {...defaultProps} />);

      const expandButton = screen.getByTestId('expand-metric-cpu-usage');
      await user.click(expandButton);

      expect(screen.getByTestId('metric-details')).toBeInTheDocument();
      expect(screen.getByText('Warning: 70%')).toBeInTheDocument();
      expect(screen.getByText('Critical: 90%')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should show auto-refresh indicator', () => {
      render(<SystemHealthMonitor {...defaultProps} autoRefresh={true} />);
      
      expect(screen.getByTestId('auto-refresh-indicator')).toBeInTheDocument();
    });

    it('should handle manual refresh', async () => {
      const user = userEvent.setup();
      render(<SystemHealthMonitor {...defaultProps} />);

      const refreshButton = screen.getByTestId('refresh-button');
      await user.click(refreshButton);

      expect(mockOnRefresh).toHaveBeenCalled();
    });

    it('should handle real-time metric updates', () => {
      const { rerender } = render(<SystemHealthMonitor {...defaultProps} />);

      const updatedMetrics = [...mockHealthMetrics];
      updatedMetrics[0] = { ...updatedMetrics[0], value: 80 };

      rerender(<SystemHealthMonitor {...defaultProps} metrics={updatedMetrics} />);

      expect(screen.getByText('80%')).toBeInTheDocument();
    });
  });

  describe('Filtering and Grouping', () => {
    it('should filter metrics by category', async () => {
      const user = userEvent.setup();
      render(<SystemHealthMonitor {...defaultProps} showFilters={true} />);

      const categoryFilter = screen.getByTestId('category-filter');
      await user.click(categoryFilter);
      
      const performanceOption = screen.getByText('Performance');
      await user.click(performanceOption);

      expect(screen.getByTestId('metric-cpu-usage')).toBeInTheDocument();
      expect(screen.getByTestId('metric-memory-usage')).toBeInTheDocument();
      expect(screen.queryByTestId('metric-disk-space')).not.toBeInTheDocument();
    });

    it('should group metrics by category', () => {
      render(<SystemHealthMonitor {...defaultProps} groupByCategory={true} />);
      
      expect(screen.getByTestId('category-performance')).toBeInTheDocument();
      expect(screen.getByTestId('category-storage')).toBeInTheDocument();
    });

    it('should sort metrics by status', async () => {
      const user = userEvent.setup();
      render(<SystemHealthMonitor {...defaultProps} showSorting={true} />);

      const sortSelect = screen.getByTestId('sort-select');
      await user.click(sortSelect);
      
      const statusOption = screen.getByText('By Status');
      await user.click(statusOption);

      const metrics = screen.getAllByTestId(/^metric-/);
      expect(metrics[0]).toHaveAttribute('data-testid', 'metric-disk-space'); // Critical first
    });
  });

  describe('Performance Features', () => {
    it('should display performance summary', () => {
      render(<SystemHealthMonitor {...defaultProps} showSummary={true} />);
      
      expect(screen.getByTestId('performance-summary')).toBeInTheDocument();
      expect(screen.getByText('3 metrics monitored')).toBeInTheDocument();
    });

    it('should show system uptime', () => {
      render(<SystemHealthMonitor {...defaultProps} showUptime={true} />);
      
      expect(screen.getByTestId('system-uptime')).toBeInTheDocument();
    });

    it('should display resource utilization chart', () => {
      render(<SystemHealthMonitor {...defaultProps} showChart={true} />);
      
      expect(screen.getByTestId('utilization-chart')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<SystemHealthMonitor {...defaultProps} />);
      
      const monitor = screen.getByTestId('system-health-monitor');
      expect(monitor).toHaveAttribute('role', 'region');
      expect(monitor).toHaveAttribute('aria-label', 'System Health Monitor');
    });

    it('should support keyboard navigation', async () => {
      render(<SystemHealthMonitor {...defaultProps} />);

      const firstMetric = screen.getByTestId('metric-cpu-usage');
      firstMetric.focus();
      
      expect(document.activeElement).toBe(firstMetric);

      fireEvent.keyDown(firstMetric, { key: 'Tab' });
    });

    it('should announce status changes', () => {
      render(<SystemHealthMonitor {...defaultProps} announceUpdates={true} />);

      const announcements = screen.getByTestId('health-announcements');
      expect(announcements).toHaveAttribute('aria-live', 'polite');
      expect(announcements).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Export and Reporting', () => {
    it('should export health report', async () => {
      const user = userEvent.setup();
      const mockOnExport = vi.fn();
      
      render(<SystemHealthMonitor {...defaultProps} exportable={true} onExport={mockOnExport} />);

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);
      
      const reportOption = screen.getByText('Health Report');
      await user.click(reportOption);

      expect(mockOnExport).toHaveBeenCalledWith('pdf', expect.any(Object));
    });
  });

  describe('Advanced Features', () => {
    it('should support custom metric templates', () => {
      const customTemplate = (metric: HealthMetric) => (
        <div data-testid="custom-metric-template">
          {metric.name}: {metric.value}{metric.unit}
        </div>
      );

      render(<SystemHealthMonitor {...defaultProps} customMetricTemplate={customTemplate} />);

      expect(screen.getAllByTestId('custom-metric-template')).toHaveLength(3);
    });

    it('should display historical data', () => {
      render(<SystemHealthMonitor {...defaultProps} showHistory={true} />);
      
      expect(screen.getByTestId('metric-history')).toBeInTheDocument();
      expect(screen.getByText('Historical Data')).toBeInTheDocument();
    });

    it('should handle threshold configuration', async () => {
      const user = userEvent.setup();
      const mockOnThresholdUpdate = vi.fn();
      
      render(<SystemHealthMonitor {...defaultProps} enableThresholdConfig={true} onThresholdUpdate={mockOnThresholdUpdate} />);

      const configButton = screen.getByTestId('configure-thresholds');
      await user.click(configButton);

      expect(screen.getByTestId('threshold-config')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid metric data', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<SystemHealthMonitor metrics={null as any} alerts={[]} onAlertAcknowledge={vi.fn()} onAlertAction={vi.fn()} />);

      expect(screen.getByTestId('health-monitor-error')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should handle metric loading failures', () => {
      render(<SystemHealthMonitor {...defaultProps} error="Failed to load metrics" />);
      
      expect(screen.getByTestId('health-monitor-error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load metrics')).toBeInTheDocument();
    });
  });
});