import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  UploadCloud,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  FileText,
  Users,
  Target,
  Filter,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import {
  parsePowerBiEpicCSV,
  parsePowerBiStoryCSV,
  aggregateTeamSprintData,
  calculateAllocationPercentages,
  validatePowerBiData,
  type PowerBiEpicData,
  type PowerBiStoryData,
  type AllocationResult,
} from '@/utils/powerBiImportUtils';
import { Allocation, Team, Epic } from '@/types';

interface PowerBiImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WizardState {
  currentStep: number;
  epicFile: File | null;
  storyFile: File | null;
  selectedFinancialYearId: string;
  selectedQuarter: string;
  epicData: PowerBiEpicData[];
  storyData: PowerBiStoryData[];
  allocations: AllocationResult[];
  errors: string[];
  warnings: string[];
  isProcessing: boolean;
}

const STEPS = [
  { number: 1, title: 'Upload Files & Select Cycle', icon: UploadCloud },
  { number: 2, title: 'Parse & Validate Files', icon: FileText },
  { number: 3, title: 'Pre-computation & Aggregation', icon: Users },
  { number: 4, title: 'Resolve Ambiguities', icon: AlertCircle },
  { number: 5, title: 'Preview & Confirm Allocations', icon: Target },
];

// Utility functions for financial year and quarter management
const getCurrentQuarter = (cycles: Cycle[]): string => {
  const today = new Date();
  const currentQuarterlyCycle = cycles.find(
    cycle =>
      cycle.type === 'quarterly' &&
      new Date(cycle.startDate) <= today &&
      new Date(cycle.endDate) >= today
  );

  if (currentQuarterlyCycle) {
    // Extract quarter from cycle name (e.g., "Q1 2024" -> "Q1")
    const quarterMatch = currentQuarterlyCycle.name.match(/Q([1-4])/);
    return quarterMatch ? quarterMatch[0] : '';
  }
  return '';
};

const getCurrentFinancialYear = (cycles: Cycle[], config: any): string => {
  const today = new Date();
  const currentCycle = cycles.find(
    cycle =>
      new Date(cycle.startDate) <= today && new Date(cycle.endDate) >= today
  );

  if (currentCycle?.financialYearId) {
    return currentCycle.financialYearId;
  }

  // Fallback: generate current financial year based on config
  if (config?.financialYear) {
    const fyStart = new Date(config.financialYear.startDate);
    const currentYear = new Date().getFullYear();
    const fyMonth = fyStart.getMonth();
    const fyDay = fyStart.getDate();

    // Determine which financial year we're currently in
    const thisYearFY = new Date(currentYear, fyMonth, fyDay);
    const nextYearFY = new Date(currentYear + 1, fyMonth, fyDay);

    if (today >= thisYearFY && today < nextYearFY) {
      return `${currentYear}-${String(fyMonth + 1).padStart(2, '0')}-${String(fyDay).padStart(2, '0')}`;
    } else if (
      today >= new Date(currentYear - 1, fyMonth, fyDay) &&
      today < thisYearFY
    ) {
      return `${currentYear - 1}-${String(fyMonth + 1).padStart(2, '0')}-${String(fyDay).padStart(2, '0')}`;
    }
  }

  return '';
};

const generateFinancialYearOptions = (config: any) => {
  if (!config?.financialYear) return [];

  const fyStart = new Date(config.financialYear.startDate);
  if (isNaN(fyStart.getTime())) {
    console.error(
      'Invalid financial year start date:',
      config.financialYear.startDate
    );
    return [];
  }

  const fyMonth = fyStart.getMonth();
  const fyDay = fyStart.getDate();
  const currentYear = new Date().getFullYear();

  const years = [];
  for (let i = -3; i <= 3; i++) {
    const year = currentYear + i;
    const startDate = `${year}-${String(fyMonth + 1).padStart(2, '0')}-${String(fyDay).padStart(2, '0')}`;

    // Calculate end date properly: add 1 year and subtract 1 day
    const endDateObj = new Date(year + 1, fyMonth, fyDay - 1);
    const endDate = endDateObj.toISOString().split('T')[0];

    // Use appropriate label format
    const endYear = endDateObj.getFullYear();
    const label = endYear === year ? `FY ${year}` : `FY ${year}-${endYear}`;

    years.push({
      id: startDate, // Use start date as ID, consistent with CycleDialog
      label,
      startDate,
      endDate,
    });
  }

  return years;
};

