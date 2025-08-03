import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  AlertTriangle,
  Info,
  ArrowRight,
  RefreshCw,
  Download,
  Upload,
  XCircle,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Team, Skill } from '@/types';
import {
  generateMigrationPreview,
  analyzeTeamSkillMigration,
  createMissingSkills,
  applySkillMigration,
  validateMigration,
  SkillMigrationResult,
  MigrationSummary,
} from '@/utils/skillsMigration';

interface SkillsMigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type MigrationStep = 'preview' | 'review' | 'execute' | 'complete';

const SkillsMigrationDialog: React.FC<SkillsMigrationDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { teams, skills, setTeams, setSkills } = useApp();
  const { toast } = useToast();

  // Migration state
  const [currentStep, setCurrentStep] = useState<MigrationStep>('preview');
  const [migrationData, setMigrationData] = useState<{
    summary: MigrationSummary;
    recommendations: {
      autoCreate: string[];
      needsReview: Array<{
        teamName: string;
        skill: string;
        candidates: string[];
      }>;
      highConfidence: number;
    };
  } | null>(null);

  // Manual mapping state
  const [manualMappings, setManualMappings] = useState<Record<string, string>>(
    {}
  );
  const [newSkillsToCreate, setNewSkillsToCreate] = useState<Set<string>>(
    new Set()
  );

  // Progress state
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [migrationResults, setMigrationResults] = useState<{
    success: boolean;
    migratedTeams: number;
    createdSkills: number;
    errors: string[];
    warnings: string[];
  } | null>(null);

  // Generate migration preview when dialog opens
  useEffect(() => {
    if (open && teams.length > 0 && skills.length > 0) {
      const preview = generateMigrationPreview(teams, skills);
      setMigrationData(preview);

      // Initialize new skills to create (all missing by default)
      setNewSkillsToCreate(new Set(preview.recommendations.autoCreate));

      // Reset state
      setCurrentStep('preview');
      setManualMappings({});
      setMigrationProgress(0);
      setIsExecuting(false);
      setMigrationResults(null);
    }
  }, [open, teams, skills]);

  const handleManualMapping = (
    originalSkill: string,
    selectedSkillId: string
  ) => {
    setManualMappings(prev => ({
      ...prev,
      [originalSkill]: selectedSkillId,
    }));
  };

  const toggleSkillCreation = (skillName: string) => {
    setNewSkillsToCreate(prev => {
      const updated = new Set(prev);
      if (updated.has(skillName)) {
        updated.delete(skillName);
      } else {
        updated.add(skillName);
      }
      return updated;
    });
  };

  const executeMigration = async () => {
    if (!migrationData) return;

    setIsExecuting(true);
    setCurrentStep('execute');
    setMigrationProgress(0);

    try {
      // Step 1: Create missing skills (20%)
      let createdSkills: Skill[] = [];
      if (newSkillsToCreate.size > 0) {
        createdSkills = createMissingSkills(Array.from(newSkillsToCreate));
        setSkills(prev => [...prev, ...createdSkills]);
        setMigrationProgress(20);
        await new Promise(resolve => setTimeout(resolve, 500)); // Visual feedback
      }

      // Step 2: Apply migration to each team (60%)
      const updatedSkills = [...skills, ...createdSkills];
      const migratedTeams: Team[] = [];
      const teamErrors: string[] = [];

      for (let i = 0; i < teams.length; i++) {
        const team = teams[i];
        const migrationResult = analyzeTeamSkillMigration(team, updatedSkills);

        try {
          const migratedTeam = applySkillMigration(
            team,
            migrationResult,
            manualMappings
          );
          migratedTeams.push(migratedTeam);
        } catch (error) {
          teamErrors.push(
            `Team ${team.name}: ${error instanceof Error ? error.message : 'Migration failed'}`
          );
          migratedTeams.push(team); // Keep original on error
        }

        setMigrationProgress(20 + ((i + 1) / teams.length) * 60);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Step 3: Validate migration results (80%)
      const validation = validateMigration(teams, migratedTeams, updatedSkills);
      setMigrationProgress(80);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 4: Apply changes (100%)
      if (validation.isValid && teamErrors.length === 0) {
        setTeams(migratedTeams);
        setMigrationProgress(100);
        await new Promise(resolve => setTimeout(resolve, 300));

        setMigrationResults({
          success: true,
          migratedTeams: migratedTeams.length,
          createdSkills: createdSkills.length,
          errors: [...teamErrors, ...validation.errors],
          warnings: validation.warnings,
        });
      } else {
        setMigrationResults({
          success: false,
          migratedTeams: 0,
          createdSkills: 0,
          errors: [...teamErrors, ...validation.errors],
          warnings: validation.warnings,
        });
      }

      setCurrentStep('complete');
    } catch (error) {
      setMigrationResults({
        success: false,
        migratedTeams: 0,
        createdSkills: 0,
        errors: [
          error instanceof Error ? error.message : 'Unknown migration error',
        ],
        warnings: [],
      });
      setCurrentStep('complete');
    } finally {
      setIsExecuting(false);
    }
  };

  const renderPreviewStep = () => {
    if (!migrationData) return null;

    const { summary, recommendations } = migrationData;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Automatic Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {recommendations.highConfidence}
              </div>
              <p className="text-sm text-gray-600">High confidence matches</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Needs Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {recommendations.needsReview.length}
              </div>
              <p className="text-sm text-gray-600">Ambiguous matches</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-500" />
                New Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {recommendations.autoCreate.length}
              </div>
              <p className="text-sm text-gray-600">To be created</p>
            </CardContent>
          </Card>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Migration will update {summary.totalTeams} teams.
            {summary.automaticMatches} skills will be automatically matched,
            {recommendations.needsReview.length} require manual review, and
            {recommendations.autoCreate.length} new skills will be created.
          </AlertDescription>
        </Alert>

        {recommendations.autoCreate.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Skills to Create</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {recommendations.autoCreate.map(skill => (
                  <Badge key={skill} variant="outline" className="text-sm">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderReviewStep = () => {
    if (!migrationData) return null;

    return (
      <div className="space-y-6">
        <Tabs defaultValue="mappings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mappings">Manual Mappings</TabsTrigger>
            <TabsTrigger value="creation">Skill Creation</TabsTrigger>
          </TabsList>

          <TabsContent value="mappings" className="space-y-4">
            {migrationData.recommendations.needsReview.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  No manual mappings required. All skills have been
                  automatically matched.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Skills Requiring Manual Review
                </h3>
                {migrationData.recommendations.needsReview.map(
                  (item, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {item.teamName} → "{item.skill}"
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600">
                            Select the best match for this skill:
                          </p>
                          <Select
                            value={manualMappings[item.skill] || ''}
                            onValueChange={value =>
                              handleManualMapping(item.skill, value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a skill..." />
                            </SelectTrigger>
                            <SelectContent>
                              {item.candidates.map(candidate => (
                                <SelectItem
                                  key={candidate}
                                  value={
                                    skills.find(s => s.name === candidate)
                                      ?.id || ''
                                  }
                                >
                                  {candidate}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-gray-500">
                              Suggestions:
                            </span>
                            {item.candidates.map(candidate => (
                              <Badge
                                key={candidate}
                                variant="secondary"
                                className="text-xs"
                              >
                                {candidate}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="creation" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">New Skills to Create</h3>
              {migrationData.recommendations.autoCreate.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No new skills need to be created.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Select which skills to create automatically:
                  </p>
                  {migrationData.recommendations.autoCreate.map(skill => (
                    <div
                      key={skill}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <span className="font-medium">{skill}</span>
                      <Button
                        variant={
                          newSkillsToCreate.has(skill) ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() => toggleSkillCreation(skill)}
                      >
                        {newSkillsToCreate.has(skill) ? 'Will Create' : 'Skip'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  const renderExecuteStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
        <h3 className="text-lg font-semibold mb-2">Migrating Team Skills...</h3>
        <p className="text-gray-600">
          Please wait while we update your team data.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Migration Progress</span>
          <span>{migrationProgress}%</span>
        </div>
        <Progress value={migrationProgress} className="w-full" />
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div
          className={`flex items-center gap-2 ${migrationProgress > 0 ? 'text-green-600' : ''}`}
        >
          {migrationProgress > 0 ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <div className="h-4 w-4" />
          )}
          Creating missing skills...
        </div>
        <div
          className={`flex items-center gap-2 ${migrationProgress > 20 ? 'text-green-600' : ''}`}
        >
          {migrationProgress > 20 ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <div className="h-4 w-4" />
          )}
          Migrating team skills...
        </div>
        <div
          className={`flex items-center gap-2 ${migrationProgress > 80 ? 'text-green-600' : ''}`}
        >
          {migrationProgress > 80 ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <div className="h-4 w-4" />
          )}
          Validating results...
        </div>
        <div
          className={`flex items-center gap-2 ${migrationProgress === 100 ? 'text-green-600' : ''}`}
        >
          {migrationProgress === 100 ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <div className="h-4 w-4" />
          )}
          Applying changes...
        </div>
      </div>
    </div>
  );

  const renderCompleteStep = () => {
    if (!migrationResults) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          {migrationResults.success ? (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-700 mb-2">
                Migration Completed Successfully!
              </h3>
              <p className="text-gray-600">
                Your team skills have been successfully migrated to use
                centralized skill references.
              </p>
            </>
          ) : (
            <>
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-700 mb-2">
                Migration Failed
              </h3>
              <p className="text-gray-600">
                There were errors during the migration process. Please review
                and try again.
              </p>
            </>
          )}
        </div>

        {migrationResults.success && (
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {migrationResults.migratedTeams}
                  </div>
                  <p className="text-sm text-gray-600">Teams Updated</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {migrationResults.createdSkills}
                  </div>
                  <p className="text-sm text-gray-600">Skills Created</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {migrationResults.errors.length > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <strong>Errors:</strong>
                {migrationResults.errors.map((error, index) => (
                  <div key={index} className="text-sm">
                    {error}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {migrationResults.warnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <strong>Warnings:</strong>
                {migrationResults.warnings.map((warning, index) => (
                  <div key={index} className="text-sm">
                    {warning}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  const canProceedToReview = () => {
    return migrationData !== null;
  };

  const canExecuteMigration = () => {
    if (!migrationData) return false;

    // Check if all ambiguous matches have manual mappings
    const unmappedSkills = migrationData.recommendations.needsReview.filter(
      item => !manualMappings[item.skill]
    );

    return unmappedSkills.length === 0;
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'preview':
        return 'Migration Preview';
      case 'review':
        return 'Review & Configure';
      case 'execute':
        return 'Executing Migration';
      case 'complete':
        return 'Migration Complete';
      default:
        return 'Skills Migration';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription>
            Migrate team skills from manual text entries to centralized skill
            references
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Progress */}
          <div className="flex items-center justify-between">
            {(
              ['preview', 'review', 'execute', 'complete'] as MigrationStep[]
            ).map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${
                    currentStep === step
                      ? 'bg-blue-500 text-white'
                      : index <
                          ['preview', 'review', 'execute', 'complete'].indexOf(
                            currentStep
                          )
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }
                `}
                >
                  {index + 1}
                </div>
                {index < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      index <
                      ['preview', 'review', 'execute', 'complete'].indexOf(
                        currentStep
                      )
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          {currentStep === 'preview' && renderPreviewStep()}
          {currentStep === 'review' && renderReviewStep()}
          {currentStep === 'execute' && renderExecuteStep()}
          {currentStep === 'complete' && renderCompleteStep()}
        </div>

        <DialogFooter>
          {currentStep === 'preview' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => setCurrentStep('review')}
                disabled={!canProceedToReview()}
              >
                Review Configuration
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}

          {currentStep === 'review' && (
            <>
              <Button
                variant="outline"
                onClick={() => setCurrentStep('preview')}
              >
                Back
              </Button>
              <Button
                onClick={executeMigration}
                disabled={!canExecuteMigration() || isExecuting}
              >
                {isExecuting ? 'Executing...' : 'Start Migration'}
                <Upload className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}

          {currentStep === 'execute' && (
            <Button disabled={true}>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Migration in Progress...
            </Button>
          )}

          {currentStep === 'complete' && (
            <Button onClick={() => onOpenChange(false)}>
              <Download className="mr-2 h-4 w-4" />
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SkillsMigrationDialog;
