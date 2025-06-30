import React, { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
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
import {
  UploadCloud,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Save,
  MapPin,
  Info,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Team, Cycle, Epic, Project } from '@/types';
import {
  parseCSV,
  parseCombinedProjectEpicCSVWithMapping,
} from '@/utils/projectsCsvUtils';
import {
  parseActualAllocationCSVWithMapping,
  parseIterationReviewCSVWithMapping,
  parseBulkTrackingCSVWithMapping,
  parsePlanningAllocationCSVWithMapping,
  parseCSV as parseTrackingCSV,
} from '@/utils/trackingImportUtils';
import { useImportMappings } from '@/hooks/useImportMappings';
import { useValueMappings } from '@/hooks/useValueMappings';
import { ValueMappingStep } from './ValueMappingStep';

const IMPORT_TYPES = {
  'projects-epics': {
    label: 'Projects, Epics & Milestones',
    fields: [
      {
        id: 'project_name',
        label: 'Project Name',
        required: false,
        type: 'text',
      },
      {
        id: 'project_description',
        label: 'Project Description',
        required: false,
        type: 'text',
      },
      {
        id: 'project_status',
        label: 'Project Status',
        required: false,
        type: 'select',
        options: ['planning', 'active', 'completed', 'cancelled'],
      },
      {
        id: 'project_start_date',
        label: 'Project Start Date',
        required: false,
        type: 'date',
      },
      {
        id: 'project_end_date',
        label: 'Project End Date',
        required: false,
        type: 'date',
      },
      {
        id: 'project_budget',
        label: 'Project Budget',
        required: false,
        type: 'number',
      },
      { id: 'epic_name', label: 'Epic Name', required: false, type: 'text' },
      {
        id: 'epic_description',
        label: 'Epic Description',
        required: false,
        type: 'text',
      },
      {
        id: 'epic_effort',
        label: 'Epic Effort',
        required: false,
        type: 'number',
      },
      {
        id: 'epic_team',
        label: 'Epic Team',
        required: false,
        type: 'select',
        options: [],
      },
      {
        id: 'epic_target_date',
        label: 'Epic Target Date',
        required: false,
        type: 'date',
      },
      {
        id: 'milestone_name',
        label: 'Milestone Name',
        required: false,
        type: 'text',
      },
      {
        id: 'milestone_due_date',
        label: 'Milestone Due Date',
        required: false,
        type: 'date',
      },
    ],
  },
  'planning-allocations': {
    label: 'Planning Allocations',
    fields: [
      {
        id: 'team_name',
        label: 'Team Name',
        required: true,
        type: 'select',
        options: [],
      },
      {
        id: 'quarter',
        label: 'Quarter',
        required: true,
        type: 'select',
        options: [],
      },
      {
        id: 'iteration_number',
        label: 'Iteration Number',
        required: true,
        type: 'number',
      },
      {
        id: 'epic_name',
        label: 'Epic/Work Name',
        required: false,
        type: 'text',
      },
      {
        id: 'epic_type',
        label: 'Epic Type',
        required: false,
        type: 'select',
        options: [
          'Feature',
          'Platform',
          'Tech Debt',
          'Critical Run',
          'Project',
        ],
      },
      {
        id: 'project_name',
        label: 'Project Name',
        required: false,
        type: 'select',
        options: [],
      },
      {
        id: 'percentage',
        label: 'Allocation Percentage',
        required: true,
        type: 'number',
      },
      { id: 'notes', label: 'Notes', required: false, type: 'text' },
    ],
  },
  'actual-allocations': {
    label: 'Actual Allocations',
    fields: [
      {
        id: 'team_name',
        label: 'Team Name',
        required: true,
        type: 'select',
        options: [],
      },
      {
        id: 'quarter',
        label: 'Quarter',
        required: true,
        type: 'select',
        options: [],
      },
      {
        id: 'iteration_number',
        label: 'Iteration Number',
        required: true,
        type: 'number',
      },
      {
        id: 'epic_name',
        label: 'Epic/Work Name',
        required: false,
        type: 'text',
      },
      {
        id: 'epic_type',
        label: 'Epic Type',
        required: false,
        type: 'select',
        options: [
          'Feature',
          'Platform',
          'Tech Debt',
          'Critical Run',
          'Project',
        ],
      },
      {
        id: 'project_name',
        label: 'Project Name',
        required: false,
        type: 'select',
        options: [],
      },
      {
        id: 'actual_percentage',
        label: 'Actual Percentage',
        required: true,
        type: 'number',
      },
      {
        id: 'variance_reason',
        label: 'Variance Reason',
        required: false,
        type: 'select',
        options: [
          'none',
          'production-support',
          'scope-change',
          'resource-unavailable',
          'technical-blocker',
          'priority-shift',
          'other',
        ],
      },
      { id: 'notes', label: 'Notes', required: false, type: 'text' },
    ],
  },
  'iteration-reviews': {
    label: 'Iteration Reviews',
    fields: [
      {
        id: 'quarter',
        label: 'Quarter',
        required: true,
        type: 'select',
        options: [],
      },
      {
        id: 'iteration_number',
        label: 'Iteration Number',
        required: true,
        type: 'number',
      },
      {
        id: 'review_date',
        label: 'Review Date',
        required: false,
        type: 'date',
      },
      {
        id: 'status',
        label: 'Status',
        required: false,
        type: 'select',
        options: ['not-started', 'in-progress', 'completed'],
      },
      {
        id: 'completed_epics',
        label: 'Completed Epics',
        required: false,
        type: 'select',
        options: [],
      },
      {
        id: 'completed_milestones',
        label: 'Completed Milestones',
        required: false,
        type: 'select',
        options: [],
      },
      { id: 'notes', label: 'Notes', required: false, type: 'text' },
    ],
  },
  'bulk-tracking': {
    label: 'Bulk Tracking Data (Combined)',
    fields: [
      {
        id: 'data_type',
        label: 'Data Type',
        required: true,
        type: 'select',
        options: ['allocation', 'review'],
      },
      {
        id: 'team_name',
        label: 'Team Name',
        required: false,
        type: 'select',
        options: [],
      },
      {
        id: 'quarter',
        label: 'Quarter',
        required: true,
        type: 'select',
        options: [],
      },
      {
        id: 'iteration_number',
        label: 'Iteration Number',
        required: true,
        type: 'number',
      },
      {
        id: 'epic_name',
        label: 'Epic/Work Name',
        required: false,
        type: 'text',
      },
      {
        id: 'actual_percentage',
        label: 'Actual Percentage',
        required: false,
        type: 'number',
      },
      {
        id: 'variance_reason',
        label: 'Variance Reason',
        required: false,
        type: 'select',
        options: [
          'none',
          'production-support',
          'scope-change',
          'resource-unavailable',
          'technical-blocker',
          'priority-shift',
          'other',
        ],
      },
      {
        id: 'review_date',
        label: 'Review Date',
        required: false,
        type: 'date',
      },
      {
        id: 'status',
        label: 'Status',
        required: false,
        type: 'select',
        options: ['not-started', 'in-progress', 'completed'],
      },
      {
        id: 'completed_epics',
        label: 'Completed Epics',
        required: false,
        type: 'select',
        options: [],
      },
      {
        id: 'completed_milestones',
        label: 'Completed Milestones',
        required: false,
        type: 'select',
        options: [],
      },
      { id: 'notes', label: 'Notes', required: false, type: 'text' },
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
    setAllocations,
    teams,
    cycles,
    epics,
    runWorkCategories,
    projects,
    setTeams,
    setCycles,
    setRunWorkCategories,
  } = useApp();
  const { saveMapping, getMapping } = useImportMappings();
  const { saveValueMapping, getValueMapping } = useValueMappings();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<string[][]>([]);
  const [importType, setImportType] =
    useState<keyof typeof IMPORT_TYPES>('projects-epics');
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string | { row: number; message: string }[];
  }>({ type: null, message: '' });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [valueMappings, setValueMappings] = useState<
    Record<string, Record<string, string | number>>
  >({});

  const methods = useForm();
  const { handleSubmit, control, trigger, formState, reset, watch } = methods;

  // Watch form values for real-time validation
  const watchedValues = watch();

  // Fields that can be mapped through value mapping (excluding percentage fields)
  const mappableFields = [
    'team_name',
    'quarter',
    'epic_name',
    'epic_type',
    'epic_team',
    'completed_epics',
    'completed_milestones',
    'milestone_name',
    'variance_reason',
    'status',
    'data_type',
    'project_status',
  ];

  // Get available options for select fields
  const getFieldOptions = useCallback(
    (fieldId: string): (string | number)[] => {
      const config = IMPORT_TYPES[importType];
      const field = config.fields.find(f => f.id === fieldId);

      if (!field) return [];

      // Return predefined options or dynamic options based on field type
      if (field.options && field.options.length > 0) {
        return field.options.filter(option => String(option).trim() !== '');
      }

      // Dynamic options based on field type
      switch (fieldId) {
        case 'team_name': {
          return teams
            .map(team => team.name)
            .filter(name => name && name.trim() !== '');
        }
        case 'quarter': {
          return cycles
            .filter(cycle => cycle.type === 'quarterly')
            .map(cycle => cycle.name)
            .filter(name => name && name.trim() !== '');
        }
        case 'epic_name': {
          // For text fields, return existing values as suggestions but don't restrict
          return [
            ...epics.map(epic => epic.name),
            ...runWorkCategories.map(rw => rw.name),
          ].filter(name => name && name.trim() !== '');
        }
        case 'completed_epics': {
          return epics
            .map(epic => epic.name)
            .filter(name => name && name.trim() !== '');
        }
        case 'completed_milestones': {
          return projects
            .flatMap(project =>
              project.milestones.map(milestone => milestone.name)
            )
            .filter(name => name && name.trim() !== '');
        }
        case 'epic_team': {
          return teams
            .map(team => team.name)
            .filter(name => name && name.trim() !== '');
        }
        case 'milestone_name': {
          // For text fields, return existing values as suggestions but don't restrict
          return projects
            .flatMap(project =>
              project.milestones.map(milestone => milestone.name)
            )
            .filter(name => name && name.trim() !== '');
        }
        case 'epic_type': {
          // Return predefined epic type options
          return [
            'Feature',
            'Platform',
            'Tech Debt',
            'Critical Run',
            'Project',
          ];
        }
        case 'variance_reason': {
          // Return predefined variance reason options
          return [
            'none',
            'production-support',
            'scope-change',
            'resource-unavailable',
            'technical-blocker',
            'priority-shift',
            'other',
          ];
        }
        case 'status': {
          // Return predefined status options
          return ['not-started', 'in-progress', 'completed'];
        }
        case 'data_type': {
          // Return predefined data type options
          return ['allocation', 'review'];
        }
        case 'project_status': {
          // Return predefined project status options
          return ['planning', 'active', 'completed', 'cancelled'];
        }
        default:
          return [];
      }
    },
    [importType, teams, cycles, epics, runWorkCategories, projects]
  );

  // Validate field mapping
  const validateMapping = useCallback(
    (mapping: Record<string, string>) => {
      const errors: string[] = [];
      const config = IMPORT_TYPES[importType];

      config.fields.forEach(field => {
        if (
          field.required &&
          (!mapping[field.id] || mapping[field.id] === SKIP_MAPPING)
        ) {
          errors.push(`${field.label} is required but not mapped.`);
        }
      });

      return errors;
    },
    [importType]
  );

  // Validate CSV data against mapping
  const validateCSVData = useCallback(
    (mapping: Record<string, string>) => {
      const errors: string[] = [];
      const config = IMPORT_TYPES[importType];

      if (!fileContent || preview.length === 0) return errors;

      const parsed = parseTrackingCSV(fileContent);
      if (parsed.length === 0) return errors;

      const headers = parsed[0];

      config.fields.forEach(field => {
        const mappedHeader = mapping[field.id];
        if (!mappedHeader || mappedHeader === SKIP_MAPPING) return;

        const headerIndex = headers.findIndex(h => h === mappedHeader);
        if (headerIndex === -1) return;

        // Check each data row
        parsed.slice(1).forEach((row, rowIndex) => {
          const value = row[headerIndex];
          if (!value || value.trim() === '') {
            if (field.required) {
              errors.push(
                `Row ${rowIndex + 2}: ${field.label} is required but empty.`
              );
            }
          } else if (field.type === 'number') {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
              errors.push(
                `Row ${rowIndex + 2}: ${field.label} must be a number, got "${value}".`
              );
            }
          } else if (field.type === 'date') {
            const dateValue = new Date(value);
            if (isNaN(dateValue.getTime())) {
              errors.push(
                `Row ${rowIndex + 2}: ${field.label} must be a valid date, got "${value}".`
              );
            }
          }
        });
      });

      return errors;
    },
    [importType, fileContent, preview]
  );

  useEffect(() => {
    if (step === 2) {
      const savedMapping = getMapping(importType);
      reset(savedMapping);
    }
  }, [step, importType, getMapping, reset]);

  // Real-time validation when mapping changes
  useEffect(() => {
    if (step === 2 && Object.keys(watchedValues).length > 0) {
      const mappingErrors = validateMapping(watchedValues);
      const csvErrors = validateCSVData(watchedValues);
      setValidationErrors([...mappingErrors, ...csvErrors]);
    }
  }, [watchedValues, step, validateMapping, validateCSVData]);

  // Clear validation errors when value mappings change (user is fixing issues)
  useEffect(() => {
    if (step === 3 && Object.keys(valueMappings).length > 0) {
      setValidationErrors([]);
    }
  }, [valueMappings, step]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus({ type: null, message: '' });
      setValidationErrors([]);
      try {
        const text = await selectedFile.text();
        setFileContent(text);
        const parsed = parseTrackingCSV(text);
        if (parsed.length > 0) {
          const headers = parsed[0];
          const dataRows = parsed.slice(1);
          setHeaders(headers);

          // For large datasets, show fewer preview rows to improve performance
          const totalRows = dataRows.length;
          let previewRows;
          if (totalRows > 1000) {
            previewRows = 5; // Very large datasets: show only 5 rows
          } else if (totalRows > 500) {
            previewRows = 10; // Large datasets: show 10 rows
          } else if (totalRows > 100) {
            previewRows = 20; // Medium datasets: show 20 rows
          } else {
            previewRows = Math.min(totalRows, 50); // Small datasets: show up to 50 rows
          }
          setPreview(dataRows.slice(0, previewRows));
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

  // Check if there are unmapped values that need value mapping
  const hasUnmappedValues = (mapping: Record<string, string>): boolean => {
    if (!fileContent || !importType) return false;

    const parsed = parseTrackingCSV(fileContent);
    if (parsed.length < 2) return false; // Need headers + at least one data row

    const headers = parsed[0];
    const dataRows = parsed.slice(1);
    const config = IMPORT_TYPES[importType];

    // For allocation imports, always go to value mapping step to handle large datasets efficiently
    if (
      importType === 'planning-allocations' ||
      importType === 'actual-allocations'
    ) {
      const hasMappableFields = config.fields.some(
        field =>
          ['team_name', 'quarter', 'epic_name'].includes(field.id) &&
          mapping[field.id] &&
          mapping[field.id] !== SKIP_MAPPING
      );

      // If we have more than 50 records, always use value mapping for better UX
      if (hasMappableFields && dataRows.length > 50) {
        return true;
      }
    }

    // Fields that can be mapped through value mapping (excluding percentage fields)
    const mappableFields = [
      'team_name',
      'quarter',
      'epic_name',
      'epic_type',
      'epic_team',
      'completed_epics',
      'completed_milestones',
      'milestone_name',
      'variance_reason',
      'status',
      'data_type',
      'project_status',
    ];

    for (const field of config.fields) {
      if (!mappableFields.includes(field.id)) continue;

      const mappedHeader = mapping[field.id];
      if (!mappedHeader || mappedHeader === SKIP_MAPPING) continue;

      const headerIndex = headers.findIndex(h => h === mappedHeader);
      if (headerIndex === -1) continue;

      // For select fields, check if any values don't match the available options
      if (field.type === 'select' && field.options) {
        // If no options defined, skip validation
        if (field.options.length === 0) continue;

        // Check if any CSV values don't match existing options
        for (const row of dataRows) {
          const value = row[headerIndex];
          if (
            value &&
            value.trim() !== '' &&
            !field.options.some(option => String(option) === value)
          ) {
            return true; // Found an unmapped value
          }
        }
      }
    }

    return false;
  };

  const onSubmit = async (data: Record<string, string>) => {
    setStatus({ type: null, message: '' });
    if (!fileContent || !importType) return;

    try {
      const mapping = { ...data };
      Object.keys(mapping).forEach(key => {
        if (mapping[key] === SKIP_MAPPING) {
          delete mapping[key];
        }
      });

      // Final validation
      const mappingErrors = validateMapping(mapping);
      const csvErrors = validateCSVData(mapping);

      if (mappingErrors.length > 0 || csvErrors.length > 0) {
        setStatus({
          type: 'error',
          message: [...mappingErrors, ...csvErrors].join(', '),
        });
        return;
      }

      saveMapping(importType, mapping);

      // Check if we need value mapping
      const needsValueMapping = hasUnmappedValues(mapping);

      if (needsValueMapping) {
        setStep(3);
        return;
      }

      await performImport(mapping, {});
    } catch (e) {
      setStatus({
        type: 'error',
        message: `Import failed: ${e instanceof Error ? e.message : 'Unknown error'}`,
      });
    }
  };

  const handleValueMappingComplete = async (
    valueMappings: Record<string, Record<string, string | number>>
  ) => {
    setValueMappings(valueMappings);
    await performImport(methods.getValues(), valueMappings);
  };

  const performImport = async (
    mapping: Record<string, string>,
    valueMappings: Record<string, Record<string, string | number>>
  ) => {
    const appData = { teams, cycles, epics, runWorkCategories, projects };

    try {
      let result: any = {};

      switch (importType) {
        case 'projects-epics':
          result = await parseCombinedProjectEpicCSVWithMapping(
            fileContent,
            mapping,
            projects,
            epics
          );
          if (result.projects) setProjects(result.projects);
          if (result.epics) setEpics(result.epics);
          break;

        case 'planning-allocations':
          result = await parsePlanningAllocationCSVWithMapping(
            fileContent,
            mapping,
            teams,
            cycles,
            epics,
            runWorkCategories,
            projects,
            valueMappings
          );
          if (result.allocations) setAllocations(result.allocations);
          break;

        case 'actual-allocations':
          result = await parseActualAllocationCSVWithMapping(
            fileContent,
            mapping,
            teams,
            cycles,
            epics,
            runWorkCategories,
            valueMappings
          );
          if (result.actualAllocations)
            setActualAllocations(result.actualAllocations);
          break;

        case 'iteration-reviews':
          result = await parseIterationReviewCSVWithMapping(
            fileContent,
            mapping,
            cycles,
            epics,
            projects,
            valueMappings
          );
          if (result.iterationReviews)
            setIterationReviews(result.iterationReviews);
          break;

        case 'bulk-tracking':
          result = await parseBulkTrackingCSVWithMapping(
            fileContent,
            mapping,
            teams,
            cycles,
            epics,
            runWorkCategories,
            projects,
            valueMappings
          );
          if (result.actualAllocations)
            setActualAllocations(result.actualAllocations);
          if (result.iterationReviews)
            setIterationReviews(result.iterationReviews);
          break;

        default:
          throw new Error(`Unknown import type: ${importType}`);
      }

      setStatus({
        type: 'success',
        message: `Successfully imported ${result.importedCount || 0} records.`,
      });

      // Reset form and go back to step 1
      setTimeout(() => {
        setStep(1);
        setFile(null);
        setFileContent('');
        setHeaders([]);
        setPreview([]);
        setValidationErrors([]);
        setValueMappings({});
        reset({});
      }, 2000);
    } catch (e) {
      setStatus({
        type: 'error',
        message: `Import failed: ${e instanceof Error ? e.message : 'Unknown error'}`,
      });
    }
  };

  const resetForm = () => {
    setStep(1);
    setFile(null);
    setFileContent('');
    setHeaders([]);
    setPreview([]);
    setValidationErrors([]);
    setValueMappings({});
    setStatus({ type: null, message: '' });
    reset({});
  };

  const config = IMPORT_TYPES[importType];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadCloud className="h-5 w-5" />
          Advanced Data Import
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              1
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              2
            </div>
            {hasUnmappedValues(methods.getValues()) && (
              <>
                <div className="w-12 h-0.5 bg-gray-300"></div>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= 3
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  3
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status messages */}
        {status.type && (
          <Alert
            className={`mb-4 ${
              status.type === 'success' ? 'border-green-500' : 'border-red-500'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <AlertDescription
              className={
                status.type === 'success' ? 'text-green-700' : 'text-red-700'
              }
            >
              {status.message}
            </AlertDescription>
          </Alert>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="import-type">Select data type to import</Label>
              <Select
                value={importType}
                onValueChange={(v: keyof typeof IMPORT_TYPES) =>
                  setImportType(v)
                }
              >
                <SelectTrigger id="import-type">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(IMPORT_TYPES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="advanced-csv-file">Upload CSV File</Label>
              <Input
                id="advanced-csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
              />
            </div>
            <p className="text-sm text-gray-500">
              Upload a CSV file to begin the import process. You will be able to
              map your file's columns to the application's fields in the next
              step.
            </p>
          </div>
        )}

        {step === 2 && file && (
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <h3 className="font-semibold mb-2">Map Your Columns</h3>
              <p className="text-sm text-gray-500 mb-4">
                Match the columns from your file{' '}
                <span className="font-semibold text-gray-700">{file.name}</span>{' '}
                to the required application fields.
              </p>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <Alert className="mb-4 border-yellow-500">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-700">
                    <div className="space-y-1">
                      <strong>Validation Issues:</strong>
                      {validationErrors.map((error, index) => (
                        <div key={index} className="text-sm">
                          • {error}
                        </div>
                      ))}
                      <div className="mt-2 text-sm font-medium text-blue-600">
                        💡 Don't worry! Unmapped values will be handled in the
                        next step where you can map them to existing data or
                        create new entries.
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {config.fields.map(field => {
                  const hasOptions =
                    field.type === 'select' &&
                    field.options &&
                    field.options.length > 0;

                  return (
                    <div
                      key={field.id}
                      className="grid grid-cols-3 items-center gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <Label>
                          {field.label}{' '}
                          {field.required && (
                            <span className="text-red-500">*</span>
                          )}
                        </Label>
                        {hasOptions && (
                          <Badge variant="outline" className="text-xs">
                            {field.options.length} options
                          </Badge>
                        )}
                      </div>
                      <div className="col-span-2">
                        <Controller
                          name={field.id}
                          control={control}
                          rules={{ required: field.required }}
                          render={({ field: controllerField }) => (
                            <Select
                              onValueChange={(value: string) =>
                                controllerField.onChange(value)
                              }
                              defaultValue={controllerField.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select source column..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={SKIP_MAPPING}>
                                  -- Skip this field --
                                </SelectItem>
                                {headers.map(header => (
                                  <SelectItem key={header} value={header}>
                                    {header}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {formState.errors[field.id] && (
                          <p className="text-xs text-red-500 mt-1">
                            This field is required.
                          </p>
                        )}

                        {/* Show available options for select fields */}
                        {hasOptions && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            <div className="flex items-center gap-1 mb-1">
                              <Info className="h-3 w-3" />
                              <span className="font-medium">
                                Available options ({field.options.length}):
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                              {field.options.map((option, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {option}
                                </Badge>
                              ))}
                            </div>
                            {mappableFields.includes(field.id) && (
                              <div className="mt-2 text-blue-600 text-xs">
                                💡 Unmapped values will be handled in the next
                                step
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Preview table */}
              {preview.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-2">Data Preview</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {headers.map((header, index) => (
                            <TableHead key={index} className="text-xs">
                              {header}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <TableCell key={cellIndex} className="text-xs">
                                {cell}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {preview.length <
                    parseTrackingCSV(fileContent).length - 1 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Showing {preview.length} of{' '}
                      {parseTrackingCSV(fileContent).length - 1} rows
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Start Over
                </Button>
                <Button type="submit" disabled={validationErrors.length > 0}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </FormProvider>
        )}

        {step === 3 && (
          <ValueMappingStep
            importType={importType}
            fieldMappings={methods.getValues()}
            csvData={parseTrackingCSV(fileContent)}
            systemOptions={Object.fromEntries(
              config.fields
                .filter(field => field.type === 'select')
                .map(field => [field.id, getFieldOptions(field.id)])
            )}
            onNext={handleValueMappingComplete}
            onBack={() => setStep(2)}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedDataImport;
