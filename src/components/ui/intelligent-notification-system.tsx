import React, { useState, useCallback, useMemo } from 'react';
import { 
  Bell, Settings, Filter, Search, X, Check, AlertTriangle, 
  Info, CheckCircle, Clock, Users, Tag, Download, Plus,
  ChevronDown, ChevronUp, Loader2, Volume2, VolumeX, Moon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

// Core types
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'alert';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';
export type NotificationCategory = 'system' | 'task' | 'deployment' | 'security' | 'user' | 'update';

export interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  action: () => void;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  category: NotificationCategory;
  timestamp: string;
  read: boolean;
  actions: NotificationAction[];
  metadata: {
    source: string;
    tags: string[];
    relatedId?: string;
  };
}

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    priority?: NotificationPriority;
    category?: NotificationCategory;
    type?: NotificationType;
  };
  channels: string[];
  enabled: boolean;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'push' | 'sms' | 'webhook';
  enabled: boolean;
  config: Record<string, any>;
}

export interface NotificationSettings {
  globalEnabled: boolean;
  soundEnabled: boolean;
  doNotDisturbEnabled: boolean;
  doNotDisturbStart: string;
  doNotDisturbEnd: string;
  groupSimilar: boolean;
  maxNotifications: number;
  autoMarkReadAfter: number;
  channels: NotificationChannel[];
  rules: NotificationRule[];
}

export interface IntelligentNotificationSystemProps {
  notifications: Notification[];
  settings: NotificationSettings;
  onNotificationClick: (notification: Notification) => void;
  onNotificationDismiss: (notificationId: string) => void;
  onNotificationAction: (notificationId: string, actionId: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onSettingsChange: (settings: NotificationSettings) => void;
  title?: string;
  className?: string;
  loading?: boolean;
  error?: string;
  showFilters?: boolean;
  showSorting?: boolean;
  showRules?: boolean;
  showSettings?: boolean;
  showAnalytics?: boolean;
  searchable?: boolean;
  groupBy?: 'none' | 'category' | 'priority' | 'date';
  maxHeight?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  virtualized?: boolean;
  lazyLoadDetails?: boolean;
  playNotificationSound?: boolean;
  announceUpdates?: boolean;
  exportable?: boolean;
  customTemplate?: (notification: Notification) => React.ReactNode;
  onRuleCreate?: (rule: NotificationRule) => void;
  onRuleUpdate?: (rule: NotificationRule) => void;
  onExport?: (format: string, data: any) => void;
}

export function IntelligentNotificationSystem({
  notifications,
  settings,
  onNotificationClick,
  onNotificationDismiss,
  onNotificationAction,
  onMarkAllRead,
  onClearAll,
  onSettingsChange,
  title = "Notifications",
  className,
  loading = false,
  error,
  showFilters = false,
  showSorting = false,
  showRules = false,
  showSettings = false,
  showAnalytics = false,
  searchable = false,
  groupBy = 'none',
  maxHeight = 600,
  autoRefresh = false,
  refreshInterval = 30000,
  virtualized = false,
  lazyLoadDetails = false,
  playNotificationSound = false,
  announceUpdates = false,
  exportable = false,
  customTemplate,
  onRuleCreate,
  onRuleUpdate,
  onExport
}: IntelligentNotificationSystemProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);

