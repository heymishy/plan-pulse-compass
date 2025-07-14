import React, { createContext, useContext, ReactNode } from 'react';
import {
  useEncryptedLocalStorage,
  useLocalStorage,
} from '@/hooks/useLocalStorage';
import {
  Goal,
  NorthStar,
  GoalEpic,
  GoalMilestone,
  GoalTeam,
} from '@/types/goalTypes';

interface GoalContextType {
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
  addGoal: (goalData: Omit<Goal, 'id' | 'createdDate' | 'updatedDate'>) => void;
  updateGoal: (goalId: string, goalData: Partial<Goal>) => void;
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);

export const useGoals = () => {
  const context = useContext(GoalContext);
  if (context === undefined) {
    throw new Error('useGoals must be used within a GoalProvider');
  }
  return context;
};

export const GoalProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [goals, setGoals] = useEncryptedLocalStorage<Goal[]>(
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

  const addGoal = (
    goalData: Omit<Goal, 'id' | 'createdDate' | 'updatedDate'>
  ) => {
    const now = new Date().toISOString();
    const newGoal: Goal = {
      ...goalData,
      dependencies: goalData.dependencies || [],
      id: crypto.randomUUID(),
      createdDate: now,
      updatedDate: now,
    };
    setGoals(prevGoals => [...prevGoals, newGoal]);
  };

  const updateGoal = (goalId: string, goalData: Partial<Goal>) => {
    setGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === goalId
          ? { ...goal, ...goalData, updatedDate: new Date().toISOString() }
          : goal
      )
    );
  };

  const value: GoalContextType = {
    goals,
    setGoals,
    northStar,
    setNorthStar,
    goalEpics,
    setGoalEpics,
    goalMilestones,
    setGoalMilestones,
    goalTeams,
    setGoalTeams,
    addGoal,
    updateGoal,
  };

  return <GoalContext.Provider value={value}>{children}</GoalContext.Provider>;
};
