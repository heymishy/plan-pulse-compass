import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  FileText,
  Clock,
  Download,
  AlertTriangle,
  CheckCircle,
  Settings,
  Trash2,
  Archive,
} from 'lucide-react';
import { auditService } from '@/services/auditService';
import { dataRetentionService } from '@/services/dataRetentionService';
import { AuditFilter, DataRetentionPolicy } from '@/types/auditTypes';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const ComplianceSettings: React.FC = () => {
  const [auditStats, setAuditStats] = useState<any>(null);
  const [retentionPolicies, setRetentionPolicies] = useState<
    DataRetentionPolicy[]
  >([]);
  const [retentionStats, setRetentionStats] = useState<any>(null);
  const [isRunningRetention, setIsRunningRetention] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [stats, policies, retStats] = await Promise.all([
        auditService.getAuditStats(30),
        dataRetentionService.getAllPolicies(),
        dataRetentionService.getRetentionStats(),
      ]);

      setAuditStats(stats);
      setRetentionPolicies(policies);
      setRetentionStats(retStats);
    } catch (error) {
      toast({
        title: 'Error Loading Data',
        description: 'Failed to load compliance data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleExportAuditLog = async (format: 'JSON' | 'CSV') => {
    try {
      const filter: AuditFilter = {
        startDate: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        endDate: new Date().toISOString(),
      };

      const data = await auditService.exportEvents(filter, format);

      const blob = new Blob([data], {
        type: format === 'JSON' ? 'application/json' : 'text/csv',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-log-${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
      link.click();

      await auditService.logDataExport('SYSTEM', auditStats?.totalEvents || 0);

      toast({
        title: 'Export Complete',
        description: `Audit log exported as ${format} file.`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export audit log. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRunRetentionPolicies = async () => {
    setIsRunningRetention(true);
    try {
      const result = await dataRetentionService.runRetentionPolicies();

      toast({
        title: 'Retention Policies Complete',
        description: `Processed ${result.policiesRun} policies. Archived: ${result.itemsArchived}, Deleted: ${result.itemsDeleted}`,
      });

      if (result.errors.length > 0) {
        toast({
          title: 'Some Policies Failed',
          description: `${result.errors.length} policies encountered errors.`,
          variant: 'destructive',
        });
      }

      await loadData();
    } catch (error) {
      toast({
        title: 'Retention Failed',
        description: 'Failed to run retention policies. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRunningRetention(false);
    }
  };

  const togglePolicyEnabled = async (policyId: string, enabled: boolean) => {
    try {
      await dataRetentionService.updatePolicy(policyId, { enabled });
      await loadData();

      toast({
        title: enabled ? 'Policy Enabled' : 'Policy Disabled',
        description: `Retention policy has been ${enabled ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update retention policy.',
        variant: 'destructive',
      });
    }
  };

  if (!auditStats || !retentionStats) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Security & Compliance
        </h2>
        <p className="text-muted-foreground">
          Manage audit trails, data retention policies, and compliance
          reporting.
        </p>
      </div>

      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="retention">Data Retention</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Events
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {auditStats.totalEvents.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Critical Events
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {auditStats.criticalEvents}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requires attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {auditStats.topUsers.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  With recorded activity
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Data Changes
                </CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {auditStats.eventsByAction.UPDATE || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Modification events
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Event Distribution</CardTitle>
              <CardDescription>
                Breakdown of audit events by type and severity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">By Action Type</h4>
                <div className="space-y-2">
                  {Object.entries(auditStats.eventsByAction).map(
                    ([action, count]) => (
                      <div
                        key={action}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{action}</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm text-muted-foreground">
                            {count as number}
                          </div>
                          <div className="w-16 h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-2 bg-blue-500 rounded-full"
                              style={{
                                width: `${((count as number) / auditStats.totalEvents) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">By Severity</h4>
                <div className="space-y-2">
                  {Object.entries(auditStats.eventsBySeverity).map(
                    ([severity, count]) => {
                      const color =
                        {
                          LOW: 'bg-green-500',
                          MEDIUM: 'bg-yellow-500',
                          HIGH: 'bg-orange-500',
                          CRITICAL: 'bg-red-500',
                        }[severity] || 'bg-gray-500';

                      return (
                        <div
                          key={severity}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={
                                severity === 'CRITICAL'
                                  ? 'destructive'
                                  : 'outline'
                              }
                            >
                              {severity}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-sm text-muted-foreground">
                              {count as number}
                            </div>
                            <div className="w-16 h-2 bg-gray-200 rounded-full">
                              <div
                                className={`h-2 rounded-full ${color}`}
                                style={{
                                  width: `${((count as number) / auditStats.totalEvents) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Audit Data</CardTitle>
              <CardDescription>
                Download audit logs for compliance and analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Button onClick={() => handleExportAuditLog('CSV')}>
                  <Download className="mr-2 h-4 w-4" />
                  Export as CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportAuditLog('JSON')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export as JSON
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retention" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Policies
                </CardTitle>
                <Archive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {retentionStats.totalPolicies}
                </div>
                <p className="text-xs text-muted-foreground">
                  Configured policies
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Policies
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {retentionStats.activePolicies}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently enabled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Run</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {retentionStats.lastRunDate
                    ? formatDistanceToNow(
                        new Date(retentionStats.lastRunDate),
                        { addSuffix: true }
                      )
                    : 'Never'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Policy execution
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Data Retention Policies
                <Button
                  onClick={handleRunRetentionPolicies}
                  disabled={isRunningRetention}
                  size="sm"
                >
                  {isRunningRetention ? 'Running...' : 'Run Policies'}
                </Button>
              </CardTitle>
              <CardDescription>
                Manage automatic data cleanup and archival policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {retentionPolicies.map(policy => (
                  <div
                    key={policy.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium">{policy.name}</h4>
                        <Badge
                          variant={policy.enabled ? 'default' : 'secondary'}
                        >
                          {policy.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {policy.description}
                      </p>
                      <div className="flex space-x-4 text-xs text-muted-foreground">
                        <span>Type: {policy.resourceType}</span>
                        {policy.retentionPeriodDays > 0 && (
                          <span>
                            Retention: {policy.retentionPeriodDays} days
                          </span>
                        )}
                        {policy.archivePeriodDays && (
                          <span>Archive: {policy.archivePeriodDays} days</span>
                        )}
                        {policy.lastRun && (
                          <span>
                            Last run:{' '}
                            {formatDistanceToNow(new Date(policy.lastRun), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={policy.enabled}
                        onCheckedChange={enabled =>
                          togglePolicyEnabled(policy.id, enabled)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Compliance features help ensure your organization meets regulatory
              requirements including GDPR, SOX, and industry standards.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>GDPR Compliance</CardTitle>
                <CardDescription>
                  Data protection and privacy compliance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data Encryption</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Audit Trail</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data Retention</span>
                  <Badge variant="default">Configured</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Right to be Forgotten</span>
                  <Badge variant="secondary">Manual</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SOX Compliance</CardTitle>
                <CardDescription>
                  Financial reporting and internal controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Financial Data Audit</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Access Controls</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data Integrity</span>
                  <Badge variant="default">Verified</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Change Management</span>
                  <Badge variant="default">Tracked</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Reports</CardTitle>
              <CardDescription>
                Generate reports for compliance auditors and regulators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 md:grid-cols-2">
                <Button variant="outline" className="justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  GDPR Data Processing Report
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  SOX Internal Controls Report
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Security Audit Summary
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Data Retention Summary
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComplianceSettings;
