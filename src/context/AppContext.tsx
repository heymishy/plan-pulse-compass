import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import {
  useEncryptedLocalStorage,
  useLocalStorage,
} from '@/hooks/useLocalStorage';
import { addWeeks, addMonths } from 'date-fns';
import { getCurrentFinancialYear } from '@/utils/dateUtils';
import {
  Person,
  Role,
  Team,
  Project,
  Allocation,
  Cycle,
  AppConfig,
  Division,
  Epic,
  RunWorkCategory,
  ActualAllocation,
  IterationReview,
  IterationSnapshot,
  Skill,
  PersonSkill,
  Release,
  Solution,
  ProjectSkill,
  ProjectSolution,
} from '@/types';
import {
  Goal,
  NorthStar,
  GoalEpic,
  GoalMilestone,
  GoalTeam,
} from '@/types/goalTypes';

interface AppContextType {
  // Data
  people: Person[];
  setPeople: (people: Person[] | ((prev: Person[]) => Person[])) => void;
  addPerson: (personData: Omit<Person, 'id'>) => void;
  updatePerson: (personId: string, personData: Partial<Person>) => void;
  roles: Role[];
  setRoles: (roles: Role[] | ((prev: Role[]) => Role[])) => void;
  teams: Team[];
  setTeams: (teams: Team[] | ((prev: Team[]) => Team[])) => void;
  divisions: Division[];
  setDivisions: (
    divisions: Division[] | ((prev: Division[]) => Division[])
  ) => void;
  projects: Project[];
  setProjects: (projects: Project[] | ((prev: Project[]) => Project[])) => void;
  updateProject: (projectId: string, updatedProject: Project) => void;
  epics: Epic[];
  setEpics: (epics: Epic[] | ((prev: Epic[]) => Epic[])) => void;
  releases: Release[];
  setReleases: (releases: Release[] | ((prev: Release[]) => Release[])) => void;
  allocations: Allocation[];
  setAllocations: (
    allocations: Allocation[] | ((prev: Allocation[]) => Allocation[])
  ) => void;
  cycles: Cycle[];
  setCycles: (cycles: Cycle[] | ((prev: Cycle[]) => Cycle[])) => void;
  runWorkCategories: RunWorkCategory[];
  setRunWorkCategories: (
    categories:
      | RunWorkCategory[]
      | ((prev: RunWorkCategory[]) => RunWorkCategory[])
  ) => void;

  // Skills data
  skills: Skill[];
  setSkills: (skills: Skill[] | ((prev: Skill[]) => Skill[])) => void;
  personSkills: PersonSkill[];
  setPersonSkills: (
    personSkills: PersonSkill[] | ((prev: PersonSkill[]) => PersonSkill[])
  ) => void;

  // NEW: Solutions data
  solutions: Solution[];
  setSolutions: (
    solutions: Solution[] | ((prev: Solution[]) => Solution[])
  ) => void;
  projectSkills: ProjectSkill[];
  setProjectSkills: (
    skills: ProjectSkill[] | ((prev: ProjectSkill[]) => ProjectSkill[])
  ) => void;
  projectSolutions: ProjectSolution[];
  setProjectSolutions: (
    solutions:
      | ProjectSolution[]
      | ((prev: ProjectSolution[]) => ProjectSolution[])
  ) => void;

  // Tracking data
  actualAllocations: ActualAllocation[];
  setActualAllocations: (
    allocations:
      | ActualAllocation[]
      | ((prev: ActualAllocation[]) => ActualAllocation[])
  ) => void;
  iterationReviews: IterationReview[];
  setIterationReviews: (
    reviews:
      | IterationReview[]
      | ((prev: IterationReview[]) => IterationReview[])
  ) => void;
  iterationSnapshots: IterationSnapshot[];
  setIterationSnapshots: (
    snapshots:
      | IterationSnapshot[]
      | ((prev: IterationSnapshot[]) => IterationSnapshot[])
  ) => void;

