/**
 * Test wrapper components providing all necessary contexts for testing
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeamProvider } from '@/context/TeamContext';
import { ProjectProvider } from '@/context/ProjectContext';
import { PlanningProvider } from '@/context/PlanningContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { GoalProvider } from '@/context/GoalContext';
import { ScenarioProvider } from '@/context/ScenarioContext';
import type {
  Person,
  Team,
  Project,
  Solution,
  Skill,
  PersonSkill,
  ProjectSkill,
  ProjectSolution,
  Division,
  Role,
  TeamMember,
  Allocation,
  Cycle,
  RunWorkCategory,
  ActualAllocation,
  IterationReview,
  IterationSnapshot,
  Epic,
  Release,
  UnmappedPerson,
  Milestone,
  DivisionLeadershipRole,
  AppConfig,
} from '@/types';
import {
  Goal,
  NorthStar,
  GoalEpic,
  GoalMilestone,
  GoalTeam,
} from '@/types/goalTypes';

interface TestProvidersProps {
  children: React.ReactNode;
  initialData?: {
    people?: Person[];
    teams?: Team[];
    projects?: Project[];
    solutions?: Solution[];
    skills?: Skill[];
    personSkills?: PersonSkill[];
    projectSkills?: ProjectSkill[];
    projectSolutions?: ProjectSolution[];
    allocations?: Allocation[];
    cycles?: Cycle[];
    goals?: Goal[];
  };
}

export const TestProviders: React.FC<TestProvidersProps> = ({
  children,
  initialData = {},
}) => {
  // Create a new QueryClient instance for each test to avoid conflicts
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ScenarioProvider>
        <SettingsProvider>
          <TeamProvider
            initialData={{
              people: initialData.people || [],
              teams: initialData.teams || [],
              roles: [],
              divisions: [],
              teamMembers: [],
              unmappedPeople: [],
              divisionLeadershipRoles: [],
            }}
          >
            <ProjectProvider
              initialData={{
                projects: initialData.projects || [],
                epics: [],
                releases: [],
                solutions: initialData.solutions || [],
                projectSkills: initialData.projectSkills || [],
                projectSolutions: initialData.projectSolutions || [],
                milestones: [],
              }}
            >
              <PlanningProvider
                initialData={{
                  allocations: initialData.allocations || [],
                  cycles: initialData.cycles || [],
                  runWorkCategories: [],
                  actualAllocations: [],
                  iterationReviews: [],
                  iterationSnapshots: [],
                }}
              >
                <GoalProvider
                  initialData={{
                    goals: initialData.goals || [],
                    northStars: [],
                    goalEpics: [],
                    goalMilestones: [],
                    goalTeams: [],
                  }}
                >
                  {children}
                </GoalProvider>
              </PlanningProvider>
            </ProjectProvider>
          </TeamProvider>
        </SettingsProvider>
      </ScenarioProvider>
    </QueryClientProvider>
  );
};

export default TestProviders;
