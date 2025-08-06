import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  AlertCircle, 
  AlertTriangle,
  X,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@/components/ui/accessibility';

// Core interfaces
export interface StepValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

export type StepStatus = 'pending' | 'current' | 'completed' | 'error';
export type WorkflowDirection = 'forward' | 'backward';
export type StepIndicatorVariant = 'numbers' | 'dots' | 'progress';

export interface WorkflowStepProps<T = any> {
  data: T;
  onDataChange?: (data: T) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onComplete?: () => void;
  isLoading?: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface WorkflowStep<T = any> {
  id: string;
  title: string;
  description?: string;
  required?: boolean;
  component: React.ComponentType<WorkflowStepProps<T>>;
  validation?: (data: T) => StepValidationResult | Promise<StepValidationResult>;
  condition?: (data: T) => boolean;
  metadata?: Record<string, any>;
}

export interface ProgressiveWorkflowProps<T = any> {
  // Core configuration
  steps: WorkflowStep<T>[];
  initialStep?: number;
  initialData?: T;
  
  // Behavior
  allowStepClick?: boolean;
  showCancel?: boolean;
  autoAdvance?: boolean;
  saveProgress?: boolean;
  
  // Callbacks
  onStepChange?: (stepIndex: number, step: WorkflowStep<T>) => void;
  onComplete?: (data: T) => void;
  onCancel?: () => void;
  onDataChange?: (data: T) => void;
  onValidation?: (stepId: string, result: StepValidationResult) => void;
  
  // Visual customization
  title?: string;
  subtitle?: string;
  compact?: boolean;
  showStepDescriptions?: boolean;
  stepIndicatorVariant?: StepIndicatorVariant;
  className?: string;
  maxWidth?: string;
  
  // Accessibility
  ariaLabel?: string;
  announceStepChanges?: boolean;
}

// Helper functions
const getStepStatus = (stepIndex: number, currentStep: number, completedSteps: Set<number>): StepStatus => {
  if (stepIndex === currentStep) return 'current';
  if (completedSteps.has(stepIndex)) return 'completed';
  if (stepIndex < currentStep) return 'completed';
  return 'pending';
};

const getStepIcon = (status: StepStatus, stepNumber: number, variant: StepIndicatorVariant) => {
  switch (variant) {
    case 'dots':
      return (
        <div 
          className={cn(
            "w-3 h-3 rounded-full transition-colors",
            status === 'completed' && "bg-green-500",
            status === 'current' && "bg-primary",
            status === 'pending' && "bg-muted-foreground/30",
            status === 'error' && "bg-destructive"
          )}
        />
      );
    case 'progress':
      return (
        <div 
          className={cn(
            "w-8 h-2 rounded-full transition-colors",
            status === 'completed' && "bg-green-500",
            status === 'current' && "bg-primary",
            status === 'pending' && "bg-muted-foreground/30",
            status === 'error' && "bg-destructive"
          )}
        />
      );
    default: // numbers
      if (status === 'completed') {
        return <Check className="h-4 w-4 text-white" />;
      }
      return <span className="text-sm font-medium text-white">{stepNumber}</span>;
  }
};

export function ProgressiveWorkflow<T = any>({
  steps,
  initialStep = 0,
  initialData = {} as T,
  allowStepClick = false,
  showCancel = false,
  autoAdvance = false,
  saveProgress = false,
  onStepChange,
  onComplete,
  onCancel,
  onDataChange,
  onValidation,
  title,
  subtitle,
  compact = false,
  showStepDescriptions = true,
  stepIndicatorVariant = 'numbers',
  className,
  maxWidth = "800px",
  ariaLabel = "Progressive workflow",
  announceStepChanges = true
}: ProgressiveWorkflowProps<T>) {
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep);
  const [data, setData] = useState<T>(initialData);
  
  // Update data when initialData changes
  useEffect(() => {
    setData(initialData);
  }, [initialData]);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [stepErrors, setStepErrors] = useState<Record<number, string[]>>({});
  const [stepWarnings, setStepWarnings] = useState<Record<number, string[]>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [stepAnnouncement, setStepAnnouncement] = useState('');
  
  const announcementTimeoutRef = useRef<NodeJS.Timeout>();

  // Validate props
  useEffect(() => {
    if (!steps || steps.length === 0) {
      console.warn('ProgressiveWorkflow requires at least one step');
    }
  }, [steps]);

  // Filter steps based on conditions
  const visibleSteps = React.useMemo(() => {
    return steps.filter(step => {
      if (!step.condition) return true;
      try {
        return step.condition(data);
      } catch (error) {
        console.error(`Error evaluating condition for step ${step.id}:`, error);
        return false; // Default to hiding step on error
      }
    });
  }, [steps, data]);
  
  // Reset step index if current step is no longer visible
  useEffect(() => {
    if (currentStepIndex >= visibleSteps.length) {
      setCurrentStepIndex(Math.max(0, visibleSteps.length - 1));
    }
  }, [visibleSteps.length, currentStepIndex]);

