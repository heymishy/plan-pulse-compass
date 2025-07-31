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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { calculateProjectCost } from '@/utils/financialCalculations';

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
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set()
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Filtering state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    priority: '',
  });

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
    let filtered = [...projects];

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
        project => project.priority?.toString() === filters.priority
      );
    }

    // Apply sorting only if a sort field is selected
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
            aValue = a.budget || 0;
            bValue = b.budget || 0;
            break;
          case 'priority':
            aValue = a.priority || 999;
            bValue = b.priority || 999;
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
    }

    return filtered;
  }, [projects, filters, sortField, sortDirection]);

  // Budget calculations
  const budgetTotals = useMemo(() => {
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const filteredBudget = filteredAndSortedProjects.reduce(
      (sum, p) => sum + (p.budget || 0),
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

  const getPriorityBadgeColor = (priority: number | undefined) => {
    if (!priority) return 'bg-gray-100 text-gray-800';
    if (priority === 1) return 'bg-red-100 text-red-800';
    if (priority === 2) return 'bg-yellow-100 text-yellow-800';
    if (priority === 3) return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
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

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-gray-50 p-4 rounded-lg">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Filter projects..."
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              className="w-64"
            />
          </div>

          <Select
            value={filters.status || 'all'}
            onValueChange={value =>
              handleFilterChange('status', value === 'all' ? '' : value)
            }
          >
            <SelectTrigger className="w-40" aria-label="Filter by status">
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
            <SelectTrigger className="w-40" aria-label="Filter by priority">
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="1">Priority 1</SelectItem>
              <SelectItem value="2">Priority 2</SelectItem>
              <SelectItem value="3">Priority 3</SelectItem>
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all projects"
                />
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
              <TableHead>Est. Cost</TableHead>
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
                  onClick={() => handleSort('priority')}
                  className="font-medium text-left p-0 h-auto"
                  aria-label="Sort by priority"
                >
                  Priority
                  {getSortIcon('priority')}
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
            {filteredAndSortedProjects.map(project => {
              const projectEpics = epics.filter(
                e => e.projectId === project.id
              );
              const { totalCost } = calculateProjectCost(
                project,
                epics,
                allocations,
                cycles,
                people,
                roles,
                teams
              );

              return (
                <TableRow key={project.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedProjects.has(project.id)}
                      onCheckedChange={checked =>
                        handleSelectProject(project.id, checked as boolean)
                      }
                      aria-label={`Select ${project.name}`}
                    />
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
                      <span>
                        {totalCost.toLocaleString(undefined, {
                          style: 'currency',
                          currency: 'USD',
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span>
                        {project.budget
                          ? project.budget.toLocaleString(undefined, {
                              style: 'currency',
                              currency: 'USD',
                              maximumFractionDigits: 0,
                            })
                          : 'Not set'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${getPriorityBadgeColor(project.priority)} border-0`}
                    >
                      {project.priority || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(project.startDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {project.endDate
                      ? new Date(project.endDate).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewProject(project.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditProject(project.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Budget Totals */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="text-sm">
              <span className="font-medium">
                {budgetTotals.isFiltered ? 'Filtered Budget' : 'Total Budget'}:
              </span>
              <span className="ml-2 text-lg font-bold text-green-600">
                $
                {(budgetTotals.isFiltered
                  ? budgetTotals.filtered
                  : budgetTotals.total
                ).toLocaleString()}
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
              Total Budget: ${budgetTotals.total.toLocaleString()}
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
    </div>
  );
};

export default ProjectTable;
