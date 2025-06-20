
import React from 'react';
import { useApp } from '@/context/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users } from 'lucide-react';
import AdvancedPlanningDashboard from '@/components/planning/AdvancedPlanningDashboard';
import DivisionBudgetManager from '@/components/planning/DivisionBudgetManager';
import ExecutiveReporting from '@/components/planning/ExecutiveReporting';
import TrackingIntegration from '@/components/planning/TrackingIntegration';

const AdvancedPlanning = () => {
  const { isSetupComplete } = useApp();

  if (!isSetupComplete) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Required</h2>
          <p className="text-gray-600 mb-6">
            Please complete the initial setup to access advanced planning features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Planning & Budgeting</h1>
        <p className="text-gray-600">
          Strategic planning, budget management, and executive reporting for portfolio optimization.
        </p>
      </div>

      <Tabs defaultValue="planning" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="planning">Project Planning</TabsTrigger>
          <TabsTrigger value="budgets">Budget Management</TabsTrigger>
          <TabsTrigger value="tracking">Tracking Integration</TabsTrigger>
          <TabsTrigger value="executive">Executive Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="planning">
          <AdvancedPlanningDashboard />
        </TabsContent>

        <TabsContent value="budgets">
          <DivisionBudgetManager />
        </TabsContent>

        <TabsContent value="tracking">
          <TrackingIntegration />
        </TabsContent>

        <TabsContent value="executive">
          <ExecutiveReporting />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedPlanning;