  const currentStep = visibleSteps[currentStepIndex];

  // Handle data changes
  const handleDataChange = useCallback((newData: T) => {
    setData(newData);
    onDataChange?.(newData);
  }, [onDataChange]);

  // Validation function
  const validateStep = useCallback(async (stepIndex: number): Promise<StepValidationResult> => {
    const step = visibleSteps[stepIndex];
    if (!step?.validation) {
      return { isValid: true };
    }

    try {
      setIsValidating(true);
      const result = await step.validation(data);
      
      // Update error and warning states
      setStepErrors(prev => ({
        ...prev,
        [stepIndex]: result.errors || []
      }));
      
      setStepWarnings(prev => ({
        ...prev,
        [stepIndex]: result.warnings || []
      }));

      onValidation?.(step.id, result);
      return result;
    } catch (error) {
      console.error(`Validation error for step ${step.id}:`, error);
      const errorResult = { 
        isValid: false, 
        errors: ['Validation failed'] 
      };
      
      setStepErrors(prev => ({
        ...prev,
        [stepIndex]: errorResult.errors || []
      }));

      return errorResult;
    } finally {
      setIsValidating(false);
    }
  }, [visibleSteps, data, onValidation]);

  // Step navigation functions
  const goToStep = useCallback(async (targetIndex: number, direction: WorkflowDirection = 'forward') => {
    if (targetIndex < 0 || targetIndex >= visibleSteps.length) return;

    // Validate current step before moving forward
    if (direction === 'forward' && currentStepIndex < visibleSteps.length - 1) {
      const validation = await validateStep(currentStepIndex);
      if (!validation.isValid) {
        return; // Stay on current step if validation fails
      }
      
      // Mark current step as completed
      setCompletedSteps(prev => new Set([...prev, currentStepIndex]));
    }

    // Clear errors for the target step
    setStepErrors(prev => ({ ...prev, [targetIndex]: [] }));
    setStepWarnings(prev => ({ ...prev, [targetIndex]: [] }));

    setCurrentStepIndex(targetIndex);
    onStepChange?.(targetIndex, visibleSteps[targetIndex]);

    // Announce step change
    if (announceStepChanges) {
      const step = visibleSteps[targetIndex];
      const announcement = `Now on step ${targetIndex + 1}: ${step.title}`;
      setStepAnnouncement(announcement);
      
      // Clear announcement after delay
      if (announcementTimeoutRef.current) {
        clearTimeout(announcementTimeoutRef.current);
      }
      announcementTimeoutRef.current = setTimeout(() => {
        setStepAnnouncement('');
      }, 3000);
    }
  }, [currentStepIndex, visibleSteps, validateStep, onStepChange, announceStepChanges]);

  const handleNext = useCallback(() => {
    if (currentStepIndex < visibleSteps.length - 1) {
      goToStep(currentStepIndex + 1, 'forward');
    }
  }, [currentStepIndex, visibleSteps.length, goToStep]);

