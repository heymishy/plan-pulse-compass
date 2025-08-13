import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Grid, Table, Eye, Star, Search, Filter } from 'lucide-react';
import OptimizedPeopleTable from '@/components/people/OptimizedPeopleTable';
import PersonDialog from '@/components/teams/PersonDialog';
import PersonSkillsDisplay from '@/components/people/PersonSkillsDisplay';
import { StorageStatusIndicator } from '@/components/ui/storage-status-indicator';
import PerformanceMonitor from '@/components/ui/PerformanceMonitor';
import PaginationControls from '@/components/ui/PaginationControls';
import { Person } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const OptimizedPeople = () => {
  const { people, roles, teams, addPerson, updatePerson, divisions } = useApp();
  const [viewMode, setViewMode] = useState<'table' | 'paginated'>('paginated');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    roleId: 'all',
    teamId: 'all',
    divisionId: 'all',
    status: 'all',
  });

  // Debounce search for better performance
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Memoized filtered people
  const filteredPeople = useMemo(() => {
    return people.filter(person => {
      const team = teams.find(t => t.id === person.teamId);
      const division = divisions.find(d => d.id === team?.divisionId);

      return (
        (debouncedSearch === '' ||
          person.name.toLowerCase().includes(debouncedSearch.toLowerCase())) &&
        (filters.roleId === 'all' || person.roleId === filters.roleId) &&
        (filters.teamId === 'all' || person.teamId === filters.teamId) &&
        (filters.divisionId === 'all' || division?.id === filters.divisionId) &&
        (filters.status === 'all' ||
          (filters.status === 'active' && person.isActive) ||
          (filters.status === 'inactive' && !person.isActive))
      );
    });
  }, [people, teams, divisions, debouncedSearch, filters]);

  // Pagination for large datasets
  const pagination = usePagination(filteredPeople, {
    initialPageSize: 50, // Start with 50 items per page
  });

  const handleCreatePerson = () => {
    setSelectedPerson(null);
    setIsCreateDialogOpen(true);
  };

  const handleEditPerson = (personId: string) => {
    const person = people.find(p => p.id === personId);
    if (person) {
      setSelectedPerson(person);
      setIsEditDialogOpen(true);
    }
  };

  const handleSavePerson = (
    personData: Omit<Person, 'id'> & { id?: string }
  ) => {
    if (personData.id) {
      updatePerson(personData.id, personData);
      return { ...personData, id: personData.id } as Person;
    } else {
      const createdPerson = addPerson(personData);
      return createdPerson;
    }
  };

  const getStatusCounts = useMemo(() => {
    return {
      active: people.filter(p => p.isActive).length,
      inactive: people.filter(p => !p.isActive).length,
    };
  }, [people]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div
        className="flex-1 p-6 space-y-6 w-full overflow-auto"
        data-testid="people-content"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">People</h1>
              <StorageStatusIndicator
                isLoading={false}
                error={null}
                stats={{ size: 0, lastModified: Date.now() }}
                itemCount={people.length}
                dataType="people"
              />
            </div>
            <p className="text-gray-600">
              Manage your team members and their information
            </p>
          </div>
          <Button onClick={handleCreatePerson}>
            <Plus className="h-4 w-4 mr-2" />
            Add Person
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total People
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {people.length.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">All team members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Star className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {getStatusCounts.active.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <Star className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {getStatusCounts.inactive.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently inactive
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Filtered</CardTitle>
              <Filter className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {filteredPeople.length.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Current results</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              <Select
                value={filters.roleId}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, roleId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.teamId}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, teamId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.divisionId}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, divisionId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Divisions" />
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

              <Select
                value={filters.status}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <Table className="h-4 w-4 mr-1" />
              Virtualized
            </Button>
            <Button
              variant={viewMode === 'paginated' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('paginated')}
            >
              <Grid className="h-4 w-4 mr-1" />
              Paginated
            </Button>
            <Badge variant="secondary" className="ml-2">
              {filteredPeople.length.toLocaleString()} results
            </Badge>
          </div>

          {people.length > 1000 && (
            <Badge variant="destructive">
              Large Dataset - Performance Mode Active
            </Badge>
          )}
        </div>

        {/* Data Table */}
        <Card>
          <CardContent className="p-0">
            {viewMode === 'table' ? (
              <OptimizedPeopleTable
                people={filteredPeople}
                onEditPerson={handleEditPerson}
                searchTerm={debouncedSearch}
                filters={filters}
              />
            ) : (
              <div>
                <OptimizedPeopleTable
                  people={pagination.paginatedItems}
                  onEditPerson={handleEditPerson}
                  searchTerm={debouncedSearch}
                  filters={filters}
                />
                <PaginationControls
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  pageSize={pagination.pageSize}
                  totalItems={pagination.totalItems}
                  hasNextPage={pagination.hasNextPage}
                  hasPrevPage={pagination.hasPrevPage}
                  onPageChange={pagination.goToPage}
                  onPageSizeChange={pagination.setPageSize}
                  pageSizeOptions={[25, 50, 100, 200]}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Tip */}
        {people.length > 500 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <Eye className="h-4 w-4" />
              <span className="font-medium">Performance Tip</span>
            </div>
            <p className="text-blue-700 text-sm mt-1">
              Large dataset detected ({people.length.toLocaleString()} people).
              Use "Virtualized" mode for better performance with large lists, or
              "Paginated" mode to reduce memory usage.
            </p>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <PersonDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSave={handleSavePerson}
        mode="create"
      />

      <PersonDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSavePerson}
        person={selectedPerson}
        mode="edit"
      />

      {/* Performance Monitor for development */}
      <PerformanceMonitor enabled={people.length > 100} showDetails={true} />
    </div>
  );
};

export default OptimizedPeople;
