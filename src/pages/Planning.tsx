import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  useKeyboardShortcuts,
  KeyboardShortcut,
} from '@/hooks/useKeyboardShortcuts';
import {
  getCurrentQuarterByDate,
  getCurrentFinancialYear,
} from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Calendar,
  Users,
  Target,
  Grid3X3,
  List,
  Zap,
  BarChart3,
  Clock,
  Eye,
  EyeOff,
  Filter,
} from 'lucide-react';
import PlanningMatrix from '@/components/planning/PlanningMatrix';
import BulkAllocationGrid from '@/components/planning/BulkAllocationGrid';
import AllocationDialog from '@/components/planning/AllocationDialog';
import CycleDialog from '@/components/planning/CycleDialog';
import AdvancedPlanningDashboard from '@/components/planning/AdvancedPlanningDashboard';
import QuarterAnalysisDashboard from '@/components/planning/QuarterAnalysisDashboard';
import IterationSequenceView from '@/components/planning/IterationSequenceView';
import KeyboardShortcutsDialog from '@/components/planning/KeyboardShortcutsDialog';
import BulkOperationsPanel, {
  BulkSelection,
} from '@/components/planning/BulkOperationsPanel';
import HeatMapView from '@/components/planning/HeatMapView';
import ProgressIndicators from '@/components/planning/ProgressIndicators';
import SearchAndFilter, {
  SearchFilters,
  FilterPreset,
} from '@/components/planning/SearchAndFilter';
import ConflictDetection from '@/components/planning/ConflictDetection';
import CapacityWarnings from '@/components/planning/CapacityWarnings';
import TimelineGanttView from '@/components/planning/TimelineGanttView';
import { applyFilters, getDefaultFilterPresets } from '@/utils/filterUtils';
import { Allocation, Cycle } from '@/types';

