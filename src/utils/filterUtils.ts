import { Team, Project, Epic, Allocation, Cycle } from '@/types';
import { SearchFilters } from '@/components/planning/SearchAndFilter';
import { calculateTeamCapacity } from './capacityUtils';

export interface FilteredData {
  teams: Team[];
  projects: Project[];
  epics: Epic[];
  allocations: Allocation[];
}

export const applyFilters = (
  data: {
    teams: Team[];
    projects: Project[];
    epics: Epic[];
    allocations: Allocation[];
    iterations: Cycle[];
  },
  filters: SearchFilters,
  selectedCycleId: string
): FilteredData => {
  const {
    teams: initialTeams,
    projects: initialProjects,
    epics: initialEpics,
    allocations,
    iterations,
  } = data;
  let teams = initialTeams;
  let projects = initialProjects;
  let epics = initialEpics;

  // Filter allocations by selected cycle
  const relevantAllocations = allocations.filter(
    a => a.cycleId === selectedCycleId
  );

  // Apply search query
  if (filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase();

    teams = teams.filter(team => team.name.toLowerCase().includes(query));

    projects = projects.filter(
      project =>
        project.name.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query)
    );

    epics = epics.filter(
      epic =>
        epic.name.toLowerCase().includes(query) ||
        epic.description?.toLowerCase().includes(query)
    );

    // Filter allocations to only include those for matching teams/projects/epics
    const teamIds = new Set(teams.map(t => t.id));
    const epicIds = new Set(epics.map(e => e.id));

    allocations = relevantAllocations.filter(
      allocation =>
        teamIds.has(allocation.teamId) ||
        (allocation.epicId && epicIds.has(allocation.epicId))
    );
  } else {
    allocations = relevantAllocations;
  }

  // Apply division filter
  if (filters.selectedDivisionIds.length > 0) {
    teams = teams.filter(team =>
      filters.selectedDivisionIds.includes(team.divisionId)
    );
  }

  // Apply team filter
  if (filters.selectedTeamIds.length > 0) {
    teams = teams.filter(team => filters.selectedTeamIds.includes(team.id));
  }

  // Apply project filter
  if (filters.selectedProjectIds.length > 0) {
    projects = projects.filter(project =>
      filters.selectedProjectIds.includes(project.id)
    );

    // Filter epics to only include those from selected projects
    epics = epics.filter(epic =>
      filters.selectedProjectIds.includes(epic.projectId)
    );
  }

  // Apply epic filter
  if (filters.selectedEpicIds.length > 0) {
    epics = epics.filter(epic => filters.selectedEpicIds.includes(epic.id));

    // Filter allocations to only include those for selected epics
    allocations = allocations.filter(
      allocation =>
        !allocation.epicId ||
        filters.selectedEpicIds.includes(allocation.epicId)
    );
  }

  // Apply allocation status filter
  if (filters.allocationStatus !== 'all') {
    const teamIds = new Set(teams.map(t => t.id));
    const filteredTeamIds = new Set<string>();

    teams.forEach(team => {
      iterations.forEach((iteration, index) => {
        const iterationNumber = index + 1;
        const capacityCheck = calculateTeamCapacity(
          team,
          iterationNumber,
          allocations,
          iterations
        );

        const percentage = capacityCheck.allocatedPercentage;
        const shouldInclude = matchesAllocationStatus(
          percentage,
          filters.allocationStatus
        );

        if (shouldInclude) {
          filteredTeamIds.add(team.id);
        }
      });
    });

    teams = teams.filter(team => filteredTeamIds.has(team.id));
  }

  // Final cleanup - ensure all references are valid
  const finalTeamIds = new Set(teams.map(t => t.id));
  const finalProjectIds = new Set(projects.map(p => p.id));
  const finalEpicIds = new Set(epics.map(e => e.id));

  allocations = allocations.filter(
    allocation =>
      finalTeamIds.has(allocation.teamId) &&
      (!allocation.epicId || finalEpicIds.has(allocation.epicId))
  );

  epics = epics.filter(epic => finalProjectIds.has(epic.projectId));

  return {
    teams,
    projects,
    epics,
    allocations,
  };
};

