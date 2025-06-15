
import React from 'react';
import { useApp } from '@/context/AppContext';
import FinancialsHeader from '@/components/financials/FinancialsHeader';
import ProjectFinancialsTable from '@/components/financials/ProjectFinancialsTable';
import TeamFinancialsTable from '@/components/financials/TeamFinancialsTable';
import { Skeleton } from '@/components/ui/skeleton';

const Financials = () => {
    const { projects, epics, allocations, cycles, people, roles, teams, config, isSetupComplete } = useApp();

    const isLoading = !isSetupComplete || !config;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
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
                            appData={{ epics, allocations, cycles, people, roles, teams, config }}
                        />
                        <TeamFinancialsTable
                            teams={teams}
                            people={people}
                            roles={roles}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default Financials;
