
import React, { useState } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UploadCloud, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { parseCSV, parseCombinedProjectEpicCSVWithMapping } from '@/utils/projectsCsvUtils';
import { parseActualAllocationCSV, parseIterationReviewCSV, parseBulkTrackingCSV } from '@/utils/trackingImportUtils';

const IMPORT_TYPES = {
  'projects-epics': {
    label: 'Projects, Epics & Milestones',
    fields: [
      { id: 'project_name', label: 'Project Name', required: true },
      { id: 'project_description', label: 'Project Description' },
      { id: 'project_status', label: 'Project Status' },
      { id: 'project_start_date', label: 'Project Start Date' },
      { id: 'project_end_date', label: 'Project End Date' },
      { id: 'project_budget', label: 'Project Budget' },
      { id: 'epic_name', label: 'Epic Name' },
      { id: 'epic_description', label: 'Epic Description' },
      { id: 'epic_effort', label: 'Epic Effort' },
      { id: 'epic_team', label: 'Epic Team' },
      { id: 'epic_target_date', label: 'Epic Target Date' },
      { id: 'milestone_name', label: 'Milestone Name' },
      { id: 'milestone_due_date', label: 'Milestone Due Date' },
    ],
  },
  'actual-allocations': {
    label: 'Actual Allocations',
    fields: [
      { id: 'team_name', label: 'Team Name', required: true },
      { id: 'quarter', label: 'Quarter', required: true },
      { id: 'iteration_number', label: 'Iteration Number', required: true },
      { id: 'epic_name', label: 'Epic/Work Name' },
      { id: 'epic_type', label: 'Epic Type' },
      { id: 'actual_percentage', label: 'Actual Percentage', required: true },
      { id: 'variance_reason', label: 'Variance Reason' },
      { id: 'notes', label: 'Notes' },
    ],
  },
  'iteration-reviews': {
    label: 'Iteration Reviews',
    fields: [
      { id: 'quarter', label: 'Quarter', required: true },
      { id: 'iteration_number', label: 'Iteration Number', required: true },
      { id: 'review_date', label: 'Review Date' },
      { id: 'status', label: 'Status' },
      { id: 'completed_epics', label: 'Completed Epics' },
      { id: 'completed_milestones', label: 'Completed Milestones' },
      { id: 'notes', label: 'Notes' },
    ],
  },
  'bulk-tracking': {
    label: 'Bulk Tracking Data (Combined)',
    fields: [
      { id: 'data_type', label: 'Data Type', required: true },
      { id: 'team_name', label: 'Team Name' },
      { id: 'quarter', label: 'Quarter', required: true },
      { id: 'iteration_number', label: 'Iteration Number', required: true },
      { id: 'epic_name', label: 'Epic/Work Name' },
      { id: 'actual_percentage', label: 'Actual Percentage' },
      { id: 'variance_reason', label: 'Variance Reason' },
      { id: 'review_date', label: 'Review Date' },
      { id: 'status', label: 'Status' },
      { id: 'completed_epics', label: 'Completed Epics' },
      { id: 'completed_milestones', label: 'Completed Milestones' },
      { id: 'notes', label: 'Notes' },
    ],
  },
};

const SKIP_MAPPING = '__SKIP_MAPPING__';