const matchesAllocationStatus = (
  percentage: number,
  status: SearchFilters['allocationStatus']
): boolean => {
  switch (status) {
    case 'allocated':
      return percentage > 0;
    case 'unallocated':
      return percentage === 0;
    case 'overallocated':
      return percentage > 100;
    case 'optimal':
      return percentage >= 80 && percentage <= 100;
    default:
      return true;
  }
};

export const getDefaultFilterPresets = (): Array<{
  id: string;
  name: string;
  filters: SearchFilters;
  isDefault: boolean;
}> => [
  {
    id: 'overallocated-teams',
    name: 'Over-allocated Teams',
    filters: {
      searchQuery: '',
      selectedDivisionIds: [],
      selectedTeamIds: [],
      selectedProjectIds: [],
      selectedEpicIds: [],
      allocationStatus: 'overallocated',
      dateRange: 'current-quarter',
    },
    isDefault: true,
  },
  {
    id: 'unplanned-teams',
    name: 'Unplanned Teams',
    filters: {
      searchQuery: '',
      selectedDivisionIds: [],
      selectedTeamIds: [],
      selectedProjectIds: [],
      selectedEpicIds: [],
      allocationStatus: 'unallocated',
      dateRange: 'current-quarter',
    },
    isDefault: true,
  },
  {
    id: 'optimal-teams',
    name: 'Optimal Teams',
    filters: {
      searchQuery: '',
      selectedDivisionIds: [],
      selectedTeamIds: [],
      selectedProjectIds: [],
      selectedEpicIds: [],
      allocationStatus: 'optimal',
      dateRange: 'current-quarter',
    },
    isDefault: true,
  },
];

export const createFilterSummary = (filters: SearchFilters): string => {
  const parts: string[] = [];

  if (filters.searchQuery) {
    parts.push(`"${filters.searchQuery}"`);
  }

  if (filters.selectedDivisionIds.length > 0) {
    parts.push(
      `${filters.selectedDivisionIds.length} division${filters.selectedDivisionIds.length !== 1 ? 's' : ''}`
    );
  }

  if (filters.selectedTeamIds.length > 0) {
    parts.push(
      `${filters.selectedTeamIds.length} team${filters.selectedTeamIds.length !== 1 ? 's' : ''}`
    );
  }

  if (filters.selectedProjectIds.length > 0) {
    parts.push(
      `${filters.selectedProjectIds.length} project${filters.selectedProjectIds.length !== 1 ? 's' : ''}`
    );
  }

  if (filters.selectedEpicIds.length > 0) {
    parts.push(
      `${filters.selectedEpicIds.length} epic${filters.selectedEpicIds.length !== 1 ? 's' : ''}`
    );
  }

  if (filters.allocationStatus !== 'all') {
    parts.push(filters.allocationStatus);
  }

  if (filters.dateRange !== 'all') {
    parts.push(filters.dateRange.replace('-', ' '));
  }

  return parts.length > 0 ? parts.join(', ') : 'No filters applied';
};

export const validateFilters = (
  filters: SearchFilters
): {
  isValid: boolean;
  warnings: string[];
} => {
  const warnings: string[] = [];

  // Check for potentially conflicting filters
  if (
    filters.selectedProjectIds.length > 0 &&
    filters.selectedEpicIds.length > 0
  ) {
    warnings.push(
      'Both project and epic filters are active - results may be limited'
    );
  }

  // Check for empty search with no other filters
  if (
    !filters.searchQuery &&
    filters.selectedDivisionIds.length === 0 &&
    filters.selectedTeamIds.length === 0 &&
    filters.selectedProjectIds.length === 0 &&
    filters.selectedEpicIds.length === 0 &&
    filters.allocationStatus === 'all' &&
    filters.dateRange === 'all'
  ) {
    warnings.push('No filters applied - showing all data');
  }

  return {
    isValid: true, // For now, all filters are considered valid
    warnings,
  };
};
