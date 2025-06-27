import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Database,
  Users,
  Building2,
  UserCheck,
  Settings,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import {
  loadSampleData,
  getDataSummary,
  validateLoadedData,
} from '@/utils/dataLoader';
import { sampleData } from '@/data/sampleData';

const DataInitialization = () => {
  const {
    setDivisions,
    setTeams,
    setPeople,
    setRoles,
    setCycles,
    setRunWorkCategories,
    setSkills,
    setPersonSkills,
    setSolutions,
    setConfig,
    setIsSetupComplete,
    // Current data for comparison
    divisions,
    teams,
    people,
    roles,
    cycles,
    runWorkCategories,
    skills,
    personSkills,
    solutions,
    config,
  } = useApp();

  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
  } | null>(null);

  const handleLoadSampleData = async () => {
    if (
      confirm(
        'This will load comprehensive sample data including 50 teams across 4 divisions. This action will replace any existing data. Continue?'
      )
    ) {
      setIsLoading(true);

      try {
        // Load sample data
        const loadedData = loadSampleData({
          loadSampleData: true,
          includeSkills: true,
          includeSolutions: true,
          includeCycles: true,
          includeRunWorkCategories: true,
        });

        // Validate the data
        const validation = validateLoadedData(loadedData);
        setValidationResult(validation);

        if (validation.isValid) {
          // Update context with loaded data
          setDivisions(loadedData.divisions);
          setTeams(loadedData.teams);
          setPeople(loadedData.people);
          setRoles(loadedData.roles);

          if (loadedData.cycles) setCycles(loadedData.cycles);
          if (loadedData.runWorkCategories)
            setRunWorkCategories(loadedData.runWorkCategories);
          if (loadedData.skills) setSkills(loadedData.skills);
          if (loadedData.personSkills) setPersonSkills(loadedData.personSkills);
          if (loadedData.solutions) setSolutions(loadedData.solutions);
          if (loadedData.config) setConfig(loadedData.config);

          // Mark setup as complete
          setIsSetupComplete(true);

          toast({
            title: 'Sample Data Loaded Successfully',
            description: `Loaded ${loadedData.divisions.length} divisions, ${loadedData.teams.length} teams, and ${loadedData.people.length} people.`,
          });
        } else {
          toast({
            title: 'Data Validation Failed',
            description:
              'Some data validation errors were found. Check the details below.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error loading sample data:', error);
        toast({
          title: 'Error Loading Data',
          description: 'An error occurred while loading the sample data.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleLoadTestData = async () => {
    if (
      confirm(
        'This will load a smaller test dataset for development and testing. This action will replace any existing data. Continue?'
      )
    ) {
      setIsLoading(true);

      try {
        // Load test data (smaller subset)
        const loadedData = loadSampleData({
          loadSampleData: true,
          includeSkills: true,
          includeSolutions: true,
          includeCycles: true,
          includeRunWorkCategories: true,
        });

        // Take only first 2 divisions and their teams
        const testDivisions = loadedData.divisions.slice(0, 2);
        const testTeams = loadedData.teams.filter(team =>
          testDivisions.some(div => div.id === team.divisionId)
        );
        const testPeople = loadedData.people.filter(person =>
          testTeams.some(team => team.id === person.teamId)
        );

        const testData = {
          ...loadedData,
          divisions: testDivisions,
          teams: testTeams,
          people: testPeople,
        };

        // Validate the data
        const validation = validateLoadedData(testData);
        setValidationResult(validation);

        if (validation.isValid) {
          // Update context with test data
          setDivisions(testData.divisions);
          setTeams(testData.teams);
          setPeople(testData.people);
          setRoles(testData.roles);

          if (testData.cycles) setCycles(testData.cycles);
          if (testData.runWorkCategories)
            setRunWorkCategories(testData.runWorkCategories);
          if (testData.skills) setSkills(testData.skills);
          if (testData.personSkills) setPersonSkills(testData.personSkills);
          if (testData.solutions) setSolutions(testData.solutions);
          if (testData.config) setConfig(testData.config);

          // Mark setup as complete
          setIsSetupComplete(true);

          toast({
            title: 'Test Data Loaded Successfully',
            description: `Loaded ${testData.divisions.length} divisions, ${testData.teams.length} teams, and ${testData.people.length} people.`,
          });
        } else {
          toast({
            title: 'Data Validation Failed',
            description:
              'Some data validation errors were found. Check the details below.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error loading test data:', error);
        toast({
          title: 'Error Loading Data',
          description: 'An error occurred while loading the test data.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getCurrentDataSummary = () => {
    return {
      divisions: divisions.length,
      teams: teams.length,
      people: people.length,
      roles: roles.length,
      cycles: cycles.length,
      runWorkCategories: runWorkCategories.length,
      skills: skills.length,
      personSkills: personSkills.length,
      solutions: solutions.length,
    };
  };

  const getSampleDataSummary = () => {
    return getDataSummary(sampleData);
  };

  const currentSummary = getCurrentDataSummary();
  const sampleSummary = getSampleDataSummary();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Initialization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This tool allows you to load comprehensive sample data for the
              banking application. The sample data includes 50 teams across 4
              divisions with realistic team structures.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Data Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Current Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Divisions: {currentSummary.divisions}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Teams: {currentSummary.teams}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    People: {currentSummary.people}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Roles: {currentSummary.roles}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Skills: {currentSummary.skills}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Sample Data Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Sample Data Available
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Divisions: {sampleSummary.divisions}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Teams: {sampleSummary.teams}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    People: {sampleSummary.people}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Roles: {sampleSummary.roles}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Skills: {sampleSummary.skills}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleLoadSampleData}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Load Full Sample Data
                </>
              )}
            </Button>

            <Button
              onClick={handleLoadTestData}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Load Test Data
                </>
              )}
            </Button>
          </div>

          {/* Sample Data Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Sample Data Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Divisions</h4>
                <div className="flex flex-wrap gap-2">
                  {sampleData.divisions.map(division => (
                    <Badge key={division.id} variant="secondary">
                      {division.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Team Distribution</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {sampleData.divisions.map(division => {
                    const teamCount = sampleData.teams.filter(
                      team => team.divisionId === division.id
                    ).length;
                    return (
                      <div key={division.id} className="text-center">
                        <div className="text-2xl font-bold">{teamCount}</div>
                        <div className="text-xs text-muted-foreground">
                          {division.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Roles</h4>
                <div className="flex flex-wrap gap-2">
                  {sampleData.roles.map(role => (
                    <Badge key={role.id} variant="outline">
                      {role.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation Results */}
          {validationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {validationResult.isValid ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Data Validation Passed
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      Data Validation Failed
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              {!validationResult.isValid &&
                validationResult.errors.length > 0 && (
                  <CardContent>
                    <div className="space-y-2">
                      {validationResult.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-600">
                          • {error}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataInitialization;
