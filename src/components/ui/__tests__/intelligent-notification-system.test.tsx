import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import IntelligentNotificationSystem, {
  IntelligentNotificationSystemProps,
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  NotificationAction,
  NotificationRule,
  NotificationChannel,
  NotificationSettings
} from '../intelligent-notification-system';

// Mock data
const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    title: 'System Alert',
    message: 'High CPU usage detected on server-1',
    type: 'alert',
    priority: 'high',
    category: 'system',
    timestamp: '2024-01-15T10:30:00Z',
    read: false,
    actions: [
      {
        id: 'action-1',
        label: 'View Details',
        type: 'primary',
        action: () => {}
      }
    ],
    metadata: {
      source: 'monitoring-system',
      tags: ['cpu', 'performance'],
      relatedId: 'server-1'
    }
  },
  {
    id: 'notif-2',
    title: 'Deployment Complete',
    message: 'Version 1.2.3 has been successfully deployed to production',
    type: 'success',
    priority: 'medium',
    category: 'deployment',
    timestamp: '2024-01-15T10:25:00Z',
    read: true,
    actions: [],
    metadata: {
      source: 'ci-cd-pipeline',
      tags: ['deployment', 'production'],
      relatedId: 'deploy-123'
    }
  },
  {
    id: 'notif-3',
    title: 'Task Assignment',
    message: 'You have been assigned to review pull request #456',
    type: 'info',
    priority: 'medium',
    category: 'task',
    timestamp: '2024-01-15T10:20:00Z',
    read: false,
    actions: [
      {
        id: 'action-2',
        label: 'Review',
        type: 'primary',
        action: () => {}
      },
      {
        id: 'action-3',
        label: 'Dismiss',
        type: 'secondary',
        action: () => {}
      }
    ],
    metadata: {
      source: 'github',
      tags: ['review', 'pr'],
      relatedId: 'pr-456'
    }
  }
];

const mockNotificationRules: NotificationRule[] = [
  {
    id: 'rule-1',
    name: 'High Priority Alerts',
    description: 'Notify immediately for high priority system alerts',
    conditions: {
      priority: 'high',
      category: 'system'
    },
    channels: ['push', 'email'],
    enabled: true
  }
];

const mockChannels: NotificationChannel[] = [
  {
    id: 'email',
    name: 'Email',
    type: 'email',
    enabled: true,
    config: {
      address: 'user@example.com'
    }
  },
  {
    id: 'push',
    name: 'Push Notifications',
    type: 'push',
    enabled: true,
    config: {}
  }
];

const mockSettings: NotificationSettings = {
  globalEnabled: true,
  soundEnabled: true,
  doNotDisturbEnabled: false,
  doNotDisturbStart: '22:00',
  doNotDisturbEnd: '08:00',
  groupSimilar: true,
  maxNotifications: 50,
  autoMarkReadAfter: 7,
  channels: mockChannels,
  rules: mockNotificationRules
};

const mockOnNotificationClick = vi.fn();
const mockOnNotificationDismiss = vi.fn();
const mockOnNotificationAction = vi.fn();
const mockOnMarkAllRead = vi.fn();
const mockOnClearAll = vi.fn();
const mockOnSettingsChange = vi.fn();
const mockOnRuleCreate = vi.fn();
const mockOnRuleUpdate = vi.fn();

const defaultProps: IntelligentNotificationSystemProps = {
  notifications: mockNotifications,
  settings: mockSettings,
  onNotificationClick: mockOnNotificationClick,
  onNotificationDismiss: mockOnNotificationDismiss,
  onNotificationAction: mockOnNotificationAction,
  onMarkAllRead: mockOnMarkAllRead,
  onClearAll: mockOnClearAll,
  onSettingsChange: mockOnSettingsChange
};