  const handlePrevious = useCallback(() => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1, 'backward');
    }
  }, [currentStepIndex, goToStep]);

  const handleComplete = useCallback(async () => {
    // Validate current step before completion
    const validation = await validateStep(currentStepIndex);
    if (!validation.isValid) {
      return;
    }

    // Validate all required steps are completed
    const requiredSteps = visibleSteps
      .map((step, index) => ({ step, index }))
      .filter(({ step }) => step.required !== false);

    const allRequiredCompleted = requiredSteps.every(({ index }) => 
      completedSteps.has(index) || index === currentStepIndex
    );

    if (!allRequiredCompleted) {
      setStepErrors(prev => ({
        ...prev,
        [currentStepIndex]: ['Please complete all required steps before finishing']
      }));
      return;
    }

    onComplete?.(data);
  }, [currentStepIndex, validateStep, visibleSteps, completedSteps, data, onComplete]);

  const handleStepClick = useCallback((stepIndex: number) => {
    if (!allowStepClick) return;
    goToStep(stepIndex);
  }, [allowStepClick, goToStep]);

  // Clean up timeouts
  useEffect(() => {
    return () => {
      if (announcementTimeoutRef.current) {
        clearTimeout(announcementTimeoutRef.current);
      }
    };
  }, []);

  // Handle empty steps
  if (!visibleSteps.length) {
    return (
      <Card className={cn("w-full max-w-2xl mx-auto", className)}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No steps available</p>
            <p className="text-sm text-muted-foreground">
              Configure workflow steps to get started
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div 
      className={cn("w-full", className)}
      style={{ maxWidth }}
      role="group"
      aria-label={ariaLabel}
      data-testid="workflow-container"
    >
      {/* Announcement for screen readers */}
      <VisuallyHidden>
        <div 
          data-testid="step-announcement"
          aria-live="polite"
          aria-atomic="true"
        >
          {stepAnnouncement}
        </div>
      </VisuallyHidden>

      <Card className={cn(compact && "compact")}>
        {/* Header */}
        {(title || subtitle) && (
          <CardHeader className="pb-4">
            {title && <CardTitle className="flex items-center gap-2">{title}</CardTitle>}
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </CardHeader>
        )}

        {/* Step Indicator */}
        <div className="px-6 pb-4">
          <div 
            className="flex items-center justify-between mb-4"
            data-testid="step-indicator"
          >
            <div className={cn(
              "flex items-center gap-4",
              stepIndicatorVariant === 'dots' && "gap-2",
              stepIndicatorVariant === 'progress' && "gap-1 flex-1"
            )}>
              {visibleSteps.map((step, index) => {
                const status = getStepStatus(index, currentStepIndex, completedSteps);
                const isClickable = allowStepClick && status !== 'pending';
                
                return (
                  <div key={step.id} className="flex items-center">
                    <button
                      className={cn(
                        "flex items-center justify-center transition-all duration-200",
                        stepIndicatorVariant === 'numbers' && "w-10 h-10 rounded-full",
                        stepIndicatorVariant === 'dots' && "w-3 h-3 rounded-full p-0",
                        stepIndicatorVariant === 'progress' && "flex-1 h-2 rounded-full",
                        status === 'completed' && "bg-green-500 text-white",
                        status === 'current' && "bg-primary text-primary-foreground ring-2 ring-primary/20",
                        status === 'pending' && "bg-muted text-muted-foreground",
                        status === 'error' && "bg-destructive text-destructive-foreground",
                        isClickable && "hover:scale-105 cursor-pointer",
                        !isClickable && "cursor-default"
                      )}
                      onClick={() => handleStepClick(index)}
                      disabled={!isClickable}
                      aria-label={`Step ${index + 1}: ${step.title}${status === 'completed' ? ' (completed)' : status === 'current' ? ' (current)' : ''}`}
                    >
                      {getStepIcon(status, index + 1, stepIndicatorVariant)}
                    </button>
                    
                    {stepIndicatorVariant === 'numbers' && (
                      <div className="ml-3 min-w-0">
                        <p className="text-sm font-medium truncate">{step.title}</p>
                        {showStepDescriptions && step.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {step.description}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Progress connector */}
                    {stepIndicatorVariant !== 'progress' && index < visibleSteps.length - 1 && (
                      <div className="flex-1 h-px bg-border mx-4" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress text */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Step {currentStepIndex + 1} of {visibleSteps.length}</span>
            <Badge variant="outline" className="text-xs">
              {Math.round(((currentStepIndex + 1) / visibleSteps.length) * 100)}% Complete
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Step Content */}
        <CardContent className="p-6">
          <div
            data-testid="step-content"
            aria-live="polite"
            aria-labelledby={`step-${currentStep?.id}-title`}
          >
            {/* Step Header */}
            <div className="mb-6">
              <h2 
                id={`step-${currentStep?.id}-title`}
                className="text-xl font-semibold mb-2"
              >
                {currentStep?.title}
              </h2>
              {showStepDescriptions && currentStep?.description && (
                <p className="text-muted-foreground">{currentStep.description}</p>
              )}
              {currentStep?.required && (
                <Badge variant="secondary" className="mt-2">Required</Badge>
              )}
            </div>

            {/* Validation Messages */}
            {stepErrors[currentStepIndex]?.length > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {stepErrors[currentStepIndex].map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {stepWarnings[currentStepIndex]?.length > 0 && (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {stepWarnings[currentStepIndex].map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Step Component */}
            <div className="min-h-[200px]">
              {currentStep ? (
                <React.Suspense fallback={
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                }>
                  <ErrorBoundary>
                    <currentStep.component
                      data={data}
                      onDataChange={handleDataChange}
                      onNext={handleNext}
                      onPrevious={handlePrevious}
                      onComplete={handleComplete}
                      isLoading={isValidating}
                      errors={stepErrors[currentStepIndex]}
                      warnings={stepWarnings[currentStepIndex]}
                    />
                  </ErrorBoundary>
                </React.Suspense>
              ) : (
                <div className="text-center text-muted-foreground">
                  Step not found
                </div>
              )}
            </div>

            {/* Validation loading */}
            {isValidating && (
              <div className="flex items-center justify-center mt-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Validating...</span>
              </div>
            )}
          </div>
        </CardContent>

        {/* Footer Navigation */}
        <div className="px-6 pb-6">
          <Separator className="mb-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <Button 
                  variant="outline" 
                  onClick={handlePrevious}
                  disabled={isValidating}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
              )}
              
              {showCancel && (
                <Button 
                  variant="ghost" 
                  onClick={onCancel}
                  disabled={isValidating}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {currentStepIndex < visibleSteps.length - 1 ? (
                <Button 
                  onClick={handleNext}
                  disabled={isValidating}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button 
                  onClick={handleComplete}
                  disabled={isValidating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Complete
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ProgressiveWorkflow step error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-2" />
            <p className="text-sm text-destructive">Error loading step</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ProgressiveWorkflow;