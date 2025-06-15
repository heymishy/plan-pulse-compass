
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, AlertCircle, CheckCircle, FolderOpen } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  parseProjectsCSV, 
  parseEpicsCSV, 
  parseCombinedProjectEpicCSV,
  exportProjectsCSV,
  exportEpicsCSV,
  exportCombinedProjectEpicCSV,
  downloadCSV 
} from '@/utils/projectsCsvUtils';

const EnhancedProjectsImportExport = () => {
  const { 
    projects, setProjects,
    epics, setEpics
  } = useApp();
  
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleProjectsImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = parseProjectsCSV(text);
      
      // Merge with existing data
      setProjects(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newProjects = result.projects.filter(p => !existingIds.has(p.id));
        return [...prev, ...newProjects];
      });
      
      setImportStatus({
        type: 'success',
        message: `Successfully imported ${result.projects.length} projects with ${result.milestones.length} milestones.`
      });
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
    
    event.target.value = '';
  };

  const handleEpicsImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = parseEpicsCSV(text, projects);
      
      // Update projects if new ones were created
      setProjects(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newProjects = result.projects.filter(p => !existingIds.has(p.id));
        return [...prev, ...newProjects];
      });
      
      // Merge epics
      setEpics(prev => {
        const existingIds = new Set(prev.map(e => e.id));
        const newEpics = result.epics.filter(e => !existingIds.has(e.id));
        return [...prev, ...newEpics];
      });
      
      setImportStatus({
        type: 'success',
        message: `Successfully imported ${result.epics.length} epics. Created ${result.projects.length - projects.length} new projects.`
      });
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
    
    event.target.value = '';
  };

  const handleCombinedImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = parseCombinedProjectEpicCSV(text);
      
      // Merge projects
      setProjects(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newProjects = result.projects.filter(p => !existingIds.has(p.id));
        return [...prev, ...newProjects];
      });
      
      // Merge epics
      setEpics(prev => {
        const existingIds = new Set(prev.map(e => e.id));
        const newEpics = result.epics.filter(e => !existingIds.has(e.id));
        return [...prev, ...newEpics];
      });
      
      setImportStatus({
        type: 'success',
        message: `Successfully imported ${result.projects.length} projects, ${result.epics.length} epics, and ${result.milestones.length} milestones.`
      });
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
    
    event.target.value = '';
  };

  const handleExportProjects = () => {
    const csvContent = exportProjectsCSV(projects);
    downloadCSV(csvContent, 'projects-export.csv');
  };

  const handleExportEpics = () => {
    const csvContent = exportEpicsCSV(epics, projects);
    downloadCSV(csvContent, 'epics-export.csv');
  };

  const handleExportCombined = () => {
    const csvContent = exportCombinedProjectEpicCSV(projects, epics);
    downloadCSV(csvContent, 'projects-epics-export.csv');
  };

  const handleExportActiveProjects = () => {
    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'planning');
    const csvContent = exportProjectsCSV(activeProjects);
    downloadCSV(csvContent, 'active-projects-export.csv');
  };

  const downloadSampleCSV = (filename: string, content: string) => {
    downloadCSV(content, filename);
  };

  const sampleProjects = `project_name,description,status,start_date,end_date,budget,milestone_names,milestone_due_dates,milestone_descriptions,milestone_statuses
Mobile App Redesign,Complete overhaul of mobile application,active,2024-01-15,2024-06-30,150000,Design Phase;Development Phase;Testing Phase,2024-03-01;2024-05-15;2024-06-15,Complete UI/UX design;Build new features;Quality assurance,completed;in-progress;not-started
API Integration Project,Integrate third-party APIs,planning,2024-02-01,2024-04-30,75000,API Analysis;Implementation;Documentation,2024-02-15;2024-04-01;2024-04-30,Analyze API requirements;Implement integrations;Create documentation,not-started;not-started;not-started`;

  const sampleEpics = `epic_name,project_name,project_id,description,estimated_effort,status,assigned_team_id,start_date,target_end_date,actual_end_date
User Authentication,Mobile App Redesign,project-1,Implement secure user login and registration,21,completed,team-1,2024-01-15,2024-02-15,2024-02-10
Payment Integration,Mobile App Redesign,project-1,Add payment processing capabilities,34,in-progress,team-2,2024-02-01,2024-03-15,
API Gateway Setup,API Integration Project,project-2,Set up API gateway for third-party integrations,13,not-started,team-3,2024-02-15,2024-03-01,`;

  const sampleCombined = `project_name,project_description,project_status,project_start_date,project_end_date,project_budget,epic_name,epic_description,epic_effort,epic_team,epic_target_date,milestone_name,milestone_due_date
E-commerce Platform,Build new e-commerce platform,active,2024-01-01,2024-12-31,500000,User Management,User registration and authentication,21,team-1,2024-03-01,MVP Launch,2024-06-30
E-commerce Platform,,,,,Product Catalog,Product listing and search functionality,34,team-2,2024-04-15,Beta Release,2024-09-30
E-commerce Platform,,,,,Shopping Cart,Cart and checkout functionality,25,team-1,2024-05-30,Production Release,2024-12-31`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FolderOpen className="mr-2 h-5 w-5" />
          Enhanced Projects & Epics Import/Export
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
              {/* Projects Import */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="projectsCSV">Projects with Milestones CSV</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadSampleCSV('projects-sample.csv', sampleProjects)}
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Sample
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  Import projects with embedded milestones, budgets, and timelines
                </p>
                <Input
                  id="projectsCSV"
                  type="file"
                  accept=".csv"
                  onChange={handleProjectsImport}
                />
              </div>

              {/* Epics Import */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="epicsCSV">Epics CSV</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadSampleCSV('epics-sample.csv', sampleEpics)}
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Sample
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  Import epics with effort estimates, team assignments, and project links
                </p>
                <Input
                  id="epicsCSV"
                  type="file"
                  accept=".csv"
                  onChange={handleEpicsImport}
                />
              </div>

              {/* Combined Import */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="combinedCSV">Combined Projects & Epics CSV</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadSampleCSV('projects-epics-combined-sample.csv', sampleCombined)}
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Sample
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  Import complete project hierarchies with epics and milestones in one file
                </p>
                <Input
                  id="combinedCSV"
                  type="file"
                  accept=".csv"
                  onChange={handleCombinedImport}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="export" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="flex items-center justify-center"
                onClick={handleExportProjects}
              >
                <Download className="h-4 w-4 mr-2" />
                Export All Projects
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center justify-center"
                onClick={handleExportEpics}
              >
                <Download className="h-4 w-4 mr-2" />
                Export All Epics
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center justify-center"
                onClick={handleExportCombined}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Combined Data
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center justify-center"
                onClick={handleExportActiveProjects}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Active Projects
              </Button>
            </div>
            
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Export Options</h4>
              <p className="text-xs text-gray-500 mb-4">
                Choose from different export formats based on your needs:
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• <strong>All Projects:</strong> Complete project data with milestones</li>
                <li>• <strong>All Epics:</strong> Epic data with project references and team assignments</li>
                <li>• <strong>Combined Data:</strong> Hierarchical view of projects, epics, and milestones</li>
                <li>• <strong>Active Projects:</strong> Only projects with 'active' or 'planning' status</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EnhancedProjectsImportExport;
