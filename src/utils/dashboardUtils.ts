import {
  Cycle,
  Allocation,
  ActualAllocation,
  IterationReview,
  Project,
  Epic,
} from "@/types";
import { isWithinInterval, parseISO, startOfToday, isBefore } from "date-fns";

/**
 * Finds the currently active cycle for a given type (e.g., 'quarterly').
 * @param cycles - Array of all cycles.
 * @param type - The type of cycle to find.
 * @returns The current cycle or undefined if not found.
 */
export const findCurrentCycle = (
  cycles: Cycle[],
  type: "quarterly"
): Cycle | undefined => {
  if (!cycles || cycles.length === 0) {
    return undefined;
  }
  const today = startOfToday();
  return cycles
    .filter((c) => c.type === type && c.status === "active")
    .find((c) =>
      isWithinInterval(today, {
        start: parseISO(c.startDate),
        end: parseISO(c.endDate),
      })
    );
};

/**
 * Finds the current iteration. It prioritizes an active iteration within the current quarter.
 * If none is active, it falls back to the most recently started iteration.
 * @param cycles - Array of all cycles.
 * @param currentQuarter - The currently active quarter.
 * @returns The current iteration cycle or undefined.
 */
export const getCurrentIteration = (
  cycles: Cycle[],
  currentQuarter?: Cycle
): Cycle | undefined => {
  if (!cycles || cycles.length === 0) {
    return undefined;
  }
  const today = startOfToday();
  // Prefer iterations from the current quarter if available
  const sourceCycles = currentQuarter
    ? cycles.filter(
        (c) => c.type === "iteration" && c.parentCycleId === currentQuarter.id
      )
    : cycles.filter((c) => c.type === "iteration");

  const iterations = sourceCycles.sort(
    (a, b) => parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime()
  );

  // Find an iteration that is currently active.
  const activeIteration = iterations.find((c) =>
    isWithinInterval(today, {
      start: parseISO(c.startDate),
      end: parseISO(c.endDate),
    })
  );
  if (activeIteration) return activeIteration;

  // Fallback: find the most recent one that has already started.
  const mostRecentStarted = iterations.find(
    (c) =>
      isBefore(parseISO(c.startDate), today) ||
      parseISO(c.startDate).getTime() === today.getTime()
  );
  return mostRecentStarted;
};

// A helper to extract the iteration number from its name, e.g., "Iteration 1" -> 1
// NOTE: This relies on a naming convention and could be fragile.
const getIterationNumberFromName = (name: string): number | null => {
  const match = name.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
};

export interface DashboardData {
  currentQuarter?: Cycle;
  currentIteration?: Cycle;
  iterationMetrics: {
    planned: number;
    actual: number;
  };
  quarterlyProgress: {
    epics: { completed: number; total: number; percentage: number };
    milestones: { completed: number; total: number; percentage: number };
  };
  attentionItems: {
    atRiskMilestones: number;
    openRisks: number;
  };
}

/**
 * Computes all necessary data for the main dashboard.
 * @returns A consolidated object of dashboard metrics.
 */
export const getDashboardData = (
  cycles: Cycle[],
  allocations: Allocation[],
  actualAllocations: ActualAllocation[],
  iterationReviews: IterationReview[],
  projects: Project[],
  epics: Epic[]
): DashboardData => {
  const currentQuarter = findCurrentCycle(cycles, "quarterly");
  const currentIteration = getCurrentIteration(cycles, currentQuarter);

  // 1. Iteration Metrics (Planned vs Actual)
  let iterationMetrics = { planned: 0, actual: 0 };
  const iterationNumber = currentIteration
    ? getIterationNumberFromName(currentIteration.name)
    : null;

  if (currentQuarter && iterationNumber !== null) {
    const planned = allocations
      .filter(
        (a) =>
          a.cycleId === currentQuarter.id &&
          a.iterationNumber === iterationNumber
      )
      .reduce((sum, a) => sum + a.percentage, 0);

    const actual = actualAllocations
      .filter(
        (a) =>
          a.cycleId === currentQuarter.id &&
          a.iterationNumber === iterationNumber
      )
      .reduce((sum, a) => sum + a.actualPercentage, 0);

    iterationMetrics = { planned, actual };
  }

  // 2. Quarterly Progress (Epics & Milestones)
  let quarterlyProgress = {
    epics: { completed: 0, total: 0, percentage: 0 },
    milestones: { completed: 0, total: 0, percentage: 0 },
  };
  if (currentQuarter) {
    const quarterIterations = cycles.filter(
      (c) => c.parentCycleId === currentQuarter.id && c.type === "iteration"
    );
    const quarterIterationNumbers = quarterIterations
      .map((i) => getIterationNumberFromName(i.name))
      .filter((n) => n !== null) as number[];

    // Epics progress
    const epicsInQuarter = new Set(
      allocations
        .filter(
          (a) =>
            a.cycleId === currentQuarter.id &&
            quarterIterationNumbers.includes(a.iterationNumber) &&
            a.epicId
        )
        .map((a) => a.epicId!)
    );
    const completedEpicsInQuarter = new Set(
      iterationReviews
        .filter(
          (r) =>
            r.cycleId === currentQuarter.id &&
            quarterIterationNumbers.includes(r.iterationNumber)
        )
        .flatMap((r) => r.completedEpics)
    );

    // Milestones progress
    const milestonesInQuarter = projects
      .flatMap((p) => p.milestones)
      .filter((m) =>
        isWithinInterval(parseISO(m.dueDate), {
          start: parseISO(currentQuarter.startDate),
          end: parseISO(currentQuarter.endDate),
        })
      );
    const completedMilestonesInQuarter = new Set(
      iterationReviews
        .filter(
          (r) =>
            r.cycleId === currentQuarter.id &&
            quarterIterationNumbers.includes(r.iterationNumber)
        )
        .flatMap((r) => r.completedMilestones)
    );

    const epicTotal = epicsInQuarter.size;
    const epicCompleted = completedEpicsInQuarter.size;
    const milestoneTotal = milestonesInQuarter.length;
    const milestoneCompleted = completedMilestonesInQuarter.size;

    quarterlyProgress = {
      epics: {
        total: epicTotal,
        completed: epicCompleted,
        percentage: epicTotal > 0 ? (epicCompleted / epicTotal) * 100 : 0,
      },
      milestones: {
        total: milestoneTotal,
        completed: milestoneCompleted,
        percentage:
          milestoneTotal > 0 ? (milestoneCompleted / milestoneTotal) * 100 : 0,
      },
    };
  }

  // 3. Attention Items
  const atRiskMilestones = projects
    .flatMap((p) => p.milestones)
    .filter((m) => m.status === "at-risk").length;

  const openRisks = projects
    .flatMap((p) => p.risks || [])
    .filter((r) => r.status === "open").length;

  return {
    currentQuarter,
    currentIteration,
    iterationMetrics,
    quarterlyProgress,
    attentionItems: { atRiskMilestones, openRisks },
  };
};
