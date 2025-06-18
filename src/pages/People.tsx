
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Grid, Table, Eye, Star } from 'lucide-react';
import PeopleTable from '@/components/people/PeopleTable';
import PersonDialog from '@/components/teams/PersonDialog';
import PersonSkillsDisplay from '@/components/people/PersonSkillsDisplay';
import { Person } from '@/types';

const People = () => {
  const { people, roles, teams, addPerson, updatePerson } = useApp();
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

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

  const handleSavePerson = (personData: Omit<Person, 'id'> & { id?: string }) => {
    if (personData.id) {
      updatePerson(personData.id, personData);
    } else {
      addPerson(personData);
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">People</h1>
          <p className="text-gray-600">Manage your team members and their skills</p>
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
            <Badge variant="secondary" className="mt-1">Inactive</Badge>
          </CardContent>
        </Card>
      </div>

      {/* People List */}
      {viewMode === 'table' ? (
        <PeopleTable people={people} onEditPerson={handleEditPerson} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {people.map((person) => {
            const role = roles.find(r => r.id === person.roleId);
            const team = teams.find(t => t.id === person.teamId);
            
            return (
              <Card key={person.id} className="hover:shadow-lg transition-shadow">
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
                    <p className="text-sm text-gray-600">{role?.name || 'No role'}</p>
                    <p className="text-sm text-gray-500">{team?.name || 'No team'}</p>
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
  );
};

export default People;
