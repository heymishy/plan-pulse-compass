import {
  AuditEvent,
  AuditAction,
  AuditResourceType,
  AuditSeverity,
  AuditFilter,
  AuditReport,
} from '@/types/auditTypes';
import { encryptData, decryptData } from '@/utils/crypto';

class AuditService {
  private readonly STORAGE_KEY = 'planning-audit-events';
  private readonly MAX_EVENTS = 10000;
  private readonly ENCRYPTION_ENABLED = true;

  private async getEvents(): Promise<AuditEvent[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const data = this.ENCRYPTION_ENABLED
        ? await decryptData(stored)
        : JSON.parse(stored);

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Failed to load audit events:', error);
      return [];
    }
  }

  private async saveEvents(events: AuditEvent[]): Promise<void> {
    try {
      // Keep only the most recent events to prevent storage bloat
      const trimmedEvents = events.slice(-this.MAX_EVENTS);

      const data = this.ENCRYPTION_ENABLED
        ? await encryptData(JSON.stringify(trimmedEvents))
        : JSON.stringify(trimmedEvents);

      localStorage.setItem(this.STORAGE_KEY, data);
    } catch (error) {
      console.error('Failed to save audit events:', error);
    }
  }

  private getUserInfo() {
    // In a real implementation, this would get from auth context
    return {
      userId: 'current-user',
      userEmail: 'user@company.com',
      ipAddress: 'localhost',
      userAgent: navigator.userAgent,
      sessionId: sessionStorage.getItem('session-id') || 'anonymous',
    };
  }

  async logEvent(
    action: AuditAction,
    resourceType: AuditResourceType,
    resourceId: string,
    resourceName?: string,
    oldValue?: any,
    newValue?: any,
    metadata?: Record<string, any>,
    severity: AuditSeverity = 'LOW'
  ): Promise<void> {
    const userInfo = this.getUserInfo();

    const event: AuditEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action,
      resourceType,
      resourceId,
      resourceName,
      oldValue,
      newValue,
      metadata: {
        ...metadata,
        userAgent: userInfo.userAgent,
        url: window.location.pathname,
      },
      severity,
      ...userInfo,
    };

    const events = await this.getEvents();
    events.push(event);
    await this.saveEvents(events);

    // Log critical events to console for immediate visibility
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      console.warn('🚨 Audit Event:', {
        action,
        resourceType,
        resourceId,
        severity,
        timestamp: event.timestamp,
      });
    }
  }

  async getFilteredEvents(filter: AuditFilter): Promise<AuditEvent[]> {
    const events = await this.getEvents();

    return events
      .filter(event => {
        // Date range filter
        if (filter.startDate && event.timestamp < filter.startDate)
          return false;
        if (filter.endDate && event.timestamp > filter.endDate) return false;

        // User filter
        if (filter.userId && event.userId !== filter.userId) return false;

        // Action filter
        if (
          filter.actions &&
          filter.actions.length > 0 &&
          !filter.actions.includes(event.action)
        ) {
          return false;
        }

        // Resource type filter
        if (
          filter.resourceTypes &&
          filter.resourceTypes.length > 0 &&
          !filter.resourceTypes.includes(event.resourceType)
        ) {
          return false;
        }

        // Severity filter
        if (
          filter.severity &&
          filter.severity.length > 0 &&
          !filter.severity.includes(event.severity)
        ) {
          return false;
        }

        // Search term filter
        if (filter.searchTerm) {
          const searchLower = filter.searchTerm.toLowerCase();
          const searchableFields = [
            event.resourceName,
            event.resourceId,
            event.action,
            event.resourceType,
            JSON.stringify(event.metadata),
          ]
            .join(' ')
            .toLowerCase();

          if (!searchableFields.includes(searchLower)) return false;
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }

  async generateReport(
    filter: AuditFilter,
    reportType: AuditReport['reportType'] = 'ACTIVITY'
  ): Promise<AuditReport> {
    const events = await this.getFilteredEvents(filter);
    const userInfo = this.getUserInfo();

    return {
      id: crypto.randomUUID(),
      name: `Audit Report - ${reportType}`,
      description: `Generated audit report for ${events.length} events`,
      filter,
      generatedAt: new Date().toISOString(),
      generatedBy: userInfo.userId,
      eventCount: events.length,
      reportType,
    };
  }

  async exportEvents(
    filter: AuditFilter,
    format: 'JSON' | 'CSV' = 'JSON'
  ): Promise<string> {
    const events = await this.getFilteredEvents(filter);

    if (format === 'CSV') {
      const headers = [
        'Timestamp',
        'User',
        'Action',
        'Resource Type',
        'Resource ID',
        'Resource Name',
        'Severity',
      ];
      const csvRows = [
        headers.join(','),
        ...events.map(event =>
          [
            event.timestamp,
            event.userEmail || event.userId,
            event.action,
            event.resourceType,
            event.resourceId,
            event.resourceName || '',
            event.severity,
          ]
            .map(field => `"${field}"`)
            .join(',')
        ),
      ];
      return csvRows.join('\n');
    }

    return JSON.stringify(events, null, 2);
  }

  async getAuditStats(days: number = 30): Promise<{
    totalEvents: number;
    eventsByAction: Record<string, number>;
    eventsByResourceType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    topUsers: Array<{ userId: string; count: number }>;
    criticalEvents: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const events = await this.getFilteredEvents({
      startDate: cutoffDate.toISOString(),
    });

    const stats = {
      totalEvents: events.length,
      eventsByAction: {} as Record<string, number>,
      eventsByResourceType: {} as Record<string, number>,
      eventsBySeverity: {} as Record<string, number>,
      topUsers: [] as Array<{ userId: string; count: number }>,
      criticalEvents: 0,
    };

    const userCounts: Record<string, number> = {};

    events.forEach(event => {
      // Count by action
      stats.eventsByAction[event.action] =
        (stats.eventsByAction[event.action] || 0) + 1;

      // Count by resource type
      stats.eventsByResourceType[event.resourceType] =
        (stats.eventsByResourceType[event.resourceType] || 0) + 1;

      // Count by severity
      stats.eventsBySeverity[event.severity] =
        (stats.eventsBySeverity[event.severity] || 0) + 1;

      // Count critical events
      if (event.severity === 'CRITICAL') {
        stats.criticalEvents++;
      }

      // Count by user
      userCounts[event.userId] = (userCounts[event.userId] || 0) + 1;
    });

    // Top users
    stats.topUsers = Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }

  // Quick logging methods for common actions
  async logProjectChange(
    projectId: string,
    projectName: string,
    oldValue: any,
    newValue: any
  ) {
    return this.logEvent(
      'UPDATE',
      'PROJECT',
      projectId,
      projectName,
      oldValue,
      newValue,
      {},
      'MEDIUM'
    );
  }

  async logAllocationChange(
    allocationId: string,
    teamName: string,
    oldValue: any,
    newValue: any
  ) {
    return this.logEvent(
      'UPDATE',
      'ALLOCATION',
      allocationId,
      `Allocation for ${teamName}`,
      oldValue,
      newValue
    );
  }

  async logDataExport(resourceType: AuditResourceType, count: number) {
    return this.logEvent(
      'EXPORT',
      resourceType,
      'bulk-export',
      `${count} records`,
      null,
      null,
      { count },
      'MEDIUM'
    );
  }

  async logDataImport(resourceType: AuditResourceType, count: number) {
    return this.logEvent(
      'IMPORT',
      resourceType,
      'bulk-import',
      `${count} records`,
      null,
      null,
      { count },
      'HIGH'
    );
  }

  async logSecurityEvent(action: AuditAction, details: Record<string, any>) {
    return this.logEvent(
      action,
      'SYSTEM',
      'security',
      'Security Event',
      null,
      null,
      details,
      'HIGH'
    );
  }
}

export const auditService = new AuditService();
