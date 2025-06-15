
import React, { useState } from 'react';
import { useSetupForm } from '@/hooks/useSetupForm';
import SetupWizardSteps from '@/components/setup/SetupWizardSteps';
import ConfigurationStep from '@/components/setup/ConfigurationStep';
import CompleteStep from '@/components/setup/CompleteStep';

const Setup = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { formData, setFormData, completeSetup } = useSetupForm();

  const steps = [
    { id: 0, title: 'Configuration', component: 'config' },
    { id: 1, title: 'Complete', component: 'complete' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Initial Setup</h1>
        <p className="text-gray-600">
          Welcome! Let's configure the basics to get you started. You can adjust more settings later.
        </p>
      </div>

      <SetupWizardSteps currentStep={currentStep} />

      {currentStep === 0 && (
        <ConfigurationStep
          formData={formData}
          setFormData={setFormData}
          onNext={() => setCurrentStep(1)}
        />
      )}

      {currentStep === 1 && (
        <CompleteStep onComplete={completeSetup} />
      )}
    </div>
  );
};

export default Setup;
