import React, { createContext, useContext, ReactNode } from 'react';
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
  const [allocations, setAllocations] = useLocalStorage<Allocation[]>(
    'planning-allocations',
    []
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
