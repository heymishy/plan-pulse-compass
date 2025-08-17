import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  Trash2,
  Download,
  Upload,
  Activity,
} from 'lucide-react';
import PerformanceMonitor from '@/components/performance/PerformanceMonitor';

const AdvancedSettings = () => {
  const {
    setPeople,
    setTeams,
    setProjects,
    setRoles,
    setAllocations,
    setCycles,
    setRunWorkCategories,
    setConfig,
    setIsSetupComplete,
    setActualAllocations,
    setIterationReviews,
    // Get all data for backup
    people,
    teams,
    projects,
    roles,
    allocations,
    cycles,
    runWorkCategories,
    config,
    actualAllocations,
    iterationReviews,
    epics,
  } = useApp();
  const { toast } = useToast();

  const handleResetData = () => {
    if (
      confirm(
        'Are you sure you want to reset all data? This action cannot be undone.'
      )
    ) {
      setPeople([]);
      setTeams([]);
      setProjects([]);
      setRoles([]);
      setAllocations([]);
      setCycles([]);
      setRunWorkCategories([]);
      setConfig(null);
      setIsSetupComplete(false);
      setActualAllocations([]);
      setIterationReviews([]);

      toast({
        title: 'Data Reset',
        description: 'All application data has been reset.',
        variant: 'destructive',
      });
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      people,
      teams,
      projects,
      roles,
      allocations,
      cycles,
      runWorkCategories,
      config,
      actualAllocations,
      iterationReviews,
      epics,
      exportDate: new Date().toISOString(),
      version: '1.0',
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planning-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Backup Created',
      description: 'Your complete data backup has been downloaded.',
    });
  };

  const handleImportBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async event => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const backupData = JSON.parse(text);

        // Validate backup structure
        if (!backupData.version || !backupData.exportDate) {
          throw new Error('Invalid backup file format');
        }

        // Restore all data
        if (backupData.people) setPeople(backupData.people);
        if (backupData.teams) setTeams(backupData.teams);
        if (backupData.projects) setProjects(backupData.projects);
        if (backupData.roles) setRoles(backupData.roles);
        if (backupData.allocations) setAllocations(backupData.allocations);
        if (backupData.cycles) setCycles(backupData.cycles);
        if (backupData.runWorkCategories)
          setRunWorkCategories(backupData.runWorkCategories);
        if (backupData.config) setConfig(backupData.config);
        if (backupData.actualAllocations)
          setActualAllocations(backupData.actualAllocations);
        if (backupData.iterationReviews)
          setIterationReviews(backupData.iterationReviews);

        if (backupData.config) setIsSetupComplete(true);

        toast({
          title: 'Backup Restored',
          description: `Your data has been restored from backup created on ${new Date(backupData.exportDate).toLocaleDateString()}.`,
        });
      } catch (error) {
        toast({
          title: 'Restore Failed',
          description:
            'Failed to restore backup. Please check the file format.',
          variant: 'destructive',
        });
      }
    };

    input.click();
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="data" className="space-y-4">
        <TabsList>
          <TabsTrigger value="data">Data Management</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="mr-2 h-5 w-5" />
                Backup & Restore
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-4">
                <Button
                  onClick={handleExportBackup}
                  className="flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Complete Backup
                </Button>
                <Button
                  variant="outline"
                  onClick={handleImportBackup}
                  className="flex items-center"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Backup
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Create and restore complete backups of your planning data,
                including tracking information, actual allocations, and
                iteration reviews.
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
                <h3 className="font-medium text-red-800 mb-2">
                  Reset All Data
                </h3>
                <p className="text-sm text-red-600 mb-4">
                  This will permanently delete all your planning data including
                  people, teams, projects, allocations, and tracking data. This
                  action cannot be undone.
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
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedSettings;
