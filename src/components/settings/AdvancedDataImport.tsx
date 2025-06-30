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
        required: true,
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
        type: 'select',
        options: [1, 2, 3, 4, 5, 6],
      },
      {
        id: 'epic_name',
        label: 'Epic/Work Name',
        required: false,
        type: 'select',
        options: [],
      },
      {
        id: 'epic_type',
        label: 'Epic Type',
        required: false,
        type: 'select',
        options: ['Feature', 'Platform', 'Tech Debt', 'Critical Run'],
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
        type: 'select',
        options: [1, 2, 3, 4, 5, 6],
      },
      {
        id: 'epic_name',
        label: 'Epic/Work Name',
        required: false,
        type: 'select',
        options: [],
      },
      {
        id: 'epic_type',
        label: 'Epic Type',
        required: false,
        type: 'select',
        options: ['Feature', 'Platform', 'Tech Debt', 'Critical Run'],
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
        type: 'select',
        options: [1, 2, 3, 4, 5, 6],
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
        type: 'select',
        options: [1, 2, 3, 4, 5, 6],
      },
      {
        id: 'epic_name',
        label: 'Epic/Work Name',
        required: false,
        type: 'select',
        options: [],
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

      // Fields that can be mapped through value mapping (excluding percentage fields)
      const mappableFields = [
        'team_name',
        'quarter',
        'iteration_number',
        'epic_name',
        'epic_type',
        'epic_team',
        'completed_epics',
        'completed_milestones',
      ];

      config.fields.forEach(field => {
        const mappedHeader = mapping[field.id];
        if (!mappedHeader || mappedHeader === SKIP_MAPPING) return;

        const headerIndex = headers.findIndex(h => h === mappedHeader);
        if (headerIndex === -1) {
          errors.push(
            `Mapped header "${mappedHeader}" for ${field.label} not found in CSV.`
          );
          return;
        }

        // Validate data in preview rows
        preview.forEach((row, rowIndex) => {
          const value = row[headerIndex];
          if (field.required && (!value || value.trim() === '')) {
            errors.push(
              `Row ${rowIndex + 2}: ${field.label} is required but empty.`
            );
          }

          if (field.type === 'number' && value && isNaN(parseFloat(value))) {
            errors.push(
              `Row ${rowIndex + 2}: ${field.label} must be a number, got "${value}".`
            );
          }

          // Only validate select field options for non-mappable fields
          if (
            field.type === 'select' &&
            value &&
            !mappableFields.includes(field.id)
          ) {
            const options = getFieldOptions(field.id);
            if (
              options.length > 0 &&
              !options.some(option => String(option) === value)
            ) {
              errors.push(
                `Row ${rowIndex + 2}: ${field.label} value "${value}" not found in available options.`
              );
            }
          }
        });
      });

      return errors;
    },
    [importType, fileContent, preview, getFieldOptions]
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
          setHeaders(parsed[0]);
          // For large datasets, show fewer preview rows to improve performance
          const totalRows = parsed.length - 1;
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
          setPreview(parsed.slice(1, previewRows + 1));
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
          ['team_name', 'quarter', 'iteration_number', 'epic_name'].includes(
            field.id
          ) &&
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
      'iteration_number',
      'epic_name',
      'epic_type',
      'epic_team',
      'completed_epics',
      'completed_milestones',
    ];

    for (const field of config.fields) {
      if (!mappableFields.includes(field.id)) continue;

      const mappedHeader = mapping[field.id];
      if (!mappedHeader || mappedHeader === SKIP_MAPPING) continue;

      const headerIndex = headers.findIndex(h => h === mappedHeader);
      if (headerIndex === -1) continue;

      // For select fields, check if any values don't match the available options
      if (field.type === 'select') {
        const options = getFieldOptions(field.id);

        // If no options defined, skip validation
        if (options.length === 0) continue;

        // Check if any CSV values don't match existing options
        for (const row of dataRows) {
          const value = row[headerIndex];
          if (
            value &&
            value.trim() !== '' &&
            !options.some(option => String(option) === value)
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

    if (importType === 'projects-epics') {
      const result = parseCombinedProjectEpicCSVWithMapping(
        fileContent,
        mapping,
        projects,
        epics
      );
      if (result.errors.length > 0) {
        setStatus({
          type: 'error',
          message: result.errors
            .map(e => `Row ${e.row}: ${e.message}`)
            .join(', '),
        });
        return;
      }
      if ('projects' in result && 'epics' in result) {
        setProjects(prev => [...prev, ...result.projects]);
        setEpics(prev => [...prev, ...result.epics]);
        setStatus({
          type: 'success',
          message: `Successfully imported ${result.projects.length} projects and ${result.epics.length} epics.`,
        });
      }
    } else if (importType === 'planning-allocations') {
      const result = parsePlanningAllocationCSVWithMapping(
        fileContent,
        mapping,
        teams,
        cycles,
        epics,
        runWorkCategories,
        valueMappings
      );
      if (result.errors.length > 0) {
        setStatus({
          type: 'error',
          message: result.errors
            .map(e => `Row ${e.row}: ${e.message}`)
            .join(', '),
        });
        return;
      }
      if ('allocations' in result) {
        // Add new records to the system
        if (result.newTeams && result.newTeams.length > 0) {
          setTeams(prev => [...prev, ...result.newTeams]);
        }
        if (result.newCycles && result.newCycles.length > 0) {
          setCycles(prev => [...prev, ...result.newCycles]);
        }
        if (result.newEpics && result.newEpics.length > 0) {
          setEpics(prev => [...prev, ...result.newEpics]);
        }
        if (
          result.newRunWorkCategories &&
          result.newRunWorkCategories.length > 0
        ) {
          setRunWorkCategories(prev => [
            ...prev,
            ...result.newRunWorkCategories,
          ]);
        }

        // Add allocations
        setAllocations(prev => [...prev, ...result.allocations]);

        // Create success message with details about new records
        const newRecordsMessage = [];
        if (result.newTeams && result.newTeams.length > 0) {
          newRecordsMessage.push(`${result.newTeams.length} new teams`);
        }
        if (result.newCycles && result.newCycles.length > 0) {
          newRecordsMessage.push(`${result.newCycles.length} new quarters`);
        }
        if (result.newEpics && result.newEpics.length > 0) {
          newRecordsMessage.push(`${result.newEpics.length} new epics`);
        }
        if (
          result.newRunWorkCategories &&
          result.newRunWorkCategories.length > 0
        ) {
          newRecordsMessage.push(
            `${result.newRunWorkCategories.length} new run work categories`
          );
        }

        const successMessage =
          `Successfully imported ${result.allocations.length} planning allocations.` +
          (newRecordsMessage.length > 0
            ? ` Created: ${newRecordsMessage.join(', ')}.`
            : '');

        setStatus({
          type: 'success',
          message: successMessage,
        });
      }
    } else if (importType === 'actual-allocations') {
      const result = parseActualAllocationCSVWithMapping(
        fileContent,
        mapping,
        teams,
        cycles,
        epics,
        runWorkCategories,
        valueMappings
      );
      if (result.errors.length > 0) {
        setStatus({
          type: 'error',
          message: result.errors
            .map(e => `Row ${e.row}: ${e.message}`)
            .join(', '),
        });
        return;
      }
      if ('allocations' in result) {
        setActualAllocations(prev => [...prev, ...result.allocations]);
        setStatus({
          type: 'success',
          message: `Successfully imported ${result.allocations.length} actual allocations.`,
        });
      }
    } else if (importType === 'iteration-reviews') {
      const result = parseIterationReviewCSVWithMapping(
        fileContent,
        mapping,
        cycles,
        epics,
        projects,
        valueMappings
      );
      if (result.errors.length > 0) {
        setStatus({ type: 'error', message: result.errors.join(', ') });
        return;
      }
      if ('reviews' in result) {
        setIterationReviews(prev => [...prev, ...result.reviews]);
        setStatus({
          type: 'success',
          message: `Successfully imported ${result.reviews.length} iteration reviews.`,
        });
      }
    } else if (importType === 'bulk-tracking') {
      const result = parseBulkTrackingCSVWithMapping(
        fileContent,
        mapping,
        teams,
        cycles,
        epics,
        runWorkCategories,
        projects,
        valueMappings
      );
      if (result.errors.length > 0) {
        setStatus({ type: 'error', message: result.errors.join(', ') });
        return;
      }
      if ('allocations' in result && 'reviews' in result) {
        setActualAllocations(prev => [...prev, ...result.allocations]);
        setIterationReviews(prev => [...prev, ...result.reviews]);
        setStatus({
          type: 'success',
          message: `Successfully imported ${result.allocations.length} allocations and ${result.reviews.length} reviews.`,
        });
      }
    }

    // Reset form
    setStep(1);
    setFile(null);
    setValueMappings({});
    methods.reset();
  };

  const config = IMPORT_TYPES[importType];

  // Fields that can be mapped through value mapping (excluding percentage fields)
  const mappableFields = [
    'team_name',
    'quarter',
    'iteration_number',
    'epic_name',
    'epic_type',
    'epic_team',
    'completed_epics',
    'completed_milestones',
  ];

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
          <Alert
            className={`mb-4 ${status.type === 'error' ? 'border-red-500' : 'border-green-500'}`}
          >
            {status.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            <AlertDescription
              className={
                status.type === 'error' ? 'text-red-700' : 'text-green-700'
              }
            >
              {typeof status.message === 'string' ? (
                status.message
              ) : (
                <ul>
                  {status.message.map((e, i) => (
                    <li key={i}>
                      Row {e.row}: {e.message}
                    </li>
                  ))}
                </ul>
              )}
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
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {config.fields.map(field => {
                  const options = getFieldOptions(field.id);
                  const hasOptions = options.length > 0;

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
                        {field.type === 'select' && hasOptions && (
                          <Badge variant="outline" className="text-xs">
                            {options.length} options
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
                        {field.type === 'select' && hasOptions && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            <div className="flex items-center gap-1 mb-1">
                              <Info className="h-3 w-3" />
                              <span className="font-medium">
                                Available options ({options.length}):
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                              {options.map((option, index) => (
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

              <div className="mt-6">
                <h4 className="font-semibold mb-2">Data Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {parseTrackingCSV(fileContent).length - 1}
                        </div>
                        <div className="text-sm text-gray-600">
                          Total Records
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {headers.length}
                        </div>
                        <div className="text-sm text-gray-600">Columns</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {parseTrackingCSV(fileContent).length > 100
                            ? 'Large'
                            : 'Standard'}
                        </div>
                        <div className="text-sm text-gray-600">
                          Dataset Size
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {preview.length}
                        </div>
                        <div className="text-sm text-gray-600">
                          Preview Rows
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <h4 className="font-semibold mb-2">Data Preview</h4>
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {headers.map(h => (
                          <TableHead key={h}>{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.map((row, i) => (
                        <TableRow key={i}>
                          {row.map((cell, j) => (
                            <TableCell key={j}>{cell}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {parseTrackingCSV(fileContent).length >
                    preview.length + 1 && (
                    <div className="p-3 bg-gray-50 text-center text-sm text-gray-600">
                      Showing {preview.length} of{' '}
                      {parseTrackingCSV(fileContent).length - 1} records
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => saveMapping(importType, methods.getValues())}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Mapping
                  </Button>
                  <Button type="submit" disabled={validationErrors.length > 0}>
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </form>
          </FormProvider>
        )}

        {step === 3 && (
          <ValueMappingStep
            importType={importType}
            fieldMappings={Object.fromEntries(
              Object.entries(methods.getValues()).filter(([fieldId]) => {
                // Exclude percentage fields from value mapping
                const percentageFields = ['percentage', 'actual_percentage'];
                return !percentageFields.includes(fieldId);
              })
            )}
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
