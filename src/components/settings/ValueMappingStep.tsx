import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  Save,
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
  const { getValueMappingsForField, saveValueMappings, suggestMapping } =
    useValueMappings();

  const [valueMappings, setValueMappings] = useState<
    Record<string, Record<string, string | number>>
  >({});
  const [saveMappingsForFuture, setSaveMappingsForFuture] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  // Extract unique CSV values for each mapped field
  const csvValuesByField = React.useMemo(() => {
    const result: Record<string, Set<string>> = {};

    Object.entries(fieldMappings).forEach(([fieldId, csvColumn]) => {
      if (csvColumn && csvData.length > 0) {
        const columnIndex = csvData[0].findIndex(
          header => header === csvColumn
        );
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

  const handleMappingChange = (
    fieldId: string,
    csvValue: string,
    systemValue: string | number
  ) => {
    setValueMappings(prev => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        [csvValue]: systemValue,
      },
    }));
  };

  const validateMappings = (): string[] => {
    const validationErrors: string[] = [];

    Object.entries(csvValuesByField).forEach(([fieldId, csvValues]) => {
      const fieldMappings = valueMappings[fieldId] || {};
      const unmappedValues = Array.from(csvValues).filter(
        csvValue => !fieldMappings[csvValue]
      );

      if (unmappedValues.length > 0) {
        validationErrors.push(
          `Field "${fieldId}" has unmapped values: ${unmappedValues.join(', ')}`
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Map CSV Values to System Values
        </h3>
        <p className="text-sm text-gray-600">
          Map the unique values from your CSV to the corresponding system
          values. Smart suggestions are provided based on patterns and previous
          mappings.
        </p>
      </div>

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
                <div className="space-y-3">
                  {Array.from(csvValues).map(csvValue => {
                    const currentMapping = fieldMappings[csvValue];
                    const isMapped = !!currentMapping;

                    return (
                      <div
                        key={csvValue}
                        className={`grid grid-cols-3 items-center gap-4 p-3 rounded-lg border ${
                          isMapped
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {csvValue}
                          </span>
                          {isMapped && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">maps to</span>
                        </div>

                        <div>
                          <Select
                            value={currentMapping ? String(currentMapping) : ''}
                            onValueChange={value =>
                              handleMappingChange(fieldId, csvValue, value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select system value..." />
                            </SelectTrigger>
                            <SelectContent>
                              {options.map(option => (
                                <SelectItem
                                  key={String(option)}
                                  value={String(option)}
                                >
                                  {option}
                                </SelectItem>
                              ))}
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
          <Button onClick={handleNext} disabled={errors.length > 0}>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
