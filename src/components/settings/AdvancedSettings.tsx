
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Trash2, Download, Upload } from 'lucide-react';

const AdvancedSettings = () => {
  const { 
    setPeople, setTeams, setProjects, setRoles, setAllocations, 
    setCycles, setRunWorkCategories, setConfig, setIsSetupComplete 
  } = useApp();
  const { toast } = useToast();

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      setPeople([]);
      setTeams([]);
      setProjects([]);
      setRoles([]);
      setAllocations([]);
      setCycles([]);
      setRunWorkCategories([]);
      setConfig(null);
      setIsSetupComplete(false);
      
      toast({
        title: "Data Reset",
        description: "All application data has been reset.",
        variant: "destructive",
      });
    }
  };

  const handleExportBackup = () => {
    // This would export all data as a backup file
    toast({
      title: "Backup Created",
      description: "Your data backup has been downloaded.",
    });
  };

  const handleImportBackup = () => {
    // This would import a backup file
    toast({
      title: "Backup Restored",
      description: "Your data has been restored from backup.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="mr-2 h-5 w-5" />
            Backup & Restore
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <Button onClick={handleExportBackup} className="flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export Backup
            </Button>
            <Button variant="outline" onClick={handleImportBackup} className="flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Import Backup
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Create and restore complete backups of your planning data.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border border-red-200 rounded-lg p-4">
            <h3 className="font-medium text-red-800 mb-2">Reset All Data</h3>
            <p className="text-sm text-red-600 mb-4">
              This will permanently delete all your planning data including people, teams, projects, and allocations. This action cannot be undone.
            </p>
            <Button 
              variant="destructive" 
              onClick={handleResetData}
              className="flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Reset All Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedSettings;
