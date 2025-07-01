import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  FileText,
  Users,
  Calendar,
  TrendingUp,
  Settings,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  Edit,
} from 'lucide-react';
import {
  EnhancedImportManager,
  ImportConfig,
  ImportResult,
  UpsertResult,
} from '@/utils/enhancedImportManager';
import { Person, Team, Division, Role, Allocation } from '@/types';
import { useApp } from '@/context/AppContext';

interface ImportMode {
  value: 'insert-only' | 'update-only' | 'upsert';
  label: string;
  description: string;
  icon: React.ReactNode;
}

const IMPORT_MODES: ImportMode[] = [
  {
    value: 'insert-only',
    label: 'Insert Only',
    description: 'Only create new records. Skip existing ones.',
    icon: <Plus className="h-4 w-4" />,
  },
  {
    value: 'update-only',
    label: 'Update Only',
    description: 'Only update existing records. Skip new ones.',
    icon: <Edit className="h-4 w-4" />,
  },
  {
    value: 'upsert',
    label: 'Upsert',
    description: 'Create new records and update existing ones.',
    icon: <RefreshCw className="h-4 w-4" />,
  },
];

export const EnhancedImportComponent: React.FC = () => {
  const {
    people,
    teams,
    divisions,
    roles,
    allocations,
    epics,
    cycles,
    runWorkCategories,
    addPerson,
    setTeams,
    setDivisions,
    setRoles,
    setAllocations,
    updatePerson,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'people' | 'allocations'>(
    'people'
  );
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 100,
    stage: '',
  });
  const [result, setResult] = useState<ImportResult<
    UpsertResult | Allocation[]
  > | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [importMode, setImportMode] = useState<
    'insert-only' | 'update-only' | 'upsert'
  >('upsert');
  const [allowPartialImports, setAllowPartialImports] = useState(true);
  const [strictValidation, setStrictValidation] = useState(false);
  const [skipEmptyRows, setSkipEmptyRows] = useState(true);
  const [maxRows, setMaxRows] = useState<number | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsImporting(true);
      setResult(null);
      setProgress({ current: 0, total: 100, stage: 'Reading file...' });

      try {
        const content = await file.text();

        const config: ImportConfig = {
          allowPartialImports,
          strictValidation,
          skipEmptyRows,
          maxRows,
          importMode,
          onProgress: setProgress,
        };

        let importResult: ImportResult<UpsertResult | Allocation[]>;

        if (activeTab === 'people') {
          importResult = await EnhancedImportManager.importPeopleAndTeams(
            content,
            { people, teams, divisions, roles },
            config
          );

          // Apply the upsert results to the context
          if (importResult.success && importResult.data[0]) {
            const upsertResult = importResult.data[0];

            // Add new records
            upsertResult.inserted.forEach(person => addPerson(person));
            upsertResult.insertedTeams.forEach(team => {
              setTeams(prev => [...prev, team]);
            });
            upsertResult.insertedDivisions.forEach(division => {
              setDivisions(prev => [...prev, division]);
            });
            upsertResult.insertedRoles.forEach(role => {
              setRoles(prev => [...prev, role]);
            });

            // Update existing records
            upsertResult.updated.forEach(person =>
              updatePerson(person.id, person)
            );
            upsertResult.updatedTeams.forEach(team => {
              setTeams(prev => prev.map(t => (t.id === team.id ? team : t)));
            });
            upsertResult.updatedDivisions.forEach(division => {
              setDivisions(prev =>
                prev.map(d => (d.id === division.id ? division : d))
              );
            });
            upsertResult.updatedRoles.forEach(role => {
              setRoles(prev => prev.map(r => (r.id === role.id ? role : r)));
            });
          }
        } else {
          importResult = await EnhancedImportManager.importPlanningAllocations(
            content,
            { teams, epics, runWorkCategories, cycles, allocations },
            config
          );

          // Add new allocations
          if (importResult.success) {
            setAllocations(prev => [...prev, ...importResult.data]);
          }
        }

        setResult(importResult);
      } catch (error) {
        setResult({
          success: false,
          data: [],
          errors: [
            {
              row: 0,
              column: 'general',
              message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              severity: 'error',
            },
          ],
          warnings: [],
          summary: {
            totalRows: 0,
            successfulRows: 0,
            errorRows: 1,
            warningRows: 0,
            processingTime: 0,
            fileSize: 0,
            inserted: 0,
            updated: 0,
            skipped: 0,
          },
        });
      } finally {
        setIsImporting(false);
        setProgress({ current: 0, total: 100, stage: '' });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [
      activeTab,
      importMode,
      allowPartialImports,
      strictValidation,
      skipEmptyRows,
      maxRows,
      people,
      teams,
      divisions,
      roles,
      allocations,
      epics,
      cycles,
      runWorkCategories,
      addPerson,
      setTeams,
      setDivisions,
      setRoles,
      setAllocations,
      updatePerson,
    ]
  );

  const handleDownloadSample = useCallback(() => {
    let sampleData: string;

    if (activeTab === 'people') {
      sampleData = `name,email,role,team_name,employment_type,annual_salary,hourly_rate,daily_rate,start_date,end_date,is_active,division_name,team_capacity
John Doe,john.doe@company.com,Software Engineer,Engineering Team,permanent,80000,,,2024-01-15,,true,Technology,40
Jane Smith,jane.smith@company.com,Product Manager,Product Team,permanent,90000,,,2024-02-01,,true,Product,40
Bob Johnson,bob.johnson@company.com,UX Designer,Design Team,contractor,,75,600,2024-01-20,2024-12-31,true,Design,40`;
    } else {
      sampleData = `team_name,quarter,iteration_number,epic_name,epic_type,project_name,percentage,notes
Engineering Team,Q1 2024,1,User Authentication,feature,Platform Development,25,Implement OAuth2
Product Team,Q1 2024,1,Market Research,run work,Critical Run,15,Competitive analysis
Design Team,Q1 2024,1,UI Redesign,feature,Platform Development,20,Complete redesign`;
    }

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab === 'people' ? 'people' : 'allocations'}_sample.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [activeTab]);

  const getImportModeInfo = (mode: string) => {
    return IMPORT_MODES.find(m => m.value === mode) || IMPORT_MODES[0];
  };

  const currentMode = getImportModeInfo(importMode);

  return (
    <div className="space-y-6" data-testid="app-container">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Enhanced Data Import
          </CardTitle>
          <CardDescription>
            Import people, teams, and planning allocations with advanced
            validation and upsert support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={value =>
              setActiveTab(value as 'people' | 'allocations')
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="people"
                className="flex items-center gap-2"
                data-testid="people-tab"
              >
                <Users className="h-4 w-4" />
                People & Teams
              </TabsTrigger>
              <TabsTrigger
                value="allocations"
                className="flex items-center gap-2"
                data-testid="allocations-tab"
              >
                <Calendar className="h-4 w-4" />
                Planning Allocations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="people" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="import-mode"
                      className="text-sm font-medium"
                    >
                      Import Mode
                    </Label>
                    <Select
                      value={importMode}
                      onValueChange={(
                        value: 'insert-only' | 'update-only' | 'upsert'
                      ) => setImportMode(value)}
                      data-testid="import-mode-selector"
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {IMPORT_MODES.map(mode => (
                          <SelectItem key={mode.value} value={mode.value}>
                            <div className="flex items-center gap-2">
                              {mode.icon}
                              <div>
                                <div className="font-medium">{mode.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {mode.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    {currentMode.icon}
                    <div>
                      <div className="font-medium">{currentMode.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {currentMode.description}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button
                    variant="outline"
                    onClick={handleDownloadSample}
                    className="w-full"
                    disabled={isImporting}
                    data-testid="download-sample-button"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Sample CSV
                  </Button>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>• People: email-based upsert</div>
                    <div>• Teams: name + division-based upsert</div>
                    <div>• Divisions: name-based upsert</div>
                    <div>• Roles: name-based upsert</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="allocations" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="import-mode-allocations"
                      className="text-sm font-medium"
                    >
                      Import Mode
                    </Label>
                    <Select
                      value={importMode}
                      onValueChange={(
                        value: 'insert-only' | 'update-only' | 'upsert'
                      ) => setImportMode(value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {IMPORT_MODES.map(mode => (
                          <SelectItem key={mode.value} value={mode.value}>
                            <div className="flex items-center gap-2">
                              {mode.icon}
                              <div>
                                <div className="font-medium">{mode.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {mode.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    {currentMode.icon}
                    <div>
                      <div className="font-medium">{currentMode.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {currentMode.description}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button
                    variant="outline"
                    onClick={handleDownloadSample}
                    className="w-full"
                    disabled={isImporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Sample CSV
                  </Button>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>• Allocations: team + cycle + iteration-based</div>
                    <div>• Epic/Project mapping</div>
                    <div>• Percentage validation</div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator className="my-4" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                data-testid="advanced-options-toggle"
              >
                <Settings className="h-4 w-4 mr-2" />
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              </Button>
            </div>

            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Validation Options
                  </Label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={allowPartialImports}
                        onChange={e => setAllowPartialImports(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Allow partial imports</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={strictValidation}
                        onChange={e => setStrictValidation(e.target.checked)}
                        className="rounded"
                        data-testid="strict-validation-checkbox"
                      />
                      <span className="text-sm">Strict validation</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={skipEmptyRows}
                        onChange={e => setSkipEmptyRows(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Skip empty rows</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Performance Options
                  </Label>
                  <div>
                    <Label
                      htmlFor="max-rows"
                      className="text-xs text-muted-foreground"
                    >
                      Max Rows (optional)
                    </Label>
                    <input
                      id="max-rows"
                      type="number"
                      value={maxRows || ''}
                      onChange={e =>
                        setMaxRows(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      placeholder="No limit"
                      className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isImporting ? 'Importing...' : 'Select CSV File'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isImporting && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2" data-testid="import-progress">
              <div className="flex items-center justify-between text-sm">
                <span>{progress.stage}</span>
                <span>{progress.current}%</span>
              </div>
              <Progress value={progress.current} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle
              className="flex items-center gap-2"
              data-testid={
                result.success ? 'import-completed' : 'import-failed'
              }
            >
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              Import {result.success ? 'Completed' : 'Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" data-testid="results-summary">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div
                    className="text-2xl font-bold text-green-600"
                    data-testid="inserted-count"
                  >
                    {result.summary.inserted}
                  </div>
                  <div className="text-sm text-muted-foreground">Inserted</div>
                </div>
                <div className="text-center">
                  <div
                    className="text-2xl font-bold text-blue-600"
                    data-testid="updated-count"
                  >
                    {result.summary.updated}
                  </div>
                  <div className="text-sm text-muted-foreground">Updated</div>
                </div>
                <div className="text-center">
                  <div
                    className="text-2xl font-bold text-yellow-600"
                    data-testid="skipped-count"
                  >
                    {result.summary.skipped}
                  </div>
                  <div className="text-sm text-muted-foreground">Skipped</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {result.summary.errorRows}
                  </div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Total Rows:</span>
                  <span>{result.summary.totalRows}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Processing Time:</span>
                  <span>{result.summary.processingTime}ms</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>File Size:</span>
                  <span>{(result.summary.fileSize / 1024).toFixed(2)} KB</span>
                </div>
              </div>

              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-medium">
                        Errors ({result.errors.length})
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {result.errors.slice(0, 10).map((error, index) => (
                          <div
                            key={index}
                            className="text-sm"
                            data-testid="error-message"
                          >
                            Row {error.row}: {error.message}
                          </div>
                        ))}
                        {result.errors.length > 10 && (
                          <div className="text-sm text-muted-foreground">
                            ... and {result.errors.length - 10} more errors
                          </div>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {result.warnings.length > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-medium">
                        Warnings ({result.warnings.length})
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {result.warnings.slice(0, 10).map((warning, index) => (
                          <div key={index} className="text-sm">
                            Row {warning.row}: {warning.message}
                          </div>
                        ))}
                        {result.warnings.length > 10 && (
                          <div className="text-sm text-muted-foreground">
                            ... and {result.warnings.length - 10} more warnings
                          </div>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
