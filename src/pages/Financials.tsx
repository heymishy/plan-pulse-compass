import React from 'react';
import { useApp } from '@/context/AppContext';
import FinancialsHeader from '@/components/financials/FinancialsHeader';
import ProjectFinancialsTable from '@/components/financials/ProjectFinancialsTable';
import TeamFinancialsTable from '@/components/financials/TeamFinancialsTable';
import { Skeleton } from '@/components/ui/skeleton';

const Financials = () => {
  const {
    projects,
    epics,
    allocations,
    cycles,
    people,
    roles,
    teams,
    config,
    isSetupComplete,
    isDataLoading,
  } = useApp();

  const isLoading = !isSetupComplete || !config || isDataLoading;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div
        className="flex-1 p-6 space-y-6 w-full overflow-auto"
        data-testid="financials-content"
      >
        <FinancialsHeader />
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-1/4" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : (
            <>
              <ProjectFinancialsTable
                projects={projects}
                appData={{
                  epics,
                  allocations,
                  cycles,
                  people,
                  roles,
                  teams,
                  config,
                }}
              />
              <TeamFinancialsTable
                teams={teams}
                people={people}
                roles={roles}
                config={config}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Financials;
