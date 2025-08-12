import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTeams } from '@/context/TeamContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Grid, Table, Eye, Star } from 'lucide-react';
import PeopleTable from '@/components/people/PeopleTable';
import PersonDialog from '@/components/teams/PersonDialog';
import PersonSkillsDisplay from '@/components/people/PersonSkillsDisplay';
import { StorageStatusIndicator } from '@/components/ui/storage-status-indicator';
import { Person } from '@/types';
import SearchAndFilter from '@/components/planning/SearchAndFilter';

const People = () => {
  const { people, roles, teams, addPerson, updatePerson, divisions } = useApp();
  const { isPeopleLoading, peopleError, peopleStorageStats } = useTeams();
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [filters, setFilters] = useState({
    searchQuery: '',
    roleId: 'all',
    teamId: 'all',
    divisionId: 'all',
    status: 'all',
  });

  const filteredPeople = people.filter(person => {
    const team = teams.find(t => t.id === person.teamId);
    const division = divisions.find(d => d.id === team?.divisionId);

    return (
      (filters.searchQuery === '' ||
        person.name
          .toLowerCase()
          .includes(filters.searchQuery.toLowerCase())) &&
      (filters.roleId === 'all' || person.roleId === filters.roleId) &&
      (filters.teamId === 'all' || person.teamId === filters.teamId) &&
      (filters.divisionId === 'all' || division?.id === filters.divisionId) &&
      (filters.status === 'all' ||
        (filters.status === 'active' && person.isActive) ||
        (filters.status === 'inactive' && !person.isActive))
    );
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

  const getStatusCounts = () => {
    return {
      active: people.filter(p => p.isActive).length,
      inactive: people.filter(p => !p.isActive).length,
    };
  };

  const statusCounts = getStatusCounts();

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
                isLoading={isPeopleLoading}
                error={peopleError}
                stats={peopleStorageStats}
                itemCount={people.length}
                dataType="people"
              />
            </div>
            <p className="text-gray-600">
              Manage your team members and their skills
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <Table className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('card')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handleCreatePerson}>
              <Plus className="h-4 w-4 mr-2" />
              Add Person
            </Button>
          </div>
        </div>

        <SearchAndFilter
          filters={filters}
          onFiltersChange={setFilters}
          filterFields={[
            {
              id: 'searchQuery',
              label: 'Search',
              type: 'text',
              placeholder: 'Search people...',
            },
            {
              id: 'roleId',
              label: 'Role',
              type: 'select',
              options: roles.map(r => ({ value: r.id, label: r.name })),
            },
            {
              id: 'teamId',
              label: 'Team',
              type: 'select',
              options: teams.map(t => ({ value: t.id, label: t.name })),
            },
            {
              id: 'divisionId',
              label: 'Division',
              type: 'select',
              options: divisions.map(d => ({ value: d.id, label: d.name })),
            },
            {
              id: 'status',
              label: 'Status',
              type: 'select',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ],
            },
          ]}
        />

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.active}</div>
              <Badge className="mt-1 bg-green-500">Active</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.inactive}</div>
              <Badge variant="secondary" className="mt-1">
                Inactive
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* People List */}
        {viewMode === 'table' ? (
          <PeopleTable
            people={filteredPeople}
            onEditPerson={handleEditPerson}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPeople.map(person => {
              const role = roles.find(r => r.id === person.roleId);
              const team = teams.find(t => t.id === person.teamId);

              return (
                <Card
                  key={person.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{person.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPerson(person.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">
                        {role?.name || 'No role'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {team?.name || 'No team'}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status:</span>
                        <Badge
                          variant={person.isActive ? 'default' : 'secondary'}
                        >
                          {person.isActive ? 'active' : 'inactive'}
                        </Badge>
                      </div>
                      <div>
                        <div className="flex items-center mb-2">
                          <Star className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">Skills:</span>
                        </div>
                        <PersonSkillsDisplay personId={person.id} compact />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Dialogs */}
        <PersonDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          person={undefined}
          onSave={handleSavePerson}
        />
        <PersonDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          person={selectedPerson}
          onSave={handleSavePerson}
        />
      </div>
    </div>
  );
};

export default People;