  // Empty state
  if (!notifications || notifications.length === 0) {
    return (
      <div 
        className={cn("w-full", className)}
        role="region"
        aria-label="Notifications"
        data-testid="intelligent-notification-system"
      >
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center" data-testid="empty-notifications-state">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm text-muted-foreground">You're all caught up!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div 
        className={cn("w-full", className)}
        role="region"
        aria-label="Notifications"
        data-testid="intelligent-notification-system"
      >
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center" data-testid="notifications-loading">
              <Loader2 className="h-8 w-8 mx-auto animate-spin mb-4" />
              <p className="text-lg font-medium">Loading notifications...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        className={cn("w-full", className)}
        role="region"
        aria-label="Notifications"
        data-testid="intelligent-notification-system"
      >
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center" data-testid="notifications-error-state">
              <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <p className="text-lg font-medium text-destructive">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter and search notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          notification.title.toLowerCase().includes(searchLower) ||
          notification.message.toLowerCase().includes(searchLower) ||
          notification.metadata.tags.some(tag => tag.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Type filter
      if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
      
      // Priority filter  
      if (priorityFilter !== 'all' && notification.priority !== priorityFilter) return false;
      
      // Category filter
      if (categoryFilter !== 'all' && notification.category !== categoryFilter) return false;
      
      // Status filter
      if (statusFilter === 'read' && !notification.read) return false;
      if (statusFilter === 'unread' && notification.read) return false;
      
      return true;
    });
  }, [notifications, searchTerm, typeFilter, priorityFilter, categoryFilter, statusFilter]);

  // Sort notifications
  const sortedNotifications = useMemo(() => {
    const sorted = [...filteredNotifications];
    
    switch (sortBy) {
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      case 'priority':
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return sorted.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
      case 'newest':
      default:
        return sorted.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  }, [filteredNotifications, sortBy]);

  // Group notifications
  const groupedNotifications = useMemo(() => {
    if (groupBy === 'none') {
      return { 'all': sortedNotifications };
    }

    const groups: Record<string, Notification[]> = {};
    
    sortedNotifications.forEach(notification => {
      let groupKey: string;
      
      switch (groupBy) {
        case 'category':
          groupKey = notification.category;
          break;
        case 'priority':
          groupKey = notification.priority;
          break;
        case 'date':
          const date = new Date(notification.timestamp);
          const today = new Date();
          const isToday = date.toDateString() === today.toDateString();
          groupKey = isToday ? 'today' : date.toDateString();
          break;
        default:
          groupKey = 'all';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });
    
    return groups;
  }, [sortedNotifications, groupBy]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const totalCount = notifications.length;

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return X;
      case 'alert': return Bell;
      case 'info': return Info;
      default: return Bell;
    }
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'alert': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 border-red-500 text-red-700';
      case 'high': return 'bg-orange-100 border-orange-500 text-orange-700';
      case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      case 'low': return 'bg-green-100 border-green-500 text-green-700';
      default: return 'bg-gray-100 border-gray-500 text-gray-700';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  const handleNotificationExpand = useCallback((notificationId: string) => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  }, []);

  const handleGroupToggle = useCallback((groupId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  const handleSettingsToggle = useCallback((key: string, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  }, [settings, onSettingsChange]);

  const handleChannelToggle = useCallback((channelId: string, enabled: boolean) => {
    const updatedChannels = settings.channels.map(channel =>
      channel.id === channelId ? { ...channel, enabled } : channel
    );
    onSettingsChange({
      ...settings,
      channels: updatedChannels
    });
  }, [settings, onSettingsChange]);

  // Setup audio for notifications
  if (playNotificationSound && typeof window !== 'undefined') {
    // Create audio instance for sound capability
    new Audio();
  }

  return (
    <div 
      className={cn("w-full space-y-4", className)}
      role="region"
      aria-label="Notifications"
      data-testid="intelligent-notification-system"
      style={{ maxHeight: `${maxHeight}px`, overflowY: 'auto' }}
    >
      {announceUpdates && (
        <div 
          data-testid="notifications-announcements"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
      )}

      {/* Auto-refresh indicator */}
      {autoRefresh && (
        <div data-testid="auto-refresh-indicator" className="flex items-center gap-2 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Auto-refresh enabled</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {title}
              <div className="flex items-center gap-2 ml-2">
                <Badge data-testid="notification-count" aria-label={`${totalCount} total notifications`}>
                  {totalCount}
                </Badge>
                {unreadCount > 0 && (
                  <Badge variant="destructive" data-testid="unread-count" aria-label={`${unreadCount} unread notifications`}>
                    {unreadCount}
                  </Badge>
                )}
              </div>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onMarkAllRead}
                data-testid="mark-all-read"
              >
                <Check className="h-4 w-4 mr-1" />
                Mark All Read
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={onClearAll}
                data-testid="clear-all"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>

              {exportable && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onExport?.('csv', notifications)}>
                      Export as CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Search */}
          {searchable && (
            <div className="mt-4">
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="notification-search"
                className="max-w-sm"
              />
            </div>
          )}

          {/* Filters and Sorting */}
          {(showFilters || showSorting) && (
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              {showFilters && (
                <>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-32" data-testid="type-filter">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="alert">Alerts</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-32" data-testid="priority-filter">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-32" data-testid="category-filter">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="deployment">Deployment</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32" data-testid="status-filter">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="unread">Unread</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}

              {showSorting && (
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-36" data-testid="sort-select">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Notifications List */}
          <div 
            className={cn("space-y-4", virtualized && "virtualized-notifications")}
            data-testid={virtualized ? "virtualized-notifications" : "notifications-list"}
          >
            {groupBy !== 'none' ? (
              // Grouped notifications
              Object.entries(groupedNotifications).map(([groupKey, groupNotifications]) => (
                <div key={groupKey} data-testid={`group-${groupKey}`}>
                  <div 
                    className="flex items-center gap-2 mb-2 cursor-pointer"
                    onClick={() => handleGroupToggle(groupKey)}
                    data-testid={`group-toggle-${groupKey}`}
                  >
                    {collapsedGroups.has(groupKey) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                    <h3 className="font-medium capitalize">{groupKey} ({groupNotifications.length})</h3>
                  </div>
                  
                  {!collapsedGroups.has(groupKey) && (
                    <div className="space-y-2 ml-6">
                      {groupNotifications.map((notification) => (
                        <NotificationCard
                          key={notification.id}
                          notification={notification}
                          onNotificationClick={onNotificationClick}
                          onNotificationDismiss={onNotificationDismiss}
                          onNotificationAction={onNotificationAction}
                          expanded={expandedNotifications.has(notification.id)}
                          onExpand={handleNotificationExpand}
                          lazyLoadDetails={lazyLoadDetails}
                          customTemplate={customTemplate}
                          getTypeIcon={getTypeIcon}
                          getTypeColor={getTypeColor}
                          getPriorityColor={getPriorityColor}
                          formatTime={formatTime}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              // Regular list
              sortedNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onNotificationClick={onNotificationClick}
                  onNotificationDismiss={onNotificationDismiss}
                  onNotificationAction={onNotificationAction}
                  expanded={expandedNotifications.has(notification.id)}
                  onExpand={handleNotificationExpand}
                  lazyLoadDetails={lazyLoadDetails}
                  customTemplate={customTemplate}
                  getTypeIcon={getTypeIcon}
                  getTypeColor={getTypeColor}
                  getPriorityColor={getPriorityColor}
                  formatTime={formatTime}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Rules */}
      {showRules && (
        <Card data-testid="notification-rules">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Notification Rules
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRuleBuilder(true)}
                data-testid="add-rule-button"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Rule
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {settings.rules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-2 border rounded mb-2">
                <div>
                  <span className="font-medium">{rule.name}</span>
                  <p className="text-sm text-muted-foreground">{rule.description}</p>
                </div>
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={(enabled) => onRuleUpdate?.({ ...rule, enabled })}
                  data-testid={`rule-toggle-${rule.id}`}
                />
              </div>
            ))}

            {showRuleBuilder && (
              <div className="mt-4 p-4 border rounded" data-testid="rule-builder">
                <h4 className="font-medium mb-2">Create Rule</h4>
                <Button 
                  onClick={() => {
                    onRuleCreate?.({
                      id: `rule-${Date.now()}`,
                      name: 'New Rule',
                      description: 'New notification rule',
                      conditions: {},
                      channels: ['push'],
                      enabled: true
                    });
                    setShowRuleBuilder(false);
                  }}
                >
                  Save Rule
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Settings */}
      {showSettings && (
        <Card data-testid="notification-settings">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Global Notifications</span>
              <Switch
                checked={settings.globalEnabled}
                onCheckedChange={(checked) => handleSettingsToggle('globalEnabled', checked)}
                data-testid="global-notifications-toggle"
              />
            </div>

            <div className="flex items-center justify-between">
              <span>Sound Notifications</span>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => handleSettingsToggle('soundEnabled', checked)}
                data-testid="sound-notifications-toggle"
              />
            </div>

            <div className="flex items-center justify-between">
              <span>Do Not Disturb</span>
              <Switch
                checked={settings.doNotDisturbEnabled}
                onCheckedChange={(checked) => handleSettingsToggle('doNotDisturbEnabled', checked)}
                data-testid="dnd-toggle"
              />
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Notification Channels</h4>
              {settings.channels.map(channel => (
                <div key={channel.id} className="flex items-center justify-between">
                  <span>{channel.name}</span>
                  <Switch
                    checked={channel.enabled}
                    onCheckedChange={(enabled) => handleChannelToggle(channel.id, enabled)}
                    data-testid={`channel-toggle-${channel.id}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics */}
      {showAnalytics && (
        <Card data-testid="notification-analytics">
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{totalCount}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{unreadCount}</div>
                <div className="text-sm text-muted-foreground">Unread</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {totalCount > 0 ? Math.round(((totalCount - unreadCount) / totalCount) * 100) : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Read Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// NotificationCard component
interface NotificationCardProps {
  notification: Notification;
  onNotificationClick: (notification: Notification) => void;
  onNotificationDismiss: (notificationId: string) => void;
  onNotificationAction: (notificationId: string, actionId: string) => void;
  expanded: boolean;
  onExpand: (notificationId: string) => void;
  lazyLoadDetails: boolean;
  customTemplate?: (notification: Notification) => React.ReactNode;
  getTypeIcon: (type: NotificationType) => React.ComponentType;
  getTypeColor: (type: NotificationType) => string;
  getPriorityColor: (priority: NotificationPriority) => string;
  formatTime: (timestamp: string) => string;
}

function NotificationCard({
  notification,
  onNotificationClick,
  onNotificationDismiss,
  onNotificationAction,
  expanded,
  onExpand,
  lazyLoadDetails,
  customTemplate,
  getTypeIcon,
  getTypeColor,
  getPriorityColor,
  formatTime
}: NotificationCardProps) {
  if (customTemplate) {
    return <div key={notification.id}>{customTemplate(notification)}</div>;
  }

  const TypeIcon = getTypeIcon(notification.type);

  return (
    <Card
      className={cn(
        "transition-all cursor-pointer hover:shadow-md",
        !notification.read && "border-l-4 border-l-blue-500",
        getTypeColor(notification.type)
      )}
      data-testid={`notification-${notification.id}`}
      tabIndex={0}
      onClick={() => onNotificationClick(notification)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <TypeIcon className="h-5 w-5" />
            <div className="flex-1">
              <h3 className="font-medium">{notification.title}</h3>
              <p className="text-sm text-muted-foreground">{notification.message}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <Badge 
              className={getPriorityColor(notification.priority)}
              data-testid={`priority-${notification.priority}`}
            >
              {notification.priority}
            </Badge>
            
            <Badge 
              variant="outline"
              data-testid={`category-${notification.category}`}
            >
              {notification.category}
            </Badge>
            
            <Badge 
              variant={notification.read ? "secondary" : "default"}
              data-testid={`status-${notification.read ? "read" : "unread"}-${notification.id}`}
            >
              {notification.read ? "Read" : "Unread"}
            </Badge>
            
            <span className="text-xs text-muted-foreground">
              {formatTime(notification.timestamp)}
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onExpand(notification.id);
              }}
              data-testid={`expand-${notification.id}`}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onNotificationDismiss(notification.id);
              }}
              data-testid={`dismiss-${notification.id}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          {lazyLoadDetails ? (
            <div data-testid="notification-details-loading" className="text-center py-4">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm">
                <strong>Source:</strong> {notification.metadata.source}
              </div>
              
              {notification.metadata.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {notification.metadata.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              {notification.actions.length > 0 && (
                <div className="flex gap-2 pt-2">
                  {notification.actions.map(action => (
                    <Button
                      key={action.id}
                      variant={action.type === 'primary' ? 'default' : 'outline'}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNotificationAction(notification.id, action.id);
                      }}
                      data-testid={`action-${action.id}`}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default IntelligentNotificationSystem;