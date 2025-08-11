import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Edit,
  Eye,
  Trash2,
  Layers,
  DollarSign,
  ChevronUp,
  ChevronDown,
  Filter,
  X,
  GripVertical,
  Database,
  AlertTriangle,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/SettingsContext';
import { calculateProjectCost } from '@/utils/financialCalculations';
import {
  calculateProjectTotalBudget,
  getProjectPriorityOrder,
  assignDefaultPriorityOrderToProjects,
  migrateLegacyBudgetToFinancialYear,
} from '@/utils/projectBudgetUtils';
import { getPriorityLevels } from '@/utils/priorityUtils';
import { formatCurrency } from '@/utils/currency';

// Budget display helper
const formatBudgetDisplay = (amount: number): string => {
  return amount > 0 ? formatCurrency(amount) : 'Not set';
};

// Sortable Project Row Component
import {
  Project,
  Epic,
  Allocation,
  Cycle,
  Person,
  Role,
  Team,
  AppConfig,
} from '@/types';

// ...

// Sortable Project Row Component
interface SortableProjectRowProps {
  project: Project;
  epics: Epic[];
  allocations: Allocation[];
  cycles: Cycle[];
  people: Person[];
  roles: Role[];
  teams: Team[];
  config: AppConfig;
  selectedProjects: Set<string>;
  onSelectProject: (projectId: string, checked: boolean) => void;
  onViewProject: (projectId: string) => void;
  onEditProject: (projectId: string) => void;
  isDragDisabled?: boolean;
}

const SortableProjectRow: React.FC<SortableProjectRowProps> = ({
  project,
  epics,
  allocations,
  cycles,
  people,
  roles,
  teams,
  config,
  selectedProjects,
  onSelectProject,
  onViewProject,
  onEditProject,
  isDragDisabled = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: project.id,
    disabled: isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const projectEpics = epics.filter(e => e.projectId === project.id);
  const { totalCost } = calculateProjectCost(
    project,
    epics,
    allocations,
    cycles,
    people,
    roles,
    teams,
    config
  );

  const getStatusBadge = (status: string | undefined) => {
    const statusConfig = {
      planning: { label: 'Planning', variant: 'secondary' as const },
      'in-progress': { label: 'Active', variant: 'default' as const },
      active: { label: 'Active', variant: 'default' as const },
      completed: { label: 'Completed', variant: 'outline' as const },
      'on-hold': { label: 'On Hold', variant: 'secondary' as const },
      cancelled: { label: 'Cancelled', variant: 'destructive' as const },
    };

    // Handle undefined, null, or invalid status values
    const normalizedStatus = status?.toLowerCase() || 'planning';
    const config =
      statusConfig[normalizedStatus as keyof typeof statusConfig] ||
      statusConfig.planning;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'opacity-50' : ''}
    >
      <TableCell>
        <Checkbox
          checked={selectedProjects.has(project.id)}
          onCheckedChange={checked =>
            onSelectProject(project.id, checked as boolean)
          }
          aria-label={`Select ${project.name}`}
        />
      </TableCell>
      <TableCell className="text-center font-mono">
        <div className="flex items-center justify-center space-x-2">
          {!isDragDisabled && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <Badge variant="outline" className="min-w-[2rem] justify-center">
            {getProjectPriorityOrder(project) || project.priority || 'N/A'}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="font-medium">{project.name}</TableCell>
      <TableCell>{getStatusBadge(project.status)}</TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Layers className="h-4 w-4 text-gray-500" />
          <span>{projectEpics.length}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4 text-gray-500" />
          <span>{formatCurrency(totalCost)}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4 text-gray-500" />
          <span>
            {formatBudgetDisplay(calculateProjectTotalBudget(project))}
          </span>
        </div>
      </TableCell>
      <TableCell>{new Date(project.startDate).toLocaleDateString()}</TableCell>
      <TableCell>
        {project.endDate
          ? new Date(project.endDate).toLocaleDateString()
          : 'N/A'}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewProject(project.id)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

interface ProjectTableProps {
  projects: Project[];
  onEditProject: (projectId: string) => void;
  onViewProject: (projectId: string) => void;
}

type SortField =
  | 'name'
  | 'status'
  | 'budget'
  | 'priority'
  | 'priorityOrder'
  | 'startDate'
  | 'endDate';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  search: string;
  status: string;
  priority: string;
}

const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  onEditProject,
  onViewProject,
}) => {
  const {
    setProjects,
    setEpics,
    epics,
    allocations,
    cycles,
    people,
    roles,
    teams,
  } = useApp();
  const { toast } = useToast();
  const { config } = useSettings();
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set()
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sorting state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Filtering state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    priority: '',
  });

  // Migration state
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  const handleSelectProject = (projectId: string, checked: boolean) => {
    const newSelected = new Set(selectedProjects);
    if (checked) {
      newSelected.add(projectId);
    } else {
      newSelected.delete(projectId);
    }
    setSelectedProjects(newSelected);
  };

  // Filtering and sorting logic
  const filteredAndSortedProjects = useMemo(() => {
    // Ensure all projects have default priority order values
    let filtered = assignDefaultPriorityOrderToProjects([...projects]);

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        project =>
          project.name.toLowerCase().includes(searchLower) ||
          (project.description?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(project => project.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(
        project =>
          getProjectPriorityOrder(project)?.toString() === filters.priority
      );
    }

    // Apply sorting - if no sort field is selected, default to priority order
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue, bValue;

        switch (sortField) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'status':
            aValue = a.status || '';
            bValue = b.status || '';
            break;
          case 'budget':
            aValue = calculateProjectTotalBudget(a);
            bValue = calculateProjectTotalBudget(b);
            break;
          case 'priority':
            aValue = getProjectPriorityOrder(a) || 999;
            bValue = getProjectPriorityOrder(b) || 999;
            break;
          case 'priorityOrder':
            aValue = getProjectPriorityOrder(a) || 999;
            bValue = getProjectPriorityOrder(b) || 999;
            break;
          case 'startDate':
            aValue = new Date(a.startDate).getTime();
            bValue = new Date(b.startDate).getTime();
            break;
          case 'endDate':
            aValue = a.endDate ? new Date(a.endDate).getTime() : 0;
            bValue = b.endDate ? new Date(b.endDate).getTime() : 0;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort by priority order to make drag-and-drop changes visible
      filtered.sort((a, b) => {
        const aOrder = getProjectPriorityOrder(a) || 999;
        const bOrder = getProjectPriorityOrder(b) || 999;
        return aOrder - bOrder; // Ascending order (1, 2, 3...)
      });
    }

    return filtered;
  }, [projects, filters, sortField, sortDirection]);

  // Budget calculations
  const budgetTotals = useMemo(() => {
    const projectsWithDefaults = assignDefaultPriorityOrderToProjects(projects);
    const totalBudget = projectsWithDefaults.reduce(
      (sum, p) => sum + calculateProjectTotalBudget(p),
      0
    );
    const filteredBudget = filteredAndSortedProjects.reduce(
      (sum, p) => sum + calculateProjectTotalBudget(p),
      0
    );
    const isFiltered = filters.search || filters.status || filters.priority;

    return {
      total: totalBudget,
      filtered: filteredBudget,
      isFiltered,
      projectCount: filteredAndSortedProjects.length,
      totalProjectCount: projects.length,
    };
  }, [projects, filteredAndSortedProjects, filters]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', status: '', priority: '' });
  };

  const hasActiveFilters = filters.search || filters.status || filters.priority;

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  const handleBulkDelete = () => {
    // Remove selected projects
    setProjects(prevProjects =>
      prevProjects.filter(project => !selectedProjects.has(project.id))
    );

    // Remove epics associated with deleted projects
    setEpics(prevEpics =>
      prevEpics.filter(epic => !selectedProjects.has(epic.projectId))
    );

    toast({
      title: 'Projects Deleted',
      description: `Successfully deleted ${selectedProjects.size} project${selectedProjects.size !== 1 ? 's' : ''} and their associated epics`,
    });

    setSelectedProjects(new Set());
    setShowDeleteDialog(false);
  };

  const isAllSelected =
    filteredAndSortedProjects.length > 0 &&
    selectedProjects.size === filteredAndSortedProjects.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProjects(
        new Set(filteredAndSortedProjects.map(project => project.id))
      );
    } else {
      setSelectedProjects(new Set());
    }
  };

  // Handle drag end - update priority order for all affected projects
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // Only allow reordering when no sorting is applied (let users see the natural priority order)
    if (sortField) {
      toast({
        title: 'Cannot Reorder',
        description:
          'Please clear the current sort to enable drag-and-drop reordering.',
        variant: 'destructive',
      });
      return;
    }

    const oldIndex = filteredAndSortedProjects.findIndex(
      project => project.id === active.id
    );
    const newIndex = filteredAndSortedProjects.findIndex(
      project => project.id === over.id
    );

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Reorder the filtered projects array
    const reorderedProjects = arrayMove(
      filteredAndSortedProjects,
      oldIndex,
      newIndex
    );

    // Create a comprehensive priority order assignment for ALL projects
    const projectsMap = new Map(projects.map(p => [p.id, p]));

    // First, update the reordered projects with their new priority order
    reorderedProjects.forEach((project, index) => {
      projectsMap.set(project.id, {
        ...project,
        priorityOrder: index + 1, // Start priority order from 1
      });
    });

    // For projects not in the current filter, maintain their relative position
    // by assigning priority orders that don't conflict with the reordered ones
    const reorderedIds = new Set(reorderedProjects.map(p => p.id));
    const nonFilteredProjects = projects.filter(p => !reorderedIds.has(p.id));

    // Assign priority orders to non-filtered projects, starting after the reordered ones
    let nextPriority = reorderedProjects.length + 1;
    nonFilteredProjects.forEach(project => {
      projectsMap.set(project.id, {
        ...project,
        priorityOrder: project.priorityOrder || nextPriority++,
      });
    });

    const newProjects = Array.from(projectsMap.values());
    setProjects(newProjects);

    toast({
      title: 'Priority Order Updated',
      description: `Moved "${filteredAndSortedProjects[oldIndex].name}" and updated priority order for affected projects.`,
    });
  };

  // Legacy Budget Migration functions
  const legacyProjects = useMemo(() => {
    return projects.filter(
      project =>
        !project.financialYearBudgets?.length &&
        project.budget != null &&
        project.budget > 0
    );
  }, [projects]);

  const hasLegacyProjects = legacyProjects.length > 0;

  const handleMigrateLegacyBudgets = async () => {
    if (!config.financialYear) {
      toast({
        title: 'Migration Error',
        description:
          'No financial year configured. Please set up financial year settings first.',
        variant: 'destructive',
      });
      return;
    }

    setIsMigrating(true);

    try {
      const migratedProjects = projects.map(project =>
        migrateLegacyBudgetToFinancialYear(project, config.financialYear.id)
      );

      setProjects(migratedProjects);
      setShowMigrationDialog(false);

      toast({
        title: 'Migration Successful',
        description: `Successfully migrated ${legacyProjects.length} project${
          legacyProjects.length !== 1 ? 's' : ''
        } to financial year budget structure.`,
      });
    } catch (error) {
      console.error('Migration failed:', error);
      toast({
        title: 'Migration Failed',
        description: 'An error occurred during migration. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-4 w-full h-full flex flex-col">
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-gray-50 p-4 rounded-lg w-full">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Filter projects..."
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              className="w-64 xl:w-80"
            />
          </div>

          <Select
            value={filters.status || 'all'}
            onValueChange={value =>
              handleFilterChange('status', value === 'all' ? '' : value)
            }
          >
            <SelectTrigger
              className="w-40 xl:w-48"
              aria-label="Filter by status"
            >
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.priority || 'all'}
            onValueChange={value =>
              handleFilterChange('priority', value === 'all' ? '' : value)
            }
          >
            <SelectTrigger
              className="w-40 xl:w-48"
              aria-label="Filter by priority"
            >
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              {getPriorityLevels(config.priorityLevels).map(level => (
                <SelectItem key={level.id} value={level.id.toString()}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              aria-label="Clear filters"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {selectedProjects.size > 0 && (
        <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
          <span className="text-sm text-blue-700">
            {selectedProjects.size} project
            {selectedProjects.size !== 1 ? 's' : ''} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      {/* Legacy Budget Migration Notice */}
      {hasLegacyProjects && (
        <div className="flex items-center justify-between bg-amber-50 p-4 rounded-lg border border-amber-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Legacy Budget Migration Available
              </p>
              <p className="text-xs text-amber-700">
                {legacyProjects.length} project
                {legacyProjects.length !== 1 ? 's' : ''} can be migrated to the
                new financial year budget structure.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMigrationDialog(true)}
              disabled={isMigrating}
            >
              <Database className="h-4 w-4 mr-2" />
              {legacyProjects.length === 1 ? 'Migrate' : 'Migrate All'}
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 rounded-md border w-full overflow-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table className="w-full min-w-max">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all projects"
                  />
                </TableHead>
                <TableHead className="w-24">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('priorityOrder')}
                      className="font-medium text-left p-0 h-auto"
                      aria-label="Sort by priority order"
                    >
                      #{getSortIcon('priorityOrder')}
                    </Button>
                    {!sortField && (
                      <div
                        className="text-xs text-gray-500"
                        title="Drag to reorder"
                      >
                        ⇅
                      </div>
                    )}
                  </div>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('name')}
                    className="font-medium text-left p-0 h-auto"
                    aria-label="Sort by project name"
                  >
                    Project Name
                    {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('status')}
                    className="font-medium text-left p-0 h-auto"
                    aria-label="Sort by status"
                  >
                    Status
                    {getSortIcon('status')}
                  </Button>
                </TableHead>
                <TableHead>Epics</TableHead>
                <TableHead>FY Cost</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('budget')}
                    className="font-medium text-left p-0 h-auto"
                    aria-label="Sort by budget"
                  >
                    Budget
                    {getSortIcon('budget')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('startDate')}
                    className="font-medium text-left p-0 h-auto"
                    aria-label="Sort by start date"
                  >
                    Start Date
                    {getSortIcon('startDate')}
                  </Button>
                </TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext
                items={filteredAndSortedProjects.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredAndSortedProjects.map(project => (
                  <SortableProjectRow
                    key={project.id}
                    project={project}
                    epics={epics}
                    allocations={allocations}
                    cycles={cycles}
                    people={people}
                    roles={roles}
                    teams={teams}
                    config={config}
                    selectedProjects={selectedProjects}
                    onSelectProject={handleSelectProject}
                    onViewProject={onViewProject}
                    onEditProject={onEditProject}
                    isDragDisabled={!!sortField} // Disable dragging when sorting is active
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {/* Budget Totals */}
      <div className="bg-gray-50 p-4 rounded-lg border w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-6">
            <div className="text-sm">
              <span className="font-medium">
                {budgetTotals.isFiltered ? 'Filtered Budget' : 'Total Budget'}:
              </span>
              <span className="ml-2 text-lg font-bold text-green-600">
                {formatCurrency(
                  budgetTotals.isFiltered
                    ? budgetTotals.filtered
                    : budgetTotals.total
                )}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {budgetTotals.projectCount} project
              {budgetTotals.projectCount !== 1 ? 's' : ''}
              {budgetTotals.isFiltered && (
                <span> (of {budgetTotals.totalProjectCount} total)</span>
              )}
            </div>
          </div>
          {budgetTotals.isFiltered && (
            <div className="text-sm text-gray-500">
              Total Budget: {formatCurrency(budgetTotals.total)}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Projects</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedProjects.size} project
              {selectedProjects.size !== 1 ? 's' : ''}? This action cannot be
              undone and will also delete all associated epics.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Legacy Budget Migration Dialog */}
      <AlertDialog
        open={showMigrationDialog}
        onOpenChange={setShowMigrationDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Migrate Legacy Budgets</AlertDialogTitle>
            <AlertDialogDescription>
              Migrate {legacyProjects.length} project
              {legacyProjects.length !== 1 ? 's' : ''} from the legacy budget
              structure to the new financial year budget structure?
              {config.financialYear && (
                <span className="block mt-2 text-sm">
                  Projects will be migrated to{' '}
                  <strong>{config.financialYear.name}</strong> financial year.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMigrating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMigrateLegacyBudgets}
              disabled={isMigrating}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isMigrating ? 'Migrating...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectTable;
