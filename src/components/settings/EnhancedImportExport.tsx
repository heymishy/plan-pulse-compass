import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parseEnhancedPeopleCSV, parseTeamsWithDivisionsCSV, exportEnhancedPeopleCSV, exportTeamsWithDivisionsCSV, downloadCSV } from '@/utils/enhancedCsvUtils';

const EnhancedImportExport = () => {
  const { 
    people, setPeople, 
    teams, setTeams, 
    divisions, setDivisions,
    roles, setRoles,
    skills, setSkills, 
    personSkills, setPersonSkills 
  } = useApp();
  
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleEnhancedPeopleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = parseEnhancedPeopleCSV(text);
      
      // Merge with existing data
      setPeople(prev => [...prev, ...result.people]);
      setTeams(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        const newTeams = result.teams.filter(t => !existingIds.has(t.id));
        return [...prev, ...newTeams];
      });
      setDivisions(prev => {
        const existingIds = new Set(prev.map(d => d.id));
        const newDivisions = result.divisions.filter(d => !existingIds.has(d.id));
        return [...prev, ...newDivisions];
      });
      setRoles(prev => {
        const existingIds = new Set(prev.map(r => r.id));
        const newRoles = result.roles.filter(r => !existingIds.has(r.id));
        return [...prev, ...newRoles];
      });
      setSkills(prev => {
        const existingIds = new Set(prev.map(s => s.id));
        const newSkills = result.skills.filter(s => !existingIds.has(s.id));
        return [...prev, ...newSkills];
      });
      setPersonSkills(prev => [...prev, ...result.personSkills]);
      
      setImportStatus({
        type: 'success',
        message: `Successfully imported ${result.people.length} people, ${result.teams.length} teams, ${result.divisions.length} divisions, ${result.skills.length} skills, and ${result.personSkills.length} skill assignments.`
      });
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
    
    // Reset file input
    event.target.value = '';
  };

  const handleTeamsImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = parseTeamsWithDivisionsCSV(text);
      
      setTeams(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        const newTeams = result.teams.filter(t => !existingIds.has(t.id));
        return [...prev, ...newTeams];
      });
      setDivisions(prev => {
        const existingIds = new Set(prev.map(d => d.id));
        const newDivisions = result.divisions.filter(d => !existingIds.has(d.id));
        return [...prev, ...newDivisions];
      });
      
      setImportStatus({
        type: 'success',
        message: `Successfully imported ${result.teams.length} teams and ${result.divisions.length} divisions.`
      });
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
    
    event.target.value = '';
  };

  const handleExportEnhancedPeople = () => {
    const csvContent = exportEnhancedPeopleCSV(people, teams, divisions, roles, skills, personSkills);
    downloadCSV(csvContent, 'enhanced-people-export.csv');
  };

  const handleExportTeamsWithDivisions = () => {
    const csvContent = exportTeamsWithDivisionsCSV(teams, divisions);
    downloadCSV(csvContent, 'teams-divisions-export.csv');
  };

  const downloadSampleCSV = (filename: string, content: string) => {
    downloadCSV(content, filename);
  };

  const sampleEnhancedPeople = `name,email,role,team_name,team_id,employment_type,annual_salary,hourly_rate,daily_rate,start_date,end_date,is_active,skills,skill_proficiencies,years_experience,certifications,division_name,division_id,team_capacity
John Smith,john.smith@company.com,Senior Developer,Frontend Team,team-1,permanent,120000,,,2023-01-15,,true,React;JavaScript;TypeScript,expert;advanced;advanced,5;7;3,React Certification,Engineering,div-eng,40
Jane Doe,jane.doe@company.com,Consultant,Advisory Team,team-2,contractor,,150,1200,2023-03-01,2024-03-01,true,Strategy;Business Analysis,expert;advanced,10;8,,Consulting,div-consult,35`;

  const sampleTeamsWithDivisions = `team_id,team_name,division_id,division_name,capacity,division_budget,division_description
team-1,Frontend Team,div-eng,Engineering,40,500000,Software development and engineering
team-2,Backend Team,div-eng,Engineering,40,500000,Software development and engineering
team-3,Design Team,div-design,Design,35,200000,User experience and visual design`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="mr-2 h-5 w-5" />
          Enhanced Import & Export
        </CardTitle>
      </CardHeader>
      <CardContent>
        {importStatus.type && (
          <Alert className={`mb-4 ${importStatus.type === 'error' ? 'border-red-200' : 'border-green-200'}`}>
            {importStatus.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription className={importStatus.type === 'error' ? 'text-red-700' : 'text-green-700'}>
              {importStatus.message}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Import Data</TabsTrigger>
            <TabsTrigger value="export">Export Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="import" className="space-y-6">
            <div className="space-y-4">
              {/* Enhanced People Import */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="enhancedPeopleCSV">Enhanced People CSV</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadSampleCSV('enhanced-people-sample.csv', sampleEnhancedPeople)}
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Sample
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  Comprehensive format with employment, financial, skills, and team data
                </p>
                <Input
                  id="enhancedPeopleCSV"
                  type="file"
                  accept=".csv"
                  onChange={handleEnhancedPeopleImport}
                />
              </div>

              {/* Teams with Divisions Import */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="teamsCSV">Teams & Divisions CSV</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadSampleCSV('teams-divisions-sample.csv', sampleTeamsWithDivisions)}
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Sample
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  Teams with division hierarchy and capacity information
                </p>
                <Input
                  id="teamsCSV"
                  type="file"
                  accept=".csv"
                  onChange={handleTeamsImport}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="export" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="flex items-center justify-center"
                onClick={handleExportEnhancedPeople}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Enhanced People
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center justify-center"
                onClick={handleExportTeamsWithDivisions}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Teams & Divisions
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EnhancedImportExport;