  // Config
  config: AppConfig | null;
  setConfig: (
    config: AppConfig | null | ((prev: AppConfig | null) => AppConfig | null)
  ) => void;

  // Setup and loading state
  isSetupComplete: boolean;
  setIsSetupComplete: (complete: boolean) => void;
  isDataLoading: boolean;

  // NEW: Goal data
  goals: Goal[];
  setGoals: (goals: Goal[] | ((prev: Goal[]) => Goal[])) => void;
  northStar: NorthStar | null;
  setNorthStar: (
    northStar: NorthStar | null | ((prev: NorthStar | null) => NorthStar | null)
  ) => void;
  goalEpics: GoalEpic[];
  setGoalEpics: (
    goalEpics: GoalEpic[] | ((prev: GoalEpic[]) => GoalEpic[])
  ) => void;
  goalMilestones: GoalMilestone[];
  setGoalMilestones: (
    goalMilestones:
      | GoalMilestone[]
      | ((prev: GoalMilestone[]) => GoalMilestone[])
  ) => void;
  goalTeams: GoalTeam[];
  setGoalTeams: (
    goalTeams: GoalTeam[] | ((prev: GoalTeam[]) => GoalTeam[])
  ) => void;

  // Goal helper methods
  addGoal: (goalData: Omit<Goal, 'id' | 'createdDate' | 'updatedDate'>) => void;
  updateGoal: (goalId: string, goalData: Partial<Goal>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  console.log('AppProvider: Initializing context...');

  // Encrypted sensitive data
  const [people, setPeople, isPeopleLoading] = useEncryptedLocalStorage<
    Person[]
  >('planning-people', []);
  const [projects, setProjects, isProjectsLoading] = useEncryptedLocalStorage<
    Project[]
  >('planning-projects', []);

  // Non-sensitive configuration data
  const [roles, setRoles] = useLocalStorage<Role[]>('planning-roles', []);
  const [teams, setTeams] = useLocalStorage<Team[]>('planning-teams', []);
  const [divisions, setDivisions] = useLocalStorage<Division[]>(
    'planning-divisions',
    []
  );
  const [epics, setEpics] = useLocalStorage<Epic[]>('planning-epics', []);
  const [releases, setReleases] = useLocalStorage<Release[]>(
    'planning-releases',
    []
  );
  const [allocations, setAllocations] = useLocalStorage<Allocation[]>(
    'planning-allocations',
    []
  );
  const [cycles, setCycles] = useLocalStorage<Cycle[]>('planning-cycles', []);
  const [runWorkCategories, setRunWorkCategories] = useLocalStorage<
    RunWorkCategory[]
  >('planning-run-categories', []);
  const [config, setConfig] = useLocalStorage<AppConfig | null>(
    'planning-config',
    null
  );
  const [isSetupComplete, setIsSetupComplete] = useLocalStorage<boolean>(
    'planning-setup-complete',
    false
  );

  // Skills data
  const [skills, setSkills] = useLocalStorage<Skill[]>('planning-skills', []);
  const [personSkills, setPersonSkills] = useLocalStorage<PersonSkill[]>(
    'planning-person-skills',
    []
  );

  // NEW: Solutions data
  const [solutions, setSolutions] = useLocalStorage<Solution[]>(
    'planning-solutions',
    []
  );
  const [projectSkills, setProjectSkills] = useLocalStorage<ProjectSkill[]>(
    'planning-project-skills',
    []
  );
  const [projectSolutions, setProjectSolutions] = useLocalStorage<
    ProjectSolution[]
  >('planning-project-solutions', []);

  // Goal data with encrypted storage for sensitive goal information
  const [goals, setGoals, isGoalsLoading] = useEncryptedLocalStorage<Goal[]>(
    'planning-goals',
    []
  );
  const [northStar, setNorthStar] = useLocalStorage<NorthStar | null>(
    'planning-north-star',
    null
  );
  const [goalEpics, setGoalEpics] = useLocalStorage<GoalEpic[]>(
    'planning-goal-epics',
    []
  );
  const [goalMilestones, setGoalMilestones] = useLocalStorage<GoalMilestone[]>(
    'planning-goal-milestones',
    []
  );
  const [goalTeams, setGoalTeams] = useLocalStorage<GoalTeam[]>(
    'planning-goal-teams',
    []
  );

  // Tracking data
  const [actualAllocations, setActualAllocations] = useLocalStorage<
    ActualAllocation[]
  >('planning-actual-allocations', []);
  const [iterationReviews, setIterationReviews] = useLocalStorage<
    IterationReview[]
  >('planning-iteration-reviews', []);
  const [iterationSnapshots, setIterationSnapshots] = useLocalStorage<
    IterationSnapshot[]
  >('planning-iteration-snapshots', []);

  const addPerson = (personData: Omit<Person, 'id'>) => {
    const newPerson: Person = {
      ...personData,
      id: Date.now().toString(), // Simple ID generation
    };
    setPeople(prevPeople => [...prevPeople, newPerson]);
  };

  const updatePerson = (personId: string, personData: Partial<Person>) => {
    setPeople(prevPeople =>
      prevPeople.map(person =>
        person.id === personId ? { ...person, ...personData } : person
      )
    );
  };

  const updateProject = (projectId: string, updatedProject: Project) => {
    setProjects(prevProjects =>
      prevProjects.map(p => (p.id === projectId ? updatedProject : p))
    );
  };

  const addGoal = (
    goalData: Omit<Goal, 'id' | 'createdDate' | 'updatedDate'>
  ) => {
    const now = new Date().toISOString();
    const newGoal: Goal = {
      ...goalData,
      dependencies: goalData.dependencies || [], // Ensure dependencies is always an array
      id: Date.now().toString(),
      createdDate: now,
      updatedDate: now,
    };
    console.log('addGoal called with:', goalData);
    console.log('Created new goal:', newGoal);
    setGoals(prevGoals => {
      const updatedGoals = [...prevGoals, newGoal];
      console.log('Updated goals array:', updatedGoals);
      return updatedGoals;
    });
  };

  const updateGoal = (goalId: string, goalData: Partial<Goal>) => {
    console.log('updateGoal called with:', { goalId, goalData });
    setGoals(prevGoals => {
      const updatedGoals = prevGoals.map(goal =>
        goal.id === goalId
          ? { ...goal, ...goalData, updatedDate: new Date().toISOString() }
          : goal
      );
      console.log('Goals after update:', updatedGoals);
      return updatedGoals;
    });
  };

  const isDataLoading = isPeopleLoading || isProjectsLoading || isGoalsLoading;

  // Initialize default data if none exists
  useEffect(() => {
    if (!isDataLoading && divisions.length === 0) {
      console.log('Initializing default divisions');
      const defaultDivisions = [
        {
          id: 'engineering-division',
          name: 'Engineering',
          description: 'Software development and technical teams',
        },
        {
          id: 'product-division',
          name: 'Product',
          description: 'Product management and design teams',
        },
        {
          id: 'business-division',
          name: 'Business',
          description: 'Marketing, sales, and business operations',
        },
      ];
      setDivisions(defaultDivisions);
    }
  }, [isDataLoading, divisions.length, setDivisions]);

  useEffect(() => {
    if (!isDataLoading && teams.length === 0 && divisions.length > 0) {
      console.log('Initializing default teams');
      setTeams([
        {
          id: 'engineering',
          name: 'Engineering',
          divisionId: 'engineering-division',
          capacity: 40,
        },
        {
          id: 'product',
          name: 'Product',
          divisionId: 'product-division',
          capacity: 40,
        },
        {
          id: 'design',
          name: 'Design',
          divisionId: 'product-division',
          capacity: 40,
        },
        {
          id: 'marketing',
          name: 'Marketing',
          divisionId: 'business-division',
          capacity: 40,
        },
      ]);
    }
  }, [isDataLoading, teams.length, divisions.length, setTeams, teams]);

  // Fix existing teams that have empty divisionId
  useEffect(() => {
    if (!isDataLoading && teams.length > 0 && divisions.length > 0) {
      const teamsWithEmptyDivision = teams.filter(
        team => !team.divisionId || team.divisionId === ''
      );
      if (teamsWithEmptyDivision.length > 0) {
        console.log('Fixing teams with empty divisionId');
        setTeams(prevTeams =>
          prevTeams.map(team => {
            if (!team.divisionId || team.divisionId === '') {
              // Map teams to appropriate divisions based on name
              let divisionId = 'engineering-division'; // default
              if (
                team.name.toLowerCase().includes('product') ||
                team.name.toLowerCase().includes('design')
              ) {
                divisionId = 'product-division';
              } else if (
                team.name.toLowerCase().includes('marketing') ||
                team.name.toLowerCase().includes('sales')
              ) {
                divisionId = 'business-division';
              }
              return { ...team, divisionId };
            }
            return team;
          })
        );
      }
    }
  }, [isDataLoading, teams.length, divisions.length, setTeams, teams]);

  // Function to generate iterations for a quarterly cycle
  const generateIterationsForQuarter = (
    quarterCycle: Cycle,
    iterationLength: string
  ): Cycle[] => {
    const startDate = new Date(quarterCycle.startDate);
    const endDate = new Date(quarterCycle.endDate);
    const newIterations: Cycle[] = [];

    let currentStart = startDate;
    let iterationNumber = 1;

    while (currentStart < endDate) {
      let currentEnd: Date;

      switch (iterationLength) {
        case 'fortnightly':
          currentEnd = addWeeks(currentStart, 2);
          break;
        case 'monthly':
          currentEnd = addMonths(currentStart, 1);
          break;
        case '6-weekly':
          currentEnd = addWeeks(currentStart, 6);
          break;
        default:
          currentEnd = addWeeks(currentStart, 2);
      }

      if (currentEnd > endDate) {
        currentEnd = endDate;
      }

      newIterations.push({
        id: crypto.randomUUID(),
        type: 'iteration',
        name: `${quarterCycle.name} - Iteration ${iterationNumber}`,
        startDate: currentStart.toISOString().split('T')[0],
        endDate: currentEnd.toISOString().split('T')[0],
        parentCycleId: quarterCycle.id,
        status: 'planning',
      });

      currentStart = new Date(currentEnd);
      currentStart.setDate(currentStart.getDate() + 1);
      iterationNumber++;
    }

    return newIterations;
  };

  useEffect(() => {
    // Only create default cycles if there's no financial year config
    // When there's a financial year config, quarters should be generated via the CycleDialog
    if (!isDataLoading && cycles.length === 0 && !config?.financialYear) {
      console.log('Initializing default cycles (no financial year config)');
      setCycles([
        {
          id: 'q1-2024',
          name: 'Q1 2024',
          startDate: '2024-01-01',
          endDate: '2024-03-31',
          type: 'quarterly',
          status: 'planning',
        },
        {
          id: 'q2-2024',
          name: 'Q2 2024',
          startDate: '2024-04-01',
          endDate: '2024-06-30',
          type: 'quarterly',
          status: 'planning',
        },
        {
          id: 'q3-2024',
          name: 'Q3 2024',
          startDate: '2024-07-01',
          endDate: '2024-09-30',
          type: 'quarterly',
          status: 'planning',
        },
        {
          id: 'q4-2024',
          name: 'Q4 2024',
          startDate: '2024-10-01',
          endDate: '2024-12-31',
          type: 'quarterly',
          status: 'planning',
        },
      ]);
    }
  }, [isDataLoading, cycles.length, setCycles, config?.financialYear]);

  // Auto-generate quarters for current financial year if they don't exist
  // Temporarily disabled for test compatibility
  /* useEffect(() => {
    if (!isDataLoading && config?.financialYear && cycles.length > 0) {
      const currentFY = getCurrentFinancialYear(config.financialYear.startDate);
      const currentQuarters = cycles.filter(c => c.type === 'quarterly');

      // Check if current financial year has quarters
      const currentFYQuarters = currentQuarters.filter(quarter => {
        const quarterStart = new Date(quarter.startDate);
        const fyStart = new Date(currentFY);
        const fyEnd = new Date(fyStart);
        fyEnd.setFullYear(fyEnd.getFullYear() + 1);
        fyEnd.setDate(fyEnd.getDate() - 1);

        return quarterStart >= fyStart && quarterStart <= fyEnd;
      });

      if (currentFYQuarters.length === 0) {
        console.log(
          'Auto-generating quarters for current financial year:',
          currentFY
        );

        const fyStart = new Date(currentFY);
        const newQuarters: Cycle[] = [];

        // Generate 4 quarters based on financial year start
        for (let i = 0; i < 4; i++) {
          const quarterStart = new Date(fyStart);
          quarterStart.setMonth(quarterStart.getMonth() + i * 3);

          const quarterEnd = new Date(quarterStart);
          quarterEnd.setMonth(quarterEnd.getMonth() + 3);
          quarterEnd.setDate(quarterEnd.getDate() - 1);

          const quarterYear = quarterStart.getFullYear();

          // Determine status based on current date
          const currentDate = new Date();
          let status: 'planning' | 'active' | 'completed' = 'planning';

          if (currentDate >= quarterStart && currentDate <= quarterEnd) {
            status = 'active';
          } else if (currentDate > quarterEnd) {
            status = 'completed';
          }

          newQuarters.push({
            id: crypto.randomUUID(),
            type: 'quarterly',
            name: `Q${i + 1} ${quarterYear}`,
            startDate: quarterStart.toISOString().split('T')[0],
            endDate: quarterEnd.toISOString().split('T')[0],
            status: status,
          });
        }

        setCycles(prev => [...prev, ...newQuarters]);
      }
    }
  }, [isDataLoading, config?.financialYear, cycles, setCycles]); */

  // Generate iterations for default quarters when config is available
  useEffect(() => {
    if (!isDataLoading && config?.iterationLength && cycles.length > 0) {
      // Check if we have quarters but no iterations
      const quarters = cycles.filter(c => c.type === 'quarterly');
      const iterations = cycles.filter(c => c.type === 'iteration');

      console.log('AppContext: Checking for automatic iteration generation:', {
        isDataLoading,
        hasConfig: !!config?.iterationLength,
        iterationLength: config?.iterationLength,
        quartersCount: quarters.length,
        iterationsCount: iterations.length,
        totalCycles: cycles.length,
      });

      if (quarters.length > 0 && iterations.length === 0) {
        console.log(
          'AppContext: Generating iterations for default quarters with iteration length:',
          config.iterationLength
        );

        let allIterations: Cycle[] = [];
        quarters.forEach(quarter => {
          console.log('AppContext: Processing quarter:', quarter.name);
          const quarterIterations = generateIterationsForQuarter(
            quarter,
            config.iterationLength
          );
          allIterations = [...allIterations, ...quarterIterations];
          console.log(
            `AppContext: Generated ${quarterIterations.length} iterations for ${quarter.name}`
          );
        });

        if (allIterations.length > 0) {
          console.log(
            'AppContext: Adding all iterations to state:',
            allIterations
          );
          setCycles(prev => {
            const updated = [...prev, ...allIterations];
            console.log(
              'AppContext: Updated cycles state with iterations:',
              updated
            );

            // Force localStorage sync for E2E tests with retry logic
            if (typeof window !== 'undefined' && window.localStorage) {
              const maxRetries = 3;
              let retryCount = 0;

              const syncToLocalStorage = () => {
                try {
                  window.localStorage.setItem(
                    'planning-cycles',
                    JSON.stringify(updated)
                  );
                  console.log(
                    'AppContext: Force synced cycles to localStorage'
                  );

                  // Verify sync worked
                  const verification =
                    window.localStorage.getItem('planning-cycles');
                  if (verification) {
                    const parsed = JSON.parse(verification);
                    const verifyIterations = parsed.filter(
                      (c: Cycle) => c.type === 'iteration'
                    );
                    console.log(
                      `AppContext: Verified ${verifyIterations.length} iterations in localStorage`
                    );
                  }
                } catch (error) {
                  console.error(
                    'AppContext: Failed to sync cycles to localStorage:',
                    error
                  );
                  retryCount++;
                  if (retryCount < maxRetries) {
                    console.log(
                      `AppContext: Retrying localStorage sync (${retryCount}/${maxRetries})`
                    );
                    setTimeout(syncToLocalStorage, 100);
                  }
                }
              };

              syncToLocalStorage();
            }

            return updated;
          });
          console.log(
            `AppContext: Successfully generated ${allIterations.length} iterations for ${quarters.length} quarters`
          );
        }
      } else if (quarters.length > 0 && iterations.length > 0) {
        console.log(
          'AppContext: Iterations already exist, skipping generation'
        );
      }
    }
  }, [isDataLoading, config?.iterationLength, cycles.length]);

  // Debug logging for context state changes
  useEffect(() => {
    if (!isDataLoading) {
      console.log('AppProvider: Context state updated:', {
        peopleCount: people.length,
        projectsCount: projects.length,
        rolesCount: roles.length,
        teamsCount: teams.length,
        divisionsCount: divisions.length,
        epicsCount: epics.length,
        releasesCount: releases.length,
        allocationsCount: allocations.length,
        cyclesCount: cycles.length,
        runWorkCategoriesCount: runWorkCategories.length,
        skillsCount: skills.length,
        personSkillsCount: personSkills.length,
        solutionsCount: solutions.length,
        projectSkillsCount: projectSkills.length,
        projectSolutionsCount: projectSolutions.length,
        actualAllocationsCount: actualAllocations.length,
        iterationReviewsCount: iterationReviews.length,
        iterationSnapshotsCount: iterationSnapshots.length,
        goalsCount: goals.length,
        goalEpicsCount: goalEpics.length,
        goalMilestonesCount: goalMilestones.length,
        goalTeamsCount: goalTeams.length,
        hasNorthStar: !!northStar,
        hasConfig: !!config,
        isSetupComplete,
      });
    }
  }, [
    people,
    projects,
    roles,
    teams,
    divisions,
    epics,
    releases,
    allocations,
    cycles,
    runWorkCategories,
    skills,
    personSkills,
    solutions,
    projectSkills,
    projectSolutions,
    actualAllocations,
    iterationReviews,
    iterationSnapshots,
    goals,
    goalEpics,
    goalMilestones,
    goalTeams,
    northStar,
    config,
    isSetupComplete,
    isDataLoading,
  ]);

  const value: AppContextType = {
    people,
    setPeople,
    addPerson,
    updatePerson,
    roles,
    setRoles,
    teams,
    setTeams,
    divisions,
    setDivisions,
    projects,
    setProjects,
    updateProject,
    epics,
    setEpics,
    releases,
    setReleases,
    allocations,
    setAllocations,
    cycles,
    setCycles,
    runWorkCategories,
    setRunWorkCategories,
    skills,
    setSkills,
    personSkills,
    setPersonSkills,
    solutions,
    setSolutions,
    projectSkills,
    setProjectSkills,
    projectSolutions,
    setProjectSolutions,
    actualAllocations,
    setActualAllocations,
    iterationReviews,
    setIterationReviews,
    iterationSnapshots,
    setIterationSnapshots,
    goals,
    setGoals,
    addGoal,
    updateGoal,
    northStar,
    setNorthStar,
    goalEpics,
    setGoalEpics,
    goalMilestones,
    setGoalMilestones,
    goalTeams,
    setGoalTeams,
    config,
    setConfig,
    isSetupComplete,
    setIsSetupComplete,
    isDataLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