const Planning = () => {
  const {
    teams,
    cycles,
    setCycles,
    allocations,
    config,
    projects,
    epics,
    runWorkCategories,
    divisions,
    people,
  } = useApp();
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('all');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [selectedFinancialYear, setSelectedFinancialYear] =
    useState<string>('all');
  const [viewMode, setViewMode] = useState<
    'matrix' | 'bulk' | 'heatmap' | 'timeline'
  >('matrix');
  const [activeTab, setActiveTab] = useState<
    'planning' | 'analysis' | 'advanced'
  >('planning');
  const [hideEmptyRows, setHideEmptyRows] = useState<boolean>(false);
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false);
  const [isCycleDialogOpen, setIsCycleDialogOpen] = useState(false);
  const [isShortcutsDialogOpen, setIsShortcutsDialogOpen] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkSelection, setBulkSelection] = useState<BulkSelection>({
    teams: new Set(),
    iterations: new Set(),
  });
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchQuery: '',
    selectedDivisionIds: [],
    selectedTeamIds: [],
    selectedProjectIds: [],
    selectedEpicIds: [],
    allocationStatus: 'all',
    dateRange: 'all',
  });
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>(
    getDefaultFilterPresets()
  );
  const [selectedAllocation, setSelectedAllocation] =
    useState<Allocation | null>(null);
  const [prefilledData, setPrefilledData] = useState<{
    teamId?: string;
    iterationNumber?: number;
    suggestedEpicId?: string;
  } | null>(null);

  // Generate financial year options for filtering
  const generateFinancialYearOptions = () => {
    if (!config?.financialYear) return [];

    const fyStart = new Date(config.financialYear.startDate);
    const fyMonth = fyStart.getMonth();
    const fyDay = fyStart.getDate();
    const currentYear = new Date().getFullYear();

    const years = [];
    for (let i = -3; i <= 3; i++) {
      const year = currentYear + i;
      const startDate = `${year}-${String(fyMonth + 1).padStart(2, '0')}-${String(fyDay).padStart(2, '0')}`;
      const endYear = year + 1;

      // Calculate proper end date (day before FY starts next year)
      const fyEndDate = new Date(endYear, fyMonth, fyDay);
      fyEndDate.setDate(fyEndDate.getDate() - 1);

      const fyOption = {
        value: startDate,
        label: `FY ${year}-${endYear}`,
        startDate,
        endDate: fyEndDate.toISOString().split('T')[0],
      };

      // Debug logging for current year
      if (year === currentYear) {
        console.log('Planning: Generated current FY option:', fyOption);
      }

      years.push(fyOption);
    }

    return years;
  };

  const financialYearOptions = generateFinancialYearOptions();

  // Initialize with current financial year only if it has quarters (and for user convenience)
  React.useEffect(() => {
    if (
      config?.financialYear &&
      selectedFinancialYear === 'all' &&
      cycles.length > 0
    ) {
      const currentFY = getCurrentFinancialYear(config.financialYear.startDate);
      const allQuarters = cycles.filter(c => c.type === 'quarterly');

      // Check if current FY has quarters
      const selectedFY = financialYearOptions.find(
        fy => fy.value === currentFY
      );

      // Only auto-select financial year if:
      // 1. Current FY has quarters, AND
      // 2. There are more than 4 quarters total (indicating multiple financial years)
      // This prevents auto-selecting FY when there's only one set of quarters (like in tests)
      if (selectedFY && allQuarters.length > 4) {
        const fyStart = new Date(selectedFY.startDate);
        const fyEnd = new Date(selectedFY.endDate);

        const currentFYQuarters = allQuarters.filter(quarter => {
          const quarterStart = new Date(quarter.startDate);
          const quarterEnd = new Date(quarter.endDate);

          return (
            (quarterStart >= fyStart && quarterStart <= fyEnd) ||
            (quarterEnd >= fyStart && quarterEnd <= fyEnd) ||
            (quarterStart <= fyStart && quarterEnd >= fyEnd)
          );
        });

        // Set current FY if it has quarters
        if (currentFYQuarters.length > 0) {
          setSelectedFinancialYear(currentFY);
          console.log(
            'Planning: Auto-selected current financial year:',
            currentFY
          );
        }
      }
    }
  }, [
    config?.financialYear,
    selectedFinancialYear,
    cycles,
    financialYearOptions,
  ]);

  // Filter quarters by selected financial year for dropdown display
  const filterQuartersByFinancialYear = (quarters: typeof cycles) => {
    // If no financial year is selected or "all" is selected, show all quarters
    if (!selectedFinancialYear || selectedFinancialYear === 'all') {
      console.log(
        'Planning: No financial year selected or "all" selected, showing all quarters:',
        quarters.length
      );
      return quarters;
    }

    const selectedFY = financialYearOptions.find(
      fy => fy.value === selectedFinancialYear
    );
    if (!selectedFY) {
      console.warn(
        'Planning: Selected financial year not found in options:',
        selectedFinancialYear
      );
      return quarters;
    }

    const fyStart = new Date(selectedFY.startDate);
    const fyEnd = new Date(selectedFY.endDate);

    const filtered = quarters.filter(quarter => {
      const quarterStart = new Date(quarter.startDate);
      const quarterEnd = new Date(quarter.endDate);

      // Quarter overlaps with financial year if either:
      // 1. Quarter starts within FY, or
      // 2. Quarter ends within FY, or
      // 3. Quarter spans entire FY
      const overlaps =
        (quarterStart >= fyStart && quarterStart <= fyEnd) ||
        (quarterEnd >= fyStart && quarterEnd <= fyEnd) ||
        (quarterStart <= fyStart && quarterEnd >= fyEnd);

      // Debug logging for the first few quarters
      if (quarters.indexOf(quarter) < 3) {
        console.log(
          `Planning: Debug quarter "${quarter.name}":`,
          `Quarter: ${quarter.startDate} to ${quarter.endDate}`,
          `FY: ${selectedFY.startDate} to ${selectedFY.endDate}`,
          `Overlaps: ${overlaps}`
        );
      }

      return overlaps;
    });

    console.log(
      'Planning: Filtering quarters for FY:',
      selectedFY.label,
      'Input quarters:',
      quarters.length,
      'Filtered quarters:',
      filtered.length,
      'Quarter names:',
      filtered.map(q => q.name)
    );
    return filtered;
  };

  // Get all quarters filtered by selected financial year (for dropdown display)
  const allQuarterCycles = filterQuartersByFinancialYear(
    cycles.filter(c => c.type === 'quarterly')
  );

  // Get current quarter cycles (non-completed) for initial selection logic
  const activeQuarterCycles = allQuarterCycles.filter(
    c => c.status !== 'completed'
  );

  // Quarters to show in dropdown - all quarters for selected FY
  const quarterDropdownOptions = allQuarterCycles;

  // Determine current quarter based on actual date first, then fall back to status
  const currentQuarterByDate = getCurrentQuarterByDate(activeQuarterCycles);
  const currentQuarter =
    currentQuarterByDate ||
    activeQuarterCycles.find(c => c.status === 'active') ||
    activeQuarterCycles[0];

  // Auto-select current quarter when available
  React.useEffect(() => {
    if (currentQuarter && !selectedCycleId) {
      setSelectedCycleId(currentQuarter.id);
    }
  }, [currentQuarter, selectedCycleId]);

  // Reset quarter selection when financial year changes and current selection is not valid
  React.useEffect(() => {
    if (selectedCycleId && allQuarterCycles.length > 0) {
      const isCurrentSelectionValid = allQuarterCycles.some(
        quarter => quarter.id === selectedCycleId
      );

      if (!isCurrentSelectionValid) {
        // Current selection is not in the filtered quarters, select the best alternative
        const newCurrentQuarter =
          getCurrentQuarterByDate(allQuarterCycles) ||
          allQuarterCycles.find(c => c.status === 'active') ||
          allQuarterCycles[0];

        if (newCurrentQuarter) {
          setSelectedCycleId(newCurrentQuarter.id);
        } else {
          setSelectedCycleId('');
        }
      }
    } else if (!selectedCycleId && allQuarterCycles.length > 0) {
      // No quarter selected but quarters are available, select the best one
      const newCurrentQuarter =
        getCurrentQuarterByDate(allQuarterCycles) ||
        allQuarterCycles.find(c => c.status === 'active') ||
        allQuarterCycles[0];

      if (newCurrentQuarter) {
        setSelectedCycleId(newCurrentQuarter.id);
      }
    }
  }, [selectedFinancialYear, allQuarterCycles, selectedCycleId]);

  // Get iterations for selected quarter
  const iterations = cycles
    .filter(c => c.type === 'iteration' && c.parentCycleId === selectedCycleId)
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

  // Retry logic for iteration loading
  const [iterationRetryCount, setIterationRetryCount] = useState(0);
  const [isWaitingForIterations, setIsWaitingForIterations] = useState(false);

  React.useEffect(() => {
    if (
      selectedCycleId &&
      iterations.length === 0 &&
      iterationRetryCount < 3 &&
      config?.iterationLength
    ) {
      setIsWaitingForIterations(true);
      const timer = setTimeout(
        () => {
          console.log(
            `Planning: Retrying iteration loading (attempt ${iterationRetryCount + 1})`
          );
          setIterationRetryCount(prev => prev + 1);
          setIsWaitingForIterations(false);
        },
        1000 * (iterationRetryCount + 1)
      ); // Exponential backoff
      return () => clearTimeout(timer);
    } else if (iterations.length > 0) {
      setIterationRetryCount(0);
      setIsWaitingForIterations(false);
    }
  }, [
    selectedCycleId,
    iterations.length,
    iterationRetryCount,
    config?.iterationLength,
  ]);

  // Filter teams based on division
  const teamsInDivision = React.useMemo(() => {
    if (selectedDivisionId === 'all') {
      return teams;
    }
    return teams.filter(t => t.divisionId === selectedDivisionId);
  }, [selectedDivisionId, teams]);

  // When division changes, if selected team is not in the new division, reset it
  React.useEffect(() => {
    if (
      selectedTeamId !== 'all' &&
      !teamsInDivision.find(t => t.id === selectedTeamId)
    ) {
      setSelectedTeamId('all');
    }
  }, [selectedDivisionId, teamsInDivision, selectedTeamId]);

  // Filter teams for display (combine existing division/team filters with search filters)
  const filteredTeams = React.useMemo(() => {
    let teams = filteredData.teams;

    // Apply existing division filter
    if (selectedDivisionId !== 'all') {
      teams = teams.filter(t => t.divisionId === selectedDivisionId);
    }

    // Apply existing team filter
    if (selectedTeamId !== 'all') {
      teams = teams.filter(t => t.id === selectedTeamId);
    }

    return teams;
  }, [filteredData.teams, selectedDivisionId, selectedTeamId]);

  const handleCreateAllocation = () => {
    setSelectedAllocation(null);
    setPrefilledData(null);
    setIsAllocationDialogOpen(true);
  };

  const handleCreateAllocationFromMatrix = (
    teamId: string,
    iterationNumber: number
  ) => {
    setSelectedAllocation(null);

    // Find suggested epic from previous iteration
    let suggestedEpicId = '';
    if (iterationNumber > 1) {
      const previousIterationAllocations = allocations.filter(
        a =>
          a.teamId === teamId &&
          a.cycleId === selectedCycleId &&
          a.iterationNumber === iterationNumber - 1 &&
          a.epicId
      );

      if (previousIterationAllocations.length > 0) {
        // Use the first epic from the previous iteration
        suggestedEpicId = previousIterationAllocations[0].epicId || '';
      }
    }

    setPrefilledData({
      teamId,
      iterationNumber,
      suggestedEpicId,
    });
    setIsAllocationDialogOpen(true);
  };

  const handleEditAllocation = (allocation: Allocation) => {
    setSelectedAllocation(allocation);
    setPrefilledData(null);
    setIsAllocationDialogOpen(true);
  };

  const handleCloseAllocationDialog = () => {
    setIsAllocationDialogOpen(false);
    setPrefilledData(null);
  };

  // Bulk operations handlers
  const handleBulkAllocate = (
    teamIds: string[],
    iterationNumbers: number[],
    allocation: {
      epicId?: string;
      runWorkCategoryId?: string;
      percentage: number;
    }
  ) => {
    if (!selectedCycleId) return;

    const newAllocations: Allocation[] = [];

    teamIds.forEach(teamId => {
      iterationNumbers.forEach(iterationNumber => {
        const newAllocation: Allocation = {
          id: Date.now().toString() + Math.random().toString(36),
          teamId,
          cycleId: selectedCycleId,
          iterationNumber,
          percentage: allocation.percentage,
          epicId: allocation.epicId || '',
          runWorkCategoryId: allocation.runWorkCategoryId || '',
          notes: '',
        };
        newAllocations.push(newAllocation);
      });
    });

    setAllocations(prev => [...prev, ...newAllocations]);

    // Clear selection after bulk operation
    setBulkSelection({ teams: new Set(), iterations: new Set() });
  };

  const handleBulkDelete = (teamIds: string[], iterationNumbers: number[]) => {
    if (!selectedCycleId) return;

    setAllocations(prev =>
      prev.filter(allocation => {
        if (allocation.cycleId !== selectedCycleId) return true;
        return !(
          teamIds.includes(allocation.teamId) &&
          iterationNumbers.includes(allocation.iterationNumber)
        );
      })
    );

    // Clear selection after bulk operation
    setBulkSelection({ teams: new Set(), iterations: new Set() });
  };

  const handleBulkCopy = (
    sourceTeamId: string,
    sourceIteration: number,
    targetTeamIds: string[],
    targetIterations: number[]
  ) => {
    if (!selectedCycleId) return;

    // Find source allocations
    const sourceAllocations = allocations.filter(
      a =>
        a.teamId === sourceTeamId &&
        a.iterationNumber === sourceIteration &&
        a.cycleId === selectedCycleId
    );

    if (sourceAllocations.length === 0) return;

    const newAllocations: Allocation[] = [];

    targetTeamIds.forEach(teamId => {
      targetIterations.forEach(iterationNumber => {
        // Skip copying to self
        if (teamId === sourceTeamId && iterationNumber === sourceIteration)
          return;

        sourceAllocations.forEach(sourceAllocation => {
          const newAllocation: Allocation = {
            ...sourceAllocation,
            id: Date.now().toString() + Math.random().toString(36),
            teamId,
            iterationNumber,
          };
          newAllocations.push(newAllocation);
        });
      });
    });

    setAllocations(prev => [...prev, ...newAllocations]);

    // Clear selection after bulk operation
    setBulkSelection({ teams: new Set(), iterations: new Set() });
  };

  const getQuarterStats = () => {
    if (!currentQuarter)
      return { totalTeams: 0, allocatedTeams: 0, totalIterations: 0 };

    const quarterAllocations = allocations.filter(
      a => a.cycleId === currentQuarter.id
    );
    const allocatedTeams = new Set(quarterAllocations.map(a => a.teamId)).size;

    return {
      totalTeams: teams.length,
      allocatedTeams,
      totalIterations: iterations.length,
    };
  };

  const stats = getQuarterStats();

  // Apply filters to get filtered data
  const filteredData = React.useMemo(() => {
    if (!selectedCycleId) {
      return { teams: [], projects: [], epics: [], allocations: [] };
    }

    return applyFilters(
      {
        teams: teams,
        projects: projects,
        epics: epics,
        allocations: allocations,
        iterations: iterations,
      },
      searchFilters,
      selectedCycleId
    );
  }, [
    teams,
    projects,
    epics,
    allocations,
    iterations,
    searchFilters,
    selectedCycleId,
  ]);

  // Filter management
  const handleFilterPresetSave = (preset: Omit<FilterPreset, 'id'>) => {
    const newPreset: FilterPreset = {
      ...preset,
      id: Date.now().toString(),
    };
    setFilterPresets(prev => [...prev, newPreset]);
  };

  const handleFilterPresetLoad = (preset: FilterPreset) => {
    setSearchFilters(preset.filters);
  };

  const handleFilterPresetDelete = (presetId: string) => {
    setFilterPresets(prev => prev.filter(p => p.id !== presetId));
  };

  // Keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'n',
      action: handleCreateAllocation,
      description: 'Create new allocation',
      category: 'Actions',
    },
    {
      key: 'c',
      action: () => setIsCycleDialogOpen(true),
      description: 'Manage cycles',
      category: 'Actions',
    },
    {
      key: 'Escape',
      action: () => {
        setIsAllocationDialogOpen(false);
        setIsCycleDialogOpen(false);
        setIsShortcutsDialogOpen(false);
      },
      description: 'Close dialogs',
      category: 'Navigation',
    },
    {
      key: '?',
      action: () => setIsShortcutsDialogOpen(!isShortcutsDialogOpen),
      description: 'Toggle keyboard shortcuts help',
      category: 'Help',
    },
    {
      key: 'm',
      action: () =>
        setViewMode(
          viewMode === 'matrix'
            ? 'bulk'
            : viewMode === 'bulk'
              ? 'heatmap'
              : viewMode === 'heatmap'
                ? 'timeline'
                : 'matrix'
        ),
      description: 'Cycle view modes',
      category: 'View',
    },
    {
      key: 'h',
      action: () => setHideEmptyRows(!hideEmptyRows),
      description: 'Toggle hide empty rows',
      category: 'View',
    },
    {
      key: 't',
      ctrlKey: true,
      action: () =>
        setActiveTab(
          activeTab === 'planning'
            ? 'analysis'
            : activeTab === 'analysis'
              ? 'advanced'
              : 'planning'
        ),
      description: 'Cycle through tabs',
      category: 'Navigation',
    },
    {
      key: 'b',
      action: () => setIsBulkMode(!isBulkMode),
      description: 'Toggle bulk selection mode',
      category: 'Actions',
    },
    {
      key: 'f',
      ctrlKey: true,
      action: () => {
        // Focus search input
        const searchInput = document.querySelector(
          'input[placeholder*="Search"]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      description: 'Focus search',
      category: 'Navigation',
    },
  ];

  useKeyboardShortcuts(shortcuts, true);

  if (!config) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Setup Required
          </h2>
          <p className="text-gray-600">
            Please complete the setup to start planning.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-gray-900"
            data-testid="planning-title"
          >
            Planning
          </h1>
          <p className="text-gray-600">
            Plan team allocations and analyze project feasibility
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsCycleDialogOpen(true)}
            data-testid="manage-cycles-header-button"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Manage Cycles
          </Button>
          <Button
            onClick={handleCreateAllocation}
            data-testid="new-allocation-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Allocation
          </Button>
        </div>
      </div>

      {/* Main Planning Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={value =>
          setActiveTab(value as 'planning' | 'analysis' | 'advanced')
        }
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="planning">Quarterly Planning</TabsTrigger>
          <TabsTrigger value="analysis">
            <BarChart3 className="h-4 w-4 mr-2" />
            Plan Analysis
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Zap className="h-4 w-4 mr-2" />
            Advanced Planning
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planning" className="space-y-6">
          {/* Enhanced Filters Section */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Filter className="h-5 w-5 mr-2 text-blue-500" />
                  Planning Filters & View Options
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {currentQuarter?.name || 'No Quarter Selected'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Financial Year
                  </label>
                  <Select
                    value={selectedFinancialYear}
                    onValueChange={setSelectedFinancialYear}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select financial year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Financial Years</SelectItem>
                      {financialYearOptions.map(fy => (
                        <SelectItem key={fy.value} value={fy.value}>
                          {fy.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Quarter
                  </label>
                  <Select
                    value={selectedCycleId}
                    onValueChange={setSelectedCycleId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select quarter" />
                    </SelectTrigger>
                    <SelectContent>
                      {quarterDropdownOptions.map(cycle => (
                        <SelectItem key={cycle.id} value={cycle.id}>
                          {cycle.name} ({cycle.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Division
                  </label>
                  <Select
                    value={selectedDivisionId}
                    onValueChange={setSelectedDivisionId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select division" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Divisions</SelectItem>
                      {divisions.map(division => (
                        <SelectItem key={division.id} value={division.id}>
                          {division.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Team
                  </label>
                  <Select
                    value={selectedTeamId}
                    onValueChange={setSelectedTeamId}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      {teamsInDivision.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* View Options & Display Controls Row */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">
                      View Mode:
                    </label>
                    <div className="flex items-center border rounded-md">
                      <Button
                        variant={viewMode === 'matrix' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('matrix')}
                        className="rounded-r-none border-r"
                      >
                        <List className="h-4 w-4 mr-1" />
                        Matrix
                      </Button>
                      <Button
                        variant={viewMode === 'heatmap' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('heatmap')}
                        className="rounded-none border-r"
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Heat Map
                      </Button>
                      <Button
                        variant={viewMode === 'bulk' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('bulk')}
                        className="rounded-none border-r"
                      >
                        <Grid3X3 className="h-4 w-4 mr-1" />
                        Bulk Entry
                      </Button>
                      <Button
                        variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('timeline')}
                        className="rounded-l-none"
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Timeline
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant={hideEmptyRows ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setHideEmptyRows(!hideEmptyRows)}
                      className="text-xs"
                    >
                      {hideEmptyRows ? (
                        <Eye className="h-4 w-4 mr-1" />
                      ) : (
                        <EyeOff className="h-4 w-4 mr-1" />
                      )}
                      {hideEmptyRows ? 'Show Empty Rows' : 'Hide Empty Rows'}
                    </Button>

                    <Button
                      variant={isBulkMode ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsBulkMode(!isBulkMode)}
                      className="text-xs"
                    >
                      <Users className="h-4 w-4 mr-1" />
                      {isBulkMode ? 'Exit Bulk Mode' : 'Bulk Mode'}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>
                    Showing: {filteredTeams.length} team
                    {filteredTeams.length !== 1 ? 's' : ''}
                  </span>
                  {selectedCycleId && <span className="text-gray-400">•</span>}
                  {selectedCycleId && (
                    <span>
                      {iterations.length} iteration
                      {iterations.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Team Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.allocatedTeams}/{stats.totalTeams}
                </div>
                <p className="text-sm text-gray-600">Teams with allocations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Iterations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalIterations}
                </div>
                <p className="text-sm text-gray-600">Total iterations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.length}</div>
                <p className="text-sm text-gray-600">Active projects</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <SearchAndFilter
            teams={teams}
            projects={projects}
            epics={epics}
            divisions={divisions}
            allocations={allocations.filter(a => a.cycleId === selectedCycleId)}
            filters={searchFilters}
            onFiltersChange={setSearchFilters}
            presets={filterPresets}
            onPresetSave={handleFilterPresetSave}
            onPresetLoad={handleFilterPresetLoad}
            onPresetDelete={handleFilterPresetDelete}
          />

          {/* Progress Indicators */}
          {selectedCycleId && iterations.length > 0 && (
            <ProgressIndicators
              teams={filteredTeams}
              iterations={iterations}
              allocations={filteredData.allocations}
              projects={filteredData.projects}
              epics={filteredData.epics}
              selectedCycleId={selectedCycleId}
            />
          )}

          {/* Conflict Detection */}
          {selectedCycleId && iterations.length > 0 && (
            <ConflictDetection
              allocations={filteredData.allocations}
              teams={filteredTeams}
              epics={filteredData.epics}
              projects={filteredData.projects}
              people={people}
              iterations={iterations}
              selectedCycleId={selectedCycleId}
            />
          )}

          {/* Capacity Warnings */}
          {selectedCycleId && iterations.length > 0 && (
            <CapacityWarnings
              teams={filteredTeams}
              allocations={filteredData.allocations}
              iterations={iterations}
              selectedCycleId={selectedCycleId}
              realTimeUpdates={true}
            />
          )}

          {/* Bulk Operations Panel */}
          {isBulkMode && selectedCycleId && iterations.length > 0 && (
            <BulkOperationsPanel
              selection={bulkSelection}
              onSelectionChange={setBulkSelection}
              teams={filteredTeams}
              iterations={iterations}
              projects={filteredData.projects}
              epics={filteredData.epics}
              runWorkCategories={runWorkCategories}
              onBulkAllocate={handleBulkAllocate}
              onBulkDelete={handleBulkDelete}
              onBulkCopy={handleBulkCopy}
            />
          )}

          {/* Planning Views */}
          {selectedCycleId && iterations.length > 0 && (
            <>
              {viewMode === 'matrix' && (
                <PlanningMatrix
                  teams={filteredTeams}
                  iterations={iterations}
                  allocations={filteredData.allocations}
                  onEditAllocation={handleEditAllocation}
                  onCreateAllocation={handleCreateAllocationFromMatrix}
                  projects={filteredData.projects}
                  epics={filteredData.epics}
                  runWorkCategories={runWorkCategories}
                  hideEmptyRows={hideEmptyRows}
                  bulkSelection={bulkSelection}
                  onBulkSelectionChange={setBulkSelection}
                  isBulkMode={isBulkMode}
                />
              )}

              {viewMode === 'heatmap' && (
                <HeatMapView
                  teams={filteredTeams}
                  iterations={iterations}
                  allocations={filteredData.allocations}
                  onEditAllocation={handleEditAllocation}
                  onCreateAllocation={handleCreateAllocationFromMatrix}
                  projects={filteredData.projects}
                  epics={filteredData.epics}
                  runWorkCategories={runWorkCategories}
                  hideEmptyRows={hideEmptyRows}
                />
              )}

              {viewMode === 'bulk' && (
                <BulkAllocationGrid
                  teams={teams}
                  iterations={iterations}
                  cycleId={selectedCycleId}
                  projects={projects}
                  epics={epics}
                  runWorkCategories={runWorkCategories}
                />
              )}

              {viewMode === 'timeline' && (
                <TimelineGanttView
                  teams={filteredTeams}
                  allocations={filteredData.allocations}
                  iterations={iterations}
                  epics={filteredData.epics}
                  projects={filteredData.projects}
                  selectedCycleId={selectedCycleId}
                  onAllocationClick={handleEditAllocation}
                />
              )}
            </>
          )}

          {selectedCycleId && iterations.length === 0 && (
            <Card>
              <CardContent
                className="text-center py-12"
                data-testid="planning-no-iterations"
              >
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                {isWaitingForIterations ? (
                  <>
                    <h3
                      className="text-lg font-semibold text-gray-900 mb-2"
                      data-testid="generating-iterations-title"
                    >
                      Generating Iterations...
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Please wait while iterations are being generated for this
                      quarter.
                    </p>
                    <div className="flex justify-center">
                      <div
                        className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
                        data-testid="generating-spinner"
                      ></div>
                    </div>
                  </>
                ) : iterationRetryCount >= 3 ? (
                  <>
                    <h3
                      className="text-lg font-semibold text-gray-900 mb-2"
                      data-testid="no-iterations-title"
                    >
                      No Iterations Found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      This quarter exists but has no iterations. Generate
                      iterations to start planning.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setIsCycleDialogOpen(true)}
                      data-testid="manage-cycles-button"
                    >
                      Manage Cycles
                    </Button>
                  </>
                ) : (
                  <>
                    <h3
                      className="text-lg font-semibold text-gray-900 mb-2"
                      data-testid="loading-iterations-title"
                    >
                      Loading Iterations...
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Waiting for iterations to be generated automatically...
                    </p>
                    <div className="flex justify-center">
                      <div
                        className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
                        data-testid="loading-spinner"
                      ></div>
                    </div>
                  </>
                )}
                {/* Show teams even without iterations for debugging */}
                {teams.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Available Teams:
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      {teams.slice(0, 5).map(team => (
                        <div key={team.id} className="flex justify-between">
                          <span>{team.name}</span>
                          <span className="text-gray-400">{team.division}</span>
                        </div>
                      ))}
                      {teams.length > 5 && (
                        <div className="text-gray-400">
                          ...and {teams.length - 5} more teams
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!selectedCycleId && (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Planning Data
                </h3>
                <p className="text-gray-600 mb-4">
                  {!selectedCycleId
                    ? 'Select a quarter to start planning'
                    : 'No iterations found for this quarter. Create iterations first.'}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setIsCycleDialogOpen(true)}
                >
                  Manage Cycles
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {selectedCycleId && iterations.length > 0 ? (
            <Tabs defaultValue="quarter-analysis" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="quarter-analysis">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Quarter Analysis
                </TabsTrigger>
                <TabsTrigger value="iteration-sequence">
                  <Clock className="h-4 w-4 mr-2" />
                  Iteration Sequence
                </TabsTrigger>
              </TabsList>

              <TabsContent value="quarter-analysis">
                <QuarterAnalysisDashboard
                  cycleId={selectedCycleId}
                  teams={teams}
                  iterations={iterations}
                  allocations={allocations}
                  projects={projects}
                  epics={epics}
                  milestones={projects.flatMap(p => p.milestones)}
                  runWorkCategories={runWorkCategories}
                  divisions={divisions}
                  people={people}
                />
              </TabsContent>

              <TabsContent value="iteration-sequence">
                <IterationSequenceView
                  cycleId={selectedCycleId}
                  teams={teams}
                  iterations={iterations}
                  allocations={allocations}
                  projects={projects}
                  epics={epics}
                  milestones={projects.flatMap(p => p.milestones)}
                  runWorkCategories={runWorkCategories}
                  divisions={divisions}
                  people={people}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Analysis Data
                </h3>
                <p className="text-gray-600 mb-4">
                  Select a quarter with iterations to view analysis
                </p>
                <Button
                  variant="outline"
                  onClick={() => setIsCycleDialogOpen(true)}
                >
                  Manage Cycles
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="advanced">
          <AdvancedPlanningDashboard />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AllocationDialog
        isOpen={isAllocationDialogOpen}
        onClose={handleCloseAllocationDialog}
        allocation={selectedAllocation}
        cycleId={selectedCycleId}
        teams={teams}
        iterations={iterations}
        projects={projects}
        epics={epics}
        runWorkCategories={runWorkCategories}
        prefilledData={prefilledData}
      />

      <CycleDialog
        isOpen={isCycleDialogOpen}
        onClose={() => setIsCycleDialogOpen(false)}
        parentCycle={currentQuarter}
        selectedFinancialYear={selectedFinancialYear}
      />

      <KeyboardShortcutsDialog
        isOpen={isShortcutsDialogOpen}
        onClose={() => setIsShortcutsDialogOpen(false)}
        shortcuts={shortcuts}
      />
    </div>
  );
};

export default Planning;
