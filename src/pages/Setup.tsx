
import React, { useState } from 'react';
import { useSetupForm } from '@/hooks/useSetupForm';
import SetupWizardSteps from '@/components/setup/SetupWizardSteps';
import ConfigurationStep from '@/components/setup/ConfigurationStep';
import ImportDataStep from '@/components/setup/ImportDataStep';
import CompleteStep from '@/components/setup/CompleteStep';

const Setup = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { formData, setFormData, handleCSVUpload, completeSetup } = useSetupForm();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup Wizard</h1>
        <p className="text-gray-600">
          Configure your team planning environment
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
        <ImportDataStep
          onCSVUpload={handleCSVUpload}
          onBack={() => setCurrentStep(0)}
          onNext={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 2 && (
        <CompleteStep onComplete={completeSetup} />
      )}
    </div>
  );
};

export default Setup;
