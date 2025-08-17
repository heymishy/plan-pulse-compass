import { DataRetentionPolicy, AuditResourceType } from '@/types/auditTypes';
import { auditService } from './auditService';

class DataRetentionService {
  private readonly STORAGE_KEY = 'planning-retention-policies';
  private readonly DEFAULT_POLICIES: DataRetentionPolicy[] = [
    {
      id: 'audit-events-policy',
      name: 'Audit Events Retention',
      description:
        'Automatically archive old audit events after 1 year, delete after 7 years',
      enabled: true,
      resourceType: 'SYSTEM',
      retentionPeriodDays: 2555, // 7 years
      archivePeriodDays: 365, // 1 year
      autoCleanup: true,
    },
    {
      id: 'completed-projects-policy',
      name: 'Completed Projects Retention',
      description: 'Archive completed projects after 2 years, keep permanently',
      enabled: true,
      resourceType: 'PROJECT',
      retentionPeriodDays: -1, // Keep forever
      archivePeriodDays: 730, // 2 years
      autoCleanup: false,
    },
    {
      id: 'historical-allocations-policy',
      name: 'Historical Allocations Cleanup',
      description: 'Clean up allocation data older than 5 years',
      enabled: true,
      resourceType: 'ALLOCATION',
      retentionPeriodDays: 1825, // 5 years
      archivePeriodDays: 1095, // 3 years
      autoCleanup: true,
    },
    {
      id: 'temporary-scenarios-policy',
      name: 'Temporary Scenarios Cleanup',
      description: 'Delete temporary scenarios after 90 days',
      enabled: true,
      resourceType: 'SCENARIO',
      retentionPeriodDays: 90,
      autoCleanup: true,
    },
  ];

