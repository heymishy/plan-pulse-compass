import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
} from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  Allocation,
  Cycle,
  RunWorkCategory,
  ActualAllocation,
  IterationReview,
  IterationSnapshot,
} from '@/types';

interface PlanningContextType {
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
}

const PlanningContext = createContext<PlanningContextType | undefined>(
  undefined
);

export const usePlanning = () => {
  const context = useContext(PlanningContext);
  if (context === undefined) {
    throw new Error('usePlanning must be used within a PlanningProvider');
  }
  return context;
};

export const PlanningProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [allocations, setAllocationsRaw] = useLocalStorage<Allocation[]>(
    'planning-allocations',
    []
  );

  // Wrap setAllocations with debug logging
  const setAllocations = useCallback(
    (newAllocations: Allocation[] | ((prev: Allocation[]) => Allocation[])) => {
      console.log('🔥 [PLANNING CONTEXT] setAllocations called');

      if (typeof newAllocations === 'function') {
        setAllocationsRaw(prev => {
          const updatedAllocations = newAllocations(prev);
          console.log(
            '🔥 [PLANNING CONTEXT] Functional update - before:',
            prev.length,
            'after:',
            updatedAllocations.length
          );

          // Log new allocations for team-037 specifically
          const team037Allocations = updatedAllocations.filter(
            a => a.teamId === 'team-037'
          );
          console.log(
            '🔥 [PLANNING CONTEXT] Team-037 allocations after update:',
            team037Allocations.length
          );

          return updatedAllocations;
        });
      } else {
        console.log(
          '🔥 [PLANNING CONTEXT] Direct update - new count:',
          newAllocations.length
        );
        setAllocationsRaw(newAllocations);
      }
    },
    [setAllocationsRaw]
  );
  const [cycles, setCycles] = useLocalStorage<Cycle[]>('planning-cycles', []);
  const [runWorkCategories, setRunWorkCategories] = useLocalStorage<
    RunWorkCategory[]
  >('planning-run-categories', []);
  const [actualAllocations, setActualAllocations] = useLocalStorage<
    ActualAllocation[]
  >('planning-actual-allocations', []);
  const [iterationReviews, setIterationReviews] = useLocalStorage<
    IterationReview[]
  >('planning-iteration-reviews', []);
  const [iterationSnapshots, setIterationSnapshots] = useLocalStorage<
    IterationSnapshot[]
  >('planning-iteration-snapshots', []);

  const value: PlanningContextType = {
    allocations,
    setAllocations,
    cycles,
    setCycles,
    runWorkCategories,
    setRunWorkCategories,
    actualAllocations,
    setActualAllocations,
    iterationReviews,
    setIterationReviews,
    iterationSnapshots,
    setIterationSnapshots,
  };

  return (
    <PlanningContext.Provider value={value}>
      {children}
    </PlanningContext.Provider>
  );
};
