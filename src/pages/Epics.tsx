import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Filter, FileText, ArrowUpDown } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import EpicDialog from '@/components/projects/EpicDialog';
import ReleaseDialog from '@/components/projects/ReleaseDialog';
import EpicRankingDialog from '@/components/projects/EpicRankingDialog';
import EpicsHeader from '@/components/projects/EpicsHeader';
import SearchAndFilter from '@/components/planning/SearchAndFilter';
import { Epic } from '@/types';
import { useToast } from '@/hooks/use-toast';

const Epics = () => {
  const { epics, setEpics, projects, releases, divisions, teams } = useApp();
  const { toast } = useToast();

  const [selectedEpics, setSelectedEpics] = useState<string[]>([]);
  const [isEpicDialogOpen, setIsEpicDialogOpen] = useState(false);
  const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState(false);
  const [isRankingDialogOpen, setIsRankingDialogOpen] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState<Epic | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    projectId: 'all',
    divisionId: 'all',
    teamId: 'all',
    status: 'all',
    releaseId: 'all',
    startDate: '',
    endDate: '',
  });

  // Sort and view options
  const [sortBy, setSortBy] = useState<
    'name' | 'mvpPriority' | 'releasePriority' | 'effort' | 'targetDate'
  >('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showMvpLine, setShowMvpLine] = useState(false);
  const [showReleaseLine, setShowReleaseLine] = useState(false);

  // Get enriched epics with project and team data
  const enrichedEpics = useMemo(() => {
    return epics.map(epic => {
      const project = projects.find(p => p.id === epic.projectId);
      const release = epic.releaseId
        ? releases.find(r => r.id === epic.releaseId)
        : null;

      return {
        ...epic,
        projectName: project?.name || 'Unknown Project',
        projectStatus: project?.status,
        releaseName: release?.name,
      };
    });
  }, [epics, projects, releases]);

  // Apply filters and sorting
  const filteredAndSortedEpics = useMemo(() => {
    const filtered = enrichedEpics.filter(epic => {
      const matchesSearch =
        !filters.search ||
        epic.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        (epic.description &&
          epic.description
            .toLowerCase()
            .includes(filters.search.toLowerCase()));

      const matchesProject =
        filters.projectId === 'all' || epic.projectId === filters.projectId;
      const matchesStatus =
        filters.status === 'all' || epic.status === filters.status;
      const matchesRelease =
        filters.releaseId === 'all' || epic.releaseId === filters.releaseId;

      const matchesStartDate =
        !filters.startDate ||
        !epic.startDate ||
        epic.startDate >= filters.startDate;
      const matchesEndDate =
        !filters.endDate ||
        !epic.targetEndDate ||
        epic.targetEndDate <= filters.endDate;

      return (
        matchesSearch &&
        matchesProject &&
        matchesStatus &&
        matchesRelease &&
        matchesStartDate &&
        matchesEndDate
      );
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'mvpPriority':
          aValue = a.mvpPriority || 999999;
          bValue = b.mvpPriority || 999999;
          break;
        case 'releasePriority':
          aValue = a.releasePriority || 999999;
          bValue = b.releasePriority || 999999;
          break;
        case 'effort':
          aValue = a.estimatedEffort || 0;
          bValue = b.estimatedEffort || 0;
          break;
        case 'targetDate':
          aValue = a.targetEndDate || '9999-12-31';
          bValue = b.targetEndDate || '9999-12-31';
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [enrichedEpics, filters, sortBy, sortOrder, divisions]);

  const handleCreateEpic = () => {
    setSelectedEpic(null);
    setIsEpicDialogOpen(true);
  };

  const handleCreateRelease = () => {
    setIsReleaseDialogOpen(true);
  };

  const handleOpenRanking = () => {
    setIsRankingDialogOpen(true);
  };

  const handleEditEpic = (epic: Epic) => {
    setSelectedEpic(epic);
    setIsEpicDialogOpen(true);
  };

  const handleSelectEpic = (epicId: string, checked: boolean) => {
    if (checked) {
      setSelectedEpics(prev => [...prev, epicId]);
    } else {
      setSelectedEpics(prev => prev.filter(id => id !== epicId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEpics(filteredAndSortedEpics.map(epic => epic.id));
    } else {
      setSelectedEpics([]);
    }
  };

  const handleBulkStatusUpdate = (newStatus: Epic['status']) => {
    setEpics(prev =>
      prev.map(epic =>
        selectedEpics.includes(epic.id) ? { ...epic, status: newStatus } : epic
      )
    );

    toast({
      title: 'Success',
      description: `Updated ${selectedEpics.length} epics to ${newStatus}`,
    });

    setSelectedEpics([]);
  };

  const getStatusBadgeVariant = (status: Epic['status']) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in-progress':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div
        className="flex-1 p-6 space-y-6 w-full overflow-auto"
        data-testid="epics-content"
      >
        <EpicsHeader
          onCreateEpic={handleCreateEpic}
          onCreateRelease={handleCreateRelease}
          onOpenRanking={handleOpenRanking}
          showMvpLine={showMvpLine}
          showReleaseLine={showReleaseLine}
          onToggleMvpLine={() => setShowMvpLine(!showMvpLine)}
          onToggleReleaseLine={() => setShowReleaseLine(!showReleaseLine)}
        />

        {/* Filters */}
        <SearchAndFilter
          filters={filters}
          onFiltersChange={setFilters}
          filterFields={[
            {
              id: 'search',
              label: 'Search',
              type: 'text',
              placeholder: 'Search epics...',
            },
            {
              id: 'projectId',
              label: 'Project',
              type: 'select',
              options: projects.map(p => ({ value: p.id, label: p.name })),
            },
            {
              id: 'divisionId',
              label: 'Division',
              type: 'select',
              options: divisions.map(d => ({ value: d.id, label: d.name })),
            },
            {
              id: 'teamId',
              label: 'Team',
              type: 'select',
              options: teams.map(t => ({ value: t.id, label: t.name })),
            },
            {
              id: 'status',
              label: 'Status',
              type: 'select',
              options: [
                { value: 'not-started', label: 'Not Started' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
              ],
            },
            {
              id: 'releaseId',
              label: 'Release',
              type: 'select',
              options: releases.map(r => ({
                value: r.id,
                label: `${r.name} (${r.version})`,
              })),
            },
            {
              id: 'startDate',
              label: 'Start Date From',
              type: 'text',
              placeholder: 'YYYY-MM-DD',
            },
            {
              id: 'endDate',
              label: 'Target Date To',
              type: 'text',
              placeholder: 'YYYY-MM-DD',
            },
          ]}
        />

        {/* Bulk Actions */}
        {selectedEpics.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedEpics.length} epic(s) selected
                </span>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkStatusUpdate('not-started')}
                  >
                    Mark as Not Started
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkStatusUpdate('in-progress')}
                  >
                    Mark as In Progress
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkStatusUpdate('completed')}
                  >
                    Mark as Completed
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedEpics([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sort Controls */}
        <div className="flex items-center space-x-4">
          <Label>Sort by:</Label>
          <Select
            value={sortBy}
            onValueChange={(value: string) => setSortBy(value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="mvpPriority">MVP Priority</SelectItem>
              <SelectItem value="releasePriority">Release Priority</SelectItem>
              <SelectItem value="effort">Effort</SelectItem>
              <SelectItem value="targetDate">Target Date</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </Button>
        </div>

        {/* Epics Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedEpics.length ===
                          filteredAndSortedEpics.length &&
                        filteredAndSortedEpics.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Epic Name</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Effort</TableHead>
                  <TableHead>Target Date</TableHead>
                  <TableHead>Release</TableHead>
                  {showMvpLine && <TableHead>MVP Priority</TableHead>}
                  {showReleaseLine && <TableHead>Release Priority</TableHead>}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedEpics.map(epic => (
                  <TableRow key={epic.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedEpics.includes(epic.id)}
                        onCheckedChange={checked =>
                          handleSelectEpic(epic.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{epic.name}</div>
                        {epic.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {epic.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{epic.projectName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(epic.status)}>
                        {epic.status
                          ? epic.status.replace('-', ' ')
                          : 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>{epic.estimatedEffort || 'Not set'}</TableCell>
                    <TableCell>{epic.targetEndDate || 'Not set'}</TableCell>
                    <TableCell>{epic.releaseName || 'No release'}</TableCell>
                    {showMvpLine && (
                      <TableCell>{epic.mvpPriority || 'Not set'}</TableCell>
                    )}
                    {showReleaseLine && (
                      <TableCell>{epic.releasePriority || 'Not set'}</TableCell>
                    )}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditEpic(epic)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <EpicDialog
          isOpen={isEpicDialogOpen}
          onClose={() => setIsEpicDialogOpen(false)}
          epic={selectedEpic}
          projectId={selectedEpic?.projectId} // Only pass projectId if editing existing epic
        />

        <ReleaseDialog
          isOpen={isReleaseDialogOpen}
          onClose={() => setIsReleaseDialogOpen(false)}
          release={null}
        />

        <EpicRankingDialog
          isOpen={isRankingDialogOpen}
          onClose={() => setIsRankingDialogOpen(false)}
        />
      </div>
    </div>
  );
};

export default Epics;
