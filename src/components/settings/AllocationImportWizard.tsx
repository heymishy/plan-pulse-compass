import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  UploadCloud,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Save,
  MapPin,
  Info,
  Users,
  Target,
  Settings,
  Play,
  FileText,
  BarChart3,
  Zap,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { parseCSV as parseTrackingCSV } from '@/utils/trackingImportUtils';
import { useImportMappings } from '@/hooks/useImportMappings';
import { useValueMappings } from '@/hooks/useValueMappings';

interface AllocationImportWizardProps {
  importType: 'planning-allocations' | 'actual-allocations';
  onComplete: () => void;
  onCancel: () => void;
}

interface ImportSummary {
  totalRecords: number;
  newTeams: number;
  newEpics: number;
  existingTeams: number;
  existingEpics: number;
  teamsToCreate: string[];
  epicsToCreate: string[];
  dataPreview: Array<{
    team: string;
    quarter: string;
    iteration: number;
    epic: string;
    percentage: number;
  }>;
}

export const AllocationImportWizard: React.FC<AllocationImportWizardProps> = ({
  importType,
  onComplete,
  onCancel,
}) => {
  const { teams, cycles, epics, runWorkCategories, setTeams, setEpics } =
    useApp();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<string[][]>([]);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>(
    {}
  );
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(
    null
  );
  const [batchSettings, setBatchSettings] = useState({
    createNewTeams: true,
    createNewEpics: true,
    defaultEpicType: 'Project' as 'Project' | 'Run Work',
  });
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({
    type: null,
    message: '',
  });

  const requiredFields = [
    'team_name',
    'quarter',
    'iteration_number',
    'percentage',
  ];
  const optionalFields = ['epic_name', 'epic_type', 'notes'];

  // Step 1: File Upload
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus({ type: null, message: '' });

      try {
        const text = await selectedFile.text();
        setFileContent(text);
        const parsed = parseTrackingCSV(text);

        if (parsed.length > 0) {
          setHeaders(parsed[0]);
          setParsedData(parsed.slice(1));
          setStep(2);
        } else {
          setStatus({
            type: 'error',
            message:
              'Could not parse CSV headers. The file might be empty or invalid.',
          });
        }
      } catch (e) {
        setStatus({
          type: 'error',
          message: `Error reading file: ${e instanceof Error ? e.message : 'Unknown error'}`,
        });
      }
    }
  };

  // Step 2: Field Mapping
  const handleFieldMapping = (fieldId: string, header: string) => {
    setFieldMappings(prev => ({
      ...prev,
      [fieldId]: header,
    }));
  };

  const canProceedToStep3 = () => {
    return requiredFields.every(field => fieldMappings[field]);
  };

  // Step 3: Smart Analysis & Batch Settings
  const analyzeData = useCallback(() => {
    if (!parsedData.length || !Object.keys(fieldMappings).length) return;

    const teamIndex = headers.findIndex(h => h === fieldMappings.team_name);
    const quarterIndex = headers.findIndex(h => h === fieldMappings.quarter);
    const iterationIndex = headers.findIndex(
      h => h === fieldMappings.iteration_number
    );
    const epicIndex = fieldMappings.epic_name
      ? headers.findIndex(h => h === fieldMappings.epic_name)
      : -1;
    const percentageIndex = headers.findIndex(
      h => h === fieldMappings.percentage
    );

    const uniqueTeams = new Set<string>();
    const uniqueEpics = new Set<string>();
    const dataPreview: ImportSummary['dataPreview'] = [];

    parsedData.slice(0, 10).forEach(row => {
      const team = row[teamIndex]?.trim();
      const quarter = row[quarterIndex]?.trim();
      const iteration = parseInt(row[iterationIndex]) || 1;
      const epic = epicIndex >= 0 ? row[epicIndex]?.trim() : '';
      const percentage = parseFloat(row[percentageIndex]) || 0;

      if (team) uniqueTeams.add(team);
      if (epic) uniqueEpics.add(epic);

      dataPreview.push({ team, quarter, iteration, epic, percentage });
    });

    const existingTeamNames = new Set(teams.map(t => t.name));
    const existingEpicNames = new Set([
      ...epics.map(e => e.name),
      ...runWorkCategories.map(r => r.name),
    ]);

    const newTeams = Array.from(uniqueTeams).filter(
      team => !existingTeamNames.has(team)
    );
    const newEpics = Array.from(uniqueEpics).filter(
      epic => !existingEpicNames.has(epic)
    );

    const summary: ImportSummary = {
      totalRecords: parsedData.length,
      newTeams: newTeams.length,
      newEpics: newEpics.length,
      existingTeams: uniqueTeams.size - newTeams.length,
      existingEpics: uniqueEpics.size - newEpics.length,
      teamsToCreate: newTeams,
      epicsToCreate: newEpics,
      dataPreview,
    };

    setImportSummary(summary);
  }, [parsedData, fieldMappings, headers, teams, epics, runWorkCategories]);

  useEffect(() => {
    if (step === 3) {
      analyzeData();
    }
  }, [step, analyzeData]);

  // Step 4: Import Execution
  const executeImport = async () => {
    if (!importSummary) return;

    setStatus({ type: null, message: '' });

    try {
      // Create new teams if needed
      if (batchSettings.createNewTeams && importSummary.newTeams > 0) {
        const newTeamObjects = importSummary.teamsToCreate.map(name => ({
          id: `team-${Date.now()}-${Math.random()}`,
          name,
          description: `Auto-created from import`,
          members: [],
        }));
        setTeams(prev => [...prev, ...newTeamObjects]);
      }

      // Create new epics if needed
      if (batchSettings.createNewEpics && importSummary.newEpics > 0) {
        const newEpicObjects = importSummary.epicsToCreate.map(name => ({
          id: `epic-${Date.now()}-${Math.random()}`,
          name,
          description: `Auto-created from import`,
          effort: 0,
          team: '',
          targetDate: null,
          project: '',
        }));
        setEpics(prev => [...prev, ...newEpicObjects]);
      }

      // TODO: Process allocation data
      // This would integrate with the existing parsing logic

      setStatus({
        type: 'success',
        message: `Successfully imported ${importSummary.totalRecords} allocation records. Created ${importSummary.newTeams} new teams and ${importSummary.newEpics} new epics.`,
      });

      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (e) {
      setStatus({
        type: 'error',
        message: `Import failed: ${e instanceof Error ? e.message : 'Unknown error'}`,
      });
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">
          Upload Allocation Data
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Upload a CSV file containing your allocation data. The file should
          include team names, quarters, iterations, and allocation percentages.
        </p>
      </div>

      <div className="mt-4">
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="cursor-pointer"
        />
      </div>

      {status.type && (
        <Alert
          className={
            status.type === 'error' ? 'border-red-500' : 'border-green-500'
          }
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Map CSV Columns</h3>
        <p className="text-sm text-gray-600">
          Map your CSV columns to the required allocation fields.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requiredFields.map(fieldId => (
          <Card key={fieldId}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="text-red-500">*</span>
                {fieldId
                  .replace('_', ' ')
                  .replace(/\b\w/g, l => l.toUpperCase())}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={fieldMappings[fieldId] || ''}
                onValueChange={value => handleFieldMapping(fieldId, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select CSV column..." />
                </SelectTrigger>
                <SelectContent>
                  {headers.map(header => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        ))}

        {optionalFields.map(fieldId => (
          <Card key={fieldId}>
            <CardHeader>
              <CardTitle className="text-sm">
                {fieldId
                  .replace('_', ' ')
                  .replace(/\b\w/g, l => l.toUpperCase())}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={fieldMappings[fieldId] || ''}
                onValueChange={value => handleFieldMapping(fieldId, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select CSV column (optional)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Skip this field</SelectItem>
                  {headers.map(header => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={() => setStep(3)} disabled={!canProceedToStep3()}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Import Analysis & Settings
        </h3>
        <p className="text-sm text-gray-600">
          Review the analysis of your data and configure batch import settings.
        </p>
      </div>

      {importSummary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {importSummary.totalRecords}
                    </p>
                    <p className="text-sm text-gray-600">Total Records</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {importSummary.newTeams}
                    </p>
                    <p className="text-sm text-gray-600">New Teams</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {importSummary.newEpics}
                    </p>
                    <p className="text-sm text-gray-600">New Epics</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {importSummary.existingTeams +
                        importSummary.existingEpics}
                    </p>
                    <p className="text-sm text-gray-600">Existing Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Batch Import Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="create-new-teams"
                  checked={batchSettings.createNewTeams}
                  onCheckedChange={checked =>
                    setBatchSettings(prev => ({
                      ...prev,
                      createNewTeams: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="create-new-teams">
                  Automatically create {importSummary.newTeams} new teams
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="create-new-epics"
                  checked={batchSettings.createNewEpics}
                  onCheckedChange={checked =>
                    setBatchSettings(prev => ({
                      ...prev,
                      createNewEpics: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="create-new-epics">
                  Automatically create {importSummary.newEpics} new epics
                </Label>
              </div>

              <div className="space-y-2">
                <Label>Default Epic Type for New Epics</Label>
                <Select
                  value={batchSettings.defaultEpicType}
                  onValueChange={value =>
                    setBatchSettings(prev => ({
                      ...prev,
                      defaultEpicType: value as 'Project' | 'Run Work',
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Project">Project</SelectItem>
                    <SelectItem value="Run Work">Run Work</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Preview (First 10 Records)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Quarter</TableHead>
                    <TableHead>Iteration</TableHead>
                    <TableHead>Epic</TableHead>
                    <TableHead>Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importSummary.dataPreview.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.team}</TableCell>
                      <TableCell>{row.quarter}</TableCell>
                      <TableCell>{row.iteration}</TableCell>
                      <TableCell>{row.epic || '-'}</TableCell>
                      <TableCell>{row.percentage}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(2)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={() => setStep(4)}>
          <Play className="mr-2 h-4 w-4" />
          Start Import
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Zap className="mx-auto h-12 w-12 text-blue-500" />
        <h3 className="mt-2 text-lg font-semibold">Importing Data</h3>
        <p className="mt-1 text-sm text-gray-500">
          Processing your allocation data...
        </p>
      </div>

      <Progress value={75} className="w-full" />

      <div className="text-center">
        <Button onClick={executeImport} className="mt-4">
          <Play className="mr-2 h-4 w-4" />
          Execute Import
        </Button>
      </div>

      {status.type && (
        <Alert
          className={
            status.type === 'error' ? 'border-red-500' : 'border-green-500'
          }
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {importType === 'planning-allocations' ? 'Planning' : 'Actual'}{' '}
            Allocations Import
          </h2>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>

        <div className="mt-4 flex items-center space-x-4">
          {[1, 2, 3, 4].map(stepNumber => (
            <div
              key={stepNumber}
              className={`flex items-center ${
                stepNumber <= step ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  stepNumber <= step
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300'
                }`}
              >
                {stepNumber}
              </div>
              {stepNumber < 4 && (
                <div
                  className={`w-16 h-0.5 mx-2 ${
                    stepNumber < step ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </CardContent>
      </Card>
    </div>
  );
};
