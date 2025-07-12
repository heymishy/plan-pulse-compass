import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Filter,
  X,
  Settings,
  Save,
  BookOpen,
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import { Team, Project, Epic, Division, Allocation } from '@/types';

export interface SearchFilters {
  searchQuery: string;
  selectedDivisionIds: string[];
  selectedTeamIds: string[];
  selectedProjectIds: string[];
  selectedEpicIds: string[];
  allocationStatus:
    | 'all'
    | 'allocated'
    | 'unallocated'
    | 'overallocated'
    | 'optimal';
  dateRange: 'all' | 'current-quarter' | 'next-quarter' | 'current-fy';
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: SearchFilters;
  isDefault?: boolean;
}

interface SearchAndFilterProps {
  teams: Team[];
  projects: Project[];
  epics: Epic[];
  divisions: Division[];
  allocations: Allocation[];
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  presets: FilterPreset[];
  onPresetSave: (preset: Omit<FilterPreset, 'id'>) => void;
  onPresetLoad: (preset: FilterPreset) => void;
  onPresetDelete: (presetId: string) => void;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  teams,
  projects,
  epics,
  divisions,
  allocations,
  filters,
  onFiltersChange,
  presets,
  onPresetSave,
  onPresetLoad,
  onPresetDelete,
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false);

  // Search functionality
  const searchResults = useMemo(() => {
    if (!filters.searchQuery.trim()) return null;

    const query = filters.searchQuery.toLowerCase();
    const results = {
      teams: teams.filter(team => team.name.toLowerCase().includes(query)),
      projects: projects.filter(
        project =>
          project.name.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query)
      ),
      epics: epics.filter(
        epic =>
          epic.name.toLowerCase().includes(query) ||
          epic.description?.toLowerCase().includes(query)
      ),
    };

    return results;
  }, [filters.searchQuery, teams, projects, epics]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.selectedDivisionIds.length > 0) count++;
    if (filters.selectedTeamIds.length > 0) count++;
    if (filters.selectedProjectIds.length > 0) count++;
    if (filters.selectedEpicIds.length > 0) count++;
    if (filters.allocationStatus !== 'all') count++;
    if (filters.dateRange !== 'all') count++;
    return count;
  }, [filters]);

  const updateFilters = (updates: Partial<SearchFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchQuery: '',
      selectedDivisionIds: [],
      selectedTeamIds: [],
      selectedProjectIds: [],
      selectedEpicIds: [],
      allocationStatus: 'all',
      dateRange: 'all',
    });
  };

  const handlePresetSave = () => {
    if (!presetName.trim()) return;

    onPresetSave({
      name: presetName,
      filters: { ...filters },
    });

    setPresetName('');
    setIsPresetDialogOpen(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'allocated':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'unallocated':
        return <Calendar className="h-4 w-4 text-gray-500" />;
      case 'overallocated':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'optimal':
        return <Target className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-purple-500" />
            <span>Search & Filter</span>
          </div>
          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">
                {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search teams, projects, epics..."
            value={filters.searchQuery}
            onChange={e => updateFilters({ searchQuery: e.target.value })}
            className="pl-10"
          />
          {filters.searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0"
              onClick={() => updateFilters({ searchQuery: '' })}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search Results */}
        {searchResults && filters.searchQuery && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="text-sm font-medium text-gray-700">
              Search Results
            </div>

            {searchResults.teams.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Teams ({searchResults.teams.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {searchResults.teams.slice(0, 5).map(team => (
                    <Button
                      key={team.id}
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 px-2"
                      onClick={() => {
                        const newIds = filters.selectedTeamIds.includes(team.id)
                          ? filters.selectedTeamIds.filter(id => id !== team.id)
                          : [...filters.selectedTeamIds, team.id];
                        updateFilters({ selectedTeamIds: newIds });
                      }}
                    >
                      <Users className="h-3 w-3 mr-1" />
                      {team.name}
                    </Button>
                  ))}
                  {searchResults.teams.length > 5 && (
                    <span className="text-xs text-gray-500 self-center">
                      +{searchResults.teams.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {searchResults.projects.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Projects ({searchResults.projects.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {searchResults.projects.slice(0, 5).map(project => (
                    <Button
                      key={project.id}
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 px-2"
                      onClick={() => {
                        const newIds = filters.selectedProjectIds.includes(
                          project.id
                        )
                          ? filters.selectedProjectIds.filter(
                              id => id !== project.id
                            )
                          : [...filters.selectedProjectIds, project.id];
                        updateFilters({ selectedProjectIds: newIds });
                      }}
                    >
                      <Target className="h-3 w-3 mr-1" />
                      {project.name}
                    </Button>
                  ))}
                  {searchResults.projects.length > 5 && (
                    <span className="text-xs text-gray-500 self-center">
                      +{searchResults.projects.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {searchResults.epics.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Epics ({searchResults.epics.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {searchResults.epics.slice(0, 5).map(epic => (
                    <Button
                      key={epic.id}
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 px-2"
                      onClick={() => {
                        const newIds = filters.selectedEpicIds.includes(epic.id)
                          ? filters.selectedEpicIds.filter(id => id !== epic.id)
                          : [...filters.selectedEpicIds, epic.id];
                        updateFilters({ selectedEpicIds: newIds });
                      }}
                    >
                      <BookOpen className="h-3 w-3 mr-1" />
                      {epic.name}
                    </Button>
                  ))}
                  {searchResults.epics.length > 5 && (
                    <span className="text-xs text-gray-500 self-center">
                      +{searchResults.epics.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {searchResults.teams.length === 0 &&
              searchResults.projects.length === 0 &&
              searchResults.epics.length === 0 && (
                <div className="text-sm text-gray-500">No results found</div>
              )}
          </div>
        )}

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.allocationStatus}
            onValueChange={(value: SearchFilters['allocationStatus']) =>
              updateFilters({ allocationStatus: value })
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="allocated">
                <div className="flex items-center space-x-2">
                  {getStatusIcon('allocated')}
                  <span>Allocated</span>
                </div>
              </SelectItem>
              <SelectItem value="unallocated">
                <div className="flex items-center space-x-2">
                  {getStatusIcon('unallocated')}
                  <span>Unallocated</span>
                </div>
              </SelectItem>
              <SelectItem value="overallocated">
                <div className="flex items-center space-x-2">
                  {getStatusIcon('overallocated')}
                  <span>Over-allocated</span>
                </div>
              </SelectItem>
              <SelectItem value="optimal">
                <div className="flex items-center space-x-2">
                  {getStatusIcon('optimal')}
                  <span>Optimal</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.dateRange}
            onValueChange={(value: SearchFilters['dateRange']) =>
              updateFilters({ dateRange: value })
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="current-quarter">Current Quarter</SelectItem>
              <SelectItem value="next-quarter">Next Quarter</SelectItem>
              <SelectItem value="current-fy">Current FY</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters */}
        {isAdvancedOpen && (
          <div className="border-t pt-4 space-y-4">
            <div className="text-sm font-medium">Advanced Filters</div>

            {/* Division Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Divisions
              </label>
              <div className="grid grid-cols-2 gap-2">
                {divisions.map(division => (
                  <label
                    key={division.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      checked={filters.selectedDivisionIds.includes(
                        division.id
                      )}
                      onCheckedChange={checked => {
                        const newIds = checked
                          ? [...filters.selectedDivisionIds, division.id]
                          : filters.selectedDivisionIds.filter(
                              id => id !== division.id
                            );
                        updateFilters({ selectedDivisionIds: newIds });
                      }}
                    />
                    <span className="text-sm">{division.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Team Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Teams
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {teams.map(team => (
                  <label key={team.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={filters.selectedTeamIds.includes(team.id)}
                      onCheckedChange={checked => {
                        const newIds = checked
                          ? [...filters.selectedTeamIds, team.id]
                          : filters.selectedTeamIds.filter(
                              id => id !== team.id
                            );
                        updateFilters({ selectedTeamIds: newIds });
                      }}
                    />
                    <span className="text-sm">{team.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filter Presets */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Filter Presets
            </label>
            <Popover
              open={isPresetDialogOpen}
              onOpenChange={setIsPresetDialogOpen}
            >
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Preset Name</label>
                    <Input
                      placeholder="My filter preset"
                      value={presetName}
                      onChange={e => setPresetName(e.target.value)}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handlePresetSave}
                      disabled={!presetName.trim()}
                    >
                      Save Preset
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setIsPresetDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-wrap gap-2">
            {presets.map(preset => (
              <div key={preset.id} className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPresetLoad(preset)}
                  className="text-xs"
                >
                  {preset.name}
                  {preset.isDefault && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      Default
                    </Badge>
                  )}
                </Button>
                {!preset.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPresetDelete(preset.id)}
                    className="ml-1 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {(activeFiltersCount > 0 || filters.searchQuery) && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm text-gray-600">
              {activeFiltersCount > 0 &&
                `${activeFiltersCount} active filter${activeFiltersCount !== 1 ? 's' : ''}`}
              {filters.searchQuery && activeFiltersCount > 0 && ' • '}
              {filters.searchQuery && 'Search active'}
            </div>
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchAndFilter;