const getQuartersForFinancialYear = (
  cycles: Cycle[],
  financialYearId: string,
  financialYears: any[]
): string[] => {
  // First try filtering by financialYearId field (for existing data)
  let filteredCycles = cycles.filter(
    cycle =>
      cycle.type === 'quarterly' && cycle.financialYearId === financialYearId
  );

  // If no cycles found by financialYearId, try date-based filtering
  if (filteredCycles.length === 0) {
    const selectedFY = financialYears.find(fy => fy.id === financialYearId);
    if (!selectedFY) {
      console.warn(
        'PowerBI: Selected financial year not found in options:',
        financialYearId
      );
      return [];
    }

    const fyStart = new Date(selectedFY.startDate);
    const fyEnd = new Date(selectedFY.endDate);

    // Filter quarters using date overlap logic (same as Planning page)
    filteredCycles = cycles.filter(cycle => {
      if (cycle.type !== 'quarterly') return false;

      const quarterStart = new Date(cycle.startDate);
      const quarterEnd = new Date(cycle.endDate);

      // Quarter overlaps with financial year if either:
      // 1. Quarter starts within FY, or
      // 2. Quarter ends within FY, or
      // 3. Quarter spans entire FY
      const overlaps =
        (quarterStart >= fyStart && quarterStart <= fyEnd) ||
        (quarterEnd >= fyStart && quarterEnd <= fyEnd) ||
        (quarterStart <= fyStart && quarterEnd >= fyEnd);

      return overlaps;
    });
  }

  // Extract quarter names from filtered cycles
  const quarters = filteredCycles
    .map(cycle => {
      const quarterMatch = cycle.name.match(/Q([1-4])/);
      return quarterMatch ? quarterMatch[0] : null;
    })
    .filter(Boolean)
    .sort();

  console.log(
    'PowerBI: Filtering quarters for FY:',
    financialYearId,
    'Found quarters:',
    Array.from(new Set(quarters))
  );

  return Array.from(new Set(quarters)) as string[];
};

