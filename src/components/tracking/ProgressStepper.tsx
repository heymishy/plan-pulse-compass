
import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

interface Step {
  id: string;
  name: string;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStepId: string;
  onStepClick: (stepId: string) => void;
  completedSteps: Set<string>;
}

const ProgressStepper: React.FC<ProgressStepperProps> = ({ steps, currentStepId, onStepClick, completedSteps }) => {
  const currentStepIndex = steps.findIndex(s => s.id === currentStepId);

  return (
    <div className="w-full py-4 px-2 md:px-8">
      <div className="relative flex items-start justify-between">
        <div className="absolute left-0 top-4 -mt-px h-0.5 w-full bg-gray-200" aria-hidden="true">
            <div className="h-full bg-primary" style={{ width: `${(currentStepIndex / (steps.length -1)) * 100}%`}}></div>
        </div>
        {steps.map((step, stepIdx) => {
            const isCompleted = completedSteps.has(step.id);
            const isCurrent = step.id === currentStepId;
            return (
                <div key={step.id} className="relative flex flex-col items-center">
                    <button 
                        onClick={() => onStepClick(step.id)}
                        className={cn(
                            "relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-200",
                            isCompleted ? "border-primary bg-primary text-white" : isCurrent ? "border-primary bg-white text-primary scale-110" : "border-gray-300 bg-white text-gray-400"
                        )}
                    >
                        {isCompleted && <CheckCircle className="h-5 w-5" />}
                    </button>
                    <span className="mt-2 text-center text-xs md:text-sm font-medium text-gray-700">{step.name}</span>
                </div>
            )
        })}
      </div>
    </div>
  );
};

export default ProgressStepper;