  private getPolicies(): DataRetentionPolicy[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        // Initialize with default policies
        this.savePolicies(this.DEFAULT_POLICIES);
        return this.DEFAULT_POLICIES;
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load retention policies:', error);
      return this.DEFAULT_POLICIES;
    }
  }

  private savePolicies(policies: DataRetentionPolicy[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(policies));
    } catch (error) {
      console.error('Failed to save retention policies:', error);
    }
  }

  async getAllPolicies(): Promise<DataRetentionPolicy[]> {
    return this.getPolicies();
  }

  async getPolicyById(id: string): Promise<DataRetentionPolicy | null> {
    const policies = this.getPolicies();
    return policies.find(p => p.id === id) || null;
  }

  async createPolicy(
    policy: Omit<DataRetentionPolicy, 'id'>
  ): Promise<DataRetentionPolicy> {
    const newPolicy: DataRetentionPolicy = {
      ...policy,
      id: crypto.randomUUID(),
    };

    const policies = this.getPolicies();
    policies.push(newPolicy);
    this.savePolicies(policies);

    await auditService.logEvent(
      'CREATE',
      'SYSTEM',
      newPolicy.id,
      `Data Retention Policy: ${newPolicy.name}`,
      null,
      newPolicy,
      { policyType: 'data-retention' },
      'MEDIUM'
    );

    return newPolicy;
  }

  async updatePolicy(
    id: string,
    updates: Partial<DataRetentionPolicy>
  ): Promise<DataRetentionPolicy | null> {
    const policies = this.getPolicies();
    const index = policies.findIndex(p => p.id === id);

    if (index === -1) return null;

    const oldPolicy = { ...policies[index] };
    policies[index] = { ...policies[index], ...updates };
    this.savePolicies(policies);

    await auditService.logEvent(
      'UPDATE',
      'SYSTEM',
      id,
      `Data Retention Policy: ${policies[index].name}`,
      oldPolicy,
      policies[index],
      { policyType: 'data-retention' },
      'MEDIUM'
    );

    return policies[index];
  }

  async deletePolicy(id: string): Promise<boolean> {
    const policies = this.getPolicies();
    const index = policies.findIndex(p => p.id === id);

    if (index === -1) return false;

    const deletedPolicy = policies[index];
    policies.splice(index, 1);
    this.savePolicies(policies);

    await auditService.logEvent(
      'DELETE',
      'SYSTEM',
      id,
      `Data Retention Policy: ${deletedPolicy.name}`,
      deletedPolicy,
      null,
      { policyType: 'data-retention' },
      'HIGH'
    );

    return true;
  }

  async runRetentionPolicies(): Promise<{
    policiesRun: number;
    itemsArchived: number;
    itemsDeleted: number;
    errors: string[];
  }> {
    const policies = this.getPolicies().filter(p => p.enabled);
    const result = {
      policiesRun: 0,
      itemsArchived: 0,
      itemsDeleted: 0,
      errors: [] as string[],
    };

    for (const policy of policies) {
      try {
        const policyResult = await this.runSinglePolicy(policy);
        result.policiesRun++;
        result.itemsArchived += policyResult.itemsArchived;
        result.itemsDeleted += policyResult.itemsDeleted;

        // Update policy with last run info
        await this.updatePolicy(policy.id, {
          lastRun: new Date().toISOString(),
          itemsProcessed:
            policyResult.itemsArchived + policyResult.itemsDeleted,
        });
      } catch (error) {
        const errorMessage = `Failed to run policy ${policy.name}: ${error}`;
        result.errors.push(errorMessage);
        console.error(errorMessage);
      }
    }

    // Log the retention run
    await auditService.logEvent(
      'BULK_OPERATION',
      'SYSTEM',
      'retention-run',
      'Data Retention Execution',
      null,
      result,
      {
        type: 'data-retention',
        automated: true,
      },
      result.errors.length > 0 ? 'HIGH' : 'MEDIUM'
    );

    return result;
  }

  private async runSinglePolicy(policy: DataRetentionPolicy): Promise<{
    itemsArchived: number;
    itemsDeleted: number;
  }> {
    const now = new Date();
    let itemsArchived = 0;
    let itemsDeleted = 0;

    switch (policy.resourceType) {
      case 'SYSTEM': {
        // Handle audit events
        if (policy.name.includes('Audit Events')) {
          const result = await this.cleanupAuditEvents(policy, now);
          itemsArchived += result.itemsArchived;
          itemsDeleted += result.itemsDeleted;
        }
        break;
      }

      case 'PROJECT': {
        const projectResult = await this.cleanupProjects(policy, now);
        itemsArchived += projectResult.itemsArchived;
        itemsDeleted += projectResult.itemsDeleted;
        break;
      }

      case 'ALLOCATION': {
        const allocationResult = await this.cleanupAllocations(policy, now);
        itemsArchived += allocationResult.itemsArchived;
        itemsDeleted += allocationResult.itemsDeleted;
        break;
      }

      case 'SCENARIO': {
        const scenarioResult = await this.cleanupScenarios(policy, now);
        itemsArchived += scenarioResult.itemsArchived;
        itemsDeleted += scenarioResult.itemsDeleted;
        break;
      }

      default:
        console.warn(
          `Retention policy for ${policy.resourceType} not implemented`
        );
    }

    return { itemsArchived, itemsDeleted };
  }

  private async cleanupAuditEvents(
    policy: DataRetentionPolicy,
    now: Date
  ): Promise<{ itemsArchived: number; itemsDeleted: number }> {
    // This would integrate with the audit service to clean up old events
    // For now, we'll simulate the cleanup
    const cutoffDate = new Date(
      now.getTime() - policy.retentionPeriodDays * 24 * 60 * 60 * 1000
    );

    // In a real implementation, this would clean up actual audit events
    console.log(
      `Would cleanup audit events older than ${cutoffDate.toISOString()}`
    );

    return { itemsArchived: 0, itemsDeleted: 0 };
  }

  private async cleanupProjects(
    policy: DataRetentionPolicy,
    now: Date
  ): Promise<{ itemsArchived: number; itemsDeleted: number }> {
    // This would integrate with project data to archive/delete completed projects
    const archiveCutoff = policy.archivePeriodDays
      ? new Date(now.getTime() - policy.archivePeriodDays * 24 * 60 * 60 * 1000)
      : null;

    const deleteCutoff =
      policy.retentionPeriodDays > 0
        ? new Date(
            now.getTime() - policy.retentionPeriodDays * 24 * 60 * 60 * 1000
          )
        : null;

    // Implementation would go here
    console.log(
      `Would cleanup projects - Archive before: ${archiveCutoff?.toISOString()}, Delete before: ${deleteCutoff?.toISOString()}`
    );

    return { itemsArchived: 0, itemsDeleted: 0 };
  }

  private async cleanupAllocations(
    policy: DataRetentionPolicy,
    now: Date
  ): Promise<{ itemsArchived: number; itemsDeleted: number }> {
    // Implementation for allocation cleanup
    return { itemsArchived: 0, itemsDeleted: 0 };
  }

  private async cleanupScenarios(
    policy: DataRetentionPolicy,
    now: Date
  ): Promise<{ itemsArchived: number; itemsDeleted: number }> {
    // Implementation for scenario cleanup
    return { itemsArchived: 0, itemsDeleted: 0 };
  }

  async getRetentionStats(): Promise<{
    totalPolicies: number;
    activePolicies: number;
    lastRunDate?: string;
    upcomingExpirations: Array<{
      resourceType: AuditResourceType;
      count: number;
      nextCleanupDate: string;
    }>;
  }> {
    const policies = this.getPolicies();

    return {
      totalPolicies: policies.length,
      activePolicies: policies.filter(p => p.enabled).length,
      lastRunDate: policies
        .filter(p => p.lastRun)
        .sort((a, b) => (b.lastRun || '').localeCompare(a.lastRun || ''))[0]
        ?.lastRun,
      upcomingExpirations: [], // Would calculate based on actual data
    };
  }

  // Utility method to check if data should be archived/deleted
  shouldArchive(itemDate: string, archivePeriodDays?: number): boolean {
    if (!archivePeriodDays) return false;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - archivePeriodDays);
    return new Date(itemDate) < cutoff;
  }

  shouldDelete(itemDate: string, retentionPeriodDays: number): boolean {
    if (retentionPeriodDays <= 0) return false; // Keep forever
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionPeriodDays);
    return new Date(itemDate) < cutoff;
  }
}

export const dataRetentionService = new DataRetentionService();
