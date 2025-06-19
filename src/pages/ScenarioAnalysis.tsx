
import React from 'react';
import { useApp } from '@/context/AppContext';
import { Users } from 'lucide-react';
import ScenarioAnalysisDashboard from '@/components/scenarios/ScenarioAnalysisDashboard';

const ScenarioAnalysis = () => {
  const { isSetupComplete } = useApp();

  if (!isSetupComplete) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Required</h2>
          <p className="text-gray-600 mb-6">
            Please complete the initial setup to access scenario analysis.
          </p>
        </div>
      </div>
    );
  }

  return <ScenarioAnalysisDashboard />;
};

export default ScenarioAnalysis;
