import React from 'react';
import { useApp } from '@/context/AppContext';
import { useScenarios } from '@/context/ScenarioContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Debug component to verify scenario functionality is working correctly
 * Shows team count in both live and scenario modes to confirm data isolation
 */
export const ScenarioDebugInfo: React.FC = () => {
  const { teams, people, projects } = useApp();
  const { isInScenarioMode, activeScenarioId, scenarios } = useScenarios();

  const activeScenario = scenarios.find(s => s.id === activeScenarioId);

  return (
    <Card className="mb-4 border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <span>Scenario Debug Info</span>
          <Badge variant={isInScenarioMode ? 'default' : 'secondary'}>
            {isInScenarioMode ? 'Scenario Mode' : 'Live Mode'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <span className="font-medium">Teams:</span> {teams.length}
          </div>
          <div>
            <span className="font-medium">People:</span> {people.length}
          </div>
          <div>
            <span className="font-medium">Projects:</span> {projects.length}
          </div>
        </div>

        {isInScenarioMode && activeScenario && (
          <div className="mt-2 pt-2 border-t">
            <div className="text-blue-600 dark:text-blue-400">
              <strong>Active Scenario:</strong> {activeScenario.name}
            </div>
            <div className="text-xs text-muted-foreground">
              Created: {new Date(activeScenario.createdDate).toLocaleString()}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-2">
          {isInScenarioMode
            ? "Data shown above is from the active scenario - changes won't affect live data"
            : 'Data shown above is live - changes will be saved permanently'}
        </div>
      </CardContent>
    </Card>
  );
};