const AdvancedDataImport = () => {
  const { 
    setProjects, 
    setEpics, 
    setActualAllocations, 
    setIterationReviews,
    teams,
    cycles,
    epics,
    runWorkCategories,
    projects
  } = useApp();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<string[][]>([]);
  const [importType, setImportType] = useState<keyof typeof IMPORT_TYPES>('projects-epics');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const methods = useForm();
  const { handleSubmit, control, trigger, formState } = methods;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus({ type: null, message: '' });
      try {
        const text = await selectedFile.text();
        setFileContent(text);
        const parsed = parseCSV(text);
        if (parsed.length > 0) {
          setHeaders(parsed[0]);
          setPreview(parsed.slice(1, 6)); // show first 5 data rows
          setStep(2);
        } else {
          setStatus({ type: 'error', message: 'Could not parse CSV headers. The file might be empty or invalid.' });
        }
      } catch (e) {
        setStatus({ type: 'error', message: `Error reading file: ${e instanceof Error ? e.message : 'Unknown error'}` });
      }
    }
  };

  const onSubmit = async (data: any) => {
    setStatus({ type: null, message: '' });
    if (!fileContent || !importType) return;

    try {
      const mapping = { ...data };
      Object.keys(mapping).forEach(key => {
        if (mapping[key] === SKIP_MAPPING) {
          delete mapping[key];
        }
      });
      
      const appData = { teams, cycles, epics, runWorkCategories, projects };
      
      if (importType === 'projects-epics') {
        const result = parseCombinedProjectEpicCSVWithMapping(fileContent, mapping);
        if ('projects' in result && 'epics' in result) {
          setProjects(prev => [...prev, ...result.projects]);
          setEpics(prev => [...prev, ...result.epics]);
          setStatus({ type: 'success', message: `Successfully imported ${result.projects.length} projects and ${result.epics.length} epics.` });
        }
      } else if (importType === 'actual-allocations') {
        const result = parseActualAllocationCSV(fileContent, teams, cycles, epics, runWorkCategories);
        if ('allocations' in result && 'errors' in result) {
          if (result.errors.length > 0) {
            setStatus({ type: 'error', message: `Import errors: ${result.errors.join(', ')}` });
            return;
          }
          setActualAllocations(prev => [...prev, ...result.allocations]);
          setStatus({ type: 'success', message: `Successfully imported ${result.allocations.length} actual allocations.` });
        }
      } else if (importType === 'iteration-reviews') {
        const result = parseIterationReviewCSV(fileContent, cycles, epics, projects);
        if ('reviews' in result && 'errors' in result) {
          if (result.errors.length > 0) {
            setStatus({ type: 'error', message: `Import errors: ${result.errors.join(', ')}` });
            return;
          }
          setIterationReviews(prev => [...prev, ...result.reviews]);
          setStatus({ type: 'success', message: `Successfully imported ${result.reviews.length} iteration reviews.` });
        }
      } else if (importType === 'bulk-tracking') {
        const result = parseBulkTrackingCSV(fileContent, teams, cycles, epics, runWorkCategories, projects);
        if ('allocations' in result && 'reviews' in result && 'errors' in result) {
          if (result.errors.length > 0) {
            setStatus({ type: 'error', message: `Import errors: ${result.errors.join(', ')}` });
            return;
          }
          setActualAllocations(prev => [...prev, ...result.allocations]);
          setIterationReviews(prev => [...prev, ...result.reviews]);
          setStatus({ 
            type: 'success', 
            message: `Successfully imported ${result.allocations.length} allocations and ${result.reviews.length} reviews.` 
          });
        }
      }
     
      // Reset form
      setStep(1);
      setFile(null);
      methods.reset();
    } catch (e) {
      setStatus({ type: 'error', message: `Import failed: ${e instanceof Error ? e.message : 'Unknown error'}` });
    }
  };

  const config = IMPORT_TYPES[importType];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <UploadCloud className="mr-2 h-5 w-5" />
          Advanced Data Import
        </CardTitle>
      </CardHeader>
      <CardContent>
        {status.type && (
          <Alert className={`mb-4 ${status.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
            {status.type === 'error' ? <AlertCircle className="h-4 w-4 text-red-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
            <AlertDescription className={status.type === 'error' ? 'text-red-700' : 'text-green-700'}>
              {status.message}
            </AlertDescription>
          </Alert>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="import-type">Select data type to import</Label>
              <Select value={importType} onValueChange={(v) => setImportType(v as any)}>
                <SelectTrigger id="import-type">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(IMPORT_TYPES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="advanced-csv-file">Upload CSV File</Label>
              <Input id="advanced-csv-file" type="file" accept=".csv" onChange={handleFileChange} />
            </div>
             <p className="text-sm text-gray-500">
                Upload a CSV file to begin the import process. You will be able to map your file's columns to the application's fields in the next step.
            </p>
          </div>
        )}

        {step === 2 && file && (
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <h3 className="font-semibold mb-2">Map Your Columns</h3>
              <p className="text-sm text-gray-500 mb-4">
                Match the columns from your file <span className="font-semibold text-gray-700">{file.name}</span> to the required application fields.
              </p>
              
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {config.fields.map(field => (
                  <div key={field.id} className="grid grid-cols-3 items-center gap-4">
                    <Label>
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    <div className="col-span-2">
                      <Controller
                        name={field.id}
                        control={control}
                        rules={{ required: field.required }}
                        render={({ field: controllerField }) => (
                          <Select onValueChange={controllerField.onChange} defaultValue={controllerField.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select source column..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={SKIP_MAPPING}>-- Skip this field --</SelectItem>
                              {headers.map(header => (
                                <SelectItem key={header} value={header}>{header}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                       {formState.errors[field.id] && <p className="text-xs text-red-500 mt-1">This field is required.</p>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="font-semibold mb-2">Data Preview</h4>
                <div className="border rounded-md overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {headers.map(h => <TableHead key={h}>{h}</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {preview.map((row, i) => (
                                <TableRow key={i}>
                                    {row.map((cell, j) => <TableCell key={j}>{cell}</TableCell>)}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button type="submit">
                  Import Data <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </FormProvider>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedDataImport;