export function PowerBiImportWizard({
  isOpen,
  onClose,
}: PowerBiImportWizardProps) {
  const { teams, cycles, epics, addAllocations, config } = useApp();
  const { toast } = useToast();

  const [state, setState] = useState<WizardState>({
    currentStep: 1,
    epicFile: null,
    storyFile: null,
    selectedFinancialYearId: '',
    selectedQuarter: '',
    epicData: [],
    storyData: [],
    allocations: [],
    errors: [],
    warnings: [],
    isProcessing: false,
  });

  // Memoized data for performance
  const currentFinancialYear = useMemo(
    () => getCurrentFinancialYear(cycles, config),
    [cycles, config]
  );
  const currentQuarter = useMemo(() => getCurrentQuarter(cycles), [cycles]);

  // Get unique financial years for dropdown
  const financialYears = useMemo(
    () => generateFinancialYearOptions(config),
    [config]
  );

  // Get quarters for selected financial year
  const availableQuarters = useMemo(() => {
    const selectedFY = state.selectedFinancialYearId || currentFinancialYear;
    return getQuartersForFinancialYear(cycles, selectedFY, financialYears);
  }, [
    cycles,
    state.selectedFinancialYearId,
    currentFinancialYear,
    financialYears,
  ]);

  // Initialize with current quarter and financial year when dialog opens
  useEffect(() => {
    if (
      isOpen &&
      state.selectedQuarter === '' &&
      state.selectedFinancialYearId === ''
    ) {
      setState(prev => ({
        ...prev,
        selectedQuarter: currentQuarter,
        selectedFinancialYearId: currentFinancialYear,
      }));
    }
  }, [isOpen, currentQuarter, currentFinancialYear]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setState({
        currentStep: 1,
        epicFile: null,
        storyFile: null,
        selectedFinancialYearId: '',
        selectedQuarter: '',
        epicData: [],
        storyData: [],
        allocations: [],
        errors: [],
        warnings: [],
        isProcessing: false,
      });
    }
  }, [isOpen]);

  const handleFileUpload = (type: 'epic' | 'story', file: File | null) => {
    setState(prev => ({
      ...prev,
      [type + 'File']: file,
    }));
  };

  const handleQuarterSelect = (quarter: string) => {
    setState(prev => ({
      ...prev,
      selectedQuarter: quarter,
    }));
  };

  const handleFinancialYearSelect = (fyId: string) => {
    setState(prev => {
      const newQuarters = getQuartersForFinancialYear(
        cycles,
        fyId,
        financialYears
      );
      const shouldKeepQuarter = newQuarters.includes(prev.selectedQuarter);

      // Auto-select current quarter if this is the current financial year and no quarter is selected
      const shouldAutoSelectCurrent =
        fyId === currentFinancialYear &&
        !shouldKeepQuarter &&
        newQuarters.includes(currentQuarter);

      return {
        ...prev,
        selectedFinancialYearId: fyId,
        selectedQuarter: shouldKeepQuarter
          ? prev.selectedQuarter
          : shouldAutoSelectCurrent
            ? currentQuarter
            : '',
      };
    });
  };

  const validateStep1 = (): string[] => {
    const errors: string[] = [];
    if (!state.epicFile) errors.push('Please upload Epic CSV file');
    if (!state.storyFile) errors.push('Please upload Story CSV file');
    if (!state.selectedFinancialYearId)
      errors.push('Please select a financial year');
    if (!state.selectedQuarter) errors.push('Please select a quarter');
    if (availableQuarters.length === 0 && state.selectedFinancialYearId) {
      errors.push('No quarters available for the selected financial year');
    }
    return errors;
  };

  const processFiles = async () => {
    if (!state.epicFile || !state.storyFile) return;

    setState(prev => ({ ...prev, isProcessing: true, errors: [] }));

    try {
      // Read file contents
      const epicContent = await state.epicFile.text();
      const storyContent = await state.storyFile.text();

      // Parse Epic CSV
      const epicResult = parsePowerBiEpicCSV(epicContent);
      if (!epicResult.success) {
        setState(prev => ({
          ...prev,
          errors: epicResult.errors,
          isProcessing: false,
        }));
        return;
      }

      // Parse Story CSV
      const storyResult = parsePowerBiStoryCSV(storyContent);
      if (!storyResult.success) {
        setState(prev => ({
          ...prev,
          errors: storyResult.errors,
          isProcessing: false,
        }));
        return;
      }

      // Aggregate data
      const aggregatedData = aggregateTeamSprintData(
        epicResult.data,
        storyResult.data
      );
      const allocations = calculateAllocationPercentages(aggregatedData);

      // Validate against existing data
      const validation = validatePowerBiData(allocations, teams, epics);

      setState(prev => ({
        ...prev,
        epicData: epicResult.data,
        storyData: storyResult.data,
        allocations: validation.validAllocations,
        errors: validation.errors,
        warnings: validation.warnings,
        isProcessing: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        errors: [
          `Failed to process files: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
        isProcessing: false,
      }));
    }
  };

  const nextStep = async () => {
    if (state.currentStep === 1) {
      const validationErrors = validateStep1();
      if (validationErrors.length > 0) {
        setState(prev => ({ ...prev, errors: validationErrors }));
        return;
      }
      setState(prev => ({ ...prev, currentStep: 2, errors: [] }));
      await processFiles();
    } else if (state.currentStep < 5) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  };

  const prevStep = () => {
    if (state.currentStep > 1) {
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1,
        errors: [],
      }));
    }
  };

  const handleImport = async () => {
    if (state.allocations.length === 0) return;

    try {
      // Find cycles for the selected financial year and quarter
      const selectedFY = state.selectedFinancialYearId || currentFinancialYear;
      const selectedFYDetails = financialYears.find(fy => fy.id === selectedFY);

      if (!selectedFYDetails) {
        toast({
          title: 'Error',
          description: 'Selected financial year not found',
          variant: 'destructive',
        });
        return;
      }

      const fyStart = new Date(selectedFYDetails.startDate);
      const fyEnd = new Date(selectedFYDetails.endDate);

      const targetCycles = cycles.filter(cycle => {
        if (cycle.type !== 'quarterly') return false;
        if (!cycle.name.includes(state.selectedQuarter)) return false;

        const quarterStart = new Date(cycle.startDate);
        const quarterEnd = new Date(cycle.endDate);

        // Quarter overlaps with financial year
        const overlaps =
          (quarterStart >= fyStart && quarterStart <= fyEnd) ||
          (quarterEnd >= fyStart && quarterEnd <= fyEnd) ||
          (quarterStart <= fyStart && quarterEnd >= fyEnd);

        return overlaps;
      });

      if (targetCycles.length === 0) {
        toast({
          title: 'Error',
          description:
            'No cycles found for the selected financial year and quarter',
          variant: 'destructive',
        });
        return;
      }

      // Convert allocations to the required format for all cycles in the quarter
      const newAllocations: Omit<Allocation, 'id'>[] = [];

      targetCycles.forEach(cycle => {
        state.allocations.forEach(allocation => {
          const team = teams.find(t => t.name === allocation.teamName);

          newAllocations.push({
            personId: 'team-allocation', // Placeholder - this will need to be handled by team allocation logic
            teamId: team?.id || '',
            projectId: undefined,
            epicId: undefined, // Will be resolved based on epic name
            cycleId: cycle.id,
            percentage: allocation.percentage,
            type: allocation.epicType === 'Run Work' ? 'run-work' : 'project',
            startDate: cycle.startDate,
            endDate: cycle.endDate,
            notes: `Imported from Power BI - ${state.selectedQuarter} - Epic: ${allocation.epicName}, Sprint: ${allocation.sprint}, Story Points: ${allocation.storyPoints}`,
          });
        });
      });

      await addAllocations(newAllocations);

      toast({
        title: 'Success',
        description: `Successfully imported ${state.allocations.length} allocations`,
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to import allocations: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const renderStepIndicators = () => (
    <div className="flex items-center justify-center space-x-4 mb-6">
      {STEPS.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              state.currentStep >= step.number
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {step.number}
          </div>
          {index < STEPS.length - 1 && (
            <ArrowRight className="w-4 h-4 mx-2 text-gray-400" />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Upload Epic CSV File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label htmlFor="epic-file">Epic CSV File</Label>
              <Input
                id="epic-file"
                type="file"
                accept=".csv"
                onChange={e =>
                  handleFileUpload('epic', e.target.files?.[0] || null)
                }
              />
              {state.epicFile && (
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {state.epicFile.name}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Upload Story CSV File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label htmlFor="story-file">Story CSV File</Label>
              <Input
                id="story-file"
                type="file"
                accept=".csv"
                onChange={e =>
                  handleFileUpload('story', e.target.files?.[0] || null)
                }
              />
              {state.storyFile && (
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {state.storyFile.name}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Select Target Quarter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Financial Year Selection */}
            <div className="space-y-2">
              <Label htmlFor="fy-select">Financial Year</Label>
              <Select
                value={state.selectedFinancialYearId || currentFinancialYear}
                onValueChange={handleFinancialYearSelect}
              >
                <SelectTrigger id="fy-select">
                  <SelectValue placeholder="Select financial year" />
                </SelectTrigger>
                <SelectContent>
                  {financialYears.map(fy => (
                    <SelectItem key={fy.id} value={fy.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{fy.label}</span>
                        {fy.id === currentFinancialYear && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quarter Selection */}
            <div className="space-y-2">
              <Label htmlFor="quarter-select">Quarter</Label>
              <Select
                value={state.selectedQuarter}
                onValueChange={handleQuarterSelect}
                disabled={!state.selectedFinancialYearId}
              >
                <SelectTrigger id="quarter-select">
                  <SelectValue placeholder="Select a quarter" />
                </SelectTrigger>
                <SelectContent>
                  {availableQuarters.map(quarter => {
                    const isCurrentQuarter =
                      quarter === currentQuarter &&
                      (state.selectedFinancialYearId ||
                        currentFinancialYear) === currentFinancialYear;

                    return (
                      <SelectItem key={quarter} value={quarter}>
                        <div className="flex items-center justify-between w-full">
                          <span>{quarter}</span>
                          {isCurrentQuarter && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Helpful information */}
              {state.selectedQuarter === currentQuarter &&
                (state.selectedFinancialYearId || currentFinancialYear) ===
                  currentFinancialYear && (
                  <div className="flex items-center text-sm text-green-600 mt-2">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Current quarter selected - data will be imported for all
                    iterations in this quarter
                  </div>
                )}

              {availableQuarters.length === 0 &&
                state.selectedFinancialYearId && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No quarters found for the selected financial year. Please
                      select a different financial year.
                    </AlertDescription>
                  </Alert>
                )}

              {!state.selectedFinancialYearId && (
                <div className="text-sm text-gray-500 mt-2">
                  Please select a financial year first
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>File Processing Results</CardTitle>
        </CardHeader>
        <CardContent>
          {state.isProcessing ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Processing files...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {state.epicData.length}
                  </div>
                  <div className="text-sm text-gray-600">Epics Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {state.storyData.length}
                  </div>
                  <div className="text-sm text-gray-600">Stories Processed</div>
                </div>
              </div>

              {state.errors.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {state.errors.map((error, index) => (
                        <div key={index}>{error}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {state.warnings.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <strong>Warnings:</strong>
                      {state.warnings.map((warning, index) => (
                        <div key={index}>{warning}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Allocation Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              {state.allocations.length} allocations ready for import
            </div>

            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Epic</TableHead>
                    <TableHead>Sprint</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Story Points</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.allocations.map((allocation, index) => (
                    <TableRow key={index}>
                      <TableCell>{allocation.teamName}</TableCell>
                      <TableCell>{allocation.epicName}</TableCell>
                      <TableCell>{allocation.sprint}</TableCell>
                      <TableCell>{allocation.percentage}%</TableCell>
                      <TableCell>{allocation.storyPoints}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            allocation.epicType === 'Run Work'
                              ? 'secondary'
                              : 'default'
                          }
                        >
                          {allocation.epicType || 'Change Work'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const currentStepData = STEPS.find(s => s.number === state.currentStep);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Power BI Import Wizard</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {renderStepIndicators()}

          <div className="text-center">
            <h3 className="text-lg font-medium">
              Step {state.currentStep} of 5: {currentStepData?.title}
            </h3>
          </div>

          {state.currentStep === 1 && renderStep1()}
          {state.currentStep === 2 && renderStep2()}
          {state.currentStep === 3 && (
            <div className="text-center py-8">
              <p>Step 3: Pre-computation & Aggregation (Coming Soon)</p>
            </div>
          )}
          {state.currentStep === 4 && (
            <div className="text-center py-8">
              <p>Step 4: Resolve Ambiguities (Coming Soon)</p>
            </div>
          )}
          {state.currentStep === 5 && renderStep5()}

          {state.errors.length > 0 && state.currentStep === 1 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {state.errors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between">
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {state.currentStep > 1 && (
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>

            <div>
              {state.currentStep < 5 ? (
                <Button
                  onClick={nextStep}
                  disabled={
                    state.isProcessing ||
                    (state.currentStep === 2 && state.errors.length > 0)
                  }
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleImport}
                  disabled={state.allocations.length === 0}
                >
                  Import Allocations
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
