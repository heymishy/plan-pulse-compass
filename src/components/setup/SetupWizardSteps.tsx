
import React from 'react';
import { Settings, DollarSign, Upload, CheckCircle } from 'lucide-react';

interface SetupWizardStepsProps {
  currentStep: number;
}

const SetupWizardSteps: React.FC<SetupWizardStepsProps> = ({ currentStep }) => {
  const steps = [
    { id: 0, title: 'Configuration', icon: Settings },
    { id: 1, title: 'Financial', icon: DollarSign },
    { id: 2, title: 'Import Data', icon: Upload },
    { id: 3, title: 'Complete', icon: CheckCircle },
  ];

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = currentStep === index;
        const isCompleted = currentStep > index;
        
        return (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              isCompleted ? 'bg-green-500 border-green-500 text-white' :
              isActive ? 'border-blue-500 text-blue-500' : 'border-gray-300 text-gray-300'
            }`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className={`ml-2 ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
              {step.title}
            </span>
            {index < steps.length - 1 && (
              <div className="w-16 h-px bg-gray-300 mx-4" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SetupWizardSteps;