describe('IntelligentNotificationSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<IntelligentNotificationSystem {...defaultProps} />);
      
      expect(screen.getByTestId('intelligent-notification-system')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('should render custom title', () => {
      render(<IntelligentNotificationSystem {...defaultProps} title="Custom Notifications" />);
      
      expect(screen.getByText('Custom Notifications')).toBeInTheDocument();
    });

    it('should show notification count', () => {
      render(<IntelligentNotificationSystem {...defaultProps} />);
      
      expect(screen.getByTestId('notification-count')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should show unread notification count', () => {
      render(<IntelligentNotificationSystem {...defaultProps} />);
      
      expect(screen.getByTestId('unread-count')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should render empty state when no notifications', () => {
      render(
        <IntelligentNotificationSystem 
          {...defaultProps} 
          notifications={[]} 
        />
      );
      
      expect(screen.getByTestId('empty-notifications-state')).toBeInTheDocument();
      expect(screen.getByText('No notifications')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      render(<IntelligentNotificationSystem {...defaultProps} loading={true} />);
      
      expect(screen.getByTestId('notifications-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
    });

    it('should render error state', () => {
      render(<IntelligentNotificationSystem {...defaultProps} error="Failed to load notifications" />);
      
      expect(screen.getByTestId('notifications-error-state')).toBeInTheDocument();
      expect(screen.getByText('Failed to load notifications')).toBeInTheDocument();
    });
  });

  describe('Notification Display', () => {
    it('should render all notification types', () => {
      render(<IntelligentNotificationSystem {...defaultProps} />);
      
      expect(screen.getByTestId('notification-notif-1')).toBeInTheDocument();
      expect(screen.getByTestId('notification-notif-2')).toBeInTheDocument();
      expect(screen.getByTestId('notification-notif-3')).toBeInTheDocument();
    });

    it('should show notification priorities', () => {
      render(<IntelligentNotificationSystem {...defaultProps} />);
      
      expect(screen.getByTestId('priority-high')).toBeInTheDocument();
      expect(screen.getAllByTestId('priority-medium')).toHaveLength(2);
    });

    it('should show notification categories', () => {
      render(<IntelligentNotificationSystem {...defaultProps} />);
      
      expect(screen.getByTestId('category-system')).toBeInTheDocument();
      expect(screen.getByTestId('category-deployment')).toBeInTheDocument();
      expect(screen.getByTestId('category-task')).toBeInTheDocument();
    });

    it('should show read/unread status', () => {
      render(<IntelligentNotificationSystem {...defaultProps} />);
      
      expect(screen.getByTestId('status-unread-notif-1')).toBeInTheDocument();
      expect(screen.getByTestId('status-read-notif-2')).toBeInTheDocument();
    });

    it('should display timestamps', () => {
      render(<IntelligentNotificationSystem {...defaultProps} />);
      
      // Check that timestamps are displayed - looking for time format patterns
      const timeElements = document.querySelectorAll('span.text-xs.text-muted-foreground');
      expect(timeElements.length).toBeGreaterThan(0);
    });
  });

  describe('Notification Interactions', () => {
    it('should handle notification clicks', async () => {
      const user = userEvent.setup();
      render(<IntelligentNotificationSystem {...defaultProps} />);

      const notification = screen.getByTestId('notification-notif-1');
      await user.click(notification);

      expect(mockOnNotificationClick).toHaveBeenCalledWith(mockNotifications[0]);
    });

    it('should handle notification dismissal', async () => {
      const user = userEvent.setup();
      render(<IntelligentNotificationSystem {...defaultProps} />);

      const dismissButton = screen.getByTestId('dismiss-notif-1');
      await user.click(dismissButton);

      expect(mockOnNotificationDismiss).toHaveBeenCalledWith('notif-1');
    });

    it('should handle notification actions', async () => {
      const user = userEvent.setup();
      render(<IntelligentNotificationSystem {...defaultProps} />);

      // First expand the notification to see actions
      const expandButton = screen.getByTestId('expand-notif-1');
      await user.click(expandButton);

      const actionButton = screen.getByTestId('action-action-1');
      await user.click(actionButton);

      expect(mockOnNotificationAction).toHaveBeenCalledWith('notif-1', 'action-1');
    });

    it('should mark all notifications as read', async () => {
      const user = userEvent.setup();
      render(<IntelligentNotificationSystem {...defaultProps} />);

      const markAllReadButton = screen.getByTestId('mark-all-read');
      await user.click(markAllReadButton);

      expect(mockOnMarkAllRead).toHaveBeenCalled();
    });

    it('should clear all notifications', async () => {
      const user = userEvent.setup();
      render(<IntelligentNotificationSystem {...defaultProps} />);

      const clearAllButton = screen.getByTestId('clear-all');
      await user.click(clearAllButton);

      expect(mockOnClearAll).toHaveBeenCalled();
    });
  });

  describe('Filtering and Sorting', () => {
    it('should filter notifications by type', async () => {
      const user = userEvent.setup();
      render(<IntelligentNotificationSystem {...defaultProps} showFilters={true} />);

      const typeFilter = screen.getByTestId('type-filter');
      await user.click(typeFilter);
      
      const alertOption = screen.getByText('Alerts');
      await user.click(alertOption);

      expect(screen.getByTestId('notification-notif-1')).toBeInTheDocument();
      expect(screen.queryByTestId('notification-notif-2')).not.toBeInTheDocument();
    });

    it('should filter notifications by priority', async () => {
      const user = userEvent.setup();
      render(<IntelligentNotificationSystem {...defaultProps} showFilters={true} />);

      const priorityFilter = screen.getByTestId('priority-filter');
      await user.click(priorityFilter);
      
      const highOption = screen.getByText('High');
      await user.click(highOption);

      expect(screen.getByTestId('notification-notif-1')).toBeInTheDocument();
      expect(screen.queryByTestId('notification-notif-2')).not.toBeInTheDocument();
    });

    it('should filter notifications by category', async () => {
      const user = userEvent.setup();
      render(<IntelligentNotificationSystem {...defaultProps} showFilters={true} />);

      const categoryFilter = screen.getByTestId('category-filter');
      await user.click(categoryFilter);
      
      const systemOption = screen.getByText('System');
      await user.click(systemOption);

      expect(screen.getByTestId('notification-notif-1')).toBeInTheDocument();
      expect(screen.queryByTestId('notification-notif-2')).not.toBeInTheDocument();
    });

    it('should filter notifications by read status', async () => {
      const user = userEvent.setup();
      render(<IntelligentNotificationSystem {...defaultProps} showFilters={true} />);

      const statusFilter = screen.getByTestId('status-filter');
      await user.click(statusFilter);
      
      const unreadOptions = screen.getAllByText('Unread');
      // Find the option in the dropdown (not the status badges)
      const unreadOption = unreadOptions.find(el => el.closest('[role="option"]'));
      await user.click(unreadOption!);

      expect(screen.getByTestId('notification-notif-1')).toBeInTheDocument();
      expect(screen.getByTestId('notification-notif-3')).toBeInTheDocument();
      expect(screen.queryByTestId('notification-notif-2')).not.toBeInTheDocument();
    });

    it('should sort notifications by timestamp', async () => {
      const user = userEvent.setup();
      render(<IntelligentNotificationSystem {...defaultProps} showSorting={true} />);

      const sortSelect = screen.getByTestId('sort-select');
      await user.click(sortSelect);
      
      const oldestOption = screen.getByText('Oldest first');
      await user.click(oldestOption);

      const notifications = screen.getAllByTestId(/^notification-notif-/);
      expect(notifications[0]).toHaveAttribute('data-testid', 'notification-notif-3');
    });
  });

  describe('Grouping and Organization', () => {
    it('should group notifications by category', () => {
      render(<IntelligentNotificationSystem {...defaultProps} groupBy="category" />);
      
      expect(screen.getByTestId('group-system')).toBeInTheDocument();
      expect(screen.getByTestId('group-deployment')).toBeInTheDocument();
      expect(screen.getByTestId('group-task')).toBeInTheDocument();
    });

    it('should group notifications by priority', () => {
      render(<IntelligentNotificationSystem {...defaultProps} groupBy="priority" />);
      
      expect(screen.getByTestId('group-high')).toBeInTheDocument();
      expect(screen.getByTestId('group-medium')).toBeInTheDocument();
    });

    it('should group notifications by date', () => {
      render(<IntelligentNotificationSystem {...defaultProps} groupBy="date" />);
      
      expect(screen.getByTestId('group-today')).toBeInTheDocument();
    });

    it('should collapse and expand groups', async () => {
      const user = userEvent.setup();
      render(<IntelligentNotificationSystem {...defaultProps} groupBy="category" />);

      const systemGroup = screen.getByTestId('group-toggle-system');
      await user.click(systemGroup);

      // After clicking, the group should be collapsed and notification should not be in document
      expect(screen.queryByTestId('notification-notif-1')).not.toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should search notifications by title', async () => {
      const user = userEvent.setup();
      render(<IntelligentNotificationSystem {...defaultProps} searchable={true} />);

      const searchInput = screen.getByTestId('notification-search');
      await user.type(searchInput, 'System Alert');

      expect(screen.getByTestId('notification-notif-1')).toBeInTheDocument();
      expect(screen.queryByTestId('notification-notif-2')).not.toBeInTheDocument();
    });

    it('should search notifications by message content', async () => {
      const user = userEvent.setup();
      render(<IntelligentNotificationSystem {...defaultProps} searchable={true} />);

      const searchInput = screen.getByTestId('notification-search');
      await user.type(searchInput, 'CPU usage');

      expect(screen.getByTestId('notification-notif-1')).toBeInTheDocument();
      expect(screen.queryByTestId('notification-notif-2')).not.toBeInTheDocument();
    });

    it('should search notifications by tags', async () => {
      const user = userEvent.setup();
      render(<IntelligentNotificationSystem {...defaultProps} searchable={true} />);

      const searchInput = screen.getByTestId('notification-search');
      await user.type(searchInput, 'deployment');

      expect(screen.getByTestId('notification-notif-2')).toBeInTheDocument();
      expect(screen.queryByTestId('notification-notif-1')).not.toBeInTheDocument();
    });
  });

  describe('Notification Rules', () => {
    it('should display notification rules', () => {
      render(<IntelligentNotificationSystem {...defaultProps} showRules={true} />);
      
      expect(screen.getByTestId('notification-rules')).toBeInTheDocument();
      expect(screen.getByText('High Priority Alerts')).toBeInTheDocument();
    });

    it('should create new notification rule', async () => {
      const user = userEvent.setup();
      render(
        <IntelligentNotificationSystem 
          {...defaultProps} 
          showRules={true} 
          onRuleCreate={mockOnRuleCreate} 
        />
      );

      const addRuleButton = screen.getByTestId('add-rule-button');
      await user.click(addRuleButton);

      expect(screen.getByTestId('rule-builder')).toBeInTheDocument();
      
      const saveButton = screen.getByText('Save Rule');
      await user.click(saveButton);

      expect(mockOnRuleCreate).toHaveBeenCalled();
    });

    it('should toggle rule enabled status', async () => {
      const user = userEvent.setup();
      render(
        <IntelligentNotificationSystem 
          {...defaultProps} 
          showRules={true} 
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

  describe('Settings Management', () => {
    it('should display notification settings', () => {
      render(<IntelligentNotificationSystem {...defaultProps} showSettings={true} />);
      
      expect(screen.getByTestId('notification-settings')).toBeInTheDocument();
      expect(screen.getByTestId('global-notifications-toggle')).toBeInTheDocument();
    });

    it('should toggle global notifications', async () => {
      const user = userEvent.setup();
      render(<IntelligentNotificationSystem {...defaultProps} showSettings={true} />);

      const globalToggle = screen.getByTestId('global-notifications-toggle');
      await user.click(globalToggle);

      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          globalEnabled: false
        })
      );
    });

    it('should toggle sound notifications', async () => {
      const user = userEvent.setup();
      render(<IntelligentNotificationSystem {...defaultProps} showSettings={true} />);

      const soundToggle = screen.getByTestId('sound-notifications-toggle');
      await user.click(soundToggle);

      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          soundEnabled: false
        })
      );
    });

    it('should configure do not disturb', async () => {
      const user = userEvent.setup();
      render(<IntelligentNotificationSystem {...defaultProps} showSettings={true} />);

      const dndToggle = screen.getByTestId('dnd-toggle');
      await user.click(dndToggle);

      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          doNotDisturbEnabled: true
        })
      );
    });

    it('should configure notification channels', async () => {
      const user = userEvent.setup();
      render(<IntelligentNotificationSystem {...defaultProps} showSettings={true} />);

      const emailToggle = screen.getByTestId('channel-toggle-email');
      await user.click(emailToggle);

      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          channels: expect.arrayContaining([
            expect.objectContaining({
              id: 'email',
              enabled: false
            })
          ])
        })
      );
    });
  });

  describe('Real-time Updates', () => {
    it('should handle real-time notification updates', () => {
      const { rerender } = render(<IntelligentNotificationSystem {...defaultProps} />);

      const updatedNotifications = [
        ...mockNotifications,
        {
          id: 'notif-4',
          title: 'New Alert',
          message: 'New system alert received',
          type: 'alert' as NotificationType,
          priority: 'high' as NotificationPriority,
          category: 'system' as NotificationCategory,
          timestamp: '2024-01-15T10:35:00Z',
          read: false,
          actions: [],
          metadata: {
            source: 'monitoring',
            tags: ['new'],
            relatedId: 'alert-new'
          }
        }
      ];

      rerender(<IntelligentNotificationSystem {...defaultProps} notifications={updatedNotifications} />);

      expect(screen.getByTestId('notification-notif-4')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument(); // Updated count
    });

    it('should show auto-refresh indicator', () => {
      render(<IntelligentNotificationSystem {...defaultProps} autoRefresh={true} />);
      
      expect(screen.getByTestId('auto-refresh-indicator')).toBeInTheDocument();
    });

    it('should handle notification sound', () => {
      const mockAudio = {
        play: vi.fn(),
        pause: vi.fn(),
        currentTime: 0,
        volume: 1
      };
      
      // Mock Audio constructor
      global.Audio = vi.fn(() => mockAudio) as any;

      render(<IntelligentNotificationSystem {...defaultProps} playNotificationSound={true} />);
      
      // Audio should be created for sound capability
      expect(global.Audio).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<IntelligentNotificationSystem {...defaultProps} />);
      
      const system = screen.getByTestId('intelligent-notification-system');
      expect(system).toHaveAttribute('role', 'region');
      expect(system).toHaveAttribute('aria-label', 'Notifications');
      
      const notifications = screen.getAllByRole('button');
      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', async () => {
      render(<IntelligentNotificationSystem {...defaultProps} />);

      const firstNotification = screen.getByTestId('notification-notif-1');
      firstNotification.focus();
      
      expect(document.activeElement).toBe(firstNotification);

      fireEvent.keyDown(firstNotification, { key: 'Tab' });
    });

    it('should announce updates to screen readers', () => {
      render(<IntelligentNotificationSystem {...defaultProps} announceUpdates={true} />);

      const announcements = screen.getByTestId('notifications-announcements');
      expect(announcements).toHaveAttribute('aria-live', 'polite');
      expect(announcements).toHaveAttribute('aria-atomic', 'true');
    });

    it('should provide notification count for screen readers', () => {
      render(<IntelligentNotificationSystem {...defaultProps} />);

      const countElement = screen.getByTestId('notification-count');
      expect(countElement).toHaveAttribute('aria-label');
    });
  });

  describe('Performance Features', () => {
    it('should virtualize large notification lists', () => {
      const largeNotificationList = Array.from({ length: 100 }, (_, i) => ({
        ...mockNotifications[0],
        id: `notif-${i}`,
        title: `Notification ${i}`
      }));

      render(
        <IntelligentNotificationSystem 
          {...defaultProps} 
          notifications={largeNotificationList}
          virtualized={true}
        />
      );

      expect(screen.getByTestId('virtualized-notifications')).toBeInTheDocument();
    });

    it('should lazy load notification details', async () => {
      const user = userEvent.setup();
      render(<IntelligentNotificationSystem {...defaultProps} lazyLoadDetails={true} />);

      const expandButton = screen.getByTestId('expand-notif-1');
      await user.click(expandButton);

      expect(screen.getByTestId('notification-details-loading')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid notification data', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <IntelligentNotificationSystem 
          {...defaultProps} 
          notifications={null as any} 
        />
      );

      expect(screen.getByTestId('empty-notifications-state')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should display error state for data loading failures', () => {
      render(
        <IntelligentNotificationSystem 
          {...defaultProps} 
          error="Failed to load notifications"
        />
      );

      expect(screen.getByTestId('notifications-error-state')).toBeInTheDocument();
      expect(screen.getByText('Failed to load notifications')).toBeInTheDocument();
    });
  });

  describe('Export and Analytics', () => {
    it('should export notifications', async () => {
      const user = userEvent.setup();
      const mockOnExport = vi.fn();
      
      render(
        <IntelligentNotificationSystem 
          {...defaultProps} 
          exportable={true}
          onExport={mockOnExport}
        />
      );

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);
      
      const csvOption = screen.getByText('Export as CSV');
      await user.click(csvOption);

      expect(mockOnExport).toHaveBeenCalledWith('csv', mockNotifications);
    });

    it('should show notification analytics', () => {
      render(<IntelligentNotificationSystem {...defaultProps} showAnalytics={true} />);
      
      expect(screen.getByTestId('notification-analytics')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });
  });
});