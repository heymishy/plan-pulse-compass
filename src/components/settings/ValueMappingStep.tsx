import React, { useState, useEffect, useMemo } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Save,
  Lightbulb,
  Zap,
  Users,
  Target,
  BarChart3,
  Settings,
} from 'lucide-react';
import { useValueMappings } from '@/hooks/useValueMappings';

interface ValueMappingStepProps {
  importType: string;
  fieldMappings: Record<string, string>;
  csvData: string[][];
  systemOptions: Record<string, (string | number)[]>;
  onNext: (
    valueMappings: Record<string, Record<string, string | number>>
  ) => void;
  onBack: () => void;
}

export const ValueMappingStep: React.FC<ValueMappingStepProps> = ({
  importType,
  fieldMappings,
  csvData,
  systemOptions,
  onNext,
  onBack,
}) => {
  const [valueMappings, setValueMappings] = useState<
    Record<string, Record<string, string | number>>
  >({});
  const [errors, setErrors] = useState<string[]>([]);
  const [saveMappingsForFuture, setSaveMappingsForFuture] = useState(false);
  const [batchSettings, setBatchSettings] = useState({
    createAllNewTeams: false,
    createAllNewEpics: false,
    defaultEpicType: 'Project' as 'Project' | 'Run Work',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { getValueMappingsForField, saveValueMappings } = useValueMappings();

  // Get unique CSV values for each field
  const csvValuesByField = useMemo(() => {
    const result: Record<string, Set<string>> = {};

    Object.entries(fieldMappings).forEach(([fieldId, header]) => {
      if (header && header !== 'SKIP') {
        const columnIndex = csvData[0]?.findIndex(h => h === header);
        if (columnIndex !== -1) {
          const uniqueValues = new Set<string>();
          csvData.slice(1).forEach(row => {
            if (row[columnIndex]) {
              uniqueValues.add(row[columnIndex].trim());
            }
          });
          result[fieldId] = uniqueValues;
        }
      }
    });

    return result;
  }, [fieldMappings, csvData]);

  // Smart suggestions for mapping
  const suggestMapping = (
    csvValue: string,
    options: (string | number)[]
  ): string | number | null => {
    const normalizedCsvValue = csvValue.toLowerCase().trim();

    // Exact match
    const exactMatch = options.find(
      option => String(option).toLowerCase().trim() === normalizedCsvValue
    );
    if (exactMatch) return exactMatch;

    // Partial match
    const partialMatch = options.find(
      option =>
        String(option).toLowerCase().includes(normalizedCsvValue) ||
        normalizedCsvValue.includes(String(option).toLowerCase())
    );
    if (partialMatch) return partialMatch;

    return null;
  };

  // Initialize value mappings with saved mappings and suggestions
  useEffect(() => {
    const initialMappings: Record<string, Record<string, string | number>> = {};

    Object.entries(csvValuesByField).forEach(([fieldId, csvValues]) => {
      const savedMappings = getValueMappingsForField(importType, fieldId);
      const fieldMappings: Record<string, string | number> = {};

      csvValues.forEach(csvValue => {
        // Use saved mapping if available
        if (savedMappings[csvValue]) {
          fieldMappings[csvValue] = savedMappings[csvValue];
        } else {
          // Try to suggest a mapping
          const options = systemOptions[fieldId] || [];
          const suggestion = suggestMapping(csvValue, options);
          if (suggestion) {
            fieldMappings[csvValue] = suggestion;
          } else {
            // Default to "Create new" for unmapped values
            fieldMappings[csvValue] = `NEW:${csvValue}`;
          }
        }
      });

      initialMappings[fieldId] = fieldMappings;
    });

    setValueMappings(initialMappings);
  }, [
    csvValuesByField,
    importType,
    getValueMappingsForField,
    suggestMapping,
    systemOptions,
  ]);

  // Apply batch operations
  const applyBatchOperation = (
    fieldId: string,
    operation: 'create-all-new' | 'map-to-existing'
  ) => {
    const csvValues = csvValuesByField[fieldId];
    if (!csvValues) return;

    const options = systemOptions[fieldId] || [];
    const newMappings: Record<string, string | number> = {};

    csvValues.forEach(csvValue => {
      if (operation === 'create-all-new') {
        newMappings[csvValue] = `NEW:${csvValue}`;
      } else if (operation === 'map-to-existing' && options.length > 0) {
        const suggestion = suggestMapping(csvValue, options);
        newMappings[csvValue] = suggestion || `NEW:${csvValue}`;
      }
    });

    setValueMappings(prev => ({
      ...prev,
      [fieldId]: { ...prev[fieldId], ...newMappings },
    }));
  };

  const handleMappingChange = (
    fieldId: string,
    csvValue: string,
    systemValue: string | number
  ) => {
    // Handle "Create new" option
    if (String(systemValue).startsWith('CREATE_NEW:')) {
      const newValue = String(systemValue).replace('CREATE_NEW:', '');
      setValueMappings(prev => ({
        ...prev,
        [fieldId]: {
          ...prev[fieldId],
          [csvValue]: `NEW:${newValue}`, // Mark as new record
        },
      }));
    } else {
      setValueMappings(prev => ({
        ...prev,
        [fieldId]: {
          ...prev[fieldId],
          [csvValue]: systemValue,
        },
      }));
    }
  };

  const validateMappings = (): string[] => {
    const validationErrors: string[] = [];

    Object.entries(csvValuesByField).forEach(([fieldId, csvValues]) => {
      const fieldMappings = valueMappings[fieldId] || {};
      const unmappedValues = Array.from(csvValues).filter(
        csvValue => !fieldMappings[csvValue] || fieldMappings[csvValue] === ''
      );

      if (unmappedValues.length > 0) {
        validationErrors.push(
          `Field "${getFieldLabel(fieldId)}" has unmapped values: ${unmappedValues.join(', ')}`
        );
      }
    });

    return validationErrors;
  };

  const handleNext = () => {
    const validationErrors = validateMappings();
    setErrors(validationErrors);

    if (validationErrors.length === 0) {
      // Save mappings if requested
      if (saveMappingsForFuture) {
        Object.entries(valueMappings).forEach(([fieldId, mappings]) => {
          saveValueMappings(importType, fieldId, mappings);
        });
      }

      onNext(valueMappings);
    }
  };

  const getFieldLabel = (fieldId: string): string => {
    const fieldLabels: Record<string, string> = {
      team_name: 'Team Name',
      quarter: 'Quarter',
      iteration_number: 'Iteration Number',
      epic_name: 'Epic/Work Name',
      epic_type: 'Epic Type',
      actual_percentage: 'Actual Percentage',
      variance_reason: 'Variance Reason',
      notes: 'Notes',
      project_name: 'Project Name',
      project_status: 'Project Status',
      review_date: 'Review Date',
      status: 'Status',
      completed_epics: 'Completed Epics',
      completed_milestones: 'Completed Milestones',
    };

    return fieldLabels[fieldId] || fieldId;
  };

  // Calculate import summary
  const importSummary = useMemo(() => {
    const summary = {
      totalRecords: csvData.length - 1,
      newTeams: 0,
      newEpics: 0,
      existingTeams: 0,
      existingEpics: 0,
    };

    Object.entries(csvValuesByField).forEach(([fieldId, csvValues]) => {
      const fieldMappings = valueMappings[fieldId] || {};
      const options = systemOptions[fieldId] || [];

      csvValues.forEach(csvValue => {
        const mapping = fieldMappings[csvValue];
        if (String(mapping).startsWith('NEW:')) {
          if (fieldId === 'team_name') summary.newTeams++;
          if (fieldId === 'epic_name') summary.newEpics++;
        } else if (mapping && options.includes(mapping)) {
          if (fieldId === 'team_name') summary.existingTeams++;
          if (fieldId === 'epic_name') summary.existingEpics++;
        }
      });
    });

    return summary;
  }, [csvValuesByField, valueMappings, systemOptions]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Smart Value Mapping</h3>
        <p className="text-sm text-gray-600">
          Map CSV values to system values with smart suggestions and batch
          operations for large datasets.
        </p>
      </div>

      {/* Import Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <BarChart3 className="h-5 w-5" />
            Import Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {importSummary.totalRecords}
              </div>
              <div className="text-sm text-blue-700">Total Records</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {importSummary.newTeams}
              </div>
              <div className="text-sm text-green-700">New Teams</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {importSummary.newEpics}
              </div>
              <div className="text-sm text-purple-700">New Epics</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {importSummary.existingTeams + importSummary.existingEpics}
              </div>
              <div className="text-sm text-gray-700">Existing Items</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batch Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Batch Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(csvValuesByField).map(([fieldId, csvValues]) => {
              const options = systemOptions[fieldId] || [];
              const unmappedCount = Array.from(csvValues).filter(
                csvValue => !valueMappings[fieldId]?.[csvValue]
              ).length;

              return (
                <div key={fieldId} className="space-y-2">
                  <Label className="font-medium">
                    {getFieldLabel(fieldId)}
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        applyBatchOperation(fieldId, 'create-all-new')
                      }
                      className="text-blue-600"
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      Create All New ({csvValues.size})
                    </Button>
                    {options.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          applyBatchOperation(fieldId, 'map-to-existing')
                        }
                        className="text-green-600"
                      >
                        <Target className="h-4 w-4 mr-1" />
                        Map to Existing
                      </Button>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {csvValues.size} unique values • {unmappedCount} unmapped
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {errors.length > 0 && (
        <Alert className="border-red-500">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">
            <div className="space-y-1">
              <strong>Please fix the following issues:</strong>
              {errors.map((error, index) => (
                <div key={index} className="text-sm">
                  • {error}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Individual Mappings (Collapsible for large datasets) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Individual Mappings</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'} Details
            </Button>
          </CardTitle>
        </CardHeader>
        {showAdvanced && (
          <CardContent>
            <div className="space-y-6">
              {Object.entries(csvValuesByField).map(([fieldId, csvValues]) => {
                const fieldMappings = valueMappings[fieldId] || {};
                const options = systemOptions[fieldId] || [];
                const unmappedCount = Array.from(csvValues).filter(
                  csvValue => !fieldMappings[csvValue]
                ).length;

                return (
                  <Card key={fieldId}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{getFieldLabel(fieldId)}</span>
                        <div className="flex items-center gap-2">
                          {unmappedCount > 0 ? (
                            <Badge variant="destructive">
                              {unmappedCount} unmapped
                            </Badge>
                          ) : (
                            <Badge
                              variant="default"
                              className="bg-green-100 text-green-800"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Complete
                            </Badge>
                          )}
                          <Badge variant="outline">
                            {csvValues.size} unique values
                          </Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {Array.from(csvValues).map(csvValue => {
                          const currentMapping = fieldMappings[csvValue];
                          const isMapped = !!currentMapping;
                          const isNewRecord =
                            String(currentMapping).startsWith('NEW:');

                          return (
                            <div
                              key={csvValue}
                              className={`grid grid-cols-3 items-center gap-4 p-3 rounded-lg border ${
                                isMapped
                                  ? isNewRecord
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'bg-green-50 border-green-200'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {csvValue}
                                </span>
                                {isMapped &&
                                  (isNewRecord ? (
                                    <Badge
                                      variant="outline"
                                      className="text-blue-600 text-xs"
                                    >
                                      New
                                    </Badge>
                                  ) : (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ))}
                              </div>

                              <div className="flex items-center gap-2">
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-500">
                                  {isNewRecord ? 'will create' : 'maps to'}
                                </span>
                              </div>

                              <div>
                                <Select
                                  value={
                                    currentMapping ? String(currentMapping) : ''
                                  }
                                  onValueChange={value =>
                                    handleMappingChange(
                                      fieldId,
                                      csvValue,
                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select system value..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {options
                                      .filter(
                                        option => String(option).trim() !== ''
                                      )
                                      .map(option => (
                                        <SelectItem
                                          key={String(option)}
                                          value={String(option)}
                                        >
                                          {option}
                                        </SelectItem>
                                      ))}
                                    <SelectItem
                                      value={`CREATE_NEW:${csvValue}`}
                                      className="text-blue-600 font-medium"
                                    >
                                      ✨ Create new: "{csvValue}"
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {options.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium text-blue-700">
                              Available system values:
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {options.map(option => (
                              <Badge
                                key={String(option)}
                                variant="secondary"
                                className="text-xs"
                              >
                                {option}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="save-mappings"
          checked={saveMappingsForFuture}
          onCheckedChange={checked =>
            setSaveMappingsForFuture(checked as boolean)
          }
        />
        <Label htmlFor="save-mappings" className="text-sm">
          Save these mappings for future imports
        </Label>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          {saveMappingsForFuture && (
            <Button
              variant="outline"
              onClick={() => {
                Object.entries(valueMappings).forEach(([fieldId, mappings]) => {
                  saveValueMappings(importType, fieldId, mappings);
                });
              }}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Mappings
            </Button>
          )}
          <Button onClick={handleNext}>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
