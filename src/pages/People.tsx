
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, Search, DollarSign, Building } from 'lucide-react';
import PersonDialog from '@/components/teams/PersonDialog';
import PeopleTable from '@/components/people/PeopleTable';
import DivisionTable from '@/components/divisions/DivisionTable';
import DivisionDialog from '@/components/divisions/DivisionDialog';
import { Person, Division } from '@/types';
import { useToast } from '@/hooks/use-toast';

const People = () => {
  const { 
    people, setPeople, 
    divisions, setDivisions, 
    teams, roles, 
    isSetupComplete 
  } = useApp();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<string>('all');
  const [isPersonDialogOpen, setIsPersonDialogOpen] = useState(false);
  const [isDivisionDialogOpen, setIsDivisionDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | undefined>();
  const [editingDivision, setEditingDivision] = useState<Division | undefined>();

  if (!isSetupComplete) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Required</h2>
          <p className="text-gray-600 mb-6">
            Please complete the initial setup to manage people and divisions.
          </p>
        </div>
      </div>
    );
  }

  const filteredPeople = people.filter(person => {
    const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = selectedTeam === 'all' || person.teamId === selectedTeam;
    const team = teams.find(t => t.id === person.teamId);
    const matchesDivision = selectedDivision === 'all' || team?.divisionId === selectedDivision;
    const matchesEmploymentType = selectedEmploymentType === 'all' || person.employmentType === selectedEmploymentType;
    
    return matchesSearch && matchesTeam && matchesDivision && matchesEmploymentType;
  });

  const activePeople = people.filter(person => person.isActive);
  const permanentStaff = people.filter(person => person.employmentType === 'permanent');
  const contractors = people.filter(person => person.employmentType === 'contractor');

  const handleSavePerson = (personData: Omit<Person, 'id'> & { id?: string }) => {
    if (personData.id) {
      setPeople(prev => prev.map(p => p.id === personData.id ? { ...personData, id: personData.id } as Person : p));
      toast({
        title: "Person Updated",
        description: `${personData.name} has been updated successfully.`,
      });
    } else {
      const newPerson: Person = {
        ...personData,
        id: crypto.randomUUID(),
      } as Person;
      setPeople(prev => [...prev, newPerson]);
      toast({
        title: "Person Added",
        description: `${personData.name} has been added successfully.`,
      });
    }
    setEditingPerson(undefined);
  };

  const handleSaveDivision = (divisionData: Omit<Division, 'id'> & { id?: string }) => {
    if (divisionData.id) {
      setDivisions(prev => prev.map(d => d.id === divisionData.id ? { ...divisionData, id: divisionData.id } as Division : d));
      toast({
        title: "Division Updated",
        description: `${divisionData.name} has been updated successfully.`,
      });
    } else {
      const newDivision: Division = {
        ...divisionData,
        id: crypto.randomUUID(),
      } as Division;
      setDivisions(prev => [...prev, newDivision]);
      toast({
        title: "Division Created",
        description: `${divisionData.name} has been created successfully.`,
      });
    }
    setEditingDivision(undefined);
  };

  const handleEditPerson = (personId: string) => {
    const person = people.find(p => p.id === personId);
    setEditingPerson(person);
    setIsPersonDialogOpen(true);
  };

  const handleEditDivision = (divisionId: string) => {
    const division = divisions.find(d => d.id === divisionId);
    setEditingDivision(division);
    setIsDivisionDialogOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">People & Divisions</h1>
          <p className="text-gray-600">
            Manage people, their roles, compensation, and organizational structure
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total People</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{people.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active People</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePeople.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permanent Staff</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permanentStaff.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contractors</CardTitle>
            <Building className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contractors.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="people" className="space-y-6">
        <TabsList>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="divisions">Divisions</TabsTrigger>
        </TabsList>

        <TabsContent value="people" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 mr-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search people..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Teams</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Divisions</option>
                {divisions.map(division => (
                  <option key={division.id} value={division.id}>
                    {division.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedEmploymentType}
                onChange={(e) => setSelectedEmploymentType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="permanent">Permanent</option>
                <option value="contractor">Contractor</option>
              </select>
            </div>
            <Button onClick={() => {
              setEditingPerson(undefined);
              setIsPersonDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Person
            </Button>
          </div>

          <PeopleTable people={filteredPeople} onEditPerson={handleEditPerson} />
        </TabsContent>

        <TabsContent value="divisions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Divisions</h2>
            <Button onClick={() => {
              setEditingDivision(undefined);
              setIsDivisionDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Division
            </Button>
          </div>

          <DivisionTable divisions={divisions} onEditDivision={handleEditDivision} />
        </TabsContent>
      </Tabs>

      <PersonDialog
        open={isPersonDialogOpen}
        onOpenChange={setIsPersonDialogOpen}
        person={editingPerson}
        onSave={handleSavePerson}
      />

      <DivisionDialog
        open={isDivisionDialogOpen}
        onOpenChange={setIsDivisionDialogOpen}
        division={editingDivision}
        onSave={handleSaveDivision}
      />
    </div>
  );
};

export default People;
