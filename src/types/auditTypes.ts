export interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  userEmail?: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string;
  resourceName?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  severity: AuditSeverity;
}

export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'IMPORT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'SETTINGS_CHANGE'
  | 'BULK_OPERATION'
  | 'DATA_CLEANUP'
  | 'ARCHIVE'
  | 'RESTORE';

export type AuditResourceType =
  | 'PROJECT'
  | 'EPIC'
  | 'PERSON'
  | 'TEAM'
  | 'ALLOCATION'
  | 'MILESTONE'
  | 'SETTINGS'
  | 'SCENARIO'
  | 'REPORT'
  | 'SKILL'
  | 'ROLE'
  | 'CYCLE'
  | 'SYSTEM';

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditFilter {
  startDate?: string;
  endDate?: string;
  userId?: string;
  actions?: AuditAction[];
  resourceTypes?: AuditResourceType[];
  severity?: AuditSeverity[];
  searchTerm?: string;
}

export interface AuditReport {
  id: string;
  name: string;
  description?: string;
  filter: AuditFilter;
  generatedAt: string;
  generatedBy: string;
  eventCount: number;
  reportType: 'SECURITY' | 'COMPLIANCE' | 'ACTIVITY' | 'PERFORMANCE';
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  type: 'GDPR' | 'SOX' | 'HIPAA' | 'ISO27001' | 'CUSTOM';
  enabled: boolean;
  conditions: ComplianceCondition[];
  actions: ComplianceAction[];
  lastChecked?: string;
  violations?: number;
}

export interface ComplianceCondition {
  field: string;
  operator: 'EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN' | 'EXISTS';
  value: any;
}

export interface ComplianceAction {
  type: 'ALERT' | 'EMAIL' | 'AUTO_DELETE' | 'AUTO_ARCHIVE' | 'REQUIRE_APPROVAL';
  config: Record<string, any>;
}

export interface DataRetentionPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  resourceType: AuditResourceType;
  retentionPeriodDays: number;
  archivePeriodDays?: number;
  autoCleanup: boolean;
  lastRun?: string;
  itemsProcessed?: number;
}
