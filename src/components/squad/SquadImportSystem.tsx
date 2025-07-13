import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  Users,
  Target,
  X,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  Squad,
  UnmappedPerson,
  SquadMember,
  SquadType,
  SquadStatus,
  SquadMemberRole,
} from '@/types';

interface ImportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data: any[];
}

interface SquadImportData {
  squadName: string;
  squadType: SquadType;
  squadStatus: SquadStatus;
  capacity: number;
  members: {
    name: string;
    email: string;
    role: SquadMemberRole;
    allocation: number;
    skills?: string[];
  }[];
}

const SquadImportSystem: React.FC = () => {
  const {
    squads,
    people,
    addSquad,
    addSquadMember,
    addUnmappedPerson,
    addPerson,
  } = useApp();

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importMode, setImportMode] = useState<'csv' | 'json' | 'manual'>(
    'csv'
  );
  const [importData, setImportData] = useState('');
  const [validationResult, setValidationResult] =
    useState<ImportValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    squadsCreated: number;
    membersAdded: number;
    errors: string[];
  } | null>(null);

  // CSV template for download
  const csvTemplate = `Squad Name,Squad Type,Squad Status,Capacity,Member Name,Member Email,Member Role,Allocation,Skills
"Project Alpha",project,active,8,"John Doe",john.doe@company.com,lead,100,"React,TypeScript,Leadership"
"Project Alpha",project,active,8,"Jane Smith",jane.smith@company.com,member,80,"React,CSS,Testing"
"Initiative Beta",initiative,planning,6,"Bob Johnson",bob.johnson@company.com,advisor,50,"Product Management,Strategy"`;

  const jsonTemplate = {
    squads: [
      {
        squadName: 'Project Alpha',
        squadType: 'project',
        squadStatus: 'active',
        capacity: 8,
        members: [
          {
            name: 'John Doe',
            email: 'john.doe@company.com',
            role: 'lead',
            allocation: 100,
            skills: ['React', 'TypeScript', 'Leadership'],
          },
          {
            name: 'Jane Smith',
            email: 'jane.smith@company.com',
            role: 'member',
            allocation: 80,
            skills: ['React', 'CSS', 'Testing'],
          },
        ],
      },
    ],
  };

  const validateCSVData = useCallback(
    (csvText: string): ImportValidationResult => {
      const errors: string[] = [];
      const warnings: string[] = [];
      const data: SquadImportData[] = [];

      try {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) {
          errors.push(
            'CSV must contain at least a header row and one data row'
          );
          return { isValid: false, errors, warnings, data };
        }

        const headers = lines[0]
          .split(',')
          .map(h => h.replace(/"/g, '').trim());
        const expectedHeaders = [
          'Squad Name',
          'Squad Type',
          'Squad Status',
          'Capacity',
          'Member Name',
          'Member Email',
          'Member Role',
          'Allocation',
          'Skills',
        ];

        for (const header of expectedHeaders) {
          if (!headers.includes(header)) {
            errors.push(`Missing required header: ${header}`);
          }
        }

        if (errors.length > 0) {
          return { isValid: false, errors, warnings, data };
        }

        const squadsMap = new Map<string, SquadImportData>();

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i]
            .split(',')
            .map(v => v.replace(/"/g, '').trim());

          if (values.length !== headers.length) {
            warnings.push(`Row ${i + 1}: Incorrect number of columns`);
            continue;
          }

          const squadName = values[0];
          const squadType = values[1] as SquadType;
          const squadStatus = values[2] as SquadStatus;
          const capacity = parseInt(values[3]);
          const memberName = values[4];
          const memberEmail = values[5];
          const memberRole = values[6] as SquadMemberRole;
          const allocation = parseInt(values[7]);
          const skills = values[8]
            ? values[8].split(';').map(s => s.trim())
            : [];

          // Validate data
          if (!squadName) {
            errors.push(`Row ${i + 1}: Squad name is required`);
            continue;
          }

          if (
            !['project', 'initiative', 'workstream', 'feature-team'].includes(
              squadType
            )
          ) {
            errors.push(`Row ${i + 1}: Invalid squad type: ${squadType}`);
            continue;
          }

          if (
            !['planning', 'active', 'on-hold', 'completed'].includes(
              squadStatus
            )
          ) {
            errors.push(`Row ${i + 1}: Invalid squad status: ${squadStatus}`);
            continue;
          }

          if (isNaN(capacity) || capacity < 1) {
            errors.push(`Row ${i + 1}: Capacity must be a positive number`);
            continue;
          }

          if (!memberName || !memberEmail) {
            errors.push(`Row ${i + 1}: Member name and email are required`);
            continue;
          }

          if (
            !['lead', 'member', 'advisor', 'consultant'].includes(memberRole)
          ) {
            errors.push(`Row ${i + 1}: Invalid member role: ${memberRole}`);
            continue;
          }

          if (isNaN(allocation) || allocation < 0 || allocation > 100) {
            errors.push(`Row ${i + 1}: Allocation must be between 0 and 100`);
            continue;
          }

          // Build squad data
          if (!squadsMap.has(squadName)) {
            squadsMap.set(squadName, {
              squadName,
              squadType,
              squadStatus,
              capacity,
              members: [],
            });
          }

          const squad = squadsMap.get(squadName)!;
          squad.members.push({
            name: memberName,
            email: memberEmail,
            role: memberRole,
            allocation,
            skills,
          });
        }

        data.push(...Array.from(squadsMap.values()));

        // Additional validations
        for (const squad of data) {
          if (squad.members.length > squad.capacity) {
            warnings.push(
              `Squad "${squad.squadName}": ${squad.members.length} members exceed capacity of ${squad.capacity}`
            );
          }

          const leadCount = squad.members.filter(m => m.role === 'lead').length;
          if (leadCount === 0) {
            warnings.push(`Squad "${squad.squadName}": No lead assigned`);
          } else if (leadCount > 1) {
            warnings.push(
              `Squad "${squad.squadName}": Multiple leads assigned`
            );
          }
        }
      } catch (error) {
        errors.push(
          `CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        data,
      };
    },
    []
  );

  const validateJSONData = useCallback(
    (jsonText: string): ImportValidationResult => {
      const errors: string[] = [];
      const warnings: string[] = [];
      let data: SquadImportData[] = [];

      try {
        const parsed = JSON.parse(jsonText);

        if (!parsed.squads || !Array.isArray(parsed.squads)) {
          errors.push('JSON must contain a "squads" array');
          return { isValid: false, errors, warnings, data };
        }

        data = parsed.squads;

        for (let i = 0; i < data.length; i++) {
          const squad = data[i];

          if (!squad.squadName) {
            errors.push(`Squad ${i + 1}: Missing squadName`);
          }

          if (
            !['project', 'initiative', 'workstream', 'feature-team'].includes(
              squad.squadType
            )
          ) {
            errors.push(`Squad ${i + 1}: Invalid squadType`);
          }

          if (
            !['planning', 'active', 'on-hold', 'completed'].includes(
              squad.squadStatus
            )
          ) {
            errors.push(`Squad ${i + 1}: Invalid squadStatus`);
          }

          if (!squad.capacity || squad.capacity < 1) {
            errors.push(`Squad ${i + 1}: Invalid capacity`);
          }

          if (!squad.members || !Array.isArray(squad.members)) {
            errors.push(`Squad ${i + 1}: Missing or invalid members array`);
            continue;
          }

          for (let j = 0; j < squad.members.length; j++) {
            const member = squad.members[j];

            if (!member.name || !member.email) {
              errors.push(
                `Squad ${i + 1}, Member ${j + 1}: Missing name or email`
              );
            }

            if (
              !['lead', 'member', 'advisor', 'consultant'].includes(member.role)
            ) {
              errors.push(`Squad ${i + 1}, Member ${j + 1}: Invalid role`);
            }

            if (member.allocation < 0 || member.allocation > 100) {
              errors.push(
                `Squad ${i + 1}, Member ${j + 1}: Invalid allocation`
              );
            }
          }
        }
      } catch (error) {
        errors.push(
          `JSON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        data,
      };
    },
    []
  );

  const handleValidateData = useCallback(() => {
    if (!importData.trim()) {
      setValidationResult({
        isValid: false,
        errors: ['Please provide import data'],
        warnings: [],
        data: [],
      });
      return;
    }

    let result: ImportValidationResult;

    if (importMode === 'csv') {
      result = validateCSVData(importData);
    } else {
      result = validateJSONData(importData);
    }

    setValidationResult(result);
  }, [importData, importMode, validateCSVData, validateJSONData]);

  const handleImport = useCallback(async () => {
    if (!validationResult?.isValid || !validationResult.data.length) return;

    setIsProcessing(true);
    setProcessingProgress(0);

    const results = {
      squadsCreated: 0,
      membersAdded: 0,
      errors: [] as string[],
    };

    try {
      const totalSteps = validationResult.data.reduce(
        (sum, squad) => sum + 1 + squad.members.length,
        0
      );
      let currentStep = 0;

      for (const squadData of validationResult.data) {
        try {
          // Create squad
          const newSquad = addSquad({
            name: squadData.squadName,
            type: squadData.squadType,
            status: squadData.squadStatus,
            capacity: squadData.capacity,
            description: `Imported squad`,
            targetSkills: [],
            divisionId: '',
            projectIds: [],
            duration: {
              start: new Date().toISOString().split('T')[0],
              end: '',
            },
          });

          results.squadsCreated++;
          currentStep++;
          setProcessingProgress((currentStep / totalSteps) * 100);

          // Add members
          for (const memberData of squadData.members) {
            try {
              // Check if person exists
              let person = people.find(p => p.email === memberData.email);

              if (!person) {
                // Create as unmapped person first
                const unmappedPerson: Omit<
                  UnmappedPerson,
                  'id' | 'importedDate'
                > = {
                  name: memberData.name,
                  email: memberData.email,
                  skills: (memberData.skills || []).map(skillName => ({
                    skillId: `skill-${Date.now()}-${Math.random()}`,
                    skillName,
                    proficiency: 'intermediate' as const,
                  })),
                  availability: 100,
                  joinDate: new Date().toISOString().split('T')[0],
                };

                addUnmappedPerson(unmappedPerson);

                // Find the person we just created by email to get the ID
                // Note: In a real implementation, addUnmappedPerson should return the created person
                person = people.find(p => p.email === memberData.email);
              }

              if (person) {
                addSquadMember({
                  squadId: newSquad.id,
                  personId: person.id,
                  role: memberData.role,
                  allocation: memberData.allocation,
                  startDate: new Date().toISOString().split('T')[0],
                  isActive: true,
                });

                results.membersAdded++;
              }

              currentStep++;
              setProcessingProgress((currentStep / totalSteps) * 100);
            } catch (memberError) {
              results.errors.push(
                `Failed to add member ${memberData.name}: ${memberError instanceof Error ? memberError.message : 'Unknown error'}`
              );
            }
          }
        } catch (squadError) {
          results.errors.push(
            `Failed to create squad ${squadData.squadName}: ${squadError instanceof Error ? squadError.message : 'Unknown error'}`
          );
        }
      }
    } catch (error) {
      results.errors.push(
        `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    setIsProcessing(false);
    setImportResults(results);
  }, [validationResult, addSquad, addSquadMember, addUnmappedPerson, people]);

  const downloadTemplate = useCallback((format: 'csv' | 'json') => {
    const element = document.createElement('a');

    if (format === 'csv') {
      const file = new Blob([csvTemplate], { type: 'text/csv' });
      element.href = URL.createObjectURL(file);
      element.download = 'squad-import-template.csv';
    } else {
      const file = new Blob([JSON.stringify(jsonTemplate, null, 2)], {
        type: 'application/json',
      });
      element.href = URL.createObjectURL(file);
      element.download = 'squad-import-template.json';
    }

    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }, []);

  const resetImport = useCallback(() => {
    setImportData('');
    setValidationResult(null);
    setImportResults(null);
    setProcessingProgress(0);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Bulk Import System
          </CardTitle>
          <Dialog
            open={isImportDialogOpen}
            onOpenChange={setIsImportDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Import Squads
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Import Squads and Members</DialogTitle>
              </DialogHeader>

              <Tabs
                value={importMode}
                onValueChange={(value: any) => setImportMode(value)}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="csv">CSV Import</TabsTrigger>
                  <TabsTrigger value="json">JSON Import</TabsTrigger>
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                </TabsList>

                <TabsContent value="csv" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>CSV Data</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadTemplate('csv')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                  <Textarea
                    value={importData}
                    onChange={e => setImportData(e.target.value)}
                    placeholder="Paste your CSV data here..."
                    rows={10}
                    className="font-mono text-sm"
                  />
                </TabsContent>

                <TabsContent value="json" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>JSON Data</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadTemplate('json')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                  <Textarea
                    value={importData}
                    onChange={e => setImportData(e.target.value)}
                    placeholder="Paste your JSON data here..."
                    rows={10}
                    className="font-mono text-sm"
                  />
                </TabsContent>

                <TabsContent value="manual" className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Manual Entry</h3>
                    <p>Use the Squad Builder to create squads manually</p>
                  </div>
                </TabsContent>
              </Tabs>

              {importMode !== 'manual' && (
                <>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleValidateData}
                      disabled={!importData.trim()}
                    >
                      Validate Data
                    </Button>
                    <Button variant="outline" onClick={resetImport}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>

                  {/* Validation Results */}
                  {validationResult && (
                    <Card className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Validation Results</h4>
                        <Badge
                          variant={
                            validationResult.isValid ? 'default' : 'destructive'
                          }
                          className={
                            validationResult.isValid ? 'bg-green-500' : ''
                          }
                        >
                          {validationResult.isValid ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <AlertCircle className="h-3 w-3 mr-1" />
                          )}
                          {validationResult.isValid ? 'Valid' : 'Invalid'}
                        </Badge>
                      </div>

                      {validationResult.errors.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-red-600 mb-2">
                            Errors:
                          </h5>
                          <ul className="text-sm text-red-600 space-y-1">
                            {validationResult.errors.map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {validationResult.warnings.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-yellow-600 mb-2">
                            Warnings:
                          </h5>
                          <ul className="text-sm text-yellow-600 space-y-1">
                            {validationResult.warnings.map((warning, index) => (
                              <li key={index}>• {warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {validationResult.isValid &&
                        validationResult.data.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium mb-2">
                              Preview:
                            </h5>
                            <div className="text-sm text-muted-foreground">
                              • {validationResult.data.length} squads to create
                              •{' '}
                              {validationResult.data.reduce(
                                (sum, squad) => sum + squad.members.length,
                                0
                              )}{' '}
                              members to add
                            </div>
                          </div>
                        )}
                    </Card>
                  )}

                  {/* Processing */}
                  {isProcessing && (
                    <Card className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Importing...</h4>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(processingProgress)}%
                        </span>
                      </div>
                      <Progress value={processingProgress} className="h-2" />
                    </Card>
                  )}

                  {/* Results */}
                  {importResults && (
                    <Card className="p-4">
                      <h4 className="font-medium mb-3">Import Results</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Squads created:</span>
                          <Badge variant="outline">
                            {importResults.squadsCreated}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Members added:</span>
                          <Badge variant="outline">
                            {importResults.membersAdded}
                          </Badge>
                        </div>
                        {importResults.errors.length > 0 && (
                          <div>
                            <span className="text-red-600 font-medium">
                              Errors:
                            </span>
                            <ul className="text-red-600 mt-1 space-y-1">
                              {importResults.errors.map((error, index) => (
                                <li key={index}>• {error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}
                </>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsImportDialogOpen(false)}
                >
                  Close
                </Button>
                {validationResult?.isValid &&
                  !isProcessing &&
                  !importResults && (
                    <Button onClick={handleImport}>
                      Import {validationResult.data.length} Squads
                    </Button>
                  )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <h4 className="font-medium">CSV Import</h4>
                  <p className="text-sm text-muted-foreground">
                    Import multiple squads and members from CSV
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <Target className="h-8 w-8 text-green-500" />
                <div>
                  <h4 className="font-medium">JSON Import</h4>
                  <p className="text-sm text-muted-foreground">
                    Structured data import with validation
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Start Import Process
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SquadImportSystem;
