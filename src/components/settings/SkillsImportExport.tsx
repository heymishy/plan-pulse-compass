/**
 * Skills Import/Export Component
 *
 * Provides comprehensive import/export functionality for skills and person-skill mappings.
 * Follows the same patterns as EnhancedImportExport for consistency.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  BookOpen,
  Users,
  Layers,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  parseSkillsCSV,
  parsePersonSkillsCSV,
  parseCombinedSkillsCSV,
  parseSolutionsCSV,
  parseTeamSkillsCSV,
  parseProjectSkillsCSV,
  parseProjectSolutionsCSV,
  exportSkillsCSV,
  exportPersonSkillsCSV,
  exportCombinedSkillsCSV,
  exportSolutionsCSV,
  exportSolutionSkillsCSV,
  exportTeamSkillsCSV,
  exportProjectSkillsCSV,
  exportProjectSolutionsCSV,
  downloadCSV,
  generateSampleSkillsCSV,
  generateSamplePersonSkillsCSV,
  generateSampleCombinedSkillsCSV,
  generateSampleSolutionsCSV,
  generateSampleTeamSkillsCSV,
  generateSampleProjectSkillsCSV,
  generateSampleProjectSolutionsCSV,
} from '@/utils/skillsCsvUtils';
import { Skill, PersonSkill } from '@/types';

const SkillsImportExport: React.FC = () => {
  const {
    people,
    teams,
    setTeams,
    projects,
    solutions,
    setSolutions,
    projectSkills,
    setProjectSkills,
    projectSolutions,
    setProjectSolutions,
    skills,
    setSkills,
    personSkills,
    setPersonSkills,
  } = useApp();

  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const [loading, setLoading] = useState(false);

  const handleSkillsImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const result = parseSkillsCSV(text);

      // Merge with existing skills, avoiding duplicates
      setSkills(prev => {
        const existingIds = new Set(prev.map(s => s.id));
        const existingNames = new Set(prev.map(s => s.name.toLowerCase()));
        const newSkills = result.skills.filter(
          s =>
            !existingIds.has(s.id) && !existingNames.has(s.name.toLowerCase())
        );
        return [...prev, ...newSkills];
      });

      setImportStatus({
        type: 'success',
        message: `Successfully imported ${result.skills.length} skills. Duplicates were skipped.`,
      });
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: `Skills import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handlePersonSkillsImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const result = parsePersonSkillsCSV(text, skills);

      // Add new skills if any were created
      if (result.newSkills.length > 0) {
        setSkills(prev => {
          const existingIds = new Set(prev.map(s => s.id));
          const newSkills = result.newSkills.filter(
            s => !existingIds.has(s.id)
          );
          return [...prev, ...newSkills];
        });
      }

      // Merge person skills, avoiding duplicates
      setPersonSkills(prev => {
        const existingKeys = new Set(
          prev.map(ps => `${ps.personId}-${ps.skillId}`)
        );
        const newPersonSkills = result.personSkills.filter(
          ps => !existingKeys.has(`${ps.personId}-${ps.skillId}`)
        );
        return [...prev, ...newPersonSkills];
      });

      const newSkillsMessage =
        result.newSkills.length > 0
          ? ` ${result.newSkills.length} new skills were auto-created.`
          : '';

      setImportStatus({
        type: 'success',
        message: `Successfully imported ${result.personSkills.length} person-skill mappings.${newSkillsMessage} Duplicates were skipped.`,
      });
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: `Person skills import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleCombinedImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const result = parseCombinedSkillsCSV(text);

      // Merge skills
      setSkills(prev => {
        const existingIds = new Set(prev.map(s => s.id));
        const existingNames = new Set(prev.map(s => s.name.toLowerCase()));
        const newSkills = result.skills.filter(
          s =>
            !existingIds.has(s.id) && !existingNames.has(s.name.toLowerCase())
        );
        return [...prev, ...newSkills];
      });

      // Merge person skills
      setPersonSkills(prev => {
        const existingKeys = new Set(
          prev.map(ps => `${ps.personId}-${ps.skillId}`)
        );
        const newPersonSkills = result.personSkills.filter(
          ps => !existingKeys.has(`${ps.personId}-${ps.skillId}`)
        );
        return [...prev, ...newPersonSkills];
      });

      setImportStatus({
        type: 'success',
        message: `Successfully imported ${result.skills.length} skills and ${result.personSkills.length} person-skill mappings. Duplicates were skipped.`,
      });
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: `Combined import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleSolutionsImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const result = parseSolutionsCSV(text);

      // Merge with existing solutions, avoiding duplicates
      setSolutions(prev => {
        const existingIds = new Set(prev.map(s => s.id));
        const existingNames = new Set(prev.map(s => s.name.toLowerCase()));
        const newSolutions = result.solutions.filter(
          s =>
            !existingIds.has(s.id) && !existingNames.has(s.name.toLowerCase())
        );
        return [...prev, ...newSolutions];
      });

      setImportStatus({
        type: 'success',
        message: `Successfully imported ${result.solutions.length} solutions. Duplicates were skipped.`,
      });
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: `Solutions import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleTeamSkillsImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const result = parseTeamSkillsCSV(text, teams, skills);

      // Add new skills if any were created
      if (result.newSkills.length > 0) {
        setSkills(prev => {
          const existingIds = new Set(prev.map(s => s.id));
          const newSkills = result.newSkills.filter(
            s => !existingIds.has(s.id)
          );
          return [...prev, ...newSkills];
        });
      }

      // Update teams with new target skills
      setTeams(prev => {
        return prev.map(team => {
          const teamUpdate = result.teamUpdates.find(tu => tu.id === team.id);
          if (teamUpdate && teamUpdate.targetSkills) {
            // Merge with existing target skills, avoiding duplicates
            const existingSkills = new Set(team.targetSkills || []);
            const newSkills = teamUpdate.targetSkills.filter(
              skillId => !existingSkills.has(skillId)
            );
            return {
              ...team,
              targetSkills: [...(team.targetSkills || []), ...newSkills],
            };
          }
          return team;
        });
      });

      const newSkillsMessage =
        result.newSkills.length > 0
          ? ` ${result.newSkills.length} new skills were auto-created.`
          : '';

      setImportStatus({
        type: 'success',
        message: `Successfully updated ${result.teamUpdates.length} teams with skill relationships.${newSkillsMessage}`,
      });
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: `Team skills import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleProjectSkillsImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const result = parseProjectSkillsCSV(text, skills);

      // Add new skills if any were created
      if (result.newSkills.length > 0) {
        setSkills(prev => {
          const existingIds = new Set(prev.map(s => s.id));
          const newSkills = result.newSkills.filter(
            s => !existingIds.has(s.id)
          );
          return [...prev, ...newSkills];
        });
      }

      // Merge project skills, avoiding duplicates
      setProjectSkills(prev => {
        const existingKeys = new Set(
          prev.map(ps => `${ps.projectId}-${ps.skillId}`)
        );
        const newProjectSkills = result.projectSkills.filter(
          ps => !existingKeys.has(`${ps.projectId}-${ps.skillId}`)
        );
        return [...prev, ...newProjectSkills];
      });

      const newSkillsMessage =
        result.newSkills.length > 0
          ? ` ${result.newSkills.length} new skills were auto-created.`
          : '';

      setImportStatus({
        type: 'success',
        message: `Successfully imported ${result.projectSkills.length} project-skill relationships.${newSkillsMessage} Duplicates were skipped.`,
      });
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: `Project skills import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleProjectSolutionsImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const result = parseProjectSolutionsCSV(text, solutions);

      // Add new solutions if any were created
      if (result.newSolutions.length > 0) {
        setSolutions(prev => {
          const existingIds = new Set(prev.map(s => s.id));
          const newSolutions = result.newSolutions.filter(
            s => !existingIds.has(s.id)
          );
          return [...prev, ...newSolutions];
        });
      }

      // Merge project solutions, avoiding duplicates
      setProjectSolutions(prev => {
        const existingKeys = new Set(
          prev.map(ps => `${ps.projectId}-${ps.solutionId}`)
        );
        const newProjectSolutions = result.projectSolutions.filter(
          ps => !existingKeys.has(`${ps.projectId}-${ps.solutionId}`)
        );
        return [...prev, ...newProjectSolutions];
      });

      const newSolutionsMessage =
        result.newSolutions.length > 0
          ? ` ${result.newSolutions.length} new solutions were auto-created.`
          : '';

      setImportStatus({
        type: 'success',
        message: `Successfully imported ${result.projectSolutions.length} project-solution relationships.${newSolutionsMessage} Duplicates were skipped.`,
      });
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: `Project solutions import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleExportSkills = () => {
    const csvContent = exportSkillsCSV(skills);
    downloadCSV(csvContent, 'skills-export.csv');
  };

  const handleExportPersonSkills = () => {
    const csvContent = exportPersonSkillsCSV(personSkills, people, skills);
    downloadCSV(csvContent, 'person-skills-export.csv');
  };

  const handleExportCombinedSkills = () => {
    const csvContent = exportCombinedSkillsCSV(personSkills, people, skills);
    downloadCSV(csvContent, 'combined-skills-export.csv');
  };

  const handleExportSolutions = () => {
    const csvContent = exportSolutionsCSV(solutions);
    downloadCSV(csvContent, 'solutions-export.csv');
  };

  const handleExportSolutionSkills = () => {
    const csvContent = exportSolutionSkillsCSV(solutions, skills);
    downloadCSV(csvContent, 'solution-skills-export.csv');
  };

  const handleExportTeamSkills = () => {
    const csvContent = exportTeamSkillsCSV(teams, skills);
    downloadCSV(csvContent, 'team-skills-export.csv');
  };

  const handleExportProjectSkills = () => {
    const csvContent = exportProjectSkillsCSV(projectSkills, projects, skills);
    downloadCSV(csvContent, 'project-skills-export.csv');
  };

  const handleExportProjectSolutions = () => {
    const csvContent = exportProjectSolutionsCSV(
      projectSolutions,
      projects,
      solutions
    );
    downloadCSV(csvContent, 'project-solutions-export.csv');
  };

  const downloadSampleCSV = (filename: string, content: string) => {
    downloadCSV(content, filename);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="mr-2 h-5 w-5" />
          Skills Import & Export
        </CardTitle>
      </CardHeader>
      <CardContent>
        {importStatus.type && (
          <Alert
            className={`mb-4 ${importStatus.type === 'error' ? 'border-red-200' : 'border-green-200'}`}
          >
            {importStatus.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription
              className={
                importStatus.type === 'error'
                  ? 'text-red-700'
                  : 'text-green-700'
              }
            >
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
              {/* Skills Only Import */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="skillsCSV" className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Skills CSV
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadSampleCSV(
                        'skills-sample.csv',
                        generateSampleSkillsCSV()
                      )
                    }
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Sample
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  Import skill definitions with categories and descriptions
                </p>
                <Input
                  id="skillsCSV"
                  type="file"
                  accept=".csv"
                  onChange={handleSkillsImport}
                  disabled={loading}
                />
              </div>

              {/* Person Skills Import */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label
                    htmlFor="personSkillsCSV"
                    className="flex items-center"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Person Skills CSV
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadSampleCSV(
                        'person-skills-sample.csv',
                        generateSamplePersonSkillsCSV()
                      )
                    }
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Sample
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  Import person-skill mappings with proficiency levels and
                  experience
                </p>
                <Input
                  id="personSkillsCSV"
                  type="file"
                  accept=".csv"
                  onChange={handlePersonSkillsImport}
                  disabled={loading}
                />
              </div>

              {/* Combined Import */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label
                    htmlFor="combinedSkillsCSV"
                    className="flex items-center"
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    Combined Skills CSV
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadSampleCSV(
                        'combined-skills-sample.csv',
                        generateSampleCombinedSkillsCSV()
                      )
                    }
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Sample
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  Import both skills and person-skill mappings in one file
                </p>
                <Input
                  id="combinedSkillsCSV"
                  type="file"
                  accept=".csv"
                  onChange={handleCombinedImport}
                  disabled={loading}
                />
              </div>

              {/* Solutions Import */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="solutionsCSV" className="flex items-center">
                    <Layers className="h-4 w-4 mr-2" />
                    Solutions CSV
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadSampleCSV(
                        'solutions-sample.csv',
                        generateSampleSolutionsCSV()
                      )
                    }
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Sample
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  Import solution definitions with skill associations
                </p>
                <Input
                  id="solutionsCSV"
                  type="file"
                  accept=".csv"
                  onChange={handleSolutionsImport}
                  disabled={loading}
                />
              </div>

              {/* Team Skills Import */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="teamSkillsCSV" className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Team Skills CSV
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadSampleCSV(
                        'team-skills-sample.csv',
                        generateSampleTeamSkillsCSV()
                      )
                    }
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Sample
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  Import team target skills and capabilities
                </p>
                <Input
                  id="teamSkillsCSV"
                  type="file"
                  accept=".csv"
                  onChange={handleTeamSkillsImport}
                  disabled={loading}
                />
              </div>

              {/* Project Skills Import */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label
                    htmlFor="projectSkillsCSV"
                    className="flex items-center"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Project Skills CSV
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadSampleCSV(
                        'project-skills-sample.csv',
                        generateSampleProjectSkillsCSV()
                      )
                    }
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Sample
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  Import project-skill relationships with importance levels
                </p>
                <Input
                  id="projectSkillsCSV"
                  type="file"
                  accept=".csv"
                  onChange={handleProjectSkillsImport}
                  disabled={loading}
                />
              </div>

              {/* Project Solutions Import */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label
                    htmlFor="projectSolutionsCSV"
                    className="flex items-center"
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    Project Solutions CSV
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadSampleCSV(
                        'project-solutions-sample.csv',
                        generateSampleProjectSolutionsCSV()
                      )
                    }
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Sample
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  Import project-solution relationships with importance levels
                </p>
                <Input
                  id="projectSolutionsCSV"
                  type="file"
                  accept=".csv"
                  onChange={handleProjectSolutionsImport}
                  disabled={loading}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <div className="space-y-6">
              {/* Core Skills & People */}
              <div>
                <h3 className="font-semibold text-sm mb-3 text-gray-700">
                  Core Skills & People
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className="flex items-center justify-center"
                    onClick={handleExportSkills}
                    disabled={skills.length === 0}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Export Skills
                    <span className="ml-2 text-xs text-gray-500">
                      ({skills.length})
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center justify-center"
                    onClick={handleExportPersonSkills}
                    disabled={personSkills.length === 0}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Export Person Skills
                    <span className="ml-2 text-xs text-gray-500">
                      ({personSkills.length})
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center justify-center"
                    onClick={handleExportCombinedSkills}
                    disabled={personSkills.length === 0 || skills.length === 0}
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    Export Combined
                    <span className="ml-2 text-xs text-gray-500">
                      ({personSkills.length})
                    </span>
                  </Button>
                </div>
              </div>

              {/* Solutions & Relationships */}
              <div>
                <h3 className="font-semibold text-sm mb-3 text-gray-700">
                  Solutions & Relationships
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="flex items-center justify-center"
                    onClick={handleExportSolutions}
                    disabled={solutions.length === 0}
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    Export Solutions
                    <span className="ml-2 text-xs text-gray-500">
                      ({solutions.length})
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center justify-center"
                    onClick={handleExportSolutionSkills}
                    disabled={solutions.length === 0}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Export Solution-Skills
                    <span className="ml-2 text-xs text-gray-500">
                      ({solutions.length})
                    </span>
                  </Button>
                </div>
              </div>

              {/* Team & Project Relationships */}
              <div>
                <h3 className="font-semibold text-sm mb-3 text-gray-700">
                  Team & Project Relationships
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className="flex items-center justify-center"
                    onClick={handleExportTeamSkills}
                    disabled={teams.length === 0}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Export Team-Skills
                    <span className="ml-2 text-xs text-gray-500">
                      ({teams.length})
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center justify-center"
                    onClick={handleExportProjectSkills}
                    disabled={projectSkills.length === 0}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Export Project-Skills
                    <span className="ml-2 text-xs text-gray-500">
                      ({projectSkills.length})
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center justify-center"
                    onClick={handleExportProjectSolutions}
                    disabled={projectSolutions.length === 0}
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    Export Project-Solutions
                    <span className="ml-2 text-xs text-gray-500">
                      ({projectSolutions.length})
                    </span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Export Description */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Export Types:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-xs mb-1 text-gray-700">
                    Core Data:
                  </h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>
                      <strong>Skills:</strong> Skill definitions with categories
                    </li>
                    <li>
                      <strong>Person Skills:</strong> Person-skill mappings with
                      proficiency
                    </li>
                    <li>
                      <strong>Combined:</strong> Both skills and person mappings
                      together
                    </li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-xs mb-1 text-gray-700">
                    Relationships:
                  </h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>
                      <strong>Solutions:</strong> Solution definitions with
                      skill associations
                    </li>
                    <li>
                      <strong>Team-Skills:</strong> Team target skills and
                      capabilities
                    </li>
                    <li>
                      <strong>Project Relationships:</strong> Project-skill and
                      project-solution mappings
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SkillsImportExport;
