
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download } from 'lucide-react';
import { useSetupForm } from '@/hooks/useSetupForm';
import { downloadSampleCSV } from '@/utils/csvUtils';
import EnhancedImportExport from './EnhancedImportExport';

const ImportExportSettings = () => {
  const { handleCSVUpload } = useSetupForm();

  return (
    <div className="space-y-6">
      {/* Enhanced Import/Export */}
      <EnhancedImportExport />
      
      {/* Legacy Import/Export - kept for backward compatibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            Legacy Import & Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="import" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="import">Legacy Import</TabsTrigger>
              <TabsTrigger value="export">Legacy Export</TabsTrigger>
            </TabsList>
            
            <TabsContent value="import" className="space-y-6">
              <Tabs defaultValue="people" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="people">People & Teams</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                  <TabsTrigger value="roles">Roles & Rates</TabsTrigger>
                </TabsList>
                
                <TabsContent value="people" className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="peopleCSV">People CSV (Basic)</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadSampleCSV('people-sample.csv')}
                        className="flex items-center"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download Sample
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      Format: name, email, role, team name, team id
                    </p>
                    <Input
                      id="peopleCSV"
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleCSVUpload(e, 'People')}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="projects" className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="projectsCSV">Projects CSV</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadSampleCSV('projects-sample.csv')}
                        className="flex items-center"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download Sample
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      Format: name, description, status, start date, end date, budget
                    </p>
                    <Input
                      id="projectsCSV"
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleCSVUpload(e, 'Projects')}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="roles" className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="rolesCSV">Roles CSV</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadSampleCSV('roles-sample.csv')}
                        className="flex items-center"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download Sample
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      Format: role name, default rate
                    </p>
                    <Input
                      id="rolesCSV"
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleCSVUpload(e, 'Roles')}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>
            
            <TabsContent value="export" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="flex items-center justify-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export People (Basic)
                </Button>
                <Button variant="outline" className="flex items-center justify-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export Teams (Basic)
                </Button>
                <Button variant="outline" className="flex items-center justify-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export Projects
                </Button>
                <Button variant="outline" className="flex items-center justify-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export Allocations
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportExportSettings;
