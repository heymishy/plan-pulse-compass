
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download } from 'lucide-react';
import { downloadSampleCSV } from '@/utils/csvUtils';

interface ImportDataStepProps {
  onCSVUpload: (event: React.ChangeEvent<HTMLInputElement>, type: string) => void;
  onBack: () => void;
  onNext: () => void;
}

const ImportDataStep: React.FC<ImportDataStepProps> = ({
  onCSVUpload,
  onBack,
  onNext
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="mr-2 h-5 w-5" />
          Import Data (Optional)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="people" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="people">People & Teams</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="roles">Roles & Rates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="people" className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="peopleCSV">People CSV</Label>
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
                onChange={(e) => onCSVUpload(e, 'People')}
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
                onChange={(e) => onCSVUpload(e, 'Projects')}
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
                onChange={(e) => onCSVUpload(e, 'Roles')}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext}>
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportDataStep;
